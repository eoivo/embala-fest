import { create, read } from "../../../services/service";
import axios from "axios";

// Função auxiliar para obter caixa atual sem exibir erros no console
const silentRead = async (resource: string) => {
  try {
    // Fazendo a requisição diretamente, sem usar o serviço read que loga erros
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "/api"
        : "http://localhost:3000/api";

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
    };

    const response = await axios.get(`${API_URL}/${resource}`, {
      headers,
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    // Silencia erros 404 (caixa não encontrado)
    if (error.response && error.response.status === 404) {
      return null;
    }
    // Repassa outros erros
    throw error;
  }
};

export const registerService = {
  // Abrir caixa
  openRegister: async (initialBalance: number) => {
    try {
      const response = await create("register/open", { initialBalance });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Obter caixa atual - versão silenciosa que não loga erro 404
  getCurrentRegister: async () => {
    try {
      // Usando nossa função auxiliar silenciosa
      const response = await silentRead("register/current");
      return response;
    } catch (error) {
      // Apenas logs para erros que não sejam 404
      console.error("Erro ao obter caixa atual:", error);
      throw error;
    }
  },

  // Fechar caixa
  closeRegister: async (
    finalBalance: number,
    paymentMethods: Record<string, number>,
    managerCredentials?: { email: string; password: string }
  ) => {
    try {
      const response = await create("register/close", {
        finalBalance,
        paymentMethods,
        managerCredentials, // Adicionamos as credenciais do gerente
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Autenticar gerente
  authenticateManager: async (credentials: {
    email: string;
    password: string;
  }) => {
    try {
      const response = await create("users/authenticate-manager", credentials);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Obter histórico de caixas
  getRegisterHistory: async () => {
    try {
      const response = await read("register/history");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Adicionar retirada de caixa
  addCashWithdrawal: async (amount: number, reason: string) => {
    try {
      const response = await create("register/withdrawal", {
        amount,
        reason,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Obter dados do dashboard
  getDashboard: async () => {
    try {
      const response = await read("register/dashboard");
      return response;
    } catch (error) {
      throw error;
    }
  },
};
