import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Sale, ISale } from "../models/sale.js";
import { Product } from "../models/product.js";
import { Register } from "../models/register.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";
import { Consumer } from "../models/consumer.js";

export const createSale = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { products, paymentMethod, consumer } = req.body;

    const register = await Register.findOne({
      user: req.user._id,
      status: "open",
    });

    if (!register) {
      res.status(400);
      throw new Error("No open register found");
    }

    let total = 0;
    const saleProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error(`Product ${item.product} not found`);
      }

      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      product.stock -= item.quantity;
      await product.save();

      saleProducts.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
      });

      total += product.price * item.quantity;
    }

    const saleData: Partial<ISale> = {
      user: req.user._id,
      products: saleProducts,
      total,
      paymentMethod,
      register: register._id as mongoose.Types.ObjectId,
    };

    if (consumer) {
      const foundConsumer = await Consumer.findById(consumer);
      if (!foundConsumer) {
        res.status(404);
        throw new Error("Consumer not found");
      }
      saleData.consumer = consumer as mongoose.Types.ObjectId;
      foundConsumer.totalSales += 1;
      foundConsumer.lastSale = new Date();
      await foundConsumer.save();
    }

    const sale = await Sale.create(saleData);

    if (sale._id instanceof mongoose.Types.ObjectId) {
      register.sales.push(sale._id);
    } else if (typeof sale._id === "string") {
      register.sales.push(new mongoose.Types.ObjectId(sale._id));
    } else {
      console.error("Erro: sale._id não é um ObjectId válido", sale._id);
    }

    await register.save();

    res.status(201).json(sale);
  }
);

export const getSales = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sales = await Sale.find({})
      .populate("user", "name")
      .populate("products.product")
      .populate("register");
    res.json(sales);
  }
);

export const getSaleById = asyncHandler(async (req: Request, res: Response) => {
  const sale = await Sale.findById(req.params.id)
    .populate("user", "name")
    .populate("products.product")
    .populate("register");

  if (sale) {
    res.json(sale);
  } else {
    res.status(404);
    throw new Error("Sale not found");
  }
});

export const cancelSale = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      res.status(404);
      throw new Error("Sale not found");
    }

    if (sale.status === "cancelled") {
      res.status(400);
      throw new Error("Sale is already cancelled");
    }

    for (const item of sale.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    sale.status = "cancelled";
    const updatedSale = await sale.save();

    res.json(updatedSale);
  }
);
