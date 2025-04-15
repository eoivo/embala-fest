"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, ShoppingBag, Menu, X, User } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl animate-float">
              E
            </div>
            <span className="ml-2 font-bold text-xl text-primary">
              EmbalaFest
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="gap-2">
                <User className="h-4 w-4" />
                Entrar
              </Button>
            </Link>
            <button
              onClick={toggleMobileMenu}
              className="md:hidden focus:outline-none"
              aria-label="Menu de navegação"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-primary" />
              ) : (
                <Menu className="h-6 w-6 text-primary" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-16 px-4 bg-gradient-to-b from-background to-accent/20 flex-1 flex items-center">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-primary">
            Sistema de Gestão EmbalaFest
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-muted-foreground">
            Acesse todas as funcionalidades do sistema para gerenciar vendas,
            estoque e clientes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Acessar Sistema
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Simplified */}
      <section className="py-12 px-4 bg-card">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background p-5 rounded-lg shadow-sm border border-accent/20">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gestão de Vendas</h3>
              <p className="text-sm text-muted-foreground">
                Registre vendas, aplique descontos e gerencie diferentes formas
                de pagamento.
              </p>
            </div>
            <div className="bg-background p-5 rounded-lg shadow-sm border border-secondary/20">
              <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                <Package className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Controle de Estoque
              </h3>
              <p className="text-sm text-muted-foreground">
                Mantenha seu inventário atualizado e receba alertas de estoque
                baixo.
              </p>
            </div>
            <div className="bg-background p-5 rounded-lg shadow-sm border border-accent/20">
              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center mb-3">
                <User className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gestão de Clientes</h3>
              <p className="text-sm text-muted-foreground">
                Cadastre clientes e acompanhe histórico de compras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Simplified */}
      <footer className="bg-card border-t py-6 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                E
              </div>
              <span className="ml-2 font-bold text-lg text-primary">
                EmbalaFest
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 EmbalaFest. Sistema Interno de Gestão.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
