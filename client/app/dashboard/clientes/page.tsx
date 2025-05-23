"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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
  Edit,
  Eye,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { read, update, remove } from "@/services/service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Address {
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Consumer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  totalSales: number;
  lastSale?: string;
  status: boolean;
}

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  status: z.boolean(),
  address: z.object({
    street: z.string().min(2, "Rua é obrigatória"),
    number: z.string().min(1, "Número é obrigatório"),
    neighborhood: z.string().optional(),
    city: z.string().min(2, "Cidade é obrigatória"),
    state: z.string().min(2, "Estado é obrigatório"),
    zipCode: z.string().min(5, "CEP é obrigatório"),
  }),
});

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Consumer[]>([]);
  const [busca, setBusca] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Consumer | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      status: false,
      address: {
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
    },
  });

  useEffect(() => {
    const checkAdminPermission = async () => {
      try {
        setLoading(true);
        const user = await read("users/me");

        if (user.role !== "admin" && user.role !== "manager") {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(true);
        const data = await read("consumers", {});
        setClientes(data);
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminPermission();
  }, []);

  useEffect(() => {
    if (selectedClient && editModalOpen) {
      form.reset({
        name: selectedClient.name,
        email: selectedClient.email,
        phone: selectedClient.phone,
        status: selectedClient.status,
        address: {
          street: selectedClient.address.street,
          number: selectedClient.address.number,
          neighborhood: selectedClient.address.neighborhood || "",
          city: selectedClient.address.city,
          state: selectedClient.address.state,
          zipCode: selectedClient.address.zipCode,
        },
      });
    }
  }, [selectedClient, editModalOpen, form]);

  const sortClients = (clients: Consumer[]) => {
    return [...clients].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "email") {
        comparison = a.email.localeCompare(b.email);
      } else if (sortBy === "totalSales") {
        comparison = a.totalSales - b.totalSales;
      } else if (sortBy === "lastSale") {
        if (!a.lastSale && !b.lastSale) comparison = 0;
        else if (!a.lastSale) comparison = -1;
        else if (!b.lastSale) comparison = 1;
        else
          comparison =
            new Date(a.lastSale).getTime() - new Date(b.lastSale).getTime();
      } else if (sortBy === "status") {
        comparison = Number(a.status) - Number(b.status);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const clientesFiltrados = sortClients(
    clientes.filter(
      (cliente) =>
        cliente.name.toLowerCase().includes(busca.toLowerCase()) ||
        cliente.email.toLowerCase().includes(busca.toLowerCase()) ||
        cliente.phone.includes(busca)
    )
  );

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const handleViewClient = (cliente: Consumer) => {
    setSelectedClient(cliente);
    setViewModalOpen(true);
  };

  const handleEditClient = (cliente: Consumer) => {
    setSelectedClient(cliente);
    setEditModalOpen(true);
  };

  const handleDeleteConfirm = (cliente: Consumer) => {
    setSelectedClient(cliente);
    setDeleteDialogOpen(true);
  };

  const onSubmitEdit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedClient) return;

    try {
      setLoading(true);

      await update("consumers", selectedClient._id, values);

      const updatedData = await read("consumers");
      setClientes(updatedData);

      toast({
        title: "Cliente atualizado",
        description: "Os dados do cliente foram atualizados com sucesso.",
      });

      setSelectedClient(null);
      setEditModalOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o cliente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);

      await remove("consumers", selectedClient._id);

      const updatedClientes = clientes.filter(
        (cliente) => cliente._id !== selectedClient._id
      );

      setClientes(updatedClientes);
      setDeleteDialogOpen(false);
      toast({
        title: "Cliente removido",
        description: "O cliente foi removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Clientes"
        description="Gerencie os clientes da loja"
      >
        <Link href="/dashboard/clientes/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Cliente</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </Link>
      </DashboardHeader>

      <div className="flex items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar clientes..."
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {!loading && clientesFiltrados.length > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          Exibindo {clientesFiltrados.length}{" "}
          {clientesFiltrados.length === 1 ? "cliente" : "clientes"}
          {busca && ` para "${busca}"`}
        </div>
      )}

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
            <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="email-asc">Email (A-Z)</SelectItem>
            <SelectItem value="email-desc">Email (Z-A)</SelectItem>
            <SelectItem value="totalSales-desc">Maiores compradores</SelectItem>
            <SelectItem value="totalSales-asc">Menores compradores</SelectItem>
            <SelectItem value="lastSale-desc">Compra mais recente</SelectItem>
            <SelectItem value="lastSale-asc">Compra mais antiga</SelectItem>
            <SelectItem value="status-desc">
              Status (Ativos primeiro)
            </SelectItem>
            <SelectItem value="status-asc">
              Status (Inativos primeiro)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden md:block">
        <Card>
          <div className="rounded-md border">
            {loading ? (
              <p className="text-center p-4">Carregando clientes...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => toggleSort("name")}
                      >
                        Nome
                        {sortBy === "name" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => toggleSort("email")}
                      >
                        Contato
                        {sortBy === "email" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-right">
                      <div
                        className="flex items-center justify-end cursor-pointer"
                        onClick={() => toggleSort("totalSales")}
                      >
                        Total em Compras
                        {sortBy === "totalSales" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => toggleSort("lastSale")}
                      >
                        Última Compra
                        {sortBy === "lastSale" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
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
                  {clientesFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-6"
                      >
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientesFiltrados.map((cliente) => (
                      <TableRow key={cliente._id}>
                        <TableCell>
                          <div className="font-medium">{cliente.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="mr-1 h-3 w-3" />
                              {cliente.email}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="mr-1 h-3 w-3" />
                              {cliente.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-1 h-3 w-3" />
                            {cliente.address.street}, {cliente.address.number} -{" "}
                            {cliente.address.city}, {cliente.address.state}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {cliente.totalSales.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {cliente.lastSale
                            ? new Date(cliente.lastSale).toLocaleDateString()
                            : "Nenhuma"}
                        </TableCell>
                        <TableCell>
                          {cliente.status ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Inativo
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewClient(cliente)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar cliente</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditClient(cliente)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar cliente</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {isAdmin && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleDeleteConfirm(cliente)
                                      }
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Excluir cliente</p>
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
            )}
          </div>
        </Card>
      </div>

      <div className="md:hidden space-y-4">
        {loading ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">Carregando clientes...</p>
            </CardContent>
          </Card>
        ) : clientesFiltrados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
            </CardContent>
          </Card>
        ) : (
          clientesFiltrados.map((cliente) => (
            <Card key={cliente._id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{cliente.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Mail className="mr-1 h-3 w-3" />
                      {cliente.email}
                    </div>
                  </div>
                  {cliente.status ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 ml-2 self-start">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground ml-2 self-start"
                    >
                      Inativo
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-3 pt-2">
                <div className="grid grid-cols-1 gap-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="mr-1 h-3 w-3" />
                    {cliente.phone}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="mr-1 h-3 w-3" />
                    {cliente.address.street}, {cliente.address.number}
                    <br />
                    {cliente.address.city}, {cliente.address.state}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 mt-1">
                    <div>
                      <p className="text-muted-foreground">Total em compras</p>
                      <p className="font-medium">
                        R$ {cliente.totalSales.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Última compra</p>
                      <p className="font-medium">
                        {cliente.lastSale
                          ? new Date(cliente.lastSale).toLocaleDateString()
                          : "Nenhuma"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-0 pb-3 gap-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => handleViewClient(cliente)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => handleEditClient(cliente)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteConfirm(cliente)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações completas do cliente
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm">Nome</h3>
                  <p>{selectedClient.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Status</h3>
                  <div>
                    {selectedClient.status ? (
                      <Badge className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm">Contato</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{selectedClient.email}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{selectedClient.phone}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm">Endereço</h3>
                <p>
                  {selectedClient.address.street},{" "}
                  {selectedClient.address.number}
                  {selectedClient.address.neighborhood &&
                    `, ${selectedClient.address.neighborhood}`}
                </p>
                <p>
                  {selectedClient.address.city} - {selectedClient.address.state}
                  , {selectedClient.address.zipCode}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm">Total em Compras</h3>
                  <p>R$ {selectedClient.totalSales.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Última Compra</h3>
                  <p>
                    {selectedClient.lastSale
                      ? new Date(selectedClient.lastSale).toLocaleDateString()
                      : "Nenhuma compra registrada"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Fechar
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      setViewModalOpen(false);
                      if (selectedClient) handleEditClient(selectedClient);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar dados do cliente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitEdit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input px-3 py-2"
                          value={String(field.value)}
                          onChange={(e) =>
                            field.onChange(e.target.value === "true")
                          }
                        >
                          <option value="true">Ativo</option>
                          <option value="false">Inativo</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rua</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar alterações"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente{" "}
              <span className="font-semibold">{selectedClient?.name}</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
