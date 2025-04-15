import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Consumer } from "../models/consumer.js";
import { Sale } from "../models/sale.js";

export const createConsumer = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, phone, email, address } = req.body;

    const existingConsumer = await Consumer.findOne({ email });

    if (existingConsumer) {
      res.status(400);
      throw new Error("Consumer already exists");
    }

    const consumer = await Consumer.create({ name, phone, email, address });

    res.status(201).json(consumer);
  }
);

export const getConsumers = asyncHandler(
  async (req: Request, res: Response) => {
    const consumers = await Consumer.find();
    res.status(200).json(consumers);
  }
);

export const getConsumerById = asyncHandler(
  async (req: Request, res: Response) => {
    const consumer = await Consumer.findById(req.params.id);

    if (!consumer) {
      res.status(404);
      throw new Error("Consumer not found");
    }

    res.status(200).json(consumer);
  }
);

export const updateConsumer = asyncHandler(
  async (req: Request, res: Response) => {
    const consumer = await Consumer.findById(req.params.id);

    if (!consumer) {
      res.status(404);
      throw new Error("Consumer not found");
    }

    consumer.name = req.body.name || consumer.name;
    consumer.phone = req.body.phone || consumer.phone;
    consumer.email = req.body.email || consumer.email;
    consumer.address = req.body.address || consumer.address;
    consumer.status = req.body.status ?? consumer.status;

    const updatedConsumer = await consumer.save();
    res.status(200).json(updatedConsumer);
  }
);

export const deleteConsumer = asyncHandler(
  async (req: Request, res: Response) => {
    const consumer = await Consumer.findById(req.params.id);

    if (!consumer) {
      res.status(404);
      throw new Error("Consumer not found");
    }

    await consumer.deleteOne();
    res.status(200).json({ message: "Consumer deleted successfully" });
  }
);

export const getLastSaleByConsumer = asyncHandler(
  async (req: Request, res: Response) => {
    const { consumerId } = req.params;

    const lastSale = await Sale.findOne({ consumer: consumerId }).sort({
      createdAt: -1,
    });

    if (!lastSale) {
      res.status(404);
      throw new Error("No sales found for this consumer");
    }

    res.status(200).json({ lastSaleDate: lastSale.createdAt });
  }
);
