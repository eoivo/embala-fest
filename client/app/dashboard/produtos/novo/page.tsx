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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  productService,
  ProductUI,
} from "@/app/dashboard/produtos/productService";
import {
  supplierService,
  SupplierUI,
} from "@/app/dashboard/produtos/supplierService";
import {
  categoryService,
  CategoryUI,
} from "@/app/dashboard/categorias/categoryService";

export default function NovoProdutoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingFornecedores, setLoadingFornecedores] = useState(true);
  const [fornecedores, setFornecedores] = useState<SupplierUI[]>([]);
  const [categorias, setCategorias] = useState<CategoryUI[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [formData, setFormData] = useState<Partial<ProductUI>>({
    nome: "",
    descricao: "",
    categoria: "",
    codigo: "",
    fornecedor: "",
    preco: 0,
    estoque: 0,
    estoqueMinimo: 5,
  });

  // Buscar fornecedores do servidor
  useEffect(() => {
    async function fetchFornecedores() {
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
    }

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]:
        id === "preco" || id === "estoque" || id === "estoqueMinimo"
          ? parseFloat(value)
          : value,
    }));
  };

  const handleSelectChange = (value: string, field: string) => {
    if (field === "fornecedor" && value === "criar_novo") {
      router.push("/dashboard/fornecedores?novo=1");
      return;
    }
    if (field === "categoria" && value === "criar_nova_categoria") {
      router.push("/dashboard/categorias?novo=1");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação básica
      if (
        !formData.nome ||
        !formData.codigo ||
        !formData.categoria ||
        !formData.fornecedor
      ) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      // Criar produto
      const novoProduto: ProductUI = {
        id: "",
        nome: formData.nome || "",
        descricao: formData.descricao || "",
        categoria: formData.categoria || "",
        codigo: formData.codigo || "",
        fornecedor: formData.fornecedor || "",
        preco: formData.preco || 0,
        estoque: formData.estoque || 0,
        estoqueMinimo: formData.estoqueMinimo || 5,
      };

      await productService.createProduct(novoProduto);

      toast({
        title: "Produto cadastrado com sucesso!",
        description: "O produto foi adicionado ao catálogo.",
      });

      router.push("/dashboard/produtos");
    } catch (error) {
      toast({
        title: "Erro ao cadastrar produto",
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
        heading="Novo Produto"
        description="Adicione um novo produto ao catálogo"
      >
        <Link href="/dashboard/produtos">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </DashboardHeader>

      <div className="grid gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
              <CardDescription>
                Preencha os dados do novo produto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Produto</Label>
                  <Input
                    id="nome"
                    placeholder="Nome do produto"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código (SKU)</Label>
                  <Input
                    id="codigo"
                    placeholder="Código do produto"
                    value={formData.codigo}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange(value, "categoria")
                    }
                    value={formData.categoria}
                    disabled={loadingCategorias}
                  >
                    <SelectTrigger id="categoria">
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
                      <SelectItem
                        value="criar_nova_categoria"
                        className="text-blue-600 font-semibold"
                      >
                        + Criar nova categoria?
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange(value, "fornecedor")
                    }
                    value={formData.fornecedor}
                    disabled={loadingFornecedores}
                  >
                    <SelectTrigger id="fornecedor">
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
                          <SelectItem key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome}
                          </SelectItem>
                        ))
                      )}
                      <SelectItem
                        value="criar_novo"
                        className="text-blue-600 font-semibold"
                      >
                        + Criar novo fornecedor?
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço de Venda (R$)</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.preco || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estoque">Quantidade em Estoque</Label>
                  <Input
                    id="estoque"
                    type="number"
                    placeholder="0"
                    value={formData.estoque || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
                  <Input
                    id="estoqueMinimo"
                    type="number"
                    placeholder="5"
                    value={formData.estoqueMinimo || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição do produto"
                  value={formData.descricao || ""}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="ml-auto" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Produto"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardShell>
  );
}
