import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Sale } from "../models/sale.js";
import { IProduct } from "../models/product.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

interface ProdutoVendido {
  id: string;
  nome: string;
  quantidade: number;
  valor: number;
  percentual?: number;
  percentualFaturamento: number;
  categoria?: string;
}

interface SaleProduct {
  product: IProduct | mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export const getDailyReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { date } = req.query;

      const targetDate = date ? new Date(date as string) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const sales = await Sale.find({
        createdAt: {
          $gte: targetDate,
          $lt: nextDay,
        },
        status: "completed",
      }).populate("products.product");

      const totalFaturado = sales.reduce((sum, sale) => sum + sale.total, 0);
      const numeroVendas = sales.length;
      const ticketMedio = numeroVendas > 0 ? totalFaturado / numeroVendas : 0;

      const vendasPorFormaPagamento = {
        cash: 0,
        credit: 0,
        debit: 0,
        pix: 0,
      };

      sales.forEach((sale) => {
        if (sale.paymentMethod in vendasPorFormaPagamento) {
          vendasPorFormaPagamento[sale.paymentMethod] += sale.total;
        }
      });

      const percentuaisPagamento = {
        cash:
          totalFaturado > 0
            ? (vendasPorFormaPagamento.cash / totalFaturado) * 100
            : 0,
        credit:
          totalFaturado > 0
            ? (vendasPorFormaPagamento.credit / totalFaturado) * 100
            : 0,
        debit:
          totalFaturado > 0
            ? (vendasPorFormaPagamento.debit / totalFaturado) * 100
            : 0,
        pix:
          totalFaturado > 0
            ? (vendasPorFormaPagamento.pix / totalFaturado) * 100
            : 0,
      };

      const produtosVendidos: ProdutoVendido[] = [];
      const produtosMap = new Map<string, ProdutoVendido>();

      sales.forEach((sale) => {
        sale.products.forEach((item: SaleProduct) => {
          if (!(item.product instanceof mongoose.Types.ObjectId)) {
            const produto = item.product as IProduct & {
              _id: mongoose.Types.ObjectId;
            };
            const id = produto._id.toString();

            if (produtosMap.has(id)) {
              const produtoExistente = produtosMap.get(id)!;
              produtoExistente.quantidade += item.quantity;
              produtoExistente.valor += item.price * item.quantity;
            } else {
              produtosMap.set(id, {
                id,
                nome: produto.name,
                quantidade: item.quantity,
                valor: item.price * item.quantity,
                percentualFaturamento: 0,
                categoria: produto.category
                  ? produto.category.toString()
                  : "Não categorizado",
              });
            }
          }
        });
      });

      produtosMap.forEach((produto) => {
        produtosVendidos.push({
          ...produto,
          percentual:
            totalFaturado > 0 ? (produto.valor / totalFaturado) * 100 : 0,
        });
      });

      produtosVendidos.sort((a, b) => b.valor - a.valor);

      res.json({
        date: targetDate,
        totalFaturado,
        numeroVendas,
        ticketMedio,
        cancelamentos: 0,
        vendasPorFormaPagamento: {
          valores: vendasPorFormaPagamento,
          percentuais: percentuaisPagamento,
        },
        produtosMaisVendidos: produtosVendidos.slice(0, 5),
      });
    } catch (error: any) {
      console.error("Erro ao gerar relatório diário:", error);
      res
        .status(500)
        .json({ error: error.message || "Erro ao gerar relatório diário" });
    }
  }
);

