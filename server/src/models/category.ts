import mongoose from "mongoose";

export interface ICategory extends mongoose.Document {
  name: string;
  description?: string;
}

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Category = mongoose.model<ICategory>("Category", categorySchema);
