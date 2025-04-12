"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
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

  // Função para converter nome do mês em número
  const getMonthNumber = (monthName: string): number => {
    try {
      // Verificar se já está no formato "mes/ano"
      if (monthName.includes("/")) {
        // Extrair apenas o nome do mês
        monthName = monthName.split("/")[0].trim();
      }

      // Remover possíveis números ou caracteres especiais
      const cleanName = monthName.replace(/[0-9]/g, "").trim();

      const months: { [key: string]: number } = {
        janeiro: 0,
        fevereiro: 1,
        março: 2,
        marco: 2, // Alternativa sem acento
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

      // Se não encontrar o mês, retorna o mês atual (valor padrão)
      return months[monthLower] !== undefined
        ? months[monthLower]
        : new Date().getMonth();
    } catch (error) {
      console.error("Erro ao converter mês:", error);
      return new Date().getMonth();
    }
  };

  // Estados para os relatórios
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

  // Efeito para carregar os dados da aba atual
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        switch (activeTab) {
          case "diario":
            if (selectedDate) {
              const dailyData = await reportService.getDailyReport(
                selectedDate.toISOString()
              );
              setDailyReport(dailyData);
            }
            break;
          case "semanal":
            const weeklyData = await reportService.getWeeklyReport();
            setWeeklyReport(weeklyData);
            break;
          case "mensal":
            const monthlyData = await reportService.getMonthlyReport();

            // Ordenar o histórico de meses pelo ano e mês cronologicamente
            if (
              monthlyData &&
              monthlyData.historicoMeses &&
              monthlyData.historicoMeses.length > 0
            ) {
              monthlyData.historicoMeses.sort((a, b) => {
                // Função para obter o valor numérico do mês e o ano de um período
                const getMonthYearValue = (periodo: string) => {
                  let month = 0;
                  let year = 0;

                  if (periodo.includes("/")) {
                    const parts = periodo.split("/");
                    // Verifica se o formato é "Mês/Ano" (ex: "Março/2025")
                    if (isNaN(parseInt(parts[0]))) {
                      month = getMonthNumber(parts[0]);
                      year = parseInt(parts[1]);
                    } else {
                      // Se for no formato "MM/AAAA" (ex: "03/2025")
                      month = parseInt(parts[0]) - 1; // Ajustar para índice 0-11
                      year = parseInt(parts[1]);
                    }
                  }

                  return { month, year };
                };

                const valueA = getMonthYearValue(a.periodo);
                const valueB = getMonthYearValue(b.periodo);

                // Ordenar primeiro por ano (decrescente)
                if (valueA.year !== valueB.year) {
                  return valueB.year - valueA.year; // Anos mais recentes primeiro
                }

                // Se o ano for o mesmo, ordenar por mês (decrescente)
                return valueB.month - valueA.month; // Meses mais recentes primeiro
              });
            }

            setMonthlyReport(monthlyData);
            break;
          case "produtos":
            const productsData = await reportService.getProductsReport();
            setProductsReport(productsData);
            break;
        }
      } catch (error: any) {
        toast({
          title: "Erro ao carregar relatório",
          description:
            error.message ||
            "Ocorreu um erro ao carregar os dados do relatório",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [activeTab, selectedDate, toast]);

  // Manipulador para troca de abas
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Função para formatar valor como moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para formatar percentual
  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Função para formatar data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  // Dentro do componente RelatoriosPage, adicione as funções de exportação
  const handleExportExcel = async () => {
    try {
      await exportDailyReportToExcel(selectedDate?.toISOString());
      toast({
        title: "Sucesso",
        description: "Relatório exportado para Excel com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message || "Erro ao exportar relatório para Excel",
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
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message || "Erro ao exportar relatório para PDF",
        variant: "destructive",
      });
    }
  };

  // Adicionar as funções de exportação para relatórios semanais e mensais
  const handleExportWeeklyExcel = async (startDate: string) => {
    try {
      await exportWeeklyReportToExcel(startDate);
      toast({
        title: "Sucesso",
        description: "Relatório semanal exportado para Excel com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description:
          error.message || "Erro ao exportar relatório semanal para Excel",
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
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description:
          error.message || "Erro ao exportar relatório semanal para PDF",
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
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description:
          error.message || "Erro ao exportar relatório mensal para Excel",
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
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description:
          error.message || "Erro ao exportar relatório mensal para PDF",
        variant: "destructive",
      });
    }
  };

  // No componente RelatoriosPage, adicione as funções de exportação de produtos
  const handleExportProductsExcel = async () => {
    try {
      await exportProductsReportToExcel();
      toast({
        title: "Sucesso",
        description: "Relatório de produtos exportado para Excel com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description:
          error.message || "Erro ao exportar relatório de produtos para Excel",
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
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description:
          error.message || "Erro ao exportar relatório de produtos para PDF",
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
      >
        <TabsList className="mb-4">
          <TabsTrigger value="diario">Diário</TabsTrigger>
          <TabsTrigger value="semanal">Semanal</TabsTrigger>
          <TabsTrigger value="mensal">Mensal</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="diario">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Relatório Diário</CardTitle>
                  <CardDescription>
                    Relatório detalhado das vendas do dia
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExportExcel}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar Excel
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-end">
                <DatePicker
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  label="Selecionar data"
                />
              </div>

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
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dailyReport.cancelamentos}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 mt-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Vendas por Forma de Pagamento</CardTitle>
                        <CardDescription>
                          Distribuição das vendas do dia
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
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
                              <TableCell>Dinheiro</TableCell>
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
                              <TableCell>Cartão de Crédito</TableCell>
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
                              <TableCell>Cartão de Débito</TableCell>
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
                              <TableCell>PIX</TableCell>
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
                  <p>Nenhum dado disponível para este dia</p>
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
                      <CardTitle>Vendas da Semana</CardTitle>
                      <CardDescription>
                        {`Período: ${formatDate(
                          weeklyReport.periodo.inicio
                        )} a ${formatDate(weeklyReport.periodo.fim)}`}
                      </CardDescription>
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
                        <CardTitle>Relatórios Semanais</CardTitle>
                        <CardDescription>
                          Histórico de relatórios semanais
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
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
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>
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
                                          handleExportWeeklyPDF(semana.periodo)
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
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p>Nenhum dado disponível para este período</p>
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
                    <CardTitle>Relatórios Mensais</CardTitle>
                    <CardDescription>
                      {`${monthlyReport.periodo.mes} de ${monthlyReport.periodo.ano}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
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
                                    // Verificar formato do período
                                    let month, year;
                                    if (mes.periodo.includes("/")) {
                                      const parts = mes.periodo.split("/");
                                      // Se for no formato "Mês/Ano" (ex: "Março/2025")
                                      if (isNaN(parseInt(parts[0]))) {
                                        month = getMonthNumber(parts[0]);
                                        year = parseInt(parts[1]);
                                      } else {
                                        // Se for no formato "MM/AAAA" (ex: "03/2025")
                                        month = parseInt(parts[0]) - 1; // Ajustar para índice 0-11
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
                                    // Verificar formato do período
                                    let month, year;
                                    if (mes.periodo.includes("/")) {
                                      const parts = mes.periodo.split("/");
                                      // Se for no formato "Mês/Ano" (ex: "Março/2025")
                                      if (isNaN(parseInt(parts[0]))) {
                                        month = getMonthNumber(parts[0]);
                                        year = parseInt(parts[1]);
                                      } else {
                                        // Se for no formato "MM/AAAA" (ex: "03/2025")
                                        month = parseInt(parts[0]) - 1; // Ajustar para índice 0-11
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
                  </CardContent>
                </Card>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p>Nenhum dado disponível para este período</p>
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
                    <div className="flex items-center justify-between">
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
                          Exportar Excel
                        </Button>
                        <Button
                          onClick={handleExportProductsPDF}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Exportar PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                        {productsReport.produtos.slice(0, 10).map((produto) => (
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
                            <TableCell colSpan={5} className="text-center py-4">
                              Nenhum produto vendido neste período
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p>Nenhum dado disponível para este período</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
