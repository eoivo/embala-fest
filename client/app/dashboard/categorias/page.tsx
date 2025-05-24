"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Edit, Plus, Search, Trash } from "lucide-react";
import { categoryService, CategoryUI } from "./categoryService";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
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
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CategoriasPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CategoriasContent />
    </Suspense>
  );
}

function CategoriasContent() {
  const [categorias, setCategorias] = useState<CategoryUI[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<CategoryUI | null>(null);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<
    string | null
  >(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    carregarCategorias();
  }, []);

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      handleAbrirModal();
    }
  }, [searchParams]);

  const carregarCategorias = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategorias(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar categorias",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModal = (categoria?: CategoryUI) => {
    setEditando(categoria || null);
    form.reset(
      categoria
        ? { name: categoria.name, description: categoria.description || "" }
        : { name: "", description: "" }
    );
    setModalAberto(true);
  };

  const handleSalvar = async (values: FormValues) => {
    try {
      setLoading(true);
      if (editando) {
        await categoryService.updateCategory(editando.id, values);
        toast({ title: "Categoria atualizada" });
      } else {
        await categoryService.createCategory(values);
        toast({ title: "Categoria criada" });
      }
      setModalAberto(false);
      carregarCategorias();
    } catch (error) {
      toast({
        title: "Erro ao salvar categoria",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!categoriaParaExcluir) return;
    try {
      setLoading(true);
      await categoryService.deleteCategory(categoriaParaExcluir);
      toast({ title: "Categoria excluída" });
      setCategoriaParaExcluir(null);
      carregarCategorias();
    } catch (error) {
      toast({
        title: "Erro ao excluir categoria",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categoriasFiltradas = categorias.filter((cat) =>
    cat.name.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <DashboardShell>
      <Suspense fallback={<div>Carregando...</div>}>
        <DashboardHeader
          heading="Categorias"
          description="Gerencie as categorias de produtos"
        >
          <Button onClick={() => handleAbrirModal()}>
            <Plus className="mr-2 h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Categoria</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </DashboardHeader>

        <div className="flex items-center mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar categorias..."
              className="pl-8"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="hidden md:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      {loading
                        ? "Carregando categorias..."
                        : busca
                        ? "Nenhuma categoria encontrada para a busca"
                        : "Nenhuma categoria cadastrada"}
                    </TableCell>
                  </TableRow>
                ) : (
                  categoriasFiltradas.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>{cat.description}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAbrirModal(cat)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCategoriaParaExcluir(cat.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="md:hidden">
          {categoriasFiltradas.map((cat) => (
            <Card key={cat.id} className="mb-4">
              <CardHeader>
                <CardTitle>{cat.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{cat.description}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleAbrirModal(cat)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCategoriaParaExcluir(cat.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Modal de criar/editar */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editando ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSalvar)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} autoFocus disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {editando ? "Salvar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmação de exclusão */}
        <AlertDialog
          open={!!categoriaParaExcluir}
          onOpenChange={() => setCategoriaParaExcluir(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            </AlertDialogHeader>
            <p>
              Tem certeza que deseja excluir esta categoria? Esta ação não
              poderá ser desfeita.
            </p>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleExcluir} disabled={loading}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Suspense>
    </DashboardShell>
  );
}