export const getWeeklyReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate } = req.query;

      let inicioSemana = new Date();
      if (startDate) {
        inicioSemana = new Date(startDate as string);
      } else {
        const diaSemana = inicioSemana.getDay();
        inicioSemana.setDate(inicioSemana.getDate() - diaSemana);
      }
      inicioSemana.setHours(0, 0, 0, 0);

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 7);

      const sales = await Sale.find({
        createdAt: {
          $gte: inicioSemana,
          $lt: fimSemana,
        },
        status: "completed",
      });

      const vendasPorDia = await Sale.aggregate([
        {
          $match: {
            createdAt: {
              $gte: inicioSemana,
              $lt: fimSemana,
            },
            status: "completed",
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      const diasSemana = [];
      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(dia.getDate() + i);
        const dataFormatada = dia.toISOString().split("T")[0];

        const vendaDia = vendasPorDia.find((v) => v._id === dataFormatada);
        diasSemana.push({
          data: dataFormatada,
          total: vendaDia ? vendaDia.total : 0,
          quantidade: vendaDia ? vendaDia.count : 0,
        });
      }

      const totalVendas = sales.reduce((sum, sale) => sum + sale.total, 0);
      const qtdVendas = sales.length;
      const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;

      const ultimasSemanas = [];
      for (let i = 1; i <= 4; i++) {
        const inicioSemanaAnterior = new Date(inicioSemana);
        inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7 * i);

        const fimSemanaAnterior = new Date(inicioSemanaAnterior);
        fimSemanaAnterior.setDate(fimSemanaAnterior.getDate() + 7);

        const salesSemanaAnterior = await Sale.find({
          createdAt: {
            $gte: inicioSemanaAnterior,
            $lt: fimSemanaAnterior,
          },
          status: "completed",
        });

        const totalSemanaAnterior = salesSemanaAnterior.reduce(
          (sum, sale) => sum + sale.total,
          0
        );
        const qtdSemanaAnterior = salesSemanaAnterior.length;

        ultimasSemanas.push({
          periodo: `${inicioSemanaAnterior.toISOString().split("T")[0]} - ${new Date(fimSemanaAnterior.getTime() - 1).toISOString().split("T")[0]}`,
          totalVendas: totalSemanaAnterior,
          qtdVendas: qtdSemanaAnterior,
          ticketMedio:
            qtdSemanaAnterior > 0 ? totalSemanaAnterior / qtdSemanaAnterior : 0,
        });
      }

      res.json({
        periodo: {
          inicio: inicioSemana,
          fim: new Date(fimSemana.getTime() - 1),
        },
        vendasPorDia: diasSemana,
        totais: {
          totalVendas,
          qtdVendas,
          ticketMedio,
        },
        historicoSemanas: ultimasSemanas,
      });
    } catch (error: any) {
      console.error("Erro ao gerar relatório semanal:", error);
      res
        .status(500)
        .json({ error: error.message || "Erro ao gerar relatório semanal" });
    }
  }
);

export const getMonthlyReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { month, year } = req.query;

      const now = new Date();
      const targetMonth = month ? parseInt(month as string) : now.getMonth();
      const targetYear = year ? parseInt(year as string) : now.getFullYear();

      const inicioMes = new Date(targetYear, targetMonth, 1);
      const fimMes = new Date(targetYear, targetMonth + 1, 1);

      const sales = await Sale.find({
        createdAt: {
          $gte: inicioMes,
          $lt: fimMes,
        },
        status: "completed",
      });

      const totalVendas = sales.reduce((sum, sale) => sum + sale.total, 0);
      const qtdVendas = sales.length;
      const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;

      const ultimosMeses = [];
      for (let i = 1; i <= 6; i++) {
        const mesTmp = targetMonth - i;
        let mesAnterior = mesTmp;
        let anoAnterior = targetYear;

        if (mesTmp < 0) {
          mesAnterior = 12 + mesTmp;
          anoAnterior = targetYear - 1;
        }

        const inicioMesAnterior = new Date(anoAnterior, mesAnterior, 1);
        const fimMesAnterior = new Date(anoAnterior, mesAnterior + 1, 1);

        const salesMesAnterior = await Sale.find({
          createdAt: {
            $gte: inicioMesAnterior,
            $lt: fimMesAnterior,
          },
          status: "completed",
        });

        const totalMesAnterior = salesMesAnterior.reduce(
          (sum, sale) => sum + sale.total,
          0
        );
        const qtdMesAnterior = salesMesAnterior.length;

        const nomeMes = inicioMesAnterior.toLocaleDateString("pt-BR", {
          month: "long",
        });
        const nomeMesCapitalizado =
          nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

        ultimosMeses.push({
          periodo: `${nomeMesCapitalizado}/${anoAnterior}`,
          totalVendas: totalMesAnterior,
          qtdVendas: qtdMesAnterior,
          ticketMedio:
            qtdMesAnterior > 0 ? totalMesAnterior / qtdMesAnterior : 0,
        });
      }

      res.json({
        periodo: {
          mes: inicioMes.toLocaleDateString("pt-BR", { month: "long" }),
          ano: targetYear,
        },
        totais: {
          totalVendas,
          qtdVendas,
          ticketMedio,
        },
        historicoMeses: ultimosMeses.reverse(),
      });
    } catch (error: any) {
      console.error("Erro ao gerar relatório mensal:", error);
      res
        .status(500)
        .json({ error: error.message || "Erro ao gerar relatório mensal" });
    }
  }
);

