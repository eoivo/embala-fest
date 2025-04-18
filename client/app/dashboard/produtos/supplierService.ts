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
  endereco?: string;
  cnpj: string;
  ativo: boolean;
}

export const mapToUISupplier = (supplier: Supplier): SupplierUI => {
  return {
    id: supplier._id || "",
    nome: supplier.name,
    nomeContato: supplier.contactName,
    email: supplier.email,
    telefone: supplier.phone,
    endereco: supplier.address,
    cnpj: supplier.cnpj,
    ativo: supplier.active,
  };
};

export const mapToAPISupplier = (supplier: SupplierUI): Supplier => {
  return {
    name: supplier.nome,
    contactName: supplier.nomeContato,
    email: supplier.email,
    phone: supplier.telefone,
    address: supplier.endereco,
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
