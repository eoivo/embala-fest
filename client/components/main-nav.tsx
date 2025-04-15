"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
} from "lucide-react";

export function MainNav() {
  const pathname = usePathname();

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

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
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
}
