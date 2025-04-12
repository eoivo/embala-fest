import mongoose from "mongoose";

export interface IStoreSettings extends mongoose.Document {
  storeName: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  openingHours: string;
  paymentMethods: {
    cash: boolean;
    credit: boolean;
    debit: boolean;
    pix: boolean;
  };
  updatedAt: Date;
}

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      default: "EmbalaFest",
    },
    cnpj: {
      type: String,
      required: true,
      default: "00.000.000/0000-00",
    },
    phone: {
      type: String,
      required: true,
      default: "(00) 0000-0000",
    },
    email: {
      type: String,
      required: true,
      default: "contato@embalafest.com.br",
    },
    address: {
      type: String,
      required: true,
      default: "Rua Exemplo, 123 - Centro, Cidade - UF, 00000-000",
    },
    openingHours: {
      type: String,
      required: true,
      default: "Segunda a Sexta: 08:00 às 18:00 | Sábado: 08:00 às 12:00",
    },
    paymentMethods: {
      cash: {
        type: Boolean,
        default: true,
      },
      credit: {
        type: Boolean,
        default: true,
      },
      debit: {
        type: Boolean,
        default: true,
      },
      pix: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const StoreSettings = mongoose.model<IStoreSettings>(
  "StoreSettings",
  storeSettingsSchema
);
