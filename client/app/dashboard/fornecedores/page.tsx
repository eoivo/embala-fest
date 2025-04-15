"use client";

import { useState, useEffect } from "react";
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
import { Edit, Eye, Plus, Search, Trash, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import {
  supplierService,
  SupplierUI,
} from "@/app/dashboard/fornecedores/supplierService";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Função para formatar CNPJ
const formatCNPJ = (value: string) => {
  // Remove caracteres não numéricos
  const numericValue = value.replace(/\D/g, "");

  // Aplica a máscara de CNPJ: 00.000.000/0000-00
  if (numericValue.length <= 14) {
    return numericValue
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return value;
};

// Função para formatar telefone brasileiro (aceita 8 ou 9 dígitos)
const formatPhone = (value: string) => {
  // Remove caracteres não numéricos
  const numericValue = value.replace(/\D/g, "");

  // Aplica a máscara de telefone: (00) 00000-0000 ou (00) 0000-0000
  if (numericValue.length <= 11) {
    if (numericValue.length <= 10) {
      return numericValue
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      return numericValue
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
  }

  return value;
};

// Schema de validação para o formulário de edição
const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  nomeContato: z
    .string()
    .min(2, "Nome do contato deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(14, "Telefone inválido"),
  endereco: z.object({
    cep: z.string().min(8, "CEP inválido"),
    rua: z.string().min(2, "Rua é obrigatória"),
    numero: z.string().min(1, "Número é obrigatório"),
    bairro: z.string().min(2, "Bairro é obrigatório"),
    cidade: z.string().min(2, "Cidade é obrigatória"),
    estado: z.string().min(2, "Estado é obrigatório"),
  }),
  cnpj: z.string().min(18, "CNPJ inválido"),
  ativo: z.boolean().default(true),
});

// Schema para o formulário de criação
const createFormSchema = formSchema;

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<SupplierUI[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<
    string | null
  >(null);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierUI | null>(
    null
  );
  const [sortBy, setSortBy] = useState<string>("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      nomeContato: "",
      email: "",
      telefone: "",
      endereco: {
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
      },
      cnpj: "",
      ativo: true,
    },
  });

  const createForm = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      nome: "",
      nomeContato: "",
      email: "",
      telefone: "",
      endereco: {
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
      },
      cnpj: "",
      ativo: true,
    },
  });

  // Carregar fornecedores da API
  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const data = await supplierService.getSuppliers();
        setFornecedores(data);
      } catch (error) {
        toast({
          title: "Erro ao carregar fornecedores",
          description:
            error instanceof Error
              ? error.message
              : "Ocorreu um erro desconhecido",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFornecedores();
  }, [toast]);

  // Função para ordenar fornecedores
  const sortSuppliers = (suppliers: SupplierUI[]) => {
    return [...suppliers].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "nome") {
        comparison = a.nome.localeCompare(b.nome);
      } else if (sortBy === "nomeContato") {
        comparison = a.nomeContato.localeCompare(b.nomeContato);
      } else if (sortBy === "email") {
        comparison = a.email.localeCompare(b.email);
      } else if (sortBy === "ativo") {
        comparison = Number(a.ativo) - Number(b.ativo);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  // Filtrar e ordenar fornecedores
  const fornecedoresFiltrados = sortSuppliers(
    fornecedores.filter(
      (fornecedor) =>
        fornecedor.nome.toLowerCase().includes(busca.toLowerCase()) ||
        fornecedor.nomeContato.toLowerCase().includes(busca.toLowerCase()) ||
        fornecedor.email.toLowerCase().includes(busca.toLowerCase()) ||
        fornecedor.cnpj.toLowerCase().includes(busca.toLowerCase())
    )
  );

  // Função para alternar a direção da ordenação
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // Função para excluir fornecedor
  const handleExcluirFornecedor = async () => {
    if (!fornecedorParaExcluir) return;

    try {
      await supplierService.deleteSupplier(fornecedorParaExcluir);
      setFornecedores(
        fornecedores.filter((f) => f.id !== fornecedorParaExcluir)
      );
      toast({
        title: "Fornecedor excluído",
        description: "Fornecedor removido com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir fornecedor",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setFornecedorParaExcluir(null);
    }
  };

  // Função para abrir o modal de edição
  const handleEditSupplier = (fornecedor: SupplierUI) => {
    setSelectedSupplier(fornecedor);
    setEditModalOpen(true);

    // Certifica-se de que o endereço exista antes de preencher o formulário
    const enderecoCompleto = fornecedor.endereco || {
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
    };

    // Atualiza o formulário com os dados do fornecedor selecionado
    form.reset({
      nome: fornecedor.nome,
      nomeContato: fornecedor.nomeContato,
      email: fornecedor.email,
      telefone: fornecedor.telefone,
      endereco: enderecoCompleto,
      cnpj: fornecedor.cnpj,
      ativo: fornecedor.ativo,
    });
  };

  // Função para abrir o modal de visualização
  const handleViewSupplier = (fornecedor: SupplierUI) => {
    setSelectedSupplier(fornecedor);
    setViewModalOpen(true);
  };

  // Função para enviar o formulário de edição
  const onSubmitEdit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedSupplier) return;

    try {
      setLoading(true);

      // Incluir o id do fornecedor no objeto de atualização
      const updatedSupplier: SupplierUI = {
        ...values,
        id: selectedSupplier.id,
      };

      await supplierService.updateSupplier(
        selectedSupplier.id,
        updatedSupplier
      );

      const updatedFornecedores = fornecedores.map((fornecedor) => {
        if (fornecedor.id === selectedSupplier.id) {
          return { ...fornecedor, ...updatedSupplier };
        }
        return fornecedor;
      });

      setFornecedores(updatedFornecedores);
      setEditModalOpen(false);
      toast({
        title: "Fornecedor atualizado",
        description: "Os dados do fornecedor foram atualizados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar fornecedor",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para enviar o formulário de criação
  const onSubmitCreate = async (values: z.infer<typeof createFormSchema>) => {
    try {
      setLoading(true);

      // Criar um novo fornecedor com ID temporário (será substituído pelo server)
      const newSupplier: SupplierUI = {
        id: "temp-id",
        ...values,
      };

      const createdSupplier = await supplierService.createSupplier(newSupplier);
      setFornecedores([...fornecedores, createdSupplier]);
      setCreateModalOpen(false);
      createForm.reset();
      toast({
        title: "Fornecedor criado",
        description: "Novo fornecedor adicionado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao criar fornecedor",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar o endereço pelo CEP
  const fetchAddressByCep = async (
    cep: string,
    formType: "edit" | "create"
  ) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      const response = await axios.get(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );
      if (response.data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado",
          variant: "destructive",
        });
        return;
      }

      const formToUpdate = formType === "edit" ? form : createForm;

      formToUpdate.setValue("endereco.rua", response.data.logradouro || "");
      formToUpdate.setValue("endereco.bairro", response.data.bairro || "");
      formToUpdate.setValue("endereco.cidade", response.data.localidade || "");
      formToUpdate.setValue("endereco.estado", response.data.uf || "");
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Ocorreu um erro ao consultar o serviço de CEP",
        variant: "destructive",
      });
      console.error("Erro ao buscar CEP:", error);
    }
  };

  // Função para lidar com a mudança no campo de CEP
  const handleCepChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    formType: "edit" | "create"
  ) => {
    const { value } = e.target;
    const formToUpdate = formType === "edit" ? form : createForm;

    // Aplicar máscara ao CEP
    const maskedCep = applyCepMask(value);
    formToUpdate.setValue("endereco.cep", maskedCep);

    // Se o CEP tiver 8 dígitos numéricos, buscar o endereço
    if (value.replace(/\D/g, "").length === 8) {
      fetchAddressByCep(value, formType);
    }
  };

  // Função para aplicar máscara ao CEP (00000-000)
  const applyCepMask = (value: string) => {
    const cep = value.replace(/\D/g, "");
    if (cep.length <= 5) return cep;
    return `${cep.slice(0, 5)}-${cep.slice(5, 8)}`;
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Fornecedores"
        description="Gerencie os fornecedores da sua loja"
      >
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo Fornecedor</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </DashboardHeader>

      <div className="flex items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar fornecedores..."
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {!loading && fornecedoresFiltrados.length > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          Exibindo {fornecedoresFiltrados.length}{" "}
          {fornecedoresFiltrados.length === 1 ? "fornecedor" : "fornecedores"}
          {busca && ` para "${busca}"`}
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
            <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="nomeContato-asc">Contato (A-Z)</SelectItem>
            <SelectItem value="nomeContato-desc">Contato (Z-A)</SelectItem>
            <SelectItem value="email-asc">Email (A-Z)</SelectItem>
            <SelectItem value="email-desc">Email (Z-A)</SelectItem>
            <SelectItem value="ativo-desc">Status (Ativos primeiro)</SelectItem>
            <SelectItem value="ativo-asc">
              Status (Inativos primeiro)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Versão para desktop (tabela) - mostrada apenas em telas md e maiores */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("nome")}
                  >
                    Nome
                    {sortBy === "nome" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("nomeContato")}
                  >
                    Contato
                    {sortBy === "nomeContato" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("email")}
                  >
                    Email
                    {sortBy === "email" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("ativo")}
                  >
                    Status
                    {sortBy === "ativo" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedoresFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {loading
                      ? "Carregando fornecedores..."
                      : busca
                      ? "Nenhum fornecedor encontrado para a busca"
                      : "Nenhum fornecedor cadastrado"}
                  </TableCell>
                </TableRow>
              ) : (
                fornecedoresFiltrados.map((fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell className="font-medium">
                      {fornecedor.nome}
                    </TableCell>
                    <TableCell>{fornecedor.nomeContato}</TableCell>
                    <TableCell>{fornecedor.email}</TableCell>
                    <TableCell>{fornecedor.telefone}</TableCell>
                    <TableCell>{fornecedor.cnpj}</TableCell>
                    <TableCell>
                      {Boolean(fornecedor.ativo) ? (
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
                    <TableCell className="flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewSupplier(fornecedor)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Visualizar fornecedor</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSupplier(fornecedor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar fornecedor</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setFornecedorParaExcluir(fornecedor.id)
                              }
                              className="text-red-500"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir fornecedor</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Versão para dispositivos móveis (cards) - mostrada apenas em telas menores que md */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">
                Carregando fornecedores...
              </p>
            </CardContent>
          </Card>
        ) : fornecedoresFiltrados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">
                {busca
                  ? "Nenhum fornecedor encontrado para a busca"
                  : "Nenhum fornecedor cadastrado"}
              </p>
            </CardContent>
          </Card>
        ) : (
          fornecedoresFiltrados.map((fornecedor) => (
            <Card key={fornecedor.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      {fornecedor.nome}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contato: {fornecedor.nomeContato}
                    </p>
                  </div>
                  {Boolean(fornecedor.ativo) ? (
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
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{fornecedor.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div>
                      <p className="text-muted-foreground">Telefone</p>
                      <p className="font-medium">{fornecedor.telefone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CNPJ</p>
                      <p className="font-medium">{fornecedor.cnpj}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-0 pb-3 gap-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => handleViewSupplier(fornecedor)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => handleEditSupplier(fornecedor)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setFornecedorParaExcluir(fornecedor.id)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog
        open={!!fornecedorParaExcluir}
        onOpenChange={(open) => !open && setFornecedorParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O fornecedor será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluirFornecedor}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de edição de fornecedor */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="pb-2">
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>
              Atualize os dados do fornecedor. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitEdit)}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nomeContato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome do Contato</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Email</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Telefone</FormLabel>
                      <FormControl>
                        <Input
                          className="h-8"
                          {...field}
                          value={field.value}
                          onChange={(e) => {
                            const formattedValue = formatPhone(e.target.value);
                            field.onChange(formattedValue);
                          }}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="endereco.cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">CEP</FormLabel>
                    <FormControl>
                      <Input
                        className="h-8"
                        {...field}
                        maxLength={9}
                        onChange={(e) => handleCepChange(e, "edit")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="endereco.rua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Rua</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco.numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Número</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="endereco.bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Bairro</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco.cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Cidade</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco.estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Estado</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">CNPJ</FormLabel>
                      <FormControl>
                        <Input
                          className="h-8"
                          {...field}
                          value={field.value}
                          onChange={(e) => {
                            const formattedValue = formatCNPJ(e.target.value);
                            field.onChange(formattedValue);
                          }}
                          maxLength={18}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Status</FormLabel>
                      <div className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1">
                        <span className="text-sm">
                          {field.value ? "Ativo" : "Inativo"}
                        </span>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de criação de fornecedor */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="pb-2">
            <DialogTitle>Cadastrar Fornecedor</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo fornecedor.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onSubmitCreate)}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={createForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="nomeContato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome do Contato</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Email</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Telefone</FormLabel>
                      <FormControl>
                        <Input
                          className="h-8"
                          {...field}
                          value={field.value}
                          onChange={(e) => {
                            const formattedValue = formatPhone(e.target.value);
                            field.onChange(formattedValue);
                          }}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="endereco.cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">CEP</FormLabel>
                    <FormControl>
                      <Input
                        className="h-8"
                        {...field}
                        maxLength={9}
                        onChange={(e) => handleCepChange(e, "create")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={createForm.control}
                  name="endereco.rua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Rua</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="endereco.numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Número</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={createForm.control}
                  name="endereco.bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Bairro</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="endereco.cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Cidade</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="endereco.estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Estado</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={createForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">CNPJ</FormLabel>
                      <FormControl>
                        <Input
                          className="h-8"
                          {...field}
                          value={field.value}
                          onChange={(e) => {
                            const formattedValue = formatCNPJ(e.target.value);
                            field.onChange(formattedValue);
                          }}
                          maxLength={18}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Status</FormLabel>
                      <div className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1">
                        <span className="text-sm">
                          {field.value ? "Ativo" : "Inativo"}
                        </span>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  Cadastrar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Fornecedor</DialogTitle>
            <DialogDescription>
              Informações completas do fornecedor
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm">Nome</h3>
                  <p>{selectedSupplier.nome}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Nome do Contato</h3>
                  <p>{selectedSupplier.nomeContato}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm">Email</h3>
                  <p>{selectedSupplier.email}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Telefone</h3>
                  <p>{selectedSupplier.telefone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm">CNPJ</h3>
                  <p>{selectedSupplier.cnpj}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Status</h3>
                  <div>
                    {selectedSupplier.ativo ? (
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
                <h3 className="font-semibold text-sm">Endereço</h3>
                <p>
                  {selectedSupplier.endereco?.rua ? (
                    <>
                      {selectedSupplier.endereco.rua}
                      {selectedSupplier.endereco.numero &&
                        `, ${selectedSupplier.endereco.numero}`}
                      {selectedSupplier.endereco.bairro &&
                        `, ${selectedSupplier.endereco.bairro}`}
                      <br />
                      {selectedSupplier.endereco.cidade &&
                        `${selectedSupplier.endereco.cidade}`}
                      {selectedSupplier.endereco.estado &&
                        ` - ${selectedSupplier.endereco.estado}`}
                      {selectedSupplier.endereco.cep &&
                        `, ${selectedSupplier.endereco.cep}`}
                    </>
                  ) : (
                    "Não informado"
                  )}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
