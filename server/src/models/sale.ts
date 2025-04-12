import mongoose from "mongoose";

export interface ISale extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  products: {
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
  }[];
  total: number;
  paymentMethod: "cash" | "credit" | "debit" | "pix";
  status: "completed" | "cancelled";
  register: mongoose.Types.ObjectId;
  consumer?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const saleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "credit", "debit", "pix"],
    },
    status: {
      type: String,
      required: true,
      enum: ["completed", "cancelled"],
      default: "completed",
    },
    register: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Register",
    },
    consumer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consumer",
    },
  },
  {
    timestamps: true,
  }
);

export const Sale = mongoose.model<ISale>("Sale", saleSchema);
