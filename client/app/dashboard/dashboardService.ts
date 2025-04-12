import { getAuthToken } from "../../lib/auth";

export interface DashboardData {
  vendasHoje: {
    total: number;
    variacao: number;
  };
  produtosVendidos: {
    quantidade: number;
    variacao: number;
  };
  ticketMedio: {
    valor: number;
    variacao: number;
  };
  statusCaixa: {
    status: "open" | "closed";
    ultimoFechamento?: string;
  };
  vendasUltimos7Dias: Array<{
    data: string;
    total: number;
  }>;
  vendasRecentes: Array<{
    id: string;
    cliente: string;
    data: string;
    total: number;
    status: string;
  }>;
}

export interface VendasPorPeriodo {
  vendas: Array<{
    data: string;
    total: number;
  }>;
  totalPeriodo: number;
}

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Usuário não autenticado");
    }

    const response = await fetch("/api/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar dados do dashboard");
    }

    return response.json();
  },

  async getVendasPorPeriodo(
    startDate: string,
    endDate: string
  ): Promise<VendasPorPeriodo> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Usuário não autenticado");
    }

    const response = await fetch(
      `/api/dashboard/vendas?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar vendas por período");
    }

    return response.json();
  },
};
