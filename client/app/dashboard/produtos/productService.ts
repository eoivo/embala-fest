import { create, read, update, remove } from "../../../services/service";

// Interface para o produto (correspondente ao backend)
export interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category: string;
  sku: string;
  minStock: number;
  supplier: string;
}

// Interface para mapeamento com o frontend
export interface ProductUI {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  codigo: string;
  fornecedor: string;
  descricao?: string;
  estoqueMinimo?: number;
  imagemUrl?: string;
}

// Converter do formato da API para o formato da UI
export const mapToUIProduct = (product: Product): ProductUI => {
  return {
    id: product._id || "",
    nome: product.name,
    descricao: product.description,
    categoria: product.category,
    preco: product.price,
    estoque: product.stock,
    codigo: product.sku,
    fornecedor: product.supplier,
    estoqueMinimo: product.minStock,
    imagemUrl: product.imageUrl,
  };
};

// Converter do formato da UI para o formato da API
export const mapToAPIProduct = (product: ProductUI): Product => {
  return {
    name: product.nome,
    description: product.descricao || "",
    price: product.preco,
    stock: product.estoque,
    category: product.categoria,
    sku: product.codigo,
    minStock: product.estoqueMinimo || 5,
    supplier: product.fornecedor,
    imageUrl: product.imagemUrl,
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

// Funções para interagir com a API de produtos
export const productService = {
  // Buscar todos os produtos
  async getProducts(): Promise<ProductUI[]> {
    const products = await read("products", getAuthHeaders());
    return products.map(mapToUIProduct);
  },

  // Buscar produto por ID
  async getProductById(id: string): Promise<ProductUI> {
    const product = await read(`products/${id}`, getAuthHeaders());
    return mapToUIProduct(product);
  },

  // Criar um novo produto
  async createProduct(product: ProductUI): Promise<ProductUI> {
    const apiProduct = mapToAPIProduct(product);
    const createdProduct = await create(
      "products",
      apiProduct,
      getAuthHeaders()
    );
    return mapToUIProduct(createdProduct);
  },

  // Atualizar um produto existente
  async updateProduct(id: string, product: ProductUI): Promise<ProductUI> {
    const apiProduct = mapToAPIProduct(product);
    const updatedProduct = await update(
      "products",
      id,
      apiProduct,
      getAuthHeaders()
    );
    return mapToUIProduct(updatedProduct);
  },

  // Excluir um produto
  async deleteProduct(id: string): Promise<void> {
    await remove("products", id, getAuthHeaders());
  },
};
