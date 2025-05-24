import axios from "axios";

export interface CategoryUI {
  id: string;
  name: string;
  description?: string;
}

function getAuthHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const categoryService = {
  async getCategories(): Promise<CategoryUI[]> {
    const { data } = await axios.get("/api/categories", {
      headers: getAuthHeader(),
    });
    return data.map((cat: any) => ({
      id: cat._id,
      name: cat.name,
      description: cat.description,
    }));
  },
  async getCategoryById(id: string): Promise<CategoryUI> {
    const { data } = await axios.get(`/api/categories/${id}`, {
      headers: getAuthHeader(),
    });
    return { id: data._id, name: data.name, description: data.description };
  },
  async createCategory(category: Omit<CategoryUI, "id">): Promise<CategoryUI> {
    const { data } = await axios.post("/api/categories", category, {
      headers: getAuthHeader(),
    });
    return { id: data._id, name: data.name, description: data.description };
  },
  async updateCategory(
    id: string,
    category: Omit<CategoryUI, "id">
  ): Promise<CategoryUI> {
    const { data } = await axios.put(`/api/categories/${id}`, category, {
      headers: getAuthHeader(),
    });
    return { id: data._id, name: data.name, description: data.description };
  },
  async deleteCategory(id: string): Promise<void> {
    await axios.delete(`/api/categories/${id}`, { headers: getAuthHeader() });
  },
};
