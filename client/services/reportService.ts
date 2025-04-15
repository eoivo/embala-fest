import axios from "axios";

// Configuração da URL da API dependendo do ambiente
let API_URL = "";
if (process.env.NODE_ENV === "production") {
  // Em produção, usamos o proxy configurado no next.config.mjs
  API_URL = "/api";
} else {
  // Em desenvolvimento, conectamos diretamente ao backend local
  API_URL = "http://localhost:3000/api";
}

function getAuthToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function getHeaders(headers: any = {}) {
  const token = getAuthToken();
  return {
    ...headers,
    Authorization: token ? `Bearer ${token}` : "",
  };
}

export interface DailyReportData {
  date: string;
  totalFaturado: number;
  numeroVendas: number;
  ticketMedio: number;
  cancelamentos: number;
  vendasPorFormaPagamento: {
    valores: {
      cash: number;
      credit: number;
      debit: number;
      pix: number;
    };
    percentuais: {
      cash: number;
      credit: number;
      debit: number;
      pix: number;
    };
  };
  produtosMaisVendidos: Array<{
    id: string;
    nome: string;
    quantidade: number;
    valor: number;
    percentual: number;
  }>;
}

export interface WeeklyReportData {
  periodo: {
    inicio: string;
    fim: string;
  };
  vendasPorDia: Array<{
    data: string;
    total: number;
    quantidade: number;
  }>;
  totais: {
    totalVendas: number;
    qtdVendas: number;
    ticketMedio: number;
  };
  historicoSemanas: Array<{
    periodo: string;
    totalVendas: number;
    qtdVendas: number;
    ticketMedio: number;
  }>;
}

export interface MonthlyReportData {
  periodo: {
    mes: string;
    ano: number;
  };
  totais: {
    totalVendas: number;
    qtdVendas: number;
    ticketMedio: number;
  };
  historicoMeses: Array<{
    periodo: string;
    totalVendas: number;
    qtdVendas: number;
    ticketMedio: number;
  }>;
}

export interface ProductsReportData {
  periodo: {
    inicio: string;
    fim: string;
  };
  totalVendas: number;
  produtos: Array<{
    id: string;
    nome: string;
    categoria: string;
    quantidade: number;
    valor: number;
    percentualFaturamento: number;
  }>;
}

export const reportService = {
  async getDailyReport(date?: string): Promise<DailyReportData> {
    try {
      const params = date ? `?date=${date}` : "";
      const response = await axios.get(`${API_URL}/reports/daily${params}`, {
        headers: getHeaders(),
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("Erro ao buscar relatório diário:", error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.error || "Erro ao buscar relatório diário"
        );
      }
      throw new Error("Erro ao buscar relatório diário");
    }
  },

  async getWeeklyReport(startDate?: string): Promise<WeeklyReportData> {
    try {
      const params = startDate ? `?startDate=${startDate}` : "";
      const response = await axios.get(`${API_URL}/reports/weekly${params}`, {
        headers: getHeaders(),
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("Erro ao buscar relatório semanal:", error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.error || "Erro ao buscar relatório semanal"
        );
      }
      throw new Error("Erro ao buscar relatório semanal");
    }
  },

  async getMonthlyReport(
    month?: number,
    year?: number
  ): Promise<MonthlyReportData> {
    try {
      let params = "";
      if (month !== undefined && year !== undefined) {
        params = `?month=${month}&year=${year}`;
      } else if (month !== undefined) {
        params = `?month=${month}`;
      } else if (year !== undefined) {
        params = `?year=${year}`;
      }

      const response = await axios.get(`${API_URL}/reports/monthly${params}`, {
        headers: getHeaders(),
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("Erro ao buscar relatório mensal:", error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.error || "Erro ao buscar relatório mensal"
        );
      }
      throw new Error("Erro ao buscar relatório mensal");
    }
  },

  async getProductsReport(
    startDate?: string,
    endDate?: string
  ): Promise<ProductsReportData> {
    try {
      let params = "";
      if (startDate && endDate) {
        params = `?startDate=${startDate}&endDate=${endDate}`;
      } else if (startDate) {
        params = `?startDate=${startDate}`;
      } else if (endDate) {
        params = `?endDate=${endDate}`;
      }

      const response = await axios.get(`${API_URL}/reports/products${params}`, {
        headers: getHeaders(),
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("Erro ao buscar relatório de produtos:", error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.error || "Erro ao buscar relatório de produtos"
        );
      }
      throw new Error("Erro ao buscar relatório de produtos");
    }
  },
};

export const exportDailyReportToExcel = async (date?: string) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(
      `${API_URL}/reports/daily/export/excel${date ? `?date=${date}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
        withCredentials: true,
      }
    );

    // Criar link para download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `relatorio_diario_${date || new Date().toISOString().split("T")[0]}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao exportar relatório para Excel:", error);
    throw error;
  }
};

export const exportDailyReportToPDF = async (date?: string) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(
      `${API_URL}/reports/daily/export/pdf${date ? `?date=${date}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );

    // Criar link para download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `relatorio_diario_${date || new Date().toISOString().split("T")[0]}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao exportar relatório para PDF:", error);
    throw error;
  }
};

