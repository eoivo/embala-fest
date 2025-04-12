"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Eye,
  Filter,
  Printer,
  Search,
  Send,
  ShoppingBag,
  X,
  Ban,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  read,
  cancelSale,
  cancelSaleWithManager,
  getStoreSettings,
} from "@/services/service"; // Atualizando o import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ISale {
  _id: string;
  user: {
    name: string;
  };
  consumer?: string; // Agora é apenas o ID do consumer
  createdAt: string;
  total: number;
  paymentMethod: string;
  status: string;
  products: {
    product: {
      name: string;
    };
    quantity: number;
  }[];
}

interface IConsumer {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  totalSales: number;
  lastSale: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

// Componente ManagerAuthModal específico para cancelamento de vendas
function ManagerAuthModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (credentials: {
    email: string;
    password: string;
  }) => Promise<void>;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email e senha são obrigatórios");
      return;
    }

    try {
      await onConfirm({ email, password });
      // Limpa o formulário após sucesso
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Falha na autenticação");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Autenticação de Gerente</DialogTitle>
          <DialogDescription>
            Para cancelar uma venda, é necessária a autenticação de um gerente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm font-medium text-red-500">{error}</div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager-email" className="text-right">
                Email
              </Label>
              <Input
                id="manager-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                autoComplete="email"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager-password" className="text-right">
                Senha
              </Label>
              <Input
                id="manager-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                autoComplete="current-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Verificando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<ISale[]>([]);
  const [consumers, setConsumers] = useState<{ [key: string]: IConsumer }>({});
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [showFullId, setShowFullId] = useState<string | null>(null);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<ISale | null>(
    null
  );
  const [showDialog, setShowDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showManagerAuth, setShowManagerAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    storeName: "EmbalaFest",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    openingHours: "",
    paymentMethods: {
      cash: true,
      credit: true,
      debit: true,
      pix: true,
    },
  });
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar pedidos
        const data = await read("api/sales");
        setPedidos(data);

        // Buscar os detalhes dos consumers
        const consumerIds = data
          .map((sale: ISale) => sale.consumer)
          .filter((consumerId: string | undefined) => consumerId);

        const consumersData: { [key: string]: IConsumer } = {};
        for (const consumerId of consumerIds) {
          if (!consumersData[consumerId]) {
            const consumer = await read(`api/consumers/${consumerId}`);
            consumersData[consumerId] = consumer;
          }
        }

        setConsumers(consumersData);

        // Buscar configurações da loja
        const storeData = await getStoreSettings();
        if (storeData) {
          setStoreSettings(storeData);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    }

    fetchData();
  }, []);

  const pedidosFiltrados = pedidos.filter(
    (pedido) =>
      ((consumers[pedido.consumer || ""]?.name || "Cliente não informado")
        .toLowerCase()
        .includes(busca.toLowerCase()) ||
        pedido._id.toLowerCase().includes(busca.toLowerCase())) &&
      (filtroStatus === "" ||
        filtroStatus === "todos" ||
        pedido.status === filtroStatus)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Concluído
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Função para traduzir os métodos de pagamento
  const traduzirFormaPagamento = (paymentMethod: string): string => {
    switch (paymentMethod.toLowerCase()) {
      case "cash":
        return "Dinheiro";
      case "credit":
        return "Cartão de Crédito";
      case "debit":
        return "Cartão de Débito";
      case "pix":
        return "PIX";
      default:
        return paymentMethod;
    }
  };

  const toggleShowFullId = (id: string) => {
    setShowFullId(showFullId === id ? null : id);
  };

  const handleVisualizarPedido = (pedido: ISale) => {
    setPedidoSelecionado(pedido);
    setShowDialog(true);
  };

  const handleImprimirPedido = (pedido: ISale) => {
    setPedidoSelecionado(pedido);
    setShowPrintDialog(true);

    // Implementar a lógica de impressão na função separada para ser chamada no diálogo
  };

  const imprimirPedido = () => {
    // Criar uma nova janela com a impressão formatada
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow || !pedidoSelecionado) return;

    const clienteNome =
      consumers[pedidoSelecionado.consumer || ""]?.name ||
      "Cliente não informado";
    const dataFormatada = new Date(
      pedidoSelecionado.createdAt
    ).toLocaleDateString();

    const itens = pedidoSelecionado.products
      .map(
        (item, index) =>
          `<tr>
        <td>${index + 1}</td>
        <td>${item.product.name}</td>
        <td>${item.quantity}</td>
      </tr>`
      )
      .join("");

    const conteudo = `
      <html>
        <head>
          <title>Recibo de Pedido #${pedidoSelecionado._id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; text-align: center; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; text-align: right; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
            .store-info { font-size: 12px; text-align: center; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${storeSettings.storeName || "EMBALAFEST"}</h1>
            <div class="store-info">
              ${storeSettings.cnpj ? `<p>CNPJ: ${storeSettings.cnpj}</p>` : ""}
              ${storeSettings.address ? `<p>${storeSettings.address}</p>` : ""}
              ${
                storeSettings.phone
                  ? `<p>Telefone: ${storeSettings.phone}</p>`
                  : ""
              }
              ${
                storeSettings.email
                  ? `<p>Email: ${storeSettings.email}</p>`
                  : ""
              }
              ${
                storeSettings.openingHours
                  ? `<p>Horário: ${storeSettings.openingHours}</p>`
                  : ""
              }
            </div>
          </div>
          <h2 style="text-align: center;">RECIBO DE PEDIDO</h2>
          <div class="info">
            <p><strong>Pedido:</strong> ${pedidoSelecionado._id}</p>
            <p><strong>Cliente:</strong> ${clienteNome}</p>
            <p><strong>Data:</strong> ${dataFormatada}</p>
            <p><strong>Forma de Pagamento:</strong> ${traduzirFormaPagamento(
              pedidoSelecionado.paymentMethod
            )}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Produto</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              ${itens}
            </tbody>
          </table>
          <div class="total">
            <p>Total: R$ ${pedidoSelecionado.total.toFixed(2)}</p>
          </div>
          <div class="footer">
            <p>${
              storeSettings.storeName || "EMBALAFEST"
            } - Obrigado pela preferência!</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(conteudo);
    printWindow.document.close();

    // Aguardar o carregamento do conteúdo e imprimir
    printWindow.onload = function () {
      printWindow.print();
      // Fecha a janela após a impressão (opcional)
      // printWindow.close();
    };

    setShowPrintDialog(false);
  };

  const handleEnviarWhatsapp = (pedido: ISale) => {
    setPedidoSelecionado(pedido);

    // Se tiver telefone do consumidor, preencher
    if (
      pedido.consumer &&
      consumers[pedido.consumer] &&
      consumers[pedido.consumer].phone
    ) {
      setWhatsappNumber(consumers[pedido.consumer].phone);
    } else {
      setWhatsappNumber("");
    }

    setShowWhatsappDialog(true);
  };

  const enviarWhatsapp = () => {
    if (!pedidoSelecionado) return;

    // Validar número de telefone
    const numero = whatsappNumber.replace(/\D/g, "");
    if (numero.length < 10) {
      toast({
        title: "Número inválido",
        description: "Por favor, insira um número de telefone válido",
        variant: "destructive",
      });
      return;
    }

    const clienteNome =
      consumers[pedidoSelecionado.consumer || ""]?.name ||
      "Cliente não informado";
    const dataFormatada = new Date(
      pedidoSelecionado.createdAt
    ).toLocaleDateString();

    // Criar mensagem para WhatsApp com informações da loja
    let mensagem = `*${storeSettings.storeName || "EMBALAFEST"}*\n`;

    // Adicionar informações da loja
    if (storeSettings.cnpj) mensagem += `CNPJ: ${storeSettings.cnpj}\n`;
    if (storeSettings.address) mensagem += `${storeSettings.address}\n`;
    if (storeSettings.phone) mensagem += `Telefone: ${storeSettings.phone}\n`;
    if (storeSettings.email) mensagem += `Email: ${storeSettings.email}\n`;
    if (storeSettings.openingHours)
      mensagem += `Horário: ${storeSettings.openingHours}\n`;

    mensagem += `\n*RECIBO DE PEDIDO*\n\n`;
    mensagem += `*Pedido:* ${pedidoSelecionado._id}\n`;
    mensagem += `*Cliente:* ${clienteNome}\n`;
    mensagem += `*Data:* ${dataFormatada}\n`;
    mensagem += `*Forma de Pagamento:* ${traduzirFormaPagamento(
      pedidoSelecionado.paymentMethod
    )}\n\n`;
    mensagem += `*Itens do Pedido:*\n`;

    pedidoSelecionado.products.forEach((item, index) => {
      mensagem += `${index + 1}. ${item.product.name} - Qtd: ${
        item.quantity
      }\n`;
    });

    mensagem += `\n*Total: R$ ${pedidoSelecionado.total.toFixed(2)}*\n\n`;
    mensagem += `${
      storeSettings.storeName || "EMBALAFEST"
    } - Obrigado pela preferência!`;

    // Codificar a mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);

    // Abrir WhatsApp Web com a mensagem
    window.open(`https://wa.me/${numero}?text=${mensagemCodificada}`, "_blank");

    setShowWhatsappDialog(false);

    toast({
      title: "WhatsApp aberto",
      description: "O WhatsApp foi aberto com a mensagem do pedido",
    });
  };

  // Funções para o cancelamento de pedidos
  const handleCancelarPedido = (pedido: ISale) => {
    setPedidoSelecionado(pedido);
    setShowCancelDialog(true);
  };

  // Função para confirmar o cancelamento e mostrar a autenticação de gerente
  const confirmarCancelamento = () => {
    setShowCancelDialog(false);
    setShowManagerAuth(true);
  };

  // Função para executar o cancelamento com autenticação de gerente
  const cancelarComAutenticacaoGerente = async (credentials: {
    email: string;
    password: string;
  }) => {
    if (!pedidoSelecionado) return;

    try {
      setIsLoading(true);
      await cancelSaleWithManager(pedidoSelecionado._id, credentials);

      // Atualizar a lista de pedidos após o cancelamento
      const data = await read("api/sales");
      setPedidos(data);

      setShowManagerAuth(false);

      toast({
        title: "Pedido cancelado",
        description:
          "O pedido foi cancelado com sucesso e o estoque foi restaurado.",
        variant: "default",
      });
    } catch (error: any) {
      // Propagar o erro para ser tratado no componente ManagerAuthModal
      throw new Error(error.message || "Não foi possível cancelar o pedido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Pedidos"
        description="Gerencie os pedidos da loja"
      >
        <Link href="/dashboard/caixa/venda">
          <Button>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </Link>
      </DashboardHeader>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar pedidos por cliente ou número..."
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-6"
                  >
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                pedidosFiltrados.map((pedido) => (
                  <TableRow
                    key={pedido._id}
                    className={
                      pedido.status === "cancelled"
                        ? "bg-muted/50 text-muted-foreground"
                        : ""
                    }
                  >
                    <TableCell>
                      <div className="font-medium flex items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-1"
                                onClick={() => toggleShowFullId(pedido._id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mostrar ID completo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {showFullId === pedido._id
                          ? pedido._id
                          : `${pedido._id.substring(0, 6)}...`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {consumers[pedido.consumer || ""]?.name ||
                        "Cliente não informado"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                        {new Date(pedido.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{pedido.products.length}</TableCell>
                    <TableCell className="text-right">
                      R$ {pedido.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {traduzirFormaPagamento(pedido.paymentMethod)}
                    </TableCell>
                    <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleVisualizarPedido(pedido)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Visualizar venda</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleImprimirPedido(pedido)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Imprimir recibo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEnviarWhatsapp(pedido)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Enviar por WhatsApp</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {pedido.status !== "cancelled" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCancelarPedido(pedido)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cancelar venda</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal de Visualização do Pedido */}
      {pedidoSelecionado && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido</DialogTitle>
              <DialogDescription>
                Pedido #{pedidoSelecionado._id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Cliente</h4>
                <p className="text-sm">
                  {consumers[pedidoSelecionado.consumer || ""]?.name ||
                    "Cliente não informado"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Data</h4>
                <p className="text-sm">
                  {new Date(pedidoSelecionado.createdAt).toLocaleDateString()}{" "}
                  às{" "}
                  {new Date(pedidoSelecionado.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Itens</h4>
                <ul className="text-sm space-y-1 mt-1">
                  {pedidoSelecionado.products.map((product, index) => (
                    <li key={index}>
                      {product.product.name} - Quantidade: {product.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium">Pagamento</h4>
                <p className="text-sm">
                  {traduzirFormaPagamento(pedidoSelecionado.paymentMethod)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Status</h4>
                <div className="mt-1">
                  {getStatusBadge(pedidoSelecionado.status)}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium">Total</h4>
                <p className="text-lg font-bold">
                  R$ {pedidoSelecionado.total.toFixed(2)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Fechar
              </Button>
              <Button
                onClick={() => {
                  setShowDialog(false);
                  handleImprimirPedido(pedidoSelecionado);
                }}
              >
                Imprimir Recibo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Impressão */}
      {pedidoSelecionado && (
        <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Imprimir Pedido</DialogTitle>
              <DialogDescription>
                Deseja imprimir o recibo deste pedido?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPrintDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={imprimirPedido}>Imprimir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Envio WhatsApp */}
      {pedidoSelecionado && (
        <Dialog open={showWhatsappDialog} onOpenChange={setShowWhatsappDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar por WhatsApp</DialogTitle>
              <DialogDescription>
                Informe o número de telefone para enviar o recibo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Número do WhatsApp</Label>
                <Input
                  id="telefone"
                  placeholder="Ex: 11912345678"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Digite o número com DDD, sem espaços ou caracteres especiais
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowWhatsappDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={enviarWhatsapp}>Enviar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Cancelamento */}
      {pedidoSelecionado && (
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancelar Pedido</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar este pedido? Esta ação
                restaurará o estoque dos produtos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="border rounded-md p-3 bg-red-50">
                <p className="text-sm text-red-800">
                  Atenção: Esta ação não pode ser desfeita. O status do pedido
                  será alterado para "Cancelado" e o estoque será restaurado.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Informações do Pedido</h4>
                <p className="text-sm">
                  ID: {pedidoSelecionado._id}
                  <br />
                  Cliente:{" "}
                  {consumers[pedidoSelecionado.consumer || ""]?.name ||
                    "Cliente não informado"}
                  <br />
                  Total: R$ {pedidoSelecionado.total.toFixed(2)}
                </p>
              </div>
              <div className="border rounded-md p-3 bg-blue-50">
                <p className="text-sm text-blue-800">
                  Será necessária a autenticação de um gerente para cancelar
                  este pedido.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
              >
                Voltar
              </Button>
              <Button variant="destructive" onClick={confirmarCancelamento}>
                Prosseguir com Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Autenticação de Gerente */}
      {showManagerAuth && (
        <ManagerAuthModal
          isOpen={showManagerAuth}
          onClose={() => setShowManagerAuth(false)}
          onConfirm={cancelarComAutenticacaoGerente}
          loading={isLoading}
        />
      )}
    </DashboardShell>
  );
}
