"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Overview } from "../../components/dashboard/overview";
import { RecentSales } from "../../components/dashboard/recent-sales";
import { DashboardHeader } from "../../components/dashboard/dashboard-header";
import { DashboardShell } from "../../components/dashboard/dashboard-shell";
import { Button } from "../../components/ui/button";
import {
  CalendarIcon,
  LineChart,
  Package,
  PartyPopper,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { Confetti } from "../../components/festive-elements";
import { dashboardService, DashboardData } from "./dashboardService";
import { useToast } from "../../hooks/use-toast";

export default function DashboardPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar dados",
          description:
            error.message ||
            "Ocorreu um erro ao buscar informações do dashboard.",
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
          heading="Dashboard"
          description="Carregando informações..."
        >
          <div className="flex space-x-2">
            <Button disabled>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Abrir Caixa
            </Button>
          </div>
        </DashboardHeader>
        <div className="flex justify-center items-center h-64">
          <p>Carregando dados do dashboard...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="relative">
        <Confetti count={30} />
        <DashboardHeader
          heading="Dashboard"
          description="Visão geral do sistema de caixa da loja"
        >
          <div className="flex space-x-2">
            {dashboardData?.statusCaixa.status === "closed" && (
              <Link href="/dashboard/caixa/abrir">
                <Button>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Abrir Caixa
                </Button>
              </Link>
            )}
          </div>
        </DashboardHeader>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {dashboardData?.vendasHoje.total.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.vendasHoje.variacao !== undefined
                ? `${
                    dashboardData.vendasHoje.variacao > 0 ? "+" : ""
                  }${dashboardData.vendasHoje.variacao.toFixed(
                    1
                  )}% em relação a ontem`
                : "Dados não disponíveis"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-secondary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos Vendidos
            </CardTitle>
            <Package className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.produtosVendidos.quantidade}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.produtosVendidos.variacao !== undefined
                ? `${dashboardData.produtosVendidos.variacao > 0 ? "+" : ""}${
                    dashboardData.produtosVendidos.variacao
                  } em relação a ontem`
                : "Dados não disponíveis"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <LineChart className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {dashboardData?.ticketMedio.valor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.ticketMedio.variacao !== undefined
                ? `${
                    dashboardData.ticketMedio.variacao > 0 ? "+" : ""
                  }${dashboardData.ticketMedio.variacao.toFixed(
                    1
                  )}% em relação a ontem`
                : "Dados não disponíveis"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status do Caixa
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                dashboardData?.statusCaixa.status === "open"
                  ? "text-green-500"
                  : "text-destructive"
              }`}
            >
              {dashboardData?.statusCaixa.status === "open"
                ? "Aberto"
                : "Fechado"}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.statusCaixa.status === "closed" &&
              dashboardData?.statusCaixa.ultimoFechamento
                ? `Último fechamento: ${new Date(
                    dashboardData.statusCaixa.ultimoFechamento
                  ).toLocaleString("pt-BR")}`
                : "Caixa aberto"}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-primary/20 shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Visão Geral</CardTitle>
              <CardDescription>Vendas por período</CardDescription>
            </div>
            <PartyPopper className="h-5 w-5 text-primary animate-float" />
          </CardHeader>
          <CardContent className="pl-2">
            <Overview
              data={
                dashboardData?.vendasUltimos7Dias.map((item) => ({
                  name: item.data,
                  total: item.total,
                })) || []
              }
            />
          </CardContent>
        </Card>
        <Card className="col-span-3 border-secondary/20 shadow-sm">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>Últimas 5 vendas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales data={dashboardData?.vendasRecentes || []} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
