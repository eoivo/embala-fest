"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/overview";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Loader2,
  CreditCard,
  DollarSign,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import {
  reportService,
  exportDailyReportToExcel,
  exportDailyReportToPDF,
  exportWeeklyReportToExcel,
  exportWeeklyReportToPDF,
  exportMonthlyReportToExcel,
  exportMonthlyReportToPDF,
  exportProductsReportToExcel,
  exportProductsReportToPDF,
} from "@/services/reportService";
import {
  DailyReportData,
  WeeklyReportData,
  MonthlyReportData,
  ProductsReportData,
} from "@/services/reportService";

export default function RelatoriosPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [activeTab, setActiveTab] = useState("diario");

  const getMonthNumber = (monthName: string): number => {
    try {
      if (monthName.includes("/")) {
        monthName = monthName.split("/")[0].trim();
      }

      const cleanName = monthName.replace(/[0-9]/g, "").trim();

      const months: { [key: string]: number } = {
        janeiro: 0,
        fevereiro: 1,
        março: 2,
        marco: 2,
        abril: 3,
        maio: 4,
        junho: 5,
        julho: 6,
        agosto: 7,
        setembro: 8,
        outubro: 9,
        novembro: 10,
        dezembro: 11,
      };

      const monthLower = cleanName.toLowerCase();
      console.log(
        "Convertendo mês:",
        monthName,
        "->",
        monthLower,
        "para número:",
        months[monthLower] !== undefined
          ? months[monthLower]
          : new Date().getMonth()
      );

      return months[monthLower] !== undefined
        ? months[monthLower]
        : new Date().getMonth();
    } catch (error) {
      console.error("Erro ao converter mês:", error);
      return new Date().getMonth();
    }
  };

  const [loading, setLoading] = useState(true);
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(
    null
  );
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportData | null>(
    null
  );
  const [productsReport, setProductsReport] =
    useState<ProductsReportData | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        switch (activeTab) {
          case "diario": {
            if (selectedDate) {
              const dailyData = await reportService.getDailyReport(
                selectedDate.toISOString()
              );
              setDailyReport(dailyData);
            }
            break;
          }
          case "semanal": {
            const weeklyData = await reportService.getWeeklyReport();
            setWeeklyReport(weeklyData);
            break;
          }
          case "mensal": {
            const monthlyData = await reportService.getMonthlyReport();

            if (
              monthlyData &&
              monthlyData.historicoMeses &&
              monthlyData.historicoMeses.length > 0
            ) {
              monthlyData.historicoMeses.sort((a, b) => {
                const getMonthYearValue = (periodo: string) => {
                  let month = 0;
                  let year = 0;

                  if (periodo.includes("/")) {
                    const parts = periodo.split("/");
                    if (isNaN(parseInt(parts[0]))) {
                      month = getMonthNumber(parts[0]);
                      year = parseInt(parts[1]);
                    } else {
                      month = parseInt(parts[0]) - 1;
                      year = parseInt(parts[1]);
                    }
                  }

                  return { month, year };
                };

                const valueA = getMonthYearValue(a.periodo);
                const valueB = getMonthYearValue(b.periodo);

                if (valueA.year !== valueB.year) {
                  return valueB.year - valueA.year;
                }

                return valueB.month - valueA.month;
              });
            }

            setMonthlyReport(monthlyData);
            break;
          }
          case "produtos": {
            const productsData = await reportService.getProductsReport();
            setProductsReport(productsData);
            break;
          }
        }
      } catch (error: unknown) {
        toast({
          title: "Erro ao carregar relatório",
          description:
            error instanceof Error
              ? error.message
              : "Ocorreu um erro ao carregar os dados do relatório",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [activeTab, selectedDate, toast]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleExportExcel = async () => {
    try {
      await exportDailyReportToExcel(selectedDate?.toISOString());
      toast({
        title: "Sucesso",
        description: "Relatório exportado para Excel com sucesso",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao exportar",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao exportar relatório para Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportDailyReportToPDF(selectedDate?.toISOString());
      toast({
        title: "Sucesso",
        description: "Relatório exportado para PDF com sucesso",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao exportar",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao exportar relatório para PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportWeeklyExcel = async (startDate: string) => {
    try {
      await exportWeeklyReportToExcel(startDate);
      toast({
        title: "Sucesso",
        description: "Relatório semanal exportado para Excel com sucesso",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao exportar",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao exportar relatório semanal para Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportWeeklyPDF = async (startDate: string) => {
    try {
      await exportWeeklyReportToPDF(startDate);
      toast({
        title: "Sucesso",
        description: "Relatório semanal exportado para PDF com sucesso",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao exportar",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao exportar relatório semanal para PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportMonthlyExcel = async (month: number, year: number) => {
    try {
      await exportMonthlyReportToExcel(month, year);
      toast({
        title: "Sucesso",
        description: "Relatório mensal exportado para Excel com sucesso",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao exportar",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao exportar relatório mensal para Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportMonthlyPDF = async (month: number, year: number) => {
    try {
      console.log(`Exportando PDF para mês ${month} e ano ${year}`);
      await exportMonthlyReportToPDF(month, year);
      toast({
        title: "Sucesso",
        description: "Relatório mensal exportado para PDF com sucesso",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao exportar",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao exportar relatório mensal para PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportProductsExcel = async () => {
    try {
      await exportProductsReportToExcel();
      toast({
        title: "Sucesso",
        description: "Relatório de produtos exportado para Excel com sucesso",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao exportar",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao exportar relatório de produtos para Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportProductsPDF = async () => {
    try {
      await exportProductsReportToPDF();
      toast({
        title: "Sucesso",
        description: "Relatório de produtos exportado para PDF com sucesso",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao exportar",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao exportar relatório de produtos para PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Relatórios"
        description="Visualize e exporte relatórios do sistema"
      ></DashboardHeader>

      <Tabs
        defaultValue="diario"
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 sm:grid-cols-4">
          <TabsTrigger value="diario">Diário</TabsTrigger>
          <TabsTrigger value="semanal">Semanal</TabsTrigger>
          <TabsTrigger value="mensal">Mensal</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="diario">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Relatório Diário</CardTitle>
                  <CardDescription>
                    Relatório detalhado das vendas do dia
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <DatePicker
                    date={selectedDate}
                    onDateChange={setSelectedDate}
                    label="Selecionar data"
                    className="w-full sm:w-auto"
                  />
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button
                      onClick={handleExportExcel}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="hidden sm:inline">Exportar Excel</span>
                      <span className="sm:hidden">Excel</span>
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Exportar PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="ml-2">Carregando dados do relatório...</p>
                </div>
              ) : dailyReport ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Faturado
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(dailyReport.totalFaturado)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Número de Vendas
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dailyReport.numeroVendas}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Ticket Médio
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(dailyReport.ticketMedio)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Cancelamentos
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dailyReport.cancelamentos}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 mt-6 md:grid-cols-2">
                    <Card className="overflow-hidden">
                      <CardHeader>
                        <CardTitle>Vendas por Forma de Pagamento</CardTitle>
                        <CardDescription>
                          Distribuição das vendas do dia
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="md:block hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Forma de Pagamento</TableHead>
                                <TableHead className="text-right">
                                  Valor
                                </TableHead>
                                <TableHead className="text-right">%</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                                  Dinheiro
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    dailyReport.vendasPorFormaPagamento.valores
                                      .cash
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPercent(
                                    dailyReport.vendasPorFormaPagamento
                                      .percentuais.cash
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="flex items-center">
                                  <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                                  Cartão de Crédito
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    dailyReport.vendasPorFormaPagamento.valores
                                      .credit
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPercent(
                                    dailyReport.vendasPorFormaPagamento
                                      .percentuais.credit
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="flex items-center">
                                  <Wallet className="h-4 w-4 mr-2 text-indigo-500" />
                                  Cartão de Débito
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    dailyReport.vendasPorFormaPagamento.valores
                                      .debit
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPercent(
                                    dailyReport.vendasPorFormaPagamento
                                      .percentuais.debit
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="flex items-center">
                                  <PiggyBank className="h-4 w-4 mr-2 text-purple-500" />
                                  PIX
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    dailyReport.vendasPorFormaPagamento.valores
                                      .pix
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPercent(
                                    dailyReport.vendasPorFormaPagamento
                                      .percentuais.pix
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        <div className="md:hidden space-y-3 p-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                              <span>Dinheiro</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                {formatCurrency(
                                  dailyReport.vendasPorFormaPagamento.valores
                                    .cash
                                )}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatPercent(
                                  dailyReport.vendasPorFormaPagamento
                                    .percentuais.cash
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center">
                              <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                              <span>Cartão de Crédito</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                {formatCurrency(
                                  dailyReport.vendasPorFormaPagamento.valores
                                    .credit
                                )}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatPercent(
                                  dailyReport.vendasPorFormaPagamento
                                    .percentuais.credit
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center">
                              <Wallet className="h-4 w-4 mr-2 text-indigo-500" />
                              <span>Cartão de Débito</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                {formatCurrency(
                                  dailyReport.vendasPorFormaPagamento.valores
                                    .debit
                                )}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatPercent(
                                  dailyReport.vendasPorFormaPagamento
                                    .percentuais.debit
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <PiggyBank className="h-4 w-4 mr-2 text-purple-500" />
                              <span>PIX</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                {formatCurrency(
                                  dailyReport.vendasPorFormaPagamento.valores
                                    .pix
                                )}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatPercent(
                                  dailyReport.vendasPorFormaPagamento
                                    .percentuais.pix
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Produtos Mais Vendidos</CardTitle>
                        <CardDescription>Top 5 produtos do dia</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">
                                Quantidade
                              </TableHead>
                              <TableHead className="text-right">
                                Valor
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dailyReport.produtosMaisVendidos.map((produto) => (
                              <TableRow key={produto.id}>
                                <TableCell>{produto.nome}</TableCell>
                                <TableCell className="text-right">
                                  {produto.quantidade}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(produto.valor)}
                                </TableCell>
                              </TableRow>
                            ))}
                            {dailyReport.produtosMaisVendidos.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  className="text-center py-4"
                                >
                                  Nenhum produto vendido neste dia
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">
                    Nenhum dado disponível para a data selecionada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semanal">
          {activeTab === "semanal" && (
            <>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="ml-2">Carregando dados do relatório...</p>
                </div>
              ) : weeklyReport ? (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
                        <div>
                          <CardTitle>Vendas da Semana</CardTitle>
                          <CardDescription>
                            {`Período: ${formatDate(
                              weeklyReport.periodo.inicio
                            )} a ${formatDate(weeklyReport.periodo.fim)}`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              handleExportWeeklyExcel(
                                weeklyReport.periodo.inicio
                              )
                            }
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              Exportar Excel
                            </span>
                            <span className="sm:hidden">Excel</span>
                          </Button>
                          <Button
                            onClick={() =>
                              handleExportWeeklyPDF(weeklyReport.periodo.inicio)
                            }
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              Exportar PDF
                            </span>
                            <span className="sm:hidden">PDF</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <Overview
                        data={weeklyReport.vendasPorDia.map((item) => ({
                          name: formatDate(item.data),
                          total: item.total,
                        }))}
                      />
                    </CardContent>
                  </Card>

                  <div className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Histórico Semanal</CardTitle>
                        <CardDescription>
                          Relatórios das semanas anteriores
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Período</TableHead>
                                <TableHead className="text-right">
                                  Total Vendas
                                </TableHead>
                                <TableHead className="text-right">
                                  Qtd. Vendas
                                </TableHead>
                                <TableHead className="text-right">
                                  Ticket Médio
                                </TableHead>
                                <TableHead className="text-right">
                                  Ações
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className="bg-muted/50">
                                <TableCell className="font-medium">
                                  {`${formatDate(
                                    weeklyReport.periodo.inicio
                                  )} - ${formatDate(weeklyReport.periodo.fim)}`}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    weeklyReport.totais.totalVendas
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {weeklyReport.totais.qtdVendas}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    weeklyReport.totais.ticketMedio
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleExportWeeklyExcel(
                                          weeklyReport.periodo.inicio
                                        )
                                      }
                                      title="Exportar para Excel"
                                    >
                                      <FileSpreadsheet className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleExportWeeklyPDF(
                                          weeklyReport.periodo.inicio
                                        )
                                      }
                                      title="Exportar para PDF"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {weeklyReport.historicoSemanas.map(
                                (semana, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{semana.periodo}</TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(semana.totalVendas)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {semana.qtdVendas}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(semana.ticketMedio)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            handleExportWeeklyExcel(
                                              semana.periodo
                                            )
                                          }
                                          title="Exportar para Excel"
                                        >
                                          <FileSpreadsheet className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            handleExportWeeklyPDF(
                                              semana.periodo
                                            )
                                          }
                                          title="Exportar para PDF"
                                        >
                                          <FileText className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="md:hidden space-y-4">
                          <Card className="bg-muted/50 overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">
                                Semana Atual
                              </CardTitle>
                              <CardDescription>
                                {`${formatDate(
                                  weeklyReport.periodo.inicio
                                )} - ${formatDate(weeklyReport.periodo.fim)}`}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-3 pt-2">
                              <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Total Vendas
                                  </p>
                                  <p className="font-medium">
                                    {formatCurrency(
                                      weeklyReport.totais.totalVendas
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Quantidade
                                  </p>
                                  <p className="font-medium">
                                    {weeklyReport.totais.qtdVendas}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Ticket Médio
                                  </p>
                                  <p className="font-medium">
                                    {formatCurrency(
                                      weeklyReport.totais.ticketMedio
                                    )}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-0 pb-3 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                  handleExportWeeklyExcel(
                                    weeklyReport.periodo.inicio
                                  )
                                }
                              >
                                <FileSpreadsheet className="h-4 w-4 mr-1" />
                                Excel
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                  handleExportWeeklyPDF(
                                    weeklyReport.periodo.inicio
                                  )
                                }
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </CardFooter>
                          </Card>

                          {weeklyReport.historicoSemanas.map(
                            (semana, index) => (
                              <Card key={index} className="overflow-hidden">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">
                                    {semana.periodo}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pb-3 pt-2">
                                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">
                                        Total Vendas
                                      </p>
                                      <p className="font-medium">
                                        {formatCurrency(semana.totalVendas)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Quantidade
                                      </p>
                                      <p className="font-medium">
                                        {semana.qtdVendas}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Ticket Médio
                                      </p>
                                      <p className="font-medium">
                                        {formatCurrency(semana.ticketMedio)}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="flex justify-between pt-0 pb-3 border-t">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8"
                                    onClick={() =>
                                      handleExportWeeklyExcel(semana.periodo)
                                    }
                                  >
                                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                                    Excel
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8"
                                    onClick={() =>
                                      handleExportWeeklyPDF(semana.periodo)
                                    }
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    PDF
                                  </Button>
                                </CardFooter>
                              </Card>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">
                    Nenhum dado disponível para este período
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="mensal">
          {activeTab === "mensal" && (
            <>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="ml-2">Carregando dados do relatório...</p>
                </div>
              ) : monthlyReport ? (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle>Relatórios Mensais</CardTitle>
                        <CardDescription>
                          {`${monthlyReport.periodo.mes} de ${monthlyReport.periodo.ano}`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleExportMonthlyExcel(
                              getMonthNumber(monthlyReport.periodo.mes),
                              monthlyReport.periodo.ano
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          <span className="hidden sm:inline">
                            Exportar Excel
                          </span>
                          <span className="sm:hidden">Excel</span>
                        </Button>
                        <Button
                          onClick={() =>
                            handleExportMonthlyPDF(
                              getMonthNumber(monthlyReport.periodo.mes),
                              monthlyReport.periodo.ano
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="hidden sm:inline">Exportar PDF</span>
                          <span className="sm:hidden">PDF</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Período</TableHead>
                            <TableHead className="text-right">
                              Total Vendas
                            </TableHead>
                            <TableHead className="text-right">
                              Qtd. Vendas
                            </TableHead>
                            <TableHead className="text-right">
                              Ticket Médio
                            </TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="bg-muted/50">
                            <TableCell className="font-medium">
                              {`${monthlyReport.periodo.mes}/${monthlyReport.periodo.ano}`}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(monthlyReport.totais.totalVendas)}
                            </TableCell>
                            <TableCell className="text-right">
                              {monthlyReport.totais.qtdVendas}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(monthlyReport.totais.ticketMedio)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleExportMonthlyExcel(
                                      getMonthNumber(monthlyReport.periodo.mes),
                                      monthlyReport.periodo.ano
                                    )
                                  }
                                  title="Exportar para Excel"
                                >
                                  <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleExportMonthlyPDF(
                                      getMonthNumber(monthlyReport.periodo.mes),
                                      monthlyReport.periodo.ano
                                    )
                                  }
                                  title="Exportar para PDF"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {monthlyReport.historicoMeses.map((mes, index) => (
                            <TableRow key={index}>
                              <TableCell>{mes.periodo}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(mes.totalVendas)}
                              </TableCell>
                              <TableCell className="text-right">
                                {mes.qtdVendas}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(mes.ticketMedio)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      let month, year;
                                      if (mes.periodo.includes("/")) {
                                        const parts = mes.periodo.split("/");
                                        if (isNaN(parseInt(parts[0]))) {
                                          month = getMonthNumber(parts[0]);
                                          year = parseInt(parts[1]);
                                        } else {
                                          month = parseInt(parts[0]) - 1;
                                          year = parseInt(parts[1]);
                                        }
                                      } else {
                                        month = getMonthNumber(mes.periodo);
                                        year = new Date().getFullYear();
                                      }

                                      console.log(
                                        `Exportando Excel para mês ${month} e ano ${year} de período ${mes.periodo}`
                                      );
                                      handleExportMonthlyExcel(month, year);
                                    }}
                                    title="Exportar para Excel"
                                  >
                                    <FileSpreadsheet className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      let month, year;
                                      if (mes.periodo.includes("/")) {
                                        const parts = mes.periodo.split("/");
                                        if (isNaN(parseInt(parts[0]))) {
                                          month = getMonthNumber(parts[0]);
                                          year = parseInt(parts[1]);
                                        } else {
                                          month = parseInt(parts[0]) - 1;
                                          year = parseInt(parts[1]);
                                        }
                                      } else {
                                        month = getMonthNumber(mes.periodo);
                                        year = new Date().getFullYear();
                                      }

                                      console.log(
                                        `Exportando PDF para mês ${month} e ano ${year} de período ${mes.periodo}`
                                      );
                                      handleExportMonthlyPDF(month, year);
                                    }}
                                    title="Exportar para PDF"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="md:hidden space-y-4">
                      <Card className="bg-muted/50 overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Mês Atual</CardTitle>
                          <CardDescription>
                            {`${monthlyReport.periodo.mes}/${monthlyReport.periodo.ano}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-3 pt-2">
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Total Vendas
                              </p>
                              <p className="font-medium">
                                {formatCurrency(
                                  monthlyReport.totais.totalVendas
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Quantidade
                              </p>
                              <p className="font-medium">
                                {monthlyReport.totais.qtdVendas}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Ticket Médio
                              </p>
                              <p className="font-medium">
                                {formatCurrency(
                                  monthlyReport.totais.ticketMedio
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0 pb-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() =>
                              handleExportMonthlyExcel(
                                getMonthNumber(monthlyReport.periodo.mes),
                                monthlyReport.periodo.ano
                              )
                            }
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-1" />
                            Excel
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() =>
                              handleExportMonthlyPDF(
                                getMonthNumber(monthlyReport.periodo.mes),
                                monthlyReport.periodo.ano
                              )
                            }
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </CardFooter>
                      </Card>

                      {monthlyReport.historicoMeses.map((mes, index) => {
                        let month, year;
                        if (mes.periodo.includes("/")) {
                          const parts = mes.periodo.split("/");
                          if (isNaN(parseInt(parts[0]))) {
                            month = getMonthNumber(parts[0]);
                            year = parseInt(parts[1]);
                          } else {
                            month = parseInt(parts[0]) - 1;
                            year = parseInt(parts[1]);
                          }
                        } else {
                          month = getMonthNumber(mes.periodo);
                          year = new Date().getFullYear();
                        }

                        return (
                          <Card key={index} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">
                                {mes.periodo}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 pt-2">
                              <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Total Vendas
                                  </p>
                                  <p className="font-medium">
                                    {formatCurrency(mes.totalVendas)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Quantidade
                                  </p>
                                  <p className="font-medium">{mes.qtdVendas}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Ticket Médio
                                  </p>
                                  <p className="font-medium">
                                    {formatCurrency(mes.ticketMedio)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-0 pb-3 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                  handleExportMonthlyExcel(month, year)
                                }
                              >
                                <FileSpreadsheet className="h-4 w-4 mr-1" />
                                Excel
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                  handleExportMonthlyPDF(month, year)
                                }
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">
                    Nenhum dado disponível para este período
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="produtos">
          {activeTab === "produtos" && (
            <>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="ml-2">Carregando dados do relatório...</p>
                </div>
              ) : productsReport ? (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle>Produtos Mais Vendidos</CardTitle>
                        <CardDescription>
                          {`Período: ${formatDate(
                            productsReport.periodo.inicio
                          )} a ${formatDate(productsReport.periodo.fim)}`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleExportProductsExcel}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          <span className="hidden sm:inline">
                            Exportar Excel
                          </span>
                          <span className="sm:hidden">Excel</span>
                        </Button>
                        <Button
                          onClick={handleExportProductsPDF}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="hidden sm:inline">Exportar PDF</span>
                          <span className="sm:hidden">PDF</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">
                              Quantidade
                            </TableHead>
                            <TableHead className="text-right">
                              Valor Total
                            </TableHead>
                            <TableHead className="text-right">
                              % do Faturamento
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productsReport.produtos
                            .slice(0, 10)
                            .map((produto) => (
                              <TableRow key={produto.id}>
                                <TableCell>{produto.nome}</TableCell>
                                <TableCell>{produto.categoria}</TableCell>
                                <TableCell className="text-right">
                                  {produto.quantidade}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(produto.valor)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPercent(produto.percentualFaturamento)}
                                </TableCell>
                              </TableRow>
                            ))}
                          {productsReport.produtos.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-4"
                              >
                                Nenhum produto vendido neste período
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="md:hidden space-y-4">
                      {productsReport.produtos.length === 0 ? (
                        <Card>
                          <CardContent className="text-center py-6">
                            <p className="text-muted-foreground">
                              Nenhum produto vendido neste período
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        productsReport.produtos.slice(0, 10).map((produto) => (
                          <Card key={produto.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">
                                {produto.nome}
                              </CardTitle>
                              <CardDescription>
                                {produto.categoria}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-3 pt-2">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Quantidade
                                  </p>
                                  <p className="font-medium">
                                    {produto.quantidade}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Valor Total
                                  </p>
                                  <p className="font-medium">
                                    {formatCurrency(produto.valor)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    % do Faturamento
                                  </p>
                                  <p className="font-medium">
                                    {formatPercent(
                                      produto.percentualFaturamento
                                    )}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">
                    Nenhum dado disponível para este período
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
