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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  CreditCard,
  DollarSign,
  FileText,
  Plus,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { registerService } from "./registerService";
import { useToast } from "@/hooks/use-toast";

export default function CaixaPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [registerHistory, setRegisterHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await registerService.getDashboard();
        const history = await registerService.getRegisterHistory();

        setDashboardData(data);
        setRegisterHistory(Array.isArray(history) ? history : []);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar dados",
          description:
            error.message || "Ocorreu um erro ao buscar informações do caixa.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  if (loading) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Caixa"
          description="Carregando informações..."
        >
          <div className="flex space-x-2">
            <Button variant="outline" disabled>
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Abrir Caixa
            </Button>
          </div>
        </DashboardHeader>
        <div className="flex justify-center items-center h-64">
          <p>Carregando dados do caixa...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Caixa"
        description="Gerencie as operações do caixa"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          {dashboardData?.status === "closed" ? (
            <Link href="/dashboard/caixa/abrir">
              <Button className="w-full sm:w-auto">
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Abrir Caixa
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/dashboard/caixa/venda" className="w-full sm:w-auto">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Venda
                </Button>
              </Link>
              <Link href="/dashboard/caixa/fechar" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  Fechar Caixa
                </Button>
              </Link>
            </>
          )}
        </div>
      </DashboardHeader>

      {dashboardData?.status === "closed" ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Caixa Fechado</AlertTitle>
          <AlertDescription>
            O caixa está fechado. Abra o caixa para iniciar as operações do dia.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 border-green-500 text-green-500">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Caixa Aberto</AlertTitle>
          <AlertDescription>
            O caixa está aberto desde{" "}
            {new Date(
              dashboardData?.currentRegister?.horaAbertura || new Date()
            ).toLocaleString("pt-BR")}
            . Saldo inicial: R${" "}
            {(dashboardData?.currentRegister?.saldoInicial || 0).toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status do Caixa
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.status === "open" ? (
                <span className="text-green-500">Aberto</span>
              ) : (
                <span className="text-red-500">Fechado</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.status === "open"
                ? `Aberto desde ${new Date(
                    dashboardData?.currentRegister?.horaAbertura || new Date()
                  ).toLocaleString("pt-BR")}`
                : `Último fechamento: ${new Date(
                    dashboardData?.lastClosedRegister?.horaFechamento ||
                      new Date()
                  ).toLocaleString("pt-BR")}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(dashboardData?.currentRegister?.saldoAtual || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo inicial: R${" "}
              {(dashboardData?.currentRegister?.saldoInicial || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(dashboardData?.currentRegister?.totalVendas || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.currentRegister?.qtdeVendas || 0} vendas
              realizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Formas de Pagamento
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Dinheiro:</span>
                <span>
                  R${" "}
                  {(
                    dashboardData?.currentRegister?.vendasPorFormaPagamento
                      ?.cash || 0
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cartão de Crédito:</span>
                <span>
                  R${" "}
                  {(
                    dashboardData?.currentRegister?.vendasPorFormaPagamento
                      ?.credit || 0
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cartão de Débito:</span>
                <span>
                  R${" "}
                  {(
                    dashboardData?.currentRegister?.vendasPorFormaPagamento
                      ?.debit || 0
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>PIX:</span>
                <span>
                  R${" "}
                  {(
                    dashboardData?.currentRegister?.vendasPorFormaPagamento
                      ?.pix || 0
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumo" className="mt-6">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Dia</CardTitle>
              <CardDescription>
                Resumo das operações do dia atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Saldo Inicial
                    </div>
                    <div className="text-xl font-bold">
                      R${" "}
                      {(
                        dashboardData?.currentRegister?.saldoInicial || 0
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Saldo Atual
                    </div>
                    <div className="text-xl font-bold">
                      R${" "}
                      {(
                        dashboardData?.currentRegister?.saldoAtual || 0
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Total de Vendas
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      R${" "}
                      {(
                        dashboardData?.currentRegister?.totalVendas || 0
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Cancelamentos
                    </div>
                    <div className="text-xl font-bold text-red-600">
                      R$ 0,00
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">
                    Vendas por Forma de Pagamento
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Dinheiro</span>
                      <span>
                        R${" "}
                        {(
                          dashboardData?.currentRegister
                            ?.vendasPorFormaPagamento?.cash || 0
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cartão de Crédito</span>
                      <span>
                        R${" "}
                        {(
                          dashboardData?.currentRegister
                            ?.vendasPorFormaPagamento?.credit || 0
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cartão de Débito</span>
                      <span>
                        R${" "}
                        {(
                          dashboardData?.currentRegister
                            ?.vendasPorFormaPagamento?.debit || 0
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>PIX</span>
                      <span>
                        R${" "}
                        {(
                          dashboardData?.currentRegister
                            ?.vendasPorFormaPagamento?.pix || 0
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Operações</CardTitle>
              <CardDescription>
                Histórico de aberturas e fechamentos do caixa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {registerHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    Nenhum histórico de caixa encontrado
                  </p>
                ) : (
                  // Ordenar por data decrescente (mais recente primeiro)
                  [...registerHistory]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((register) => {
                      const isOpen = register.status === "open";
                      const isCurrentRegister =
                        dashboardData?.currentRegister?.id === register._id;

                      return (
                        <div
                          key={register._id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Badge
                                variant="outline"
                                className={`mr-2 ${
                                  isOpen
                                    ? "bg-green-100 text-green-600 hover:bg-green-100"
                                    : "bg-red-100 text-red-600 hover:bg-red-100"
                                }`}
                              >
                                {isOpen ? "Abertura" : "Fechamento"}
                                {isCurrentRegister && " (Atual)"}
                              </Badge>
                              <span className="text-sm font-medium">
                                {new Date(register.createdAt).toLocaleString(
                                  "pt-BR"
                                )}
                                {register.closedAt &&
                                  ` - ${new Date(
                                    register.closedAt
                                  ).toLocaleString("pt-BR")}`}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Operador: {register.user?.name || "Desconhecido"}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Saldo Inicial:
                              </span>
                              <div>
                                R$ {(register.initialBalance || 0).toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                {isOpen && isCurrentRegister
                                  ? "Vendas até agora:"
                                  : "Total de Vendas:"}
                              </span>
                              <div>
                                R${" "}
                                {isOpen && isCurrentRegister
                                  ? (
                                      dashboardData?.currentRegister
                                        ?.totalVendas || 0
                                    ).toFixed(2)
                                  : (
                                      (register.finalBalance || 0) -
                                      (register.initialBalance || 0)
                                    ).toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                {isOpen && isCurrentRegister
                                  ? "Saldo Atual:"
                                  : "Saldo Final:"}
                              </span>
                              <div>
                                R${" "}
                                {isOpen && isCurrentRegister
                                  ? (
                                      dashboardData?.currentRegister
                                        ?.saldoAtual || 0
                                    ).toFixed(2)
                                  : (register.finalBalance || 0).toFixed(2)}
                              </div>
                            </div>
                            {!isOpen && register.closedBy && (
                              <div className="col-span-3 mt-2 text-xs text-muted-foreground">
                                Fechado por:{" "}
                                {register.closedBy.name || "Desconhecido"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
