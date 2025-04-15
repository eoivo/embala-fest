"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { registerService } from "@/app/dashboard/caixa/registerService";

export default function AbrirCaixaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saldoInicial, setSaldoInicial] = useState("");
  const [loading, setLoading] = useState(false);
  const [operador, setOperador] = useState("Operador de Caixa");
  const [hasOpenRegister, setHasOpenRegister] = useState(false);

  // Verificar se já existe um caixa aberto ao carregar a página
  useEffect(() => {
    const checkCurrentRegister = async () => {
      try {
        setLoading(true);

        // Em vez de verificar o caixa diretamente (que causaria 404),
        // vamos verificar o dashboard que retorna status: "open" ou "closed"
        const dashboard = await registerService.getDashboard();

        // Se o dashboard indica que tem caixa aberto
        if (
          dashboard &&
          dashboard.status === "open" &&
          dashboard.currentRegister
        ) {
          setHasOpenRegister(true);
          toast({
            title: "Atenção",
            description: "Já existe um caixa aberto. Redirecionando...",
            variant: "destructive",
          });
          router.push("/dashboard/caixa/venda");
        }
      } catch (error) {
        // Erro ao verificar dashboard
        console.error("Erro ao verificar status do caixa:", error);
      } finally {
        setLoading(false);
      }
    };

    checkCurrentRegister();
  }, [router, toast]);

  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Converte o saldo para número
      const initialBalance = parseFloat(saldoInicial);

      if (isNaN(initialBalance)) {
        throw new Error("Valor inválido para saldo inicial");
      }

      // Chamar o endpoint para abrir o caixa
      const response = await registerService.openRegister(initialBalance);

      toast({
        title: "Caixa aberto com sucesso!",
        description: `Saldo inicial: R$ ${saldoInicial}`,
      });

      // Redirecionar para página de vendas
      router.push("/dashboard/caixa/venda");
    } catch (error: any) {
      toast({
        title: "Erro ao abrir caixa",
        description:
          error.message || "Ocorreu um erro ao tentar abrir o caixa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Se já tem caixa aberto, não renderiza o conteúdo
  if (hasOpenRegister) return null;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Abrir Caixa"
        description="Inicie as operações do caixa para o dia de hoje"
      >
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </DashboardHeader>
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Abertura de Caixa</CardTitle>
            <CardDescription>
              Preencha as informações para abrir o caixa
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAbrirCaixa}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data e Hora</Label>
                <Input
                  id="data"
                  value={new Date().toLocaleString("pt-BR")}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operador">Operador</Label>
                <Input id="operador" value={operador} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saldoInicial">Saldo Inicial (R$)</Label>
                <Input
                  id="saldoInicial"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Abrindo caixa..." : "Abrir Caixa"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
}