export const getProductsReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const inicio = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(new Date().getDate() - 30));
      const fim = endDate ? new Date(endDate as string) : new Date();

      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);

      const sales = await Sale.find({
        createdAt: {
          $gte: inicio,
          $lt: fim,
        },
        status: "completed",
      }).populate("products.product");

      const totalVendas = sales.reduce((sum, sale) => sum + sale.total, 0);

      const produtosMap = new Map<string, ProdutoVendido>();

      sales.forEach((sale) => {
        sale.products.forEach((item: SaleProduct) => {
          if (!(item.product instanceof mongoose.Types.ObjectId)) {
            const produto = item.product as IProduct & {
              _id: mongoose.Types.ObjectId;
            };
            const id = produto._id.toString();

            if (produtosMap.has(id)) {
              const produtoExistente = produtosMap.get(id)!;
              produtoExistente.quantidade += item.quantity;
              produtoExistente.valor += item.price * item.quantity;
            } else {
              produtosMap.set(id, {
                id,
                nome: produto.name,
                categoria: produto.category
                  ? produto.category.toString()
                  : "Não categorizado",
                quantidade: item.quantity,
                valor: item.price * item.quantity,
                percentualFaturamento: 0,
              });
            }
          }
        });
      });

      const produtosVendidos: ProdutoVendido[] = [];
      produtosMap.forEach((produto) => {
        produtosVendidos.push({
          ...produto,
          percentualFaturamento:
            totalVendas > 0 ? (produto.valor / totalVendas) * 100 : 0,
        });
      });

      produtosVendidos.sort((a, b) => b.valor - a.valor);

      res.json({
        periodo: {
          inicio,
          fim,
        },
        totalVendas,
        produtos: produtosVendidos,
      });
    } catch (error: any) {
      console.error("Erro ao gerar relatório de produtos:", error);
      res.status(500).json({
        error: error.message || "Erro ao gerar relatório de produtos",
      });
    }
  }
);

export const exportDailyReportToExcel = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const sales = await Sale.find({
        createdAt: {
          $gte: targetDate,
          $lt: nextDay,
        },
        status: "completed",
      }).populate("products.product");

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Relatório Diário");

      worksheet.columns = [
        { header: "Data", key: "date", width: 15 },
        { header: "Total Faturado", key: "total", width: 15 },
        { header: "Número de Vendas", key: "salesCount", width: 15 },
        { header: "Ticket Médio", key: "averageTicket", width: 15 },
      ];

      const totalFaturado = sales.reduce((sum, sale) => sum + sale.total, 0);
      const numeroVendas = sales.length;
      const ticketMedio = numeroVendas > 0 ? totalFaturado / numeroVendas : 0;

      worksheet.addRow({
        date: targetDate.toLocaleDateString("pt-BR"),
        total: totalFaturado.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        salesCount: numeroVendas,
        averageTicket: ticketMedio.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio_diario_${
          targetDate.toISOString().split("T")[0]
        }.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.error("Erro ao exportar relatório diário para Excel:", error);
      res.status(500).json({
        error: error.message || "Erro ao exportar relatório diário para Excel",
      });
    }
  }
);

