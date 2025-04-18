import { create, read, update, remove } from "../../../services/service";

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

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

export const productService = {
  async getProducts(): Promise<ProductUI[]> {
    const products = await read("products", getAuthHeaders());
    return products.map(mapToUIProduct);
  },

  async getProductById(id: string): Promise<ProductUI> {
    const product = await read(`products/${id}`, getAuthHeaders());
    return mapToUIProduct(product);
  },

  async createProduct(product: ProductUI): Promise<ProductUI> {
    const apiProduct = mapToAPIProduct(product);
    const createdProduct = await create(
      "products",
      apiProduct,
      getAuthHeaders()
    );
    return mapToUIProduct(createdProduct);
  },

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

  async deleteProduct(id: string): Promise<void> {
    await remove("products", id, getAuthHeaders());
  },
};