export const exportWeeklyReportToExcel = async (startDate?: string) => {
  try {
    const token = getAuthToken();

    // Extrair apenas a primeira data em caso de período
    let dateParam = startDate;
    if (startDate && startDate.includes(" - ")) {
      dateParam = startDate.split(" - ")[0]; // Pega apenas a primeira data
    }

    const response = await axios.get(
      `${API_URL}/reports/weekly/export/excel${
        dateParam ? `?startDate=${dateParam}` : ""
      }`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
        withCredentials: true,
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `relatorio_semanal_${
        dateParam || new Date().toISOString().split("T")[0]
      }.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao exportar relatório semanal para Excel:", error);
    throw error;
  }
};

export const exportWeeklyReportToPDF = async (startDate?: string) => {
  try {
    const token = getAuthToken();

    // Extrair apenas a primeira data em caso de período
    let dateParam = startDate;
    if (startDate && startDate.includes(" - ")) {
      dateParam = startDate.split(" - ")[0]; // Pega apenas a primeira data
    }

    const response = await axios.get(
      `${API_URL}/reports/weekly/export/pdf${
        dateParam ? `?startDate=${dateParam}` : ""
      }`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `relatorio_semanal_${
        dateParam || new Date().toISOString().split("T")[0]
      }.pdf`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao exportar relatório semanal para PDF:", error);
    throw error;
  }
};

export const exportMonthlyReportToExcel = async (
  month?: number,
  year?: number
) => {
  try {
    const token = getAuthToken();
    let params = "";
    if (month !== undefined && year !== undefined) {
      params = `?month=${month}&year=${year}`;
    } else if (month !== undefined) {
      params = `?month=${month}`;
    } else if (year !== undefined) {
      params = `?year=${year}`;
    }

    const response = await axios.get(
      `${API_URL}/reports/monthly/export/excel${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
        withCredentials: true,
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `relatorio_mensal_${month || new Date().getMonth() + 1}_${
        year || new Date().getFullYear()
      }.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao exportar relatório mensal para Excel:", error);
    throw error;
  }
};

export const exportMonthlyReportToPDF = async (
  month?: number,
  year?: number
) => {
  try {
    const token = getAuthToken();
    let params = "";
    if (month !== undefined && year !== undefined) {
      params = `?month=${month}&year=${year}`;
    } else if (month !== undefined) {
      params = `?month=${month}`;
    } else if (year !== undefined) {
      params = `?year=${year}`;
    }

    const response = await axios.get(
      `${API_URL}/reports/monthly/export/pdf${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
        withCredentials: true,
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `relatorio_mensal_${month || new Date().getMonth() + 1}_${
        year || new Date().getFullYear()
      }.pdf`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao exportar relatório mensal para PDF:", error);
    throw error;
  }
};

export const exportProductsReportToExcel = async (
  startDate?: string,
  endDate?: string
) => {
  try {
    const token = getAuthToken();
    let params = "";
    if (startDate && endDate) {
      params = `?startDate=${startDate}&endDate=${endDate}`;
    } else if (startDate) {
      params = `?startDate=${startDate}`;
    } else if (endDate) {
      params = `?endDate=${endDate}`;
    }

    const response = await axios.get(
      `${API_URL}/reports/products/export/excel${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
        withCredentials: true,
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `relatorio_produtos_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao exportar relatório de produtos para Excel:", error);
    throw error;
  }
};

export const exportProductsReportToPDF = async (
  startDate?: string,
  endDate?: string
) => {
  try {
    const token = getAuthToken();
    let params = "";
    if (startDate && endDate) {
      params = `?startDate=${startDate}&endDate=${endDate}`;
    } else if (startDate) {
      params = `?startDate=${startDate}`;
    } else if (endDate) {
      params = `?endDate=${endDate}`;
    }

    const response = await axios.get(
      `${API_URL}/reports/products/export/pdf${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `relatorio_produtos_${new Date().toISOString().split("T")[0]}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao exportar relatório de produtos para PDF:", error);
    throw error;
  }
};
