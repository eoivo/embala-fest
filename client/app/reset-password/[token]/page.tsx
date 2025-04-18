"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Lock, XCircle } from "lucide-react";
import axios from "axios";

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Validar o token ao carregar a página
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/password-reset/validate/${token}`
        );
        setTokenValid(true);
      } catch (error) {
        console.error("Token inválido ou expirado:", error);
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setValidating(false);
      setTokenValid(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica no frontend
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Chamar a API para redefinir a senha
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/password-reset/reset`,
        { token, password }
      );

      toast({
        title: "Senha redefinida",
        description: "Sua senha foi alterada com sucesso.",
      });
      setPasswordChanged(true);
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao redefinir senha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-accent/20">
      <Link
        href="/login"
        className="absolute top-4 left-4 flex items-center text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para o login
      </Link>

      <div className="flex items-center mb-8">
        <Image
          src="/logos/logo-full.png"
          width={150}
          height={64}
          alt="EmbalaFest Logo"
          className="h-16"
        />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Redefinir Senha
          </CardTitle>
          <CardDescription className="text-center">
            {validating 
              ? "Validando seu token..." 
              : tokenValid 
                ? passwordChanged 
                  ? "Sua senha foi redefinida com sucesso"
                  : "Crie uma nova senha para sua conta" 
                : "Link inválido ou expirado"}
          </CardDescription>
        </CardHeader>

        {validating ? (
          <CardContent className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        ) : !tokenValid ? (
          <CardContent className="space-y-4 text-center py-6">
            <div className="rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-medium">Link inválido ou expirado</h3>
            <p className="text-muted-foreground">
              O link de redefinição de senha é inválido ou expirou. Por favor, solicite um novo link.
            </p>
            <Button asChild className="mt-4">
              <Link href="/forgot-password">
                Solicitar novo link
              </Link>
            </Button>
          </CardContent>
        ) : passwordChanged ? (
          <CardContent className="space-y-4 text-center py-6">
            <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium">Senha redefinida com sucesso</h3>
            <p className="text-muted-foreground">
              Sua senha foi alterada. Agora você pode fazer login com sua nova senha.
            </p>
            <Button asChild className="mt-4">
              <Link href="/login">
                Ir para o login
              </Link>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua nova senha"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme sua nova senha"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
} 