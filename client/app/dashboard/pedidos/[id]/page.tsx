"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Printer,
  Send,
  User,
} from "lucide-react";
import Link from "next/link";

export default function DetalhePedidoPage({
  params,
}: {
  params: { id: string };
}) {
  const pedido = {
    id: params.id,
    cliente: "João da Silva",
    email: "joao.silva@exemplo.com",
    telefone: "(11) 98765-4321",
    endereco: "Rua das Flores, 123 - São Paulo, SP",
    data: "19/03/2025",
    hora: "10:15",
    status: "concluido",
    formaPagamento: "Cartão de Crédito",
    valorTotal: 250.0,
    desconto: 0,
    itens: [
      {
        id: 1,
        nome: "Embalagem para Bolo G",
        quantidade: 2,
        preco: 4.5,
        total: 9.0,
      },
      {
        id: 2,
        nome: "Balões Coloridos (pct 50un)",
        quantidade: 1,
        preco: 15.0,
        total: 15.0,
      },
      {
        id: 3,
        nome: "Pratinhos Descartáveis (pct 10un)",
        quantidade: 3,
        preco: 8.0,
        total: 24.0,
      },
      {
        id: 4,
        nome: "Velas de Aniversário",
        quantidade: 2,
        preco: 5.0,
        total: 10.0,
      },
      {
        id: 5,
        nome: "Copos Descartáveis (pct 50un)",
        quantidade: 2,
        preco: 12.0,
        total: 24.0,
      },
    ],
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluido":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Concluído
          </Badge>
        );
      case "pendente":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pendente
          </Badge>
        );
      case "cancelado":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelado
          </Badge>
        );
      case "em_andamento":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Em andamento
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Pedido ${pedido.id}`}
        description="Detalhes do pedido"
      >
        <div className="flex space-x-2">
          <Link href="/dashboard/pedidos">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline">
            <Send className="mr-2 h-4 w-4" />
            Enviar
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Itens do Pedido</CardTitle>
              <CardDescription>Produtos incluídos neste pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedido.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.nome}</TableCell>
                      <TableCell className="text-right">
                        R$ {item.preco.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantidade}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {item.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex flex-col items-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {pedido.valorTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Desconto:</span>
                  <span>R$ {pedido.desconto.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>
                    R$ {(pedido.valorTotal - pedido.desconto).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Status</div>
                <div>{getStatusBadge(pedido.status)}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Data e Hora</div>
                <div className="flex items-center text-sm">
                  <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                  {pedido.data}
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                  {pedido.hora}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Forma de Pagamento</div>
                <div className="text-sm">{pedido.formaPagamento}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <User className="h-10 w-10 rounded-full bg-muted p-2 mr-4" />
                <div>
                  <div className="font-medium">{pedido.cliente}</div>
                  <div className="text-sm text-muted-foreground">
                    {pedido.email}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Telefone</div>
                <div className="text-sm">{pedido.telefone}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Endereço</div>
                <div className="text-sm">{pedido.endereco}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
