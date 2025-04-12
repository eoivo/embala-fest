import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Product } from "../models/product.js";

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      description,
      price,
      stock,
      category,
      sku,
      minStock,
      supplier,
    } = req.body;

    const productExists = await Product.findOne({ sku });

    if (productExists) {
      res.status(400);
      throw new Error("Product with this SKU already exists");
    }

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      sku,
      minStock,
      supplier,
    });

    res.status(201).json(product);
  }
);

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({});
  res.json(products);
});

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  }
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price || product.price;
      product.stock = req.body.stock || product.stock;
      product.category = req.body.category || product.category;
      product.minStock = req.body.minStock || product.minStock;
      product.imageUrl = req.body.imageUrl || product.imageUrl;
      product.supplier = req.body.supplier || product.supplier;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  }
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id });
      res.json({ message: "Product removed" });
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  }
);
