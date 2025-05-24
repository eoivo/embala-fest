import { create, read } from "../../../services/service";
import axios from "axios";

interface AxiosErrorResponse {
  response?: {
    status: number;
    data?: unknown;
  };
  message: string;
}

const silentRead = async (resource: string) => {
  try {
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
  } catch (error: unknown) {
    const axiosError = error as AxiosErrorResponse;
    if (axiosError.response && axiosError.response.status === 404) {
      return null;
    }
    throw error;
  }
};

export const registerService = {
  openRegister: async (initialBalance: number, managerCredentials?: { email: string; password: string }) => {
    return await create("register/open", { initialBalance, managerCredentials });
  },

  getCurrentRegister: async () => {
    try {
      const response = await silentRead("register/current");
      return response;
    } catch (error) {
      console.error("Erro ao obter caixa atual:", error);
      throw error;
    }
  },

  closeRegister: async (
    finalBalance: number,
    paymentMethods: Record<string, number>,
    managerCredentials?: { email: string; password: string }
  ) => {
    return await create("register/close", {
      finalBalance,
      paymentMethods,
      managerCredentials,
    });
  },

  authenticateManager: async (credentials: {
    email: string;
    password: string;
  }) => {
    return await create("users/authenticate-manager", credentials);
  },

  getRegisterHistory: async () => {
    return await read("register/history");
  },

  addCashWithdrawal: async (amount: number, reason: string) => {
    return await create("register/withdrawal", {
      amount,
      reason,
    });
  },

  getDashboard: async () => {
    return await read("register/dashboard");
  },

  getCurrentUser: async () => {
    return await read("users/me");
  },
};
