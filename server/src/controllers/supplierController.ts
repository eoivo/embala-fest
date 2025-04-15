import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Supplier } from "../models/supplier.js";

export const createSupplier = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, contactName, email, phone, address, cnpj, active } = req.body;

    const supplierExists = await Supplier.findOne({ cnpj });

    if (supplierExists) {
      res.status(400);
      throw new Error("Fornecedor com este CNPJ já existe");
    }

    const supplier = await Supplier.create({
      name,
      contactName,
      email,
      phone,
      address,
      cnpj,
      active: active !== undefined ? active : true,
    });

    res.status(201).json(supplier);
  }
);

export const getSuppliers = asyncHandler(
  async (req: Request, res: Response) => {
    const suppliers = await Supplier.find({});
    res.json(suppliers);
  }
);

export const getSupplierById = asyncHandler(
  async (req: Request, res: Response) => {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
      res.json(supplier);
    } else {
      res.status(404);
      throw new Error("Fornecedor não encontrado");
    }
  }
);

export const updateSupplier = asyncHandler(
  async (req: Request, res: Response) => {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
      supplier.name = req.body.name || supplier.name;
      supplier.contactName = req.body.contactName || supplier.contactName;
      supplier.email = req.body.email || supplier.email;
      supplier.phone = req.body.phone || supplier.phone;
      supplier.address = req.body.address || supplier.address;
      supplier.cnpj = req.body.cnpj || supplier.cnpj;
      supplier.active =
        req.body.active !== undefined ? req.body.active : supplier.active;

      const updatedSupplier = await supplier.save();
      res.json(updatedSupplier);
    } else {
      res.status(404);
      throw new Error("Fornecedor não encontrado");
    }
  }
);

export const deleteSupplier = asyncHandler(
  async (req: Request, res: Response) => {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
      await Supplier.deleteOne({ _id: supplier._id });
      res.json({ message: "Fornecedor removido" });
    } else {
      res.status(404);
      throw new Error("Fornecedor não encontrado");
    }
  }
);
