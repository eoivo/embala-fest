"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ClipboardList,
  Home,
  Package,
  ShoppingCart,
  Users,
  ShieldAlert,
  Building,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MainNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/caixa",
      label: "Caixa",
      icon: ShoppingCart,
      active: pathname.includes("/dashboard/caixa"),
    },
    {
      href: "/dashboard/produtos",
      label: "Produtos",
      icon: Package,
      active: pathname.includes("/dashboard/produtos"),
    },
    {
      href: "/dashboard/fornecedores",
      label: "Fornecedores",
      icon: Building,
      active: pathname.includes("/dashboard/fornecedores"),
    },
    {
      href: "/dashboard/relatorios",
      label: "Relatórios",
      icon: BarChart3,
      active: pathname.includes("/dashboard/relatorios"),
    },
    {
      href: "/dashboard/clientes",
      label: "Clientes",
      icon: Users,
      active: pathname.includes("/dashboard/clientes"),
    },
    {
      href: "/dashboard/pedidos",
      label: "Pedidos",
      icon: ClipboardList,
      active: pathname.includes("/dashboard/pedidos"),
    },
    {
      href: "/dashboard/admin/usuarios",
      label: "Admin",
      icon: ShieldAlert,
      active: pathname.includes("/dashboard/admin"),
      adminOnly: true,
    },
  ];

  const DesktopNav = () => (
    <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
      {routes.map((route) => {
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-primary",
              route.active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {route.label}
          </Link>
        );
      })}
    </nav>
  );

  const MobileNav = () => (
    <div className="md:hidden">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <SheetHeader>
            <SheetTitle>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  E
                </div>
                <span className="ml-2 font-bold text-lg text-primary">
                  EmbalaFest
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 mt-8">
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent",
                    route.active
                      ? "bg-accent text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {route.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <>
      <DesktopNav />
      <MobileNav />
    </>
  );
}
