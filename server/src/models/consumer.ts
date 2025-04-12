import { Schema, model, Document } from "mongoose";

export interface IAddress {
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface IConsumer extends Document {
  name: string;
  phone: string;
  email: string;
  address: IAddress;
  totalSales: number;
  lastSale: Date;
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  number: { type: String, required: true },
  neighborhood: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
});

const ConsumerSchema = new Schema<IConsumer>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: AddressSchema, required: true },
    totalSales: { type: Number, default: 0 },
    lastSale: { type: Date, default: null },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Consumer = model<IConsumer>("Consumer", ConsumerSchema);
