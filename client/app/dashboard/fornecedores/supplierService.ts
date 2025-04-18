import { create, read, update, remove } from "../../../services/service";

export interface Supplier {
  _id?: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  cnpj: string;
  active: boolean;
}

export interface SupplierUI {
  id: string;
  nome: string;
  nomeContato: string;
  email: string;
  telefone: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  cnpj: string;
  ativo: boolean;
}

export const mapToUISupplier = (supplier: Supplier): SupplierUI => {
  const endereco = {
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  };

  if (supplier.address && typeof supplier.address === "string") {
    try {
      const addressParts = supplier.address.split(" - ");

      if (addressParts.length >= 1) {
        const firstPart = addressParts[0].split(",");
        if (firstPart.length >= 1) endereco.rua = firstPart[0].trim();
        if (firstPart.length >= 2) endereco.numero = firstPart[1].trim();
        if (firstPart.length >= 3) endereco.bairro = firstPart[2].trim();
      }

      if (addressParts.length >= 2) {
        const locationPart = addressParts[1].split("/");
        if (locationPart.length >= 1) endereco.cidade = locationPart[0].trim();
        if (locationPart.length >= 2) endereco.estado = locationPart[1].trim();
      }

      if (addressParts.length >= 3) {
        endereco.cep = addressParts[2].trim();
      }
    } catch (error) {
      console.error("Erro ao processar o endereço:", error);
    }
  }

  return {
    id: supplier._id || "",
    nome: supplier.name,
    nomeContato: supplier.contactName,
    email: supplier.email,
    telefone: supplier.phone,
    endereco,
    cnpj: supplier.cnpj,
    ativo: supplier.active,
  };
};

export const mapToAPISupplier = (supplier: SupplierUI): Supplier => {
  const formattedAddress = supplier.endereco
    ? `${supplier.endereco.rua}, ${supplier.endereco.numero}${
        supplier.endereco.bairro ? ", " + supplier.endereco.bairro : ""
      } - ${supplier.endereco.cidade}/${supplier.endereco.estado} - ${
        supplier.endereco.cep
      }`
    : "";

  return {
    name: supplier.nome,
    contactName: supplier.nomeContato,
    email: supplier.email,
    phone: supplier.telefone,
    address: formattedAddress,
    cnpj: supplier.cnpj,
    active: supplier.ativo,
  };
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

export const supplierService = {
  async getSuppliers(): Promise<SupplierUI[]> {
    const suppliers = await read("suppliers", getAuthHeaders());
    return suppliers.map(mapToUISupplier);
  },

  async getSupplierById(id: string): Promise<SupplierUI> {
    const supplier = await read(`suppliers/${id}`, getAuthHeaders());
    return mapToUISupplier(supplier);
  },

  async createSupplier(supplier: SupplierUI): Promise<SupplierUI> {
    const apiSupplier = mapToAPISupplier(supplier);
    const createdSupplier = await create(
      "suppliers",
      apiSupplier,
      getAuthHeaders()
    );
    return mapToUISupplier(createdSupplier);
  },

  async updateSupplier(id: string, supplier: SupplierUI): Promise<SupplierUI> {
    const apiSupplier = mapToAPISupplier(supplier);
    const updatedSupplier = await update(
      "suppliers",
      id,
      apiSupplier,
      getAuthHeaders()
    );
    return mapToUISupplier(updatedSupplier);
  },

  async deleteSupplier(id: string): Promise<void> {
    await remove("suppliers", id, getAuthHeaders());
  },
};
