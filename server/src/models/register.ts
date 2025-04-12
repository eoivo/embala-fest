import mongoose from "mongoose";

export interface IRegister extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  initialBalance: number;
  finalBalance?: number;
  status: "open" | "closed";
  closedAt?: Date;
  closedBy?: mongoose.Types.ObjectId;
  closingNotes?: string;
  sales: mongoose.Types.ObjectId[];
  cashWithdrawals: {
    amount: number;
    reason: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const registerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    initialBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    finalBalance: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["open", "closed"],
      default: "open",
    },
    closedAt: {
      type: Date,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    closingNotes: {
      type: String,
      default: "",
    },
    sales: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sale",
      },
    ],
    cashWithdrawals: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        reason: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Register = mongoose.model<IRegister>("Register", registerSchema);
