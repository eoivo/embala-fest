import mongoose from "mongoose";

export interface IProduct extends mongoose.Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category: string;
  sku: string;
  minStock: number;
  supplier: mongoose.Types.ObjectId;
}

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrl: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    minStock: {
      type: Number,
      required: true,
      default: 5,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model<IProduct>("Product", productSchema);
