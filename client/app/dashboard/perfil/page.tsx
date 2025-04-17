"use client";

import React, { useEffect, useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Camera, Key, Lock, Mail, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { read, update, uploadAvatar } from "@/services/service";
import { useUserContext } from "@/hooks/use-user-context";

export default function PerfilPage() {
  const { toast } = useToast();
  const { updateAvatar } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState({
    nome: "",
    cargo: "",
    email: "",
    telefone: "",
    dataCadastro: "",
    ultimoAcesso: "",
    _id: "",
    avatar: "",
  });
  const [senhas, setSenhas] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [senhaError, setSenhaError] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [canEditAvatar, setCanEditAvatar] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        // Usando a rota /api/users/me para obter os dados do usuário logado
        const profileData = await read(`users/me`);

        setUsuario({
          nome: profileData.name,
          cargo: profileData.role,
          email: profileData.email,
          telefone: profileData.phone || "",
          dataCadastro: new Date(profileData.createdAt).toLocaleDateString(),
          ultimoAcesso: new Date(profileData.updatedAt).toLocaleString(),
          _id: profileData._id,
          avatar: profileData.avatar || "",
        });

        // Verificar se o usuário pode editar perfil (admin ou gerente)
        setCanEdit(["admin", "manager"].includes(profileData.role));

        // Todos os usuários podem editar o avatar, independentemente do cargo
        setCanEditAvatar(true);
      } catch (error) {
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar os dados do perfil.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [toast]);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!canEdit) {
        toast({
          title: "Sem permissão",
          description: "Você não tem permissão para editar o perfil.",
          variant: "destructive",
        });
        return;
      }

      // Convertendo dados do formulário para o formato esperado pela API
      const userData = {
        name: usuario.nome,
        email: usuario.email,
        phone: usuario.telefone,
      };

      // Usar a rota api/users/me para atualização do próprio perfil
      await update("users/me", "", userData);

      toast({
        title: "Perfil atualizado com sucesso!",
        description: "Suas informações foram atualizadas.",
      });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível atualizar os dados do perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setSenhaError("");

    if (!canEdit) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para alterar a senha.",
        variant: "destructive",
      });
      return;
    }

    // Validações...
    if (senhas.novaSenha !== senhas.confirmarSenha) {
      setSenhaError("As senhas não correspondem");
      return;
    }

    if (senhas.novaSenha.length < 6) {
      setSenhaError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Use a função de serviço em vez do fetch
      await update("users/update-password", "", {
        oldPassword: senhas.senhaAtual,
        newPassword: senhas.novaSenha,
      });

      // Limpar campos após sucesso
      setSenhas({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });

      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua senha foi atualizada.",
      });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast({
        title: "Erro ao alterar senha",
        description:
          "Verifique se a senha atual está correta e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (canEditAvatar && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      return;
    }

    const file = e.target.files[0];

    // Verificar se o arquivo é uma imagem
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione uma imagem (JPEG, PNG, GIF).",
        variant: "destructive",
      });
      return;
    }

    // Verificar tamanho do arquivo (limite de 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const result = await uploadAvatar(file);

      if (result && result.avatar) {
        setUsuario({
          ...usuario,
          avatar: result.avatar,
        });

        // Atualizar o contexto global para que o header atualize
        updateAvatar(result.avatar);

        toast({
          title: "Avatar atualizado",
          description: "Sua foto de perfil foi atualizada com sucesso.",
        });
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar avatar",
        description:
          "Não foi possível fazer o upload da imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Limpar o input de arquivo para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Meu Perfil"
        description="Visualize e edite suas informações pessoais"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar
                    className="h-24 w-24 cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    {usuario.avatar ? (
                      <AvatarImage src={usuario.avatar} alt={usuario.nome} />
                    ) : null}
                    <AvatarFallback className="text-2xl">
                      {usuario.nome
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {canEditAvatar && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <span className="animate-spin">⟳</span>
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <CardTitle>{usuario.nome}</CardTitle>
              <CardDescription>{usuario.cargo}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Email
                </div>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{usuario.email}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Telefone
                </div>
                <div>{usuario.telefone || "Não informado"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Data de Cadastro
                </div>
                <div>{usuario.dataCadastro}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Último Acesso
                </div>
                <div>{usuario.ultimoAcesso}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="informacoes">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="informacoes">Informações</TabsTrigger>
              <TabsTrigger value="senha">Senha</TabsTrigger>
            </TabsList>

            <TabsContent value="informacoes" className="mt-4">
              <Card>
                <form onSubmit={handleSalvarPerfil}>
                  <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>
                      Atualize suas informações de perfil
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        placeholder="Seu nome"
                        value={usuario.nome}
                        onChange={(e) =>
                          setUsuario({ ...usuario, nome: e.target.value })
                        }
                        disabled={!canEdit || loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        value={usuario.email}
                        onChange={(e) =>
                          setUsuario({ ...usuario, email: e.target.value })
                        }
                        disabled={!canEdit || loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        placeholder="(00) 00000-0000"
                        value={usuario.telefone}
                        onChange={(e) =>
                          setUsuario({ ...usuario, telefone: e.target.value })
                        }
                        disabled={!canEdit || loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo</Label>
                      <Input
                        id="cargo"
                        value={
                          usuario.cargo === "admin"
                            ? "Administrador"
                            : usuario.cargo === "manager"
                            ? "Gerente"
                            : "Operador de Caixa"
                        }
                        disabled
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    {canEdit ? (
                      <Button
                        type="submit"
                        disabled={loading}
                        className="ml-auto"
                      >
                        {loading ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    ) : (
                      <Alert className="w-full">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Modo de visualização</AlertTitle>
                        <AlertDescription>
                          Operadores de caixa podem apenas visualizar suas
                          informações. Contate um administrador para alterações.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="senha" className="mt-4">
              <Card>
                <form onSubmit={handleAlterarSenha}>
                  <CardHeader>
                    <CardTitle>Alteração de Senha</CardTitle>
                    <CardDescription>
                      Altere sua senha regularmente para maior segurança
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {senhaError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{senhaError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="senha-atual">Senha Atual</Label>
                      <Input
                        id="senha-atual"
                        type="password"
                        value={senhas.senhaAtual}
                        onChange={(e) =>
                          setSenhas({
                            ...senhas,
                            senhaAtual: e.target.value,
                          })
                        }
                        disabled={!canEdit || loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nova-senha">Nova Senha</Label>
                      <Input
                        id="nova-senha"
                        type="password"
                        value={senhas.novaSenha}
                        onChange={(e) =>
                          setSenhas({
                            ...senhas,
                            novaSenha: e.target.value,
                          })
                        }
                        disabled={!canEdit || loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmar-senha">
                        Confirmar Nova Senha
                      </Label>
                      <Input
                        id="confirmar-senha"
                        type="password"
                        value={senhas.confirmarSenha}
                        onChange={(e) =>
                          setSenhas({
                            ...senhas,
                            confirmarSenha: e.target.value,
                          })
                        }
                        disabled={!canEdit || loading}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    {canEdit ? (
                      <Button
                        type="submit"
                        disabled={loading}
                        className="ml-auto"
                      >
                        {loading ? "Alterando..." : "Alterar Senha"}
                      </Button>
                    ) : (
                      <Alert className="w-full">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Modo de visualização</AlertTitle>
                        <AlertDescription>
                          Operadores de caixa não podem alterar a senha por este
                          painel. Contate um administrador para alterações.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  );
}
