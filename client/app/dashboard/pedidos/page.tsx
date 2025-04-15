"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
  ArrowUpDown,
  MessageSquare,
  XCircle,
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
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
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
        setIsLoading(true);
        // Buscar pedidos
        const data = await read("sales");
        setPedidos(data || []);

        // Buscar consumidores
        const consumersData: { [key: string]: IConsumer } = {};
        for (const pedido of data) {
          if (pedido.consumer && !consumersData[pedido.consumer]) {
            try {
              const consumerData = await read(`consumers/${pedido.consumer}`);
              consumersData[pedido.consumer] = consumerData;
            } catch (error) {
              console.error(
                `Erro ao buscar consumidor ${pedido.consumer}:`,
                error
              );
              // Se não conseguir buscar o consumidor, cria um objeto vazio
              consumersData[pedido.consumer] = {
                _id: pedido.consumer,
                name: "Cliente não encontrado",
                phone: "",
                email: "",
                address: {
                  street: "",
                  number: "",
                  neighborhood: "",
                  city: "",
                  state: "",
                  zipCode: "",
                },
                totalSales: 0,
                lastSale: "",
                status: true,
                createdAt: "",
                updatedAt: "",
              };
            }
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
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Função para ordenar pedidos
  const sortPedidos = (pedidos: ISale[]) => {
    return [...pedidos].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "createdAt") {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "total") {
        comparison = a.total - b.total;
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      } else if (sortBy === "client") {
        const clienteA =
          consumers[a.consumer || ""]?.name || "Cliente não informado";
        const clienteB =
          consumers[b.consumer || ""]?.name || "Cliente não informado";
        comparison = clienteA.localeCompare(clienteB);
      } else if (sortBy === "items") {
        comparison = a.products.length - b.products.length;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const pedidosFiltrados = sortPedidos(
    pedidos.filter(
      (pedido) =>
        ((consumers[pedido.consumer || ""]?.name || "Cliente não informado")
          .toLowerCase()
          .includes(busca.toLowerCase()) ||
          pedido._id.toLowerCase().includes(busca.toLowerCase())) &&
        (filtroStatus === "" ||
          filtroStatus === "todos" ||
          pedido.status === filtroStatus)
    )
  );

  // Função para alternar a direção da ordenação
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

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
    if (!pedidoSelecionado) return;
    setIsLoading(true);

    cancelSale(pedidoSelecionado._id)
      .then(() => {
        toast({
          title: "Pedido cancelado",
          description: "O pedido foi cancelado com sucesso.",
        });
        // Atualizar a lista de pedidos
        read("sales")
          .then((data) => {
            setPedidos(data || []);
          })
          .catch((error) => {
            console.error("Erro ao atualizar pedidos:", error);
          });
      })
      .catch((error) => {
        toast({
          title: "Erro ao cancelar pedido",
          description:
            error.message || "Ocorreu um erro ao tentar cancelar o pedido.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
        setShowCancelDialog(false);
        setPedidoSelecionado(null);
      });
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
            <span className="hidden sm:inline">Novo Pedido</span>
            <span className="sm:hidden">Novo</span>
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

      {!isLoading && pedidosFiltrados.length > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          Exibindo {pedidosFiltrados.length}{" "}
          {pedidosFiltrados.length === 1 ? "pedido" : "pedidos"}
          {busca && ` para "${busca}"`}
          {filtroStatus !== "todos" && ` com status "${filtroStatus}"`}
        </div>
      )}

      {/* Opções de ordenação para mobile */}
      <div className="md:hidden mb-4">
        <Select
          value={`${sortBy}-${sortDirection}`}
          onValueChange={(value) => {
            const [field, direction] = value.split("-");
            setSortBy(field);
            setSortDirection(direction as "asc" | "desc");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Data (Mais recente)</SelectItem>
            <SelectItem value="createdAt-asc">Data (Mais antiga)</SelectItem>
            <SelectItem value="total-desc">Valor (Maior)</SelectItem>
            <SelectItem value="total-asc">Valor (Menor)</SelectItem>
            <SelectItem value="client-asc">Cliente (A-Z)</SelectItem>
            <SelectItem value="client-desc">Cliente (Z-A)</SelectItem>
            <SelectItem value="items-desc">Mais itens</SelectItem>
            <SelectItem value="items-asc">Menos itens</SelectItem>
            <SelectItem value="status-asc">Status (A-Z)</SelectItem>
            <SelectItem value="status-desc">Status (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Versão para desktop - visível apenas em telas md e maiores */}
      <div className="hidden md:block">
        <Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("client")}
                    >
                      Cliente
                      {sortBy === "client" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("createdAt")}
                    >
                      Data
                      {sortBy === "createdAt" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("items")}
                    >
                      Itens
                      {sortBy === "items" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div
                      className="flex items-center justify-end cursor-pointer"
                      onClick={() => toggleSort("total")}
                    >
                      Valor
                      {sortBy === "total" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("status")}
                    >
                      Status
                      {sortBy === "status" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
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
                                  <MessageSquare className="h-4 w-4" />
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
                                  >
                                    <XCircle className="h-4 w-4" />
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
      </div>

      {/* Versão para dispositivos móveis (cards) - visível apenas em telas menores que md */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">Carregando pedidos...</p>
            </CardContent>
          </Card>
        ) : pedidosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </CardContent>
          </Card>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <Card
              key={pedido._id}
              className={
                pedido.status === "cancelled"
                  ? "bg-muted/50 text-muted-foreground overflow-hidden"
                  : "overflow-hidden"
              }
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center">
                      ID:{" "}
                      {showFullId === pedido._id
                        ? pedido._id
                        : `${pedido._id.substring(0, 6)}...`}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-1 ml-1"
                        onClick={() => toggleShowFullId(pedido._id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      {consumers[pedido.consumer || ""]?.name ||
                        "Cliente não informado"}
                    </div>
                  </div>
                  <div>{getStatusBadge(pedido.status)}</div>
                </div>
              </CardHeader>
              <CardContent className="pb-3 pt-2">
                <div className="grid grid-cols-1 gap-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(pedido.createdAt).toLocaleDateString()}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 mt-1">
                    <div>
                      <p className="text-muted-foreground">Itens</p>
                      <p className="font-medium">{pedido.products.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor total</p>
                      <p className="font-medium">
                        R$ {pedido.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pagamento</p>
                    <p className="font-medium">
                      {traduzirFormaPagamento(pedido.paymentMethod)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-0 pb-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => handleVisualizarPedido(pedido)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => handleImprimirPedido(pedido)}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => handleEnviarWhatsapp(pedido)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
                {pedido.status !== "cancelled" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleCancelarPedido(pedido)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>

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
          onConfirm={confirmarCancelamento}
          loading={isLoading}
        />
      )}
    </DashboardShell>
  );
}
