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
  productService,
  ProductUI,
} from "@/app/dashboard/produtos/productService";
import {
  supplierService,
  SupplierUI,
} from "@/app/dashboard/produtos/supplierService";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  categoryService,
  CategoryUI,
} from "@/app/dashboard/categorias/categoryService";

// Schema de validação para o formulário de edição
const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  codigo: z.string().min(1, "Código é obrigatório"),
  categoria: z.string().min(2, "Categoria é obrigatória"),
  preco: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  estoque: z.number().min(0, "Estoque deve ser maior ou igual a zero"),
  fornecedor: z.string().min(1, "Fornecedor é obrigatório"),
});

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProductUI[]>([]);
  const [fornecedores, setFornecedores] = useState<SupplierUI[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingFornecedores, setLoadingFornecedores] = useState(true);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<string | null>(
    null
  );
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductUI | null>(
    null
  );
  const [sortBy, setSortBy] = useState<string>("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<CategoryUI[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      codigo: "",
      categoria: "",
      preco: 0,
      estoque: 0,
      fornecedor: "",
    },
  });

  // Carregar produtos da API
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const data = await productService.getProducts();
        setProdutos(data);
      } catch (error) {
        toast({
          title: "Erro ao carregar produtos",
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

    fetchProdutos();
  }, [toast]);

  // Carregar fornecedores da API
  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        setLoadingFornecedores(true);
        const data = await supplierService.getSuppliers();
        setFornecedores(data.filter((f) => f.ativo)); // Apenas fornecedores ativos
      } catch (error) {
        console.error("Erro ao carregar fornecedores:", error);
        toast({
          title: "Erro ao carregar fornecedores",
          description: "Não foi possível obter a lista de fornecedores",
          variant: "destructive",
        });
      } finally {
        setLoadingFornecedores(false);
      }
    };

    fetchFornecedores();
  }, [toast]);

  // Buscar categorias do servidor
  useEffect(() => {
    async function fetchCategorias() {
      try {
        setLoadingCategorias(true);
        const data = await categoryService.getCategories();
        setCategorias(data);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        toast({
          title: "Erro ao carregar categorias",
          description: "Não foi possível obter a lista de categorias",
          variant: "destructive",
        });
      } finally {
        setLoadingCategorias(false);
      }
    }
    fetchCategorias();
  }, [toast]);

  // Função para ordenar produtos
  const sortProducts = (products: ProductUI[]) => {
    return [...products].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "nome") {
        comparison = a.nome.localeCompare(b.nome);
      } else if (sortBy === "preco") {
        comparison = a.preco - b.preco;
      } else if (sortBy === "estoque") {
        comparison = a.estoque - b.estoque;
      } else if (sortBy === "categoria") {
        comparison = a.categoria.localeCompare(b.categoria);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  // Filtrar e ordenar produtos
  const produtosFiltrados = sortProducts(
    produtos.filter(
      (produto) =>
        produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
        produto.categoria.toLowerCase().includes(busca.toLowerCase()) ||
        produto.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        produto.fornecedor.toLowerCase().includes(busca.toLowerCase())
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

  // Encontrar o nome do fornecedor pelo ID
  const getFornecedorNome = (id: string) => {
    const fornecedor = fornecedores.find((f) => f.id === id);
    return fornecedor ? fornecedor.nome : id;
  };

  // Função utilitária para obter o nome da categoria pelo id
  const getCategoriaNome = (id: string) => {
    const categoria = categorias.find((c) => c.id === id);
    return categoria ? categoria.name : id;
  };

  // Função para excluir produto
  const handleExcluirProduto = async () => {
    if (!produtoParaExcluir) return;

    try {
      await productService.deleteProduct(produtoParaExcluir);
      setProdutos(produtos.filter((p) => p.id !== produtoParaExcluir));
      toast({
        title: "Produto excluído",
        description: "Produto removido com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir produto",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setProdutoParaExcluir(null);
    }
  };

  // Função para abrir o modal de visualização
  const handleViewProduct = (produto: ProductUI) => {
    setSelectedProduct(produto);
    setViewModalOpen(true);
  };

  // Função para abrir o modal de edição
  const handleEditProduct = (produto: ProductUI) => {
    setSelectedProduct(produto);
    setEditModalOpen(true);
    form.reset(produto); // Preenche o formulário com os dados do produto selecionado
  };

  // Função para enviar o formulário de edição
  const onSubmitEdit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedProduct) return;

    try {
      setLoading(true);

      // Incluir o id do produto no objeto de atualização
      const updatedProduct = { ...values, id: selectedProduct.id };

      await productService.updateProduct(selectedProduct.id, updatedProduct);

      const updatedProdutos = produtos.map((produto) => {
        if (produto.id === selectedProduct.id) {
          return { ...produto, ...values };
        }
        return produto;
      });

      setProdutos(updatedProdutos);
      setEditModalOpen(false);
      toast({
        title: "Produto atualizado",
        description: "Os dados do produto foram atualizados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar produto",
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

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Produtos"
        description="Gerencie o catálogo de produtos da loja"
      >
        <Link href="/dashboard/produtos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </Link>
      </DashboardHeader>

      <div className="flex items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar produtos..."
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {!loading && produtosFiltrados.length > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          Exibindo {produtosFiltrados.length}{" "}
          {produtosFiltrados.length === 1 ? "produto" : "produtos"}
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
            <SelectItem value="preco-asc">Preço (menor primeiro)</SelectItem>
            <SelectItem value="preco-desc">Preço (maior primeiro)</SelectItem>
            <SelectItem value="estoque-asc">
              Estoque (menor primeiro)
            </SelectItem>
            <SelectItem value="estoque-desc">
              Estoque (maior primeiro)
            </SelectItem>
            <SelectItem value="categoria-asc">Categoria (A-Z)</SelectItem>
            <SelectItem value="categoria-desc">Categoria (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Versão para desktop (tabela) - mostrada apenas em telas md e maiores */}
      <div className="hidden md:block">
        <Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
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
                      onClick={() => toggleSort("categoria")}
                    >
                      Categoria
                      {sortBy === "categoria" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div
                      className="flex items-center justify-end cursor-pointer"
                      onClick={() => toggleSort("preco")}
                    >
                      Preço
                      {sortBy === "preco" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div
                      className="flex items-center justify-end cursor-pointer"
                      onClick={() => toggleSort("estoque")}
                    >
                      Estoque
                      {sortBy === "estoque" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-6"
                    >
                      Carregando produtos...
                    </TableCell>
                  </TableRow>
                ) : produtosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-6"
                    >
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  produtosFiltrados.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell>{produto.codigo}</TableCell>
                      <TableCell>{produto.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoriaNome(produto.categoria)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {produto.preco.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            produto.estoque < (produto.estoqueMinimo || 20)
                              ? "text-red-500 font-medium"
                              : ""
                          }
                        >
                          {produto.estoque}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getFornecedorNome(produto.fornecedor)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewProduct(produto)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Visualizar produto</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditProduct(produto)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar produto</p>
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
                                    setProdutoParaExcluir(produto.id)
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Excluir produto</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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

      {/* Versão para dispositivos móveis (cards) - mostrada apenas em telas menores que md */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">Carregando produtos...</p>
            </CardContent>
          </Card>
        ) : produtosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </CardContent>
          </Card>
        ) : (
          produtosFiltrados.map((produto) => (
            <Card key={produto.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{produto.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Código: {produto.codigo}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 self-start">
                    {getCategoriaNome(produto.categoria)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3 pt-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Preço</p>
                    <p className="font-medium">R$ {produto.preco.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estoque</p>
                    <p
                      className={
                        produto.estoque < (produto.estoqueMinimo || 20)
                          ? "text-red-500 font-medium"
                          : "font-medium"
                      }
                    >
                      {produto.estoque} unid.
                    </p>
                  </div>
                  <div className="col-span-2 mt-1">
                    <p className="text-muted-foreground">Fornecedor</p>
                    <p className="font-medium">
                      {getFornecedorNome(produto.fornecedor)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-0 pb-3 gap-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => handleViewProduct(produto)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => handleEditProduct(produto)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setProdutoParaExcluir(produto.id)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Diálogo de confirmação para excluir produto */}
      <AlertDialog
        open={!!produtoParaExcluir}
        onOpenChange={() => setProdutoParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será permanentemente
              removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirProduto}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Visualização */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
            <DialogDescription>
              Informações completas do produto
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm">Nome</h3>
                  <p>{selectedProduct.nome}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Código</h3>
                  <p>{selectedProduct.codigo}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm">Categoria</h3>
                <p>{getCategoriaNome(selectedProduct.categoria)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm">Preço</h3>
                  <p>R$ {selectedProduct.preco.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Estoque</h3>
                  <p>{selectedProduct.estoque}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm">Fornecedor</h3>
                <p>{getFornecedorNome(selectedProduct.fornecedor)}</p>
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

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize as informações do produto
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
                  name="nome"
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
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
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
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingCategorias}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingCategorias
                                  ? "Carregando categorias..."
                                  : "Selecione uma categoria"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.length === 0 ? (
                              <SelectItem value="placeholder" disabled>
                                {loadingCategorias
                                  ? "Carregando..."
                                  : "Nenhuma categoria encontrada"}
                              </SelectItem>
                            ) : (
                              categorias.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estoque"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fornecedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={loadingFornecedores}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingFornecedores
                                  ? "Carregando fornecedores..."
                                  : "Selecione um fornecedor"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {fornecedores.length === 0 ? (
                              <SelectItem value="placeholder" disabled>
                                {loadingFornecedores
                                  ? "Carregando..."
                                  : "Nenhum fornecedor encontrado"}
                              </SelectItem>
                            ) : (
                              fornecedores.map((fornecedor) => (
                                <SelectItem
                                  key={fornecedor.id}
                                  value={fornecedor.id}
                                >
                                  {fornecedor.nome}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
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
    </DashboardShell>
  );
}
