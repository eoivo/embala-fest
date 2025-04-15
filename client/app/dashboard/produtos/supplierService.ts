import { create, read, update, remove } from "../../../services/service";

// Interface para o fornecedor (correspondente ao backend)
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

// Interface para mapeamento com o frontend
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

// Converter do formato da API para o formato da UI
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

// Converter do formato da UI para o formato da API
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

// Obter o token do localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

// Funções para interagir com a API de fornecedores
export const supplierService = {
  // Buscar todos os fornecedores
  async getSuppliers(): Promise<SupplierUI[]> {
    const suppliers = await read("suppliers", getAuthHeaders());
    return suppliers.map(mapToUISupplier);
  },

  // Buscar fornecedor por ID
  async getSupplierById(id: string): Promise<SupplierUI> {
    const supplier = await read(`suppliers/${id}`, getAuthHeaders());
    return mapToUISupplier(supplier);
  },

  // Criar um novo fornecedor
  async createSupplier(supplier: SupplierUI): Promise<SupplierUI> {
    const apiSupplier = mapToAPISupplier(supplier);
    const createdSupplier = await create(
      "suppliers",
      apiSupplier,
      getAuthHeaders()
    );
    return mapToUISupplier(createdSupplier);
  },

  // Atualizar um fornecedor existente
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

  // Excluir um fornecedor
  async deleteSupplier(id: string): Promise<void> {
    await remove("suppliers", id, getAuthHeaders());
  },
};
