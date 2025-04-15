import axios, { AxiosError } from "axios";

// Configuração da URL da API dependendo do ambiente
let API_URL = "";
if (process.env.NODE_ENV === "production") {
  // Em produção, usamos a URL completa do servidor
  API_URL = "https://embala-fest-server.onrender.com/api";
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

async function getUserProfile(userId: string, headers: any = {}) {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`, {
      headers: getHeaders(headers),
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

async function create(resource: string, data: any, headers: any = {}) {
  try {
    const response = await axios.post(`${API_URL}/${resource}`, data, {
      headers: getHeaders(headers),
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

async function read(resource: string, headers: any = {}) {
  try {
    const response = await axios.get(`${API_URL}/${resource}`, {
      headers: getHeaders(headers),
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

async function update(
  resource: string,
  id: string,
  data: any,
  headers: any = {}
) {
  try {
    const response = await axios.put(`${API_URL}/${resource}/${id}`, data, {
      headers: getHeaders(headers),
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

async function remove(resource: string, id: string, headers: any = {}) {
  try {
    const response = await axios.delete(`${API_URL}/${resource}/${id}`, {
      headers: getHeaders(headers),
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

async function cancelSale(saleId: string, headers: any = {}) {
  try {
    const response = await axios.put(
      `${API_URL}/sales/${saleId}/cancel`,
      {},
      {
        headers: getHeaders(headers),
      }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

async function cancelSaleWithManager(
  saleId: string,
  managerCredentials: { email: string; password: string }
) {
  try {
    const authResponse = await axios.post(
      `${API_URL}/users/authenticate-manager`,
      managerCredentials,
      {
        headers: getHeaders(),
      }
    );

    const managerToken = authResponse.data.token;

    if (!managerToken) {
      throw new Error("Token do gerente não foi fornecido");
    }

    const response = await axios.put(
      `${API_URL}/sales/${saleId}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${managerToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    handleError(error);
  }
}

async function uploadAvatar(file: File) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Usuário não autenticado");
    }

    // Criar um FormData para enviar o arquivo
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await axios.post(`${API_URL}/users/me/avatar`, formData, {
      headers: {
        ...getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    handleError(error);
  }
}

async function getAutoCloseSettings() {
  try {
    const response = await axios.get(`${API_URL}/settings/auto-close`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
}

async function updateAutoCloseSettings(settings: {
  hours: number;
  minutes: number;
}) {
  try {
    const response = await axios.put(
      `${API_URL}/settings/auto-close`,
      settings,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
}

async function getStoreSettings() {
  try {
    const response = await axios.get(`${API_URL}/store-settings`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
}

async function updateStoreSettings(settings: {
  storeName?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingHours?: string;
  paymentMethods?: {
    cash?: boolean;
    credit?: boolean;
    debit?: boolean;
    pix?: boolean;
  };
}) {
  try {
    const response = await axios.put(`${API_URL}/store-settings`, settings, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
}

async function getAvailablePaymentMethods() {
  try {
    const response = await axios.get(
      `${API_URL}/store-settings/payment-methods`,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    handleError(error);
    return {
      cash: true,
      credit: true,
      debit: true,
      pix: true,
    };
  }
}

function handleError(error: any) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (
      axiosError.response &&
      axiosError.response.data &&
      typeof axiosError.response.data === "object" &&
      "message" in axiosError.response.data
    ) {
      const responseData = axiosError.response.data as { message: string };
      throw new Error(responseData.message);
    } else {
      throw new Error("Something went wrong");
    }
  } else {
    throw new Error("Unknown error");
  }
}

export {
  create,
  read,
  update,
  remove,
  getUserProfile,
  cancelSale,
  cancelSaleWithManager,
  uploadAvatar,
  getAutoCloseSettings,
  updateAutoCloseSettings,
  getStoreSettings,
  updateStoreSettings,
  getAvailablePaymentMethods,
};
