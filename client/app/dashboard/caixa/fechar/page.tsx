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
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { registerService } from "@/app/dashboard/caixa/registerService";
import { ManagerAuthModal } from "@/app/dashboard/caixa/ManagerAuthModal";

// Definindo interfaces para fortes tipagens
interface Sale {
  total: number;
  paymentMethod: "cash" | "credit" | "debit" | "pix";
}

interface Register {
  _id: string;
  status: string;
  initialBalance: number;
  finalBalance?: number;
  sales: Sale[];
  createdAt: string;
  closedAt?: string;
  user?: {
    name: string;
  };
}

export default function FecharCaixaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [cash, setCash] = useState("0.00");
  const [credit, setCredit] = useState("0.00");
  const [debit, setDebit] = useState("0.00");
  const [pix, setPix] = useState("0.00");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentRegister, setCurrentRegister] = useState<Register | null>(null);
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [totalVendas, setTotalVendas] = useState(0);
  // Adicionando prefixo _ para indicar que variáveis não usadas são intencionais
  const [_totalCancelamentos, _setTotalCancelamentos] = useState(0);
  const [qtdeVendas, setQtdeVendas] = useState(0);
  const [horaAbertura, setHoraAbertura] = useState("");

  useEffect(() => {
    const fetchCurrentRegister = async () => {
      try {
        setInitialLoading(true);
        const register = await registerService.getCurrentRegister();

        if (!register || register.status === "closed") {
          toast({
            title: "Atenção",
            description: "Não há caixa aberto para fechamento.",
            variant: "destructive",
          });
          router.push("/dashboard");
          return;
        }

        setCurrentRegister(register);
        setSaldoInicial(register.initialBalance);

        let total = 0;
        let count = 0;

        if (register.sales && register.sales.length > 0) {
          register.sales.forEach((sale: Sale) => {
            total += sale.total;
            count++;
          });
        }

        setTotalVendas(total);
        setQtdeVendas(count);

        const openDate = new Date(register.createdAt);
        setHoraAbertura(openDate.toLocaleTimeString("pt-BR"));

        let cashTotal = 0;
        let creditTotal = 0;
        let debitTotal = 0;
        let pixTotal = 0;

        if (register.sales && register.sales.length > 0) {
          register.sales.forEach((sale: Sale) => {
            if (sale.paymentMethod === "cash") cashTotal += sale.total;
            else if (sale.paymentMethod === "credit") creditTotal += sale.total;
            else if (sale.paymentMethod === "debit") debitTotal += sale.total;
            else if (sale.paymentMethod === "pix") pixTotal += sale.total;
          });
        }

        setCash(cashTotal.toFixed(2));
        setCredit(creditTotal.toFixed(2));
        setDebit(debitTotal.toFixed(2));
        setPix(pixTotal.toFixed(2));
      } catch (error: unknown) {
        // Tratamento de erro tipado
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao buscar informações do caixa.";

        toast({
          title: "Erro ao carregar dados",
          description: errorMessage,
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCurrentRegister();
  }, [router, toast]);

  const totalCalculado =
    Number.parseFloat(cash || "0") +
    Number.parseFloat(credit || "0") +
    Number.parseFloat(debit || "0") +
    Number.parseFloat(pix || "0");

  const calcularDiferenca = () => {
    return totalCalculado - totalVendas;
  };

  const iniciarFecharCaixa = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAuthModal(true);
  };

  const autenticarGerenteEFecharCaixa = async (credentials: {
    email: string;
    password: string;
  }) => {
    setLoading(true);

    try {
      const paymentMethods = {
        cash: Number.parseFloat(cash || "0"),
        credit: Number.parseFloat(credit || "0"),
        debit: Number.parseFloat(debit || "0"),
        pix: Number.parseFloat(pix || "0"),
      };

      await registerService.closeRegister(
        totalCalculado,
        paymentMethods,
        credentials
      );

      toast({
        title: "Caixa fechado com sucesso!",
        description: `Total de vendas: R$ ${totalVendas.toFixed(2)}`,
      });

      setShowAuthModal(false);
      router.push("/dashboard");
    } catch (error: unknown) {
      // Tratando o erro em vez de apenas relançá-lo
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao fechar o caixa.";

      toast({
        title: "Erro ao fechar caixa",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Fechar Caixa"
          description="Carregando informações..."
        >
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </DashboardHeader>
        <div className="flex justify-center items-center h-64">
          <p>Carregando dados do caixa...</p>
        </div>
      </DashboardShell>
    );
  }

  if (!currentRegister) return null;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Fechar Caixa"
        description="Finalize as operações do caixa para o dia de hoje"
      >
        <div className="flex space-x-2">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Dia</CardTitle>
            <CardDescription>
              Informações sobre as operações do dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Data</TableCell>
                  <TableCell>
                    {new Date().toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Horário de Abertura
                  </TableCell>
                  <TableCell>{horaAbertura}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Horário de Fechamento
                  </TableCell>
                  <TableCell>
                    {new Date().toLocaleTimeString("pt-BR")}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Operador</TableCell>
                  <TableCell>
                    {currentRegister.user
                      ? currentRegister.user.name
                      : "Operador de Caixa"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Saldo Inicial</TableCell>
                  <TableCell>R$ {saldoInicial.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total de Vendas</TableCell>
                  <TableCell>R$ {totalVendas.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Cancelamentos</TableCell>
                  <TableCell>R$ {_totalCancelamentos.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Quantidade de Vendas
                  </TableCell>
                  <TableCell>{qtdeVendas}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <form onSubmit={iniciarFecharCaixa}>
            <CardHeader>
              <CardTitle>Conferência de Valores</CardTitle>
              <CardDescription>
                Informe os valores por forma de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cash">Dinheiro (R$)</Label>
                  <Input
                    id="cash"
                    type="number"
                    step="0.01"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit">Cartão de Crédito (R$)</Label>
                  <Input
                    id="credit"
                    type="number"
                    step="0.01"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="debit">Cartão de Débito (R$)</Label>
                  <Input
                    id="debit"
                    type="number"
                    step="0.01"
                    value={debit}
                    onChange={(e) => setDebit(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pix">PIX (R$)</Label>
                  <Input
                    id="pix"
                    type="number"
                    step="0.01"
                    value={pix}
                    onChange={(e) => setPix(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between py-1">
                  <span>Total Informado:</span>
                  <span>R$ {totalCalculado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Total do Sistema:</span>
                  <span>R$ {totalVendas.toFixed(2)}</span>
                </div>
                <div
                  className={`flex justify-between py-1 font-bold ${
                    calcularDiferenca() !== 0
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  <span>Diferença:</span>
                  <span>R$ {calcularDiferenca().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processando..." : "Fechar Caixa"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <ManagerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onConfirm={autenticarGerenteEFecharCaixa}
        loading={loading}
      />
    </DashboardShell>
  );
}
