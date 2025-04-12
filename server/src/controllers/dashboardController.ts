import { Request, Response } from "express";
import { Register } from "../models/register.js";
import { Sale } from "../models/sale.js";

export const dashboardController = {
  async getDashboardData(req: Request, res: Response) {
    try {
      // Busca o registro atual (caixa aberto)
      const currentRegister = await Register.findOne({
        user: req.user._id,
        status: "open",
      }).sort({ createdAt: -1 });

      // Busca o último registro fechado
      const lastClosedRegister = await Register.findOne({
        user: req.user._id,
        status: "closed",
      }).sort({ updatedAt: -1 });

      // Calcula vendas de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaySales = await Sale.find({
        createdAt: {
          $gte: today,
          $lt: tomorrow,
        },
      });

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdaySales = await Sale.find({
        createdAt: {
          $gte: yesterday,
          $lt: today,
        },
      });

      // Calcula totais
      const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
      const yesterdayTotal = yesterdaySales.reduce(
        (sum, sale) => sum + sale.total,
        0
      );
      const salesVariation =
        yesterdayTotal > 0
          ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
          : 0;

      // Calcula produtos vendidos
      const todayProducts = todaySales.reduce(
        (sum, sale) => sum + sale.products.length,
        0
      );
      const yesterdayProducts = yesterdaySales.reduce(
        (sum, sale) => sum + sale.products.length,
        0
      );
      const productsVariation =
        yesterdayProducts > 0 ? todayProducts - yesterdayProducts : 0;

      // Calcula ticket médio
      const todayTicket =
        todaySales.length > 0 ? todayTotal / todaySales.length : 0;
      const yesterdayTicket =
        yesterdaySales.length > 0 ? yesterdayTotal / yesterdaySales.length : 0;
      const ticketVariation =
        yesterdayTicket > 0
          ? ((todayTicket - yesterdayTicket) / yesterdayTicket) * 100
          : 0;

      // Busca vendas dos últimos 7 dias
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const last7DaysSales = await Sale.aggregate([
        {
          $match: {
            createdAt: {
              $gte: sevenDaysAgo,
              $lt: tomorrow,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            total: { $sum: "$total" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // Garantir que temos dados para todos os 7 dias, mesmo para dias sem vendas
      const allDaysData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD

        // Verificar se já temos dados para este dia
        const existingData = last7DaysSales.find(
          (sale) => sale._id === dateString
        );

        if (existingData) {
          allDaysData.push(existingData);
        } else {
          // Adicionar dia com total zero se não houver vendas
          allDaysData.push({
            _id: dateString,
            total: 0,
          });
        }
      }

      // Busca vendas recentes
      const recentSales = await Sale.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("products.product", "name price quantity")
        .populate("consumer", "name");

      res.json({
        vendasHoje: {
          total: todayTotal,
          variacao: salesVariation,
        },
        produtosVendidos: {
          quantidade: todayProducts,
          variacao: productsVariation,
        },
        ticketMedio: {
          valor: todayTicket,
          variacao: ticketVariation,
        },
        statusCaixa: {
          status: currentRegister ? "open" : "closed",
          ultimoFechamento: lastClosedRegister?.updatedAt || null,
        },
        vendasUltimos7Dias: allDaysData.map((sale) => ({
          data: sale._id,
          total: sale.total,
        })),
        vendasRecentes: recentSales.map((sale) => ({
          id: sale._id,
          cliente: sale.consumer
            ? (sale.consumer as any).name
            : "Cliente não informado",
          data: sale.createdAt,
          total: sale.total,
          status: sale.status,
        })),
      });
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      res.status(500).json({ error: "Erro ao buscar dados do dashboard" });
    }
  },

  async getVendasPorPeriodo(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "É necessário informar as datas de início e fim do período",
        });
      }

      const dataInicio = new Date(startDate as string);
      const dataFim = new Date(endDate as string);

      // Ajustar a data final para o final do dia
      dataFim.setHours(23, 59, 59, 999);

      // Buscar as vendas do período solicitado
      const vendasPeriodo = await Sale.aggregate([
        {
          $match: {
            createdAt: {
              $gte: dataInicio,
              $lte: dataFim,
            },
            status: "completed", // Considerar apenas vendas concluídas
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            total: { $sum: "$total" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // Preencher dias sem vendas com valor zero
      const vendasCompletas = [];
      const totalPeriodo = vendasPeriodo.reduce(
        (sum, item) => sum + item.total,
        0
      );

      // Criar um array com todos os dias do período
      const currentDate = new Date(dataInicio);
      while (currentDate <= dataFim) {
        const dateStr = currentDate.toISOString().split("T")[0];

        // Verificar se existe venda neste dia
        const vendaDia = vendasPeriodo.find((v) => v._id === dateStr);

        if (vendaDia) {
          vendasCompletas.push({
            data: dateStr,
            total: vendaDia.total,
          });
        } else {
          vendasCompletas.push({
            data: dateStr,
            total: 0,
          });
        }

        // Avançar para o próximo dia
        currentDate.setDate(currentDate.getDate() + 1);
      }

      res.json({
        vendas: vendasCompletas,
        totalPeriodo,
      });
    } catch (error) {
      console.error("Erro ao buscar vendas por período:", error);
      res.status(500).json({
        error: "Erro ao buscar vendas por período",
      });
    }
  },
};
