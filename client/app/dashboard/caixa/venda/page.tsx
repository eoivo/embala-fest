"use client";

import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Minus, Plus, Printer, Send, Trash, X } from "lucide-react";
import Link from "next/link";
import { saleService, Product, SaleItem, PaymentMethods } from "./saleService";

interface ItemVenda {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  total: number;
}

export default function VendaPage() {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<
    "cash" | "credit" | "debit" | "pix"
  >("cash");
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metodosDisponiveis, setMetodosDisponiveis] = useState<PaymentMethods>({
    cash: true,
    credit: true,
    debit: true,
    pix: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [produtosData, clientesData, paymentMethodsData] =
          await Promise.all([
            saleService.getProducts(),
            saleService.getConsumers(),
            saleService.getAvailablePaymentMethods(),
          ]);
        setProdutos(produtosData);
        setClientes(clientesData);
        setMetodosDisponiveis(paymentMethodsData);

        // Se o método atualmente selecionado não estiver disponível,
        // selecione o primeiro método disponível
        if (!paymentMethodsData[formaPagamento]) {
          const availableMethods = Object.entries(paymentMethodsData)
            .filter(([_, available]) => available)
            .map(([method]) => method);

          if (availableMethods.length > 0) {
            setFormaPagamento(
              availableMethods[0] as "cash" | "credit" | "debit" | "pix"
            );
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    fetchData();
  }, []);

  const adicionarItem = () => {
    if (!produtoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive",
      });
      return;
    }

    const produto = produtos.find((p) => p._id === produtoSelecionado);
    if (!produto) return;

    if (quantidade <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (quantidade > produto.stock) {
      toast({
        title: "Erro",
        description: "Quantidade indisponível em estoque",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o produto já está na lista
    const itemExistente = itensVenda.find((item) => item.id === produto._id);

    if (itemExistente) {
      // Atualizar quantidade do item existente
      setItensVenda(
        itensVenda.map((item) =>
          item.id === produto._id
            ? {
                ...item,
                quantidade: item.quantidade + quantidade,
                total: (item.quantidade + quantidade) * item.preco,
              }
            : item
        )
      );
    } else {
      // Adicionar novo item
      setItensVenda([
        ...itensVenda,
        {
          id: produto._id,
          nome: produto.name,
          preco: produto.price,
          quantidade: quantidade,
          total: produto.price * quantidade,
        },
      ]);
    }

    // Resetar seleção
    setProdutoSelecionado("");
    setQuantidade(1);

    toast({
      title: "Produto adicionado",
      description: `${quantidade}x ${produto.name}`,
    });
  };

  const removerItem = (id: string) => {
    setItensVenda(itensVenda.filter((item) => item.id !== id));
  };

  const alterarQuantidade = (id: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) return;

    const produto = produtos.find((p) => p._id === id);
    if (produto && novaQuantidade > produto.stock) {
      toast({
        title: "Erro",
        description: "Quantidade indisponível em estoque",
        variant: "destructive",
      });
      return;
    }

    setItensVenda(
      itensVenda.map((item) =>
        item.id === id
          ? {
              ...item,
              quantidade: novaQuantidade,
              total: novaQuantidade * item.preco,
            }
          : item
      )
    );
  };

  const calcularTotal = () => {
    const subtotal = itensVenda.reduce((acc, item) => acc + item.total, 0);
    return subtotal - desconto;
  };

  const finalizarVenda = async () => {
    if (itensVenda.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto à venda",
        variant: "destructive",
      });
      return;
    }

    if (!formaPagamento) {
      toast({
        title: "Erro",
        description: "Selecione uma forma de pagamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const saleItems: SaleItem[] = itensVenda.map((item) => ({
        product: item.id,
        quantity: item.quantidade,
        price: item.preco,
      }));

      const sale: any = {
        products: saleItems,
        total: calcularTotal(),
        paymentMethod: formaPagamento,
      };

      if (clienteSelecionado) {
        sale.consumer = clienteSelecionado;
      }

      await saleService.createSale(sale);

      toast({
        title: "Venda finalizada com sucesso!",
        description: `Total: R$ ${calcularTotal().toFixed(2)}`,
      });

      // Resetar formulário
      setItensVenda([]);
      setFormaPagamento("cash");
      setClienteSelecionado("");
      setDesconto(0);
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Registrar Venda"
        description="Adicione produtos e finalize a venda"
      >
        <div className="flex space-x-2">
          <Link href="/dashboard/caixa">
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
        </div>
      </DashboardHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>Adicione produtos à venda atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="produto">Produto</Label>
                  <div className="flex gap-2">
                    <Select
                      value={produtoSelecionado}
                      onValueChange={setProdutoSelecionado}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto._id} value={produto._id}>
                            {produto.name} - R$ {produto.price.toFixed(2)}{" "}
                            (Estoque: {produto.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {produtoSelecionado && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setProdutoSelecionado("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="w-full md:w-32">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={quantidade}
                      onChange={(e) =>
                        setQuantidade(Number.parseInt(e.target.value) || 1)
                      }
                      className="mx-2 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantidade(quantidade + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="w-full md:w-auto self-end">
                  <Button onClick={adicionarItem}>Adicionar</Button>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">
                        Preço Unitário
                      </TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensVenda.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-6"
                        >
                          Nenhum produto adicionado
                        </TableCell>
                      </TableRow>
                    ) : (
                      itensVenda.map((item) => {
                        const produto = produtos.find((p) => p._id === item.id);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.nome}</div>
                                {produto && (
                                  <div className="text-sm text-muted-foreground">
                                    Estoque disponível: {produto.stock}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {item.preco.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    alterarQuantidade(
                                      item.id,
                                      item.quantidade - 1
                                    )
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">
                                  {item.quantidade}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    alterarQuantidade(
                                      item.id,
                                      item.quantidade + 1
                                    )
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {item.total.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removerItem(item.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Venda</CardTitle>
              <CardDescription>Detalhes e finalização da venda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente (opcional)</Label>
                <div className="flex gap-2">
                  <Select
                    value={clienteSelecionado}
                    onValueChange={setClienteSelecionado}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente._id} value={cliente._id}>
                          {cliente.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clienteSelecionado && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setClienteSelecionado("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                <Select
                  value={formaPagamento}
                  onValueChange={(value: "cash" | "credit" | "debit" | "pix") =>
                    setFormaPagamento(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodosDisponiveis.cash && (
                      <SelectItem value="cash">Dinheiro</SelectItem>
                    )}
                    {metodosDisponiveis.credit && (
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                    )}
                    {metodosDisponiveis.debit && (
                      <SelectItem value="debit">Cartão de Débito</SelectItem>
                    )}
                    {metodosDisponiveis.pix && (
                      <SelectItem value="pix">PIX</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desconto">Desconto (R$)</Label>
                <Input
                  id="desconto"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={desconto}
                  onChange={(e) =>
                    setDesconto(Number.parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between py-1">
                  <span>Subtotal:</span>
                  <span>
                    R${" "}
                    {itensVenda
                      .reduce((acc, item) => acc + item.total, 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Desconto:</span>
                  <span>R$ {desconto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold">
                  <span>Total:</span>
                  <span>R$ {calcularTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={finalizarVenda}
                disabled={loading || itensVenda.length === 0}
              >
                {loading ? "Processando..." : "Finalizar Venda"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
