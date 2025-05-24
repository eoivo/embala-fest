import { Request, Response } from "express";
import { Category } from "../models/category.js";

export const categoryController = {
  async getAll(req: Request, res: Response) {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }
    res.json(category);
  },

  async create(req: Request, res: Response) {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }
    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ error: "Categoria já existe" });
    }
    const category = await Category.create({ name, description });
    res.status(201).json(category);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    await category.save();
    res.json(category);
  },

  async remove(req: Request, res: Response) {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }
    res.json({ success: true });
  },
};
