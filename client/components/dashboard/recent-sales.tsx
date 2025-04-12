"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardData } from "@/app/dashboard/dashboardService";
import { Badge } from "@/components/ui/badge";

interface RecentSalesProps {
  data: DashboardData["vendasRecentes"];
}

export function RecentSales({ data }: RecentSalesProps) {
  return (
    <div className="space-y-8">
      {data.map((venda) => (
        <div
          key={venda.id}
          className={`flex items-center p-2 rounded-md ${
            venda.status === "cancelled"
              ? "border border-red-500 bg-red-50"
              : ""
          }`}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {venda.cliente
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <div className="text-sm font-medium leading-none flex items-center">
              <span>{venda.cliente}</span>
              {venda.status === "cancelled" && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Cancelado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(venda.data).toLocaleString("pt-BR")}
            </p>
          </div>
          <div
            className={`ml-auto font-medium ${
              venda.status === "cancelled" ? "text-red-500 line-through" : ""
            }`}
          >
            R$ {venda.total.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
