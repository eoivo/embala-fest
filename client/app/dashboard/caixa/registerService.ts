import { create, read } from "../../../services/service";

export const registerService = {
  // Abrir caixa
  openRegister: async (initialBalance: number) => {
    try {
      const response = await create("api/register/open", { initialBalance });
      return response;
    } catch (error) {
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
      const response = await create("api/register/close", {
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
      const response = await create(
        "api/users/authenticate-manager",
        credentials
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Obter caixa atual
  getCurrentRegister: async () => {
    try {
      const response = await read("api/register/current");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Obter histórico de caixas
  getRegisterHistory: async () => {
    try {
      const response = await read("api/register/history");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Adicionar retirada de caixa
  addCashWithdrawal: async (amount: number, reason: string) => {
    try {
      const response = await create("api/register/withdrawal", {
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
      const response = await read("api/register/dashboard");
      return response;
    } catch (error) {
      throw error;
    }
  },
};
