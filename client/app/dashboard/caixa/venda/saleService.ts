import { toast } from "@/hooks/use-toast";

export interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

export interface SaleItem {
  product: string;
  quantity: number;
  price: number;
}

export interface Sale {
  products: SaleItem[];
  total: number;
  paymentMethod: "cash" | "credit" | "debit" | "pix";
  consumer?: string;
}

export interface PaymentMethods {
  cash: boolean;
  credit: boolean;
  debit: boolean;
  pix: boolean;
}

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const saleService = {
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch("/api/products", {
        headers: getHeaders(),
      });
      if (!response.ok) {
        throw new Error("Erro ao buscar produtos");
      }
      return await response.json();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar produtos",
        variant: "destructive",
      });
      return [];
    }
  },

  async createSale(sale: Sale): Promise<any> {
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(sale),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar venda");
      }

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar venda",
        variant: "destructive",
      });
      throw error;
    }
  },

  async getConsumers(): Promise<any[]> {
    try {
      const response = await fetch("/api/consumers", {
        headers: getHeaders(),
      });
      if (!response.ok) {
        throw new Error("Erro ao buscar clientes");
      }
      return await response.json();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar clientes",
        variant: "destructive",
      });
      return [];
    }
  },

  async getAvailablePaymentMethods(): Promise<PaymentMethods> {
    try {
      const response = await fetch("/api/store-settings/payment-methods", {
        headers: getHeaders(),
      });
      if (!response.ok) {
        throw new Error("Erro ao buscar métodos de pagamento");
      }
      return await response.json();
    } catch (error: any) {
      console.error("Erro ao buscar métodos de pagamento:", error);
      // Retornar todos os métodos como disponíveis em caso de erro
      return {
        cash: true,
        credit: true,
        debit: true,
        pix: true,
      };
    }
  },
};