export const exportDailyReportToPDF = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const sales = await Sale.find({
        createdAt: {
          $gte: targetDate,
          $lt: nextDay,
        },
        status: "completed",
      }).populate("products.product");

      const doc = new PDFDocument();
      const totalFaturado = sales.reduce((sum, sale) => sum + sale.total, 0);
      const numeroVendas = sales.length;
      const ticketMedio = numeroVendas > 0 ? totalFaturado / numeroVendas : 0;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio_diario_${
          targetDate.toISOString().split("T")[0]
        }.pdf`
      );

      doc.pipe(res);

      doc.fontSize(20).text("Relatório Diário", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Data: ${targetDate.toLocaleDateString("pt-BR")}`);
      doc.text(
        `Total Faturado: ${totalFaturado.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`
      );
      doc.text(`Número de Vendas: ${numeroVendas}`);
      doc.text(
        `Ticket Médio: ${ticketMedio.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`
      );

      doc.end();
    } catch (error: any) {
      console.error("Erro ao exportar relatório diário para PDF:", error);
      res.status(500).json({
        error: error.message || "Erro ao exportar relatório diário para PDF",
      });
    }
  }
);

export const exportWeeklyReportToExcel = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate } = req.query;

      let inicioSemana = new Date();
      if (startDate) {
        inicioSemana = new Date(startDate as string);
      } else {
        const diaSemana = inicioSemana.getDay();
        inicioSemana.setDate(inicioSemana.getDate() - diaSemana);
      }
      inicioSemana.setHours(0, 0, 0, 0);

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 7);

      const sales = await Sale.find({
        createdAt: {
          $gte: inicioSemana,
          $lt: fimSemana,
        },
        status: "completed",
      });

      const vendasPorDia = await Sale.aggregate([
        {
          $match: {
            createdAt: {
              $gte: inicioSemana,
              $lt: fimSemana,
            },
            status: "completed",
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Relatório Semanal");

      worksheet.columns = [
        { header: "Período", key: "periodo", width: 20 },
        { header: "Total Vendas", key: "total", width: 15 },
        { header: "Qtd. Vendas", key: "qtdVendas", width: 15 },
        { header: "Ticket Médio", key: "ticketMedio", width: 15 },
      ];

      const totalVendas = sales.reduce((sum, sale) => sum + sale.total, 0);
      const qtdVendas = sales.length;
      const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;

      worksheet.addRow({
        periodo: `${inicioSemana.toLocaleDateString("pt-BR")} a ${new Date(
          fimSemana.getTime() - 1
        ).toLocaleDateString("pt-BR")}`,
        total: totalVendas.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        qtdVendas: qtdVendas,
        ticketMedio: ticketMedio.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      });

      const detailsSheet = workbook.addWorksheet("Detalhes Diários");
      detailsSheet.columns = [
        { header: "Data", key: "data", width: 15 },
        { header: "Total", key: "total", width: 15 },
        { header: "Quantidade", key: "quantidade", width: 15 },
      ];

      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(dia.getDate() + i);
        const dataFormatada = dia.toISOString().split("T")[0];

        const vendaDia = vendasPorDia.find((v) => v._id === dataFormatada);
        const total = vendaDia ? vendaDia.total : 0;
        const quantidade = vendaDia ? vendaDia.count : 0;

        detailsSheet.addRow({
          data: dia.toLocaleDateString("pt-BR"),
          total: total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
          quantidade: quantidade,
        });
      }

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio_semanal_${
          inicioSemana.toISOString().split("T")[0]
        }.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.error("Erro ao exportar relatório semanal para Excel:", error);
      res.status(500).json({
        error: error.message || "Erro ao exportar relatório semanal para Excel",
      });
    }
  }
);

