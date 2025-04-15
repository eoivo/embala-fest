import mongoose from "mongoose";

export interface ISupplier extends mongoose.Document {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  cnpj: string;
  active: boolean;
}

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contactName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    cnpj: {
      type: String,
      required: true,
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Supplier = mongoose.model<ISupplier>("Supplier", supplierSchema);
