import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/festive-elements";
import {
  ArrowRight,
  Package,
  PartyPopper,
  ShieldCheck,
  ShoppingBag,
  Star,
} from "lucide-react";

export default function LandingPage() {
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
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-background to-accent/20">
        <Confetti count={40} />
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
            Sistema de Gestão para Lojas de Embalagens e Festas
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-muted-foreground">
            Gerencie seu caixa, estoque, vendas e clientes com facilidade e
            eficiência. Tudo em um só lugar!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Começar Agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Solicitar Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Recursos Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg shadow-sm border border-accent/20">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão de Vendas</h3>
              <p className="text-muted-foreground">
                Registre vendas rapidamente, aplique descontos e gerencie
                diferentes formas de pagamento.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-sm border border-secondary/20">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Controle de Estoque
              </h3>
              <p className="text-muted-foreground">
                Mantenha seu inventário atualizado, receba alertas de estoque
                baixo e gerencie fornecedores.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-sm border border-accent/20">
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <PartyPopper className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão de Clientes</h3>
              <p className="text-muted-foreground">
                Cadastre clientes, acompanhe histórico de compras e implemente
                programas de fidelidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-gradient-to-b from-accent/20 to-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            O Que Nossos Clientes Dizem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-muted">
              <div className="flex items-center mb-4">
                <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
              </div>
              <p className="text-muted-foreground mb-4">
                "Este sistema transformou a maneira como gerenciamos nossa loja
                de embalagens. O controle de estoque é preciso e a interface é
                muito intuitiva!"
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  MS
                </div>
                <div className="ml-3">
                  <p className="font-medium">Maria Silva</p>
                  <p className="text-sm text-muted-foreground">
                    Embalagens Express
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-muted">
              <div className="flex items-center mb-4">
                <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
              </div>
              <p className="text-muted-foreground mb-4">
                "Os relatórios detalhados me ajudam a tomar decisões melhores
                para o meu negócio. O suporte ao cliente é excelente e sempre
                responde rapidamente."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                  JR
                </div>
                <div className="ml-3">
                  <p className="font-medium">João Rodrigues</p>
                  <p className="text-sm text-muted-foreground">Festa & Cia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Pronto para transformar sua loja?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-muted-foreground">
            Junte-se a centenas de lojistas que já estão usando nosso sistema
            para aumentar vendas e melhorar a gestão do negócio.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Criar Conta Grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  E
                </div>
                <span className="ml-2 font-bold text-lg text-primary">
                  EmbalaFest
                </span>
              </div>
              <p className="text-muted-foreground">
                Sistema completo para gestão de lojas de embalagens e artigos
                para festas.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Gestão de Vendas</li>
                <li>Controle de Estoque</li>
                <li>Gestão de Clientes</li>
                <li>Relatórios</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Sobre Nós</li>
                <li>Contato</li>
                <li>Blog</li>
                <li>Carreiras</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Termos de Serviço</li>
                <li>Política de Privacidade</li>
                <li>Cookies</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2025 EmbalaFest. Todos os direitos reservados.
            </p>
            <div className="flex items-center mt-4 md:mt-0">
              <ShieldCheck className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm text-muted-foreground">
                Pagamentos seguros por Stripe
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
