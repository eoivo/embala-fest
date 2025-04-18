"use client";

import type React from "react";

import { useState } from "react";
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
import { ArrowLeft, Mail } from "lucide-react";
import axios from "axios";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Chamar a API real de recuperação de senha
      const response = await axios.post(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/api/password-reset/request`,
        { email }
      );

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setSubmitted(true);
    } catch (error: any) {
      console.error("Erro ao solicitar recuperação de senha:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message ||
          "Erro ao enviar email de recuperação.",
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
            Recuperar Senha
          </CardTitle>
          <CardDescription className="text-center">
            Digite seu email para receber um link de recuperação de senha
          </CardDescription>
        </CardHeader>

        {submitted ? (
          <CardContent className="space-y-4 text-center py-6">
            <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium">Verifique seu email</h3>
            <p className="text-muted-foreground">
              Enviamos um link de recuperação de senha para{" "}
              <strong>{email}</strong>. Verifique sua caixa de entrada e siga as
              instruções.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Não recebeu o email? Verifique sua pasta de spam ou{" "}
              <button
                className="text-primary hover:underline"
                onClick={() => setSubmitted(false)}
              >
                tente novamente
              </button>
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Lembrou sua senha?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
