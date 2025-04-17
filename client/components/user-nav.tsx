"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { read } from "@/services/service";
import { useToast } from "@/hooks/use-toast";
import { useUserContext } from "@/hooks/use-user-context";

export function UserNav() {
  const [usuario, setUsuario] = useState({ nome: "", email: "", avatar: "" });
  const router = useRouter();
  const { toast } = useToast();
  const { userAvatar } = useUserContext();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await read(`users/me`);
        setUsuario({
          nome: userData.name,
          email: userData.email,
          avatar: userData.avatar || "",
        });
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };

    fetchUserData();
  }, []);

  // Atualizar o avatar quando userAvatar mudar no contexto
  useEffect(() => {
    if (userAvatar) {
      setUsuario((prev) => ({
        ...prev,
        avatar: userAvatar,
      }));
    }
  }, [userAvatar]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    toast({
      title: "Logout bem-sucedido",
      description: "Você saiu da sua conta com sucesso. Até a próxima!",
    });
    router.push("/");
  };

  // Função para obter as iniciais do nome e sobrenome
  const getInitials = (nome: string) => {
    if (!nome) return "";
    const [firstName, lastName] = nome.split(" ");
    if (lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    }
    return firstName.charAt(0);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {usuario.avatar ? (
              <AvatarImage src={usuario.avatar} alt={usuario.nome} />
            ) : (
              <AvatarImage src="/placeholder-user.jpg" alt={usuario.nome} />
            )}
            <AvatarFallback>{getInitials(usuario.nome)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{usuario.nome}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {usuario.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard/perfil">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/configuracoes">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
