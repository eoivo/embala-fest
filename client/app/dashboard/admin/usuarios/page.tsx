"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Edit,
  Plus,
  Search,
  Trash,
  Shield,
  ShieldAlert,
  UserCog,
  User,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { create, read, update, remove } from "@/services/service"; // Importe as funções do seu serviço

// Tipos
type UserRole = "admin" | "manager" | "cashier";

interface UserType {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<UserType[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Estados para o formulário de criação/edição
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UserType | null>(
    null
  );
  const [isNovoUsuario, setIsNovoUsuario] = useState(false);
  const [formNome, setFormNome] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCargo, setFormCargo] = useState<UserRole>("cashier");
  const [formTelefone, setFormTelefone] = useState("");
  const [formSenha, setFormSenha] = useState("");
  const [formConfirmarSenha, setFormConfirmarSenha] = useState("");
  const [formResetSenha, setFormResetSenha] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Carregar usuários e verificar permissão de admin
  useEffect(() => {
    const checkAdminPermission = async () => {
      try {
        // Verificar permissões do usuário
        const user = await read("users/me");

        if (user.role !== "admin") {
          setIsAdmin(false);
          setCurrentUser(user);
          return;
        }

        // Se for admin, definir estados e buscar lista de usuários
        setCurrentUser(user);
        setIsAdmin(true);
        setLoading(true);
        const users = await read("users");
        setUsuarios(users);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao verificar permissão de admin:", error);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdminPermission();
  }, [router, toast]);

  // Função para ordenar usuários
  const sortUsuarios = (usuarios: UserType[]) => {
    return [...usuarios].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "email") {
        comparison = a.email.localeCompare(b.email);
      } else if (sortBy === "role") {
        comparison = a.role.localeCompare(b.role);
      } else if (sortBy === "createdAt") {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  // Filtrar usuários com base na busca
  const usuariosFiltrados = sortUsuarios(
    usuarios.filter(
      (usuario) =>
        usuario.name.toLowerCase().includes(busca.toLowerCase()) ||
        usuario.email.toLowerCase().includes(busca.toLowerCase()) ||
        usuario.role.toLowerCase().includes(busca.toLowerCase())
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

  // Função para abrir o modal de criação de usuário
  const handleNovoUsuario = () => {
    setIsNovoUsuario(true);
    setUsuarioSelecionado(null);
    setFormNome("");
    setFormEmail("");
    setFormCargo("cashier");
    setFormTelefone("");
    setFormSenha("");
    setFormConfirmarSenha("");
    setFormResetSenha(false);
    setIsDialogOpen(true);
  };

  // Função para abrir o modal de edição de usuário
  const handleEditarUsuario = (usuario: UserType) => {
    setIsNovoUsuario(false);
    setUsuarioSelecionado(usuario);
    setFormNome(usuario.name);
    setFormEmail(usuario.email);
    setFormCargo(usuario.role);
    setFormTelefone(usuario.phone);
    setFormSenha("");
    setFormConfirmarSenha("");
    setFormResetSenha(false);
    setIsDialogOpen(true);
  };

  // Função para salvar um novo usuário ou atualizar um existente
  const handleSalvarUsuario = async () => {
    // Validações básicas (mantenha as validações existentes)
    if (!formNome || !formEmail) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (isNovoUsuario) {
        // Criar novo usuário
        const novoUsuario = await create("users", {
          name: formNome,
          email: formEmail,
          role: formCargo,
          phone: formTelefone,
          password: formSenha,
        });

        setUsuarios([...usuarios, novoUsuario]);
        toast({
          title: "Usuário criado",
          description: `O usuário ${formNome} foi criado com sucesso.`,
        });
      } else if (usuarioSelecionado) {
        // Atualizar usuário existente
        const usuarioAtualizado = await update(
          "users",
          usuarioSelecionado._id,
          {
            name: formNome,
            email: formEmail,
            role: formCargo,
            phone: formTelefone,
          }
        );

        const usuariosAtualizados = usuarios.map((u) =>
          u._id === usuarioSelecionado._id ? usuarioAtualizado : u
        );
        setUsuarios(usuariosAtualizados);

        toast({
          title: "Usuário atualizado",
          description: `As alterações em ${formNome} foram salvas com sucesso.`,
        });
      }

      setLoading(false);
      setUsuarioSelecionado(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o usuário.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Função para excluir um usuário
  const handleExcluirUsuario = async (id: string) => {
    // Não permitir excluir o próprio usuário
    if (id === currentUser?._id) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode excluir sua própria conta.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await remove("users", id);

      const usuariosAtualizados = usuarios.filter((u) => u._id !== id);
      setUsuarios(usuariosAtualizados);

      toast({
        title: "Usuário excluído",
        description: "O usuário foi removido com sucesso.",
      });

      setLoading(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Função para obter o ícone do cargo
  const getCargoIcon = (cargo: UserRole) => {
    switch (cargo) {
      case "admin":
        return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case "manager":
        return <Shield className="h-4 w-4 text-primary" />;
      case "cashier":
        return <UserCog className="h-4 w-4 text-secondary" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Função para obter o texto do cargo
  const getCargoText = (cargo: UserRole) => {
    switch (cargo) {
      case "admin":
        return "Administrador";
      case "manager":
        return "Gerente";
      case "cashier":
        return "Operador de Caixa";
      default:
        return cargo;
    }
  };

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Se não for admin, mostrar mensagem de acesso negado
  if (!isAdmin) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <div className="flex gap-4 mt-4">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Voltar para o Dashboard
            </Button>
            <Button
              variant="default"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                router.push("/login");
              }}
            >
              Entrar como Administrador
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Administração de Usuários"
        description="Gerencie os usuários do sistema"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNovoUsuario}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Usuário</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isNovoUsuario ? "Criar Novo Usuário" : "Editar Usuário"}
              </DialogTitle>
              <DialogDescription>
                {isNovoUsuario
                  ? "Preencha os dados para criar um novo usuário no sistema."
                  : "Faça alterações nas informações do usuário."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Nome do usuário"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Select
                    value={formCargo}
                    onValueChange={(value) => setFormCargo(value as UserRole)}
                  >
                    <SelectTrigger id="cargo">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="cashier">Operador de Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    placeholder="(85) 99966-3214"
                  />
                </div>
              </div>

              {(isNovoUsuario || formResetSenha) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={formSenha}
                      onChange={(e) => setFormSenha(e.target.value)}
                      placeholder="Digite a senha"
                      required={isNovoUsuario || formResetSenha}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmar-senha">Confirmar Senha</Label>
                    <Input
                      id="confirmar-senha"
                      type="password"
                      value={formConfirmarSenha}
                      onChange={(e) => setFormConfirmarSenha(e.target.value)}
                      placeholder="Confirme a senha"
                      required={isNovoUsuario || formResetSenha}
                    />
                  </div>
                </>
              )}

              {!isNovoUsuario && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="reset-senha"
                    checked={formResetSenha}
                    onCheckedChange={setFormResetSenha}
                  />
                  <Label htmlFor="reset-senha">
                    Redefinir senha do usuário
                  </Label>
                </div>
              )}

              {formCargo === "admin" && (
                <Alert
                  variant="destructive"
                  className="bg-destructive/10 border-destructive/20"
                >
                  <AlertDescription>
                    Atenção: Usuários com cargo de Administrador têm acesso
                    completo ao sistema, incluindo esta área de administração.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleSalvarUsuario}
                disabled={loading}
              >
                {loading
                  ? "Salvando..."
                  : isNovoUsuario
                  ? "Criar Usuário"
                  : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardHeader>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar usuários por nome, email ou cargo..."
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {!loading && usuariosFiltrados.length > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          Exibindo {usuariosFiltrados.length}{" "}
          {usuariosFiltrados.length === 1 ? "usuário" : "usuários"}
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
            <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="email-asc">Email (A-Z)</SelectItem>
            <SelectItem value="email-desc">Email (Z-A)</SelectItem>
            <SelectItem value="role-asc">Cargo (A-Z)</SelectItem>
            <SelectItem value="role-desc">Cargo (Z-A)</SelectItem>
            <SelectItem value="createdAt-desc">Data (Mais recente)</SelectItem>
            <SelectItem value="createdAt-asc">Data (Mais antiga)</SelectItem>
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
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("name")}
                    >
                      Usuário
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
                      Email
                      {sortBy === "email" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("role")}
                    >
                      Cargo
                      {sortBy === "role" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("createdAt")}
                    >
                      Data de Cadastro
                      {sortBy === "createdAt" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-6"
                    >
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario._id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>
                              {getInitials(usuario.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{usuario.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getCargoIcon(usuario.role)}
                          <span className="ml-1">
                            {getCargoText(usuario.role)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                          {new Date(usuario.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditarUsuario(usuario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={usuario._id === currentUser?._id}
                                className={
                                  usuario._id === currentUser?._id
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir Usuário
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o usuário "
                                  {usuario.name}"? Esta ação não pode ser
                                  desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleExcluirUsuario(usuario._id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={loading}
                                >
                                  {loading ? "Excluindo..." : "Excluir"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
        {loading ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">Carregando usuários...</p>
            </CardContent>
          </Card>
        ) : usuariosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          usuariosFiltrados.map((usuario) => (
            <Card key={usuario._id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-2">
                      <AvatarFallback>
                        {getInitials(usuario.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {usuario.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {usuario.email}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3 pt-2">
                <div className="grid grid-cols-1 gap-y-2 text-sm">
                  <div className="flex items-center">
                    {getCargoIcon(usuario.role)}
                    <span className="ml-1 font-medium">
                      {getCargoText(usuario.role)}
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">
                      {usuario.phone || "Não informado"}
                    </p>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    Criado em{" "}
                    {new Date(usuario.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-0 pb-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => handleEditarUsuario(usuario)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      disabled={usuario._id === currentUser?._id}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o usuário "{usuario.name}
                        "? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleExcluirUsuario(usuario._id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={loading}
                      >
                        {loading ? "Excluindo..." : "Excluir"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