export const exportWeeklyReportToPDF = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate } = req.query;

      let inicioSemana = new Date();
      if (startDate) {
        inicioSemana = new Date(startDate as string);
      } else {
        const diaSemana = inicioSemana.getDay();
        inicioSemana.setDate(inicioSemana.getDate() - diaSemana);
      }
      inicioSemana.setHours(0, 0, 0, 0);

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 7);

      const sales = await Sale.find({
        createdAt: {
          $gte: inicioSemana,
          $lt: fimSemana,
        },
        status: "completed",
      });

      const totalVendas = sales.reduce((sum, sale) => sum + sale.total, 0);
      const qtdVendas = sales.length;
      const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;

      const doc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio_semanal_${
          inicioSemana.toISOString().split("T")[0]
        }.pdf`
      );

      doc.pipe(res);

      doc.fontSize(20).text("Relatório Semanal", { align: "center" });
      doc.moveDown();
      doc
        .fontSize(12)
        .text(
          `Período: ${inicioSemana.toLocaleDateString(
            "pt-BR"
          )} a ${new Date(fimSemana.getTime() - 1).toLocaleDateString("pt-BR")}`
        );
      doc.text(
        `Total Faturado: ${totalVendas.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`
      );
      doc.text(`Número de Vendas: ${qtdVendas}`);
      doc.text(
        `Ticket Médio: ${ticketMedio.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`
      );

      doc.end();
    } catch (error: any) {
      console.error("Erro ao exportar relatório semanal para PDF:", error);
      res.status(500).json({
        error: error.message || "Erro ao exportar relatório semanal para PDF",
      });
    }
  }
);

export const exportMonthlyReportToExcel = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { month, year } = req.query;

      const now = new Date();
      const targetMonth = month ? parseInt(month as string) : now.getMonth();
      const targetYear = year ? parseInt(year as string) : now.getFullYear();

      const inicioMes = new Date(targetYear, targetMonth, 1);
      const fimMes = new Date(targetYear, targetMonth + 1, 1);

      const sales = await Sale.find({
        createdAt: {
          $gte: inicioMes,
          $lt: fimMes,
        },
        status: "completed",
      });

      const totalVendas = sales.reduce((sum, sale) => sum + sale.total, 0);
      const qtdVendas = sales.length;
      const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Relatório Mensal");

      worksheet.columns = [
        { header: "Período", key: "periodo", width: 20 },
        { header: "Total Vendas", key: "totalVendas", width: 15 },
        { header: "Qtd. Vendas", key: "qtdVendas", width: 15 },
        { header: "Ticket Médio", key: "ticketMedio", width: 15 },
      ];

      const nomeMes = inicioMes.toLocaleDateString("pt-BR", { month: "long" });
      worksheet.addRow({
        periodo: `${nomeMes} de ${targetYear}`,
        totalVendas: totalVendas.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        qtdVendas: qtdVendas,
        ticketMedio: ticketMedio.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio_mensal_${
          targetMonth + 1
        }_${targetYear}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.error("Erro ao exportar relatório mensal para Excel:", error);
      res.status(500).json({
        error: error.message || "Erro ao exportar relatório mensal para Excel",
      });
    }
  }
);

export const exportMonthlyReportToPDF = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { month, year } = req.query;

      const now = new Date();
      const targetMonth = month ? parseInt(month as string) : now.getMonth();
      const targetYear = year ? parseInt(year as string) : now.getFullYear();

      const inicioMes = new Date(targetYear, targetMonth, 1);
      const fimMes = new Date(targetYear, targetMonth + 1, 1);

      const sales = await Sale.find({
        createdAt: {
          $gte: inicioMes,
          $lt: fimMes,
        },
        status: "completed",
      });

      const totalVendas = sales.reduce((sum, sale) => sum + sale.total, 0);
      const qtdVendas = sales.length;
      const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;

      const doc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio_mensal_${
          targetMonth + 1
        }_${targetYear}.pdf`
      );

      doc.pipe(res);

      doc.fontSize(20).text("Relatório Mensal", { align: "center" });
      doc.moveDown();
      const nomeMes = inicioMes.toLocaleDateString("pt-BR", { month: "long" });
      doc.fontSize(12).text(`Período: ${nomeMes} de ${targetYear}`);
      doc.text(
        `Total Faturado: ${totalVendas.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`
      );
      doc.text(`Número de Vendas: ${qtdVendas}`);
      doc.text(
        `Ticket Médio: ${ticketMedio.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`
      );

      doc.end();
    } catch (error: any) {
      console.error("Erro ao exportar relatório mensal para PDF:", error);
      res.status(500).json({
        error: error.message || "Erro ao exportar relatório mensal para PDF",
      });
    }
  }
);

