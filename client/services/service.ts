import axios, { AxiosError } from "axios";

// Configuração da URL da API dependendo do ambiente
let API_URL = "";
if (process.env.NODE_ENV === "production") {
  // Em produção, usamos o proxy configurado no netlify.toml
  API_URL = "/api";
} else {
  // Em desenvolvimento, conectamos diretamente ao backend local
  API_URL = "http://localhost:3000/api";
}

// Configurar interceptores para debug
axios.interceptors.request.use(
  (config) => {
    // Não precisamos logar todas as requisições
    if (process.env.NODE_ENV !== "production") {
      console.log("Request:", {
        url: config.url,
        method: config.method,
      });
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    // Reduzir logging apenas para produção
    if (process.env.NODE_ENV !== "production") {
      console.log("Response:", {
        status: response.status,
        statusText: response.statusText,
      });
    }
    return response;
  },
  (error) => {
    // Não logar erros 404 para register/current
    if (
      error.config &&
      error.config.url &&
      error.config.url.includes("/register/current") &&
      error.response &&
      error.response.status === 404
    ) {
      // Silenciar este erro específico, mas ainda rejeitá-lo para tratamento
      return Promise.reject(error);
    }

    console.error("Response Error:", error);
    return Promise.reject(error);
  }
);

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
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

async function create(resource: string, data: any, headers: any = {}) {
  const MAX_RETRIES = 2;
  let retries = 0;

  async function attemptRequest() {
    try {
      console.log(
        `Enviando requisição para: ${API_URL}/${resource}${
          retries > 0 ? ` (tentativa ${retries + 1})` : ""
        }`
      );
      console.log("Dados:", data);

      // Não anexar token no login/registro
      const useAuth = resource !== "users/login" && resource !== "users";
      const reqHeaders = useAuth
        ? getHeaders(headers)
        : {
            "Content-Type": "application/json",
            ...headers,
          };

      console.log("Headers:", reqHeaders);

      const response = await axios.post(`${API_URL}/${resource}`, data, {
        headers: reqHeaders,
        withCredentials: true,
      });

      console.log("Resposta:", response.data);
      return response.data;
    } catch (error) {
      // Verificar se é um erro que deve tentar novamente
      // 502 Bad Gateway ou timeout são candidatos para retry
      const axiosError = error as AxiosError;
      const is502Error = axiosError.response?.status === 502;
      const isTimeoutError =
        axiosError.code === "ECONNABORTED" || !axiosError.response;

      if ((is502Error || isTimeoutError) && retries < MAX_RETRIES) {
        retries++;
        console.log(`Tentando novamente (${retries}/${MAX_RETRIES})...`);
        // Esperar um tempo antes de tentar novamente (500ms, 1s, etc.)
        const delay = retries * 1000; // Aumentar o tempo a cada tentativa
        await new Promise((resolve) => setTimeout(resolve, delay));
        return attemptRequest();
      }

      console.error("Erro na requisição:", error);
      handleError(error);
    }
  }

  return attemptRequest();
}

async function read(resource: string, headers: any = {}) {
  try {
    const response = await axios.get(`${API_URL}/${resource}`, {
      headers: getHeaders(headers),
      withCredentials: true,
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
      withCredentials: true,
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
      withCredentials: true,
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
        withCredentials: true,
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
        withCredentials: true,
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
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    handleError(error);
  }
}

async function uploadAvatar(file: File) {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await axios.post(`${API_URL}/users/avatar`, formData, {
      headers: {
        ...getHeaders(),
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
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
      withCredentials: true,
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
        withCredentials: true,
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
      withCredentials: true,
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
      withCredentials: true,
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
        withCredentials: true,
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