export const exportProductsReportToExcel = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const finalEndDate = endDate ? new Date(endDate as string) : new Date();
      const finalStartDate = startDate
        ? new Date(startDate as string)
        : new Date(finalEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      finalStartDate.setHours(0, 0, 0, 0);
      finalEndDate.setHours(23, 59, 59, 999);

      const sales = await Sale.find({
        createdAt: {
          $gte: finalStartDate,
          $lte: finalEndDate,
        },
        status: "completed",
      }).populate("products.product");

      const produtosPorId: { [key: string]: ProdutoVendido } = {};

      let totalVendido = 0;

      sales.forEach((sale) => {
        sale.products.forEach((item: any) => {
          const product = item.product as unknown as {
            _id: { toString(): string };
            name: string;
            category?: string;
          };

          const productId = product._id.toString();

          if (!produtosPorId[productId]) {
            produtosPorId[productId] = {
              id: productId,
              nome: product.name,
              categoria: product.category
                ? product.category.toString()
                : "Não categorizado",
              quantidade: 0,
              valor: 0,
              percentualFaturamento: 0,
            };
          }

          produtosPorId[productId].quantidade += item.quantity;
          produtosPorId[productId].valor += item.quantity * item.price;
          totalVendido += item.quantity * item.price;
        });
      });

      for (const id in produtosPorId) {
        if (totalVendido > 0) {
          produtosPorId[id].percentualFaturamento =
            (produtosPorId[id].valor / totalVendido) * 100;
        }
      }

      const produtos: ProdutoVendido[] = Object.values(produtosPorId).sort(
        (a, b) => b.valor - a.valor
      );

      const formatPercentual = (produto: ProdutoVendido) => {
        if (
          produto.percentualFaturamento !== undefined &&
          !isNaN(produto.percentualFaturamento)
        ) {
          return produto.percentualFaturamento.toFixed(1);
        }
        return "0.00";
      };

      const tableRows = produtos.map((produto) => [
        produto.nome,
        produto.categoria || "Sem categoria",
        produto.quantidade.toString(),
        `R$ ${produto.valor.toFixed(2)}`,
        `${formatPercentual(produto)}%`,
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Produtos Mais Vendidos");

      worksheet.columns = [
        { header: "Produto", key: "nome", width: 30 },
        { header: "Categoria", key: "categoria", width: 20 },
        { header: "Quantidade", key: "quantidade", width: 15 },
        { header: "Valor Total", key: "valor", width: 20 },
        { header: "% do Faturamento", key: "percentual", width: 20 },
      ];

      worksheet.mergeCells("A1:E1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "Relatório de Produtos Mais Vendidos";
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: "center" };

      worksheet.mergeCells("A2:E2");
      const periodoCell = worksheet.getCell("A2");
      periodoCell.value = `Período: ${finalStartDate.toLocaleDateString("pt-BR")} a ${finalEndDate.toLocaleDateString("pt-BR")}`;
      periodoCell.font = { size: 12, bold: false };
      periodoCell.alignment = { horizontal: "center" };

      worksheet.addRow({});

      worksheet.getRow(4).font = { bold: true };

      tableRows.forEach((row) => {
        worksheet.addRow(row);
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio_produtos_${new Date().toISOString().split("T")[0]}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.error(
        "Erro ao exportar relatório de produtos para Excel:",
        error
      );
      res.status(500).json({
        error:
          error.message || "Erro ao exportar relatório de produtos para Excel",
      });
    }
  }
);

export const exportProductsReportToPDF = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const finalEndDate = endDate ? new Date(endDate as string) : new Date();
      const finalStartDate = startDate
        ? new Date(startDate as string)
        : new Date(finalEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      finalStartDate.setHours(0, 0, 0, 0);
      finalEndDate.setHours(23, 59, 59, 999);

      const sales = await Sale.find({
        createdAt: {
          $gte: finalStartDate,
          $lte: finalEndDate,
        },
        status: "completed",
      }).populate("products.product");

      const produtosPorId: { [key: string]: ProdutoVendido } = {};

      let totalVendido = 0;

      sales.forEach((sale) => {
        sale.products.forEach((item: any) => {
          const product = item.product as unknown as {
            _id: { toString(): string };
            name: string;
            category?: string;
          };

          const productId = product._id.toString();

          if (!produtosPorId[productId]) {
            produtosPorId[productId] = {
              id: productId,
              nome: product.name,
              categoria: product.category
                ? product.category.toString()
                : "Não categorizado",
              quantidade: 0,
              valor: 0,
              percentualFaturamento: 0,
            };
          }

          produtosPorId[productId].quantidade += item.quantity;
          produtosPorId[productId].valor += item.quantity * item.price;
          totalVendido += item.quantity * item.price;
        });
      });

      for (const id in produtosPorId) {
        if (totalVendido > 0) {
          produtosPorId[id].percentualFaturamento =
            (produtosPorId[id].valor / totalVendido) * 100;
        }
      }

      const produtos: ProdutoVendido[] = Object.values(produtosPorId).sort(
        (a, b) => b.valor - a.valor
      );

      const formatPercentual = (produto: ProdutoVendido) => {
        if (
          produto.percentualFaturamento !== undefined &&
          !isNaN(produto.percentualFaturamento)
        ) {
          return produto.percentualFaturamento.toFixed(1);
        }
        return "0.00";
      };

      const tableRows = produtos.map((produto) => [
        produto.nome,
        produto.categoria || "Sem categoria",
        produto.quantidade.toString(),
        `R$ ${produto.valor.toFixed(2)}`,
        `${formatPercentual(produto)}%`,
      ]);

      const doc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio_produtos_${new Date().toISOString().split("T")[0]}.pdf`
      );

      doc.pipe(res);

      doc
        .fontSize(20)
        .text("Relatório de Produtos Mais Vendidos", { align: "center" });
      doc.moveDown();

      doc
        .fontSize(12)
        .text(
          `Período: ${finalStartDate.toLocaleDateString("pt-BR")} a ${finalEndDate.toLocaleDateString("pt-BR")}`,
          { align: "center" }
        );
      doc.moveDown(2);

      doc.text(
        `Total de vendas no período: ${totalVendido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
      );
      doc.text(`Total de produtos diferentes vendidos: ${produtos.length}`);
      doc.moveDown(2);

      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [200, 80, 80, 80];

      doc.font("Helvetica-Bold");
      doc.text("Produto", tableLeft, tableTop);
      doc.text("Quantidade", tableLeft + colWidths[0], tableTop);
      doc.text("Valor", tableLeft + colWidths[0] + colWidths[1], tableTop);
      doc.text(
        "% Faturamento",
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2],
        tableTop
      );
      doc.moveDown();

      doc.font("Helvetica");
      let currentY = doc.y;

      const produtosExibidos = produtos.slice(0, 15);

      produtosExibidos.forEach((produto) => {
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
        }

        doc.text(produto.nome, tableLeft, currentY, {
          width: colWidths[0] - 10,
        });
        doc.text(
          produto.quantidade.toString(),
          tableLeft + colWidths[0],
          currentY
        );
        doc.text(
          produto.valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
          tableLeft + colWidths[0] + colWidths[1],
          currentY
        );
        doc.text(
          `${formatPercentual(produto)}%`,
          tableLeft + colWidths[0] + colWidths[1] + colWidths[2],
          currentY
        );

        currentY = doc.y + 10;
        doc.moveDown();
      });

      if (produtos.length > produtosExibidos.length) {
        doc.moveDown();
        doc.text(
          `... e mais ${produtos.length - produtosExibidos.length} outros produtos.`
        );
      }

      doc.end();
    } catch (error: any) {
      console.error("Erro ao exportar relatório de produtos para PDF:", error);
      res.status(500).json({
        error:
          error.message || "Erro ao exportar relatório de produtos para PDF",
      });
    }
  }
);
