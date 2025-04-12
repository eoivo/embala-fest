import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Register } from "../models/register.js";
import { User } from "../models/user.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

interface PaymentMethodTotals {
  cash: number;
  credit: number;
  debit: number;
  pix: number;
  [key: string]: number;
}

interface ISaleWithPayment {
  _id: mongoose.Types.ObjectId;
  total: number;
  paymentMethod: keyof PaymentMethodTotals;
}

interface IRegisterPopulated extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  user: { _id: mongoose.Types.ObjectId; name: string };
  initialBalance: number;
  finalBalance?: number;
  status: "open" | "closed";
  closedAt?: Date;
  closedBy?: { _id: mongoose.Types.ObjectId; name: string };
  sales: ISaleWithPayment[];
  createdAt: Date;
  updatedAt: Date;
}

export const openRegister = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { initialBalance } = req.body;

    // Check if there's already an open register for this user
    const existingOpenRegister = await Register.findOne({
      user: req.user._id,
      status: "open",
    });

    if (existingOpenRegister) {
      res.status(400);
      throw new Error("You already have an open register");
    }

    const register = await Register.create({
      user: req.user._id,
      initialBalance,
      status: "open",
    });

    res.status(201).json(register);
  }
);

export const closeRegister = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { finalBalance, paymentMethods, managerCredentials } = req.body;

    // Verificar se foram enviadas as credenciais do gerente
    if (
      !managerCredentials ||
      !managerCredentials.email ||
      !managerCredentials.password
    ) {
      res.status(400);
      throw new Error("Credenciais do gerente são obrigatórias");
    }

    // Autenticar o gerente
    const manager = await User.findOne({ email: managerCredentials.email });

    if (!manager) {
      res.status(401);
      throw new Error("Email ou senha inválidos");
    }

    // Verificar se o usuário é um gerente ou administrador
    if (manager.role !== "manager" && manager.role !== "admin") {
      res.status(403);
      throw new Error("Apenas gerentes podem autorizar o fechamento do caixa");
    }

    // Verificar a senha
    const isMatch = await manager.matchPassword(managerCredentials.password);

    if (!isMatch) {
      res.status(401);
      throw new Error("Email ou senha inválidos");
    }

    // Buscar o registro do caixa
    const register = await Register.findOne({
      user: req.user._id,
      status: "open",
    });

    if (!register) {
      res.status(404);
      throw new Error("Nenhum caixa aberto encontrado");
    }

    register.finalBalance = finalBalance;
    register.status = "closed";
    register.closedAt = new Date();
    register.closedBy = manager._id;

    const closedRegister = await register.save();
    res.json(closedRegister);
  }
);

export const getRegisterHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const registers = await Register.find({ user: req.user._id })
      .populate("user", "name")
      .populate("sales");
    res.json(registers);
  }
);

export const getCurrentRegister = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const register = await Register.findOne({
      user: req.user._id,
      status: "open",
    })
      .populate("user", "name")
      .populate("sales");

    if (!register) {
      res.status(404);
      throw new Error("No open register found");
    }

    res.json(register);
  }
);

export const addCashWithdrawal = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { amount, reason } = req.body;
    const register = await Register.findOne({
      user: req.user._id,
      status: "open",
    });

    if (!register) {
      res.status(404);
      throw new Error("No open register found");
    }

    register.cashWithdrawals.push({
      amount,
      reason,
      timestamp: new Date(),
    });

    const updatedRegister = await register.save();
    res.json(updatedRegister);
  }
);

export const getRegisterDashboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Buscar o caixa atual
    const currentRegister = (await Register.findOne({
      user: req.user._id,
      status: "open",
    })
      .populate("user", "name")
      .populate({
        path: "sales",
        model: "Sale",
      })) as IRegisterPopulated | null;

    // Buscar o último caixa fechado
    const lastClosedRegister = (await Register.findOne({
      user: req.user._id,
      status: "closed",
    })
      .sort({ closedAt: -1 })
      .populate("user", "name")
      .populate("closedBy", "name")) as IRegisterPopulated | null;

    // Calcular totais do caixa atual
    let totalVendas = 0;
    let qtdeVendas = 0;
    let vendasPorFormaPagamento: PaymentMethodTotals = {
      cash: 0,
      credit: 0,
      debit: 0,
      pix: 0,
    };

    if (currentRegister && currentRegister.sales) {
      currentRegister.sales.forEach((sale) => {
        totalVendas += sale.total;
        qtdeVendas++;
        if (sale.paymentMethod in vendasPorFormaPagamento) {
          vendasPorFormaPagamento[sale.paymentMethod] += sale.total;
        }
      });
    }

    // Preparar resposta
    const response = {
      status: currentRegister ? "open" : "closed",
      currentRegister: currentRegister
        ? {
            id: currentRegister._id,
            saldoInicial: currentRegister.initialBalance,
            saldoAtual: totalVendas + currentRegister.initialBalance,
            totalVendas,
            qtdeVendas,
            vendasPorFormaPagamento,
            horaAbertura: currentRegister.createdAt,
            operador: currentRegister.user.name,
          }
        : null,
      lastClosedRegister: lastClosedRegister
        ? {
            id: lastClosedRegister._id,
            saldoInicial: lastClosedRegister.initialBalance,
            saldoFinal: lastClosedRegister.finalBalance || 0,
            totalVendas:
              (lastClosedRegister.finalBalance || 0) -
              lastClosedRegister.initialBalance,
            horaAbertura: lastClosedRegister.createdAt,
            horaFechamento: lastClosedRegister.closedAt,
            operador: lastClosedRegister.user.name,
            fechadoPor: lastClosedRegister.closedBy?.name,
          }
        : null,
    };

    res.json(response);
  }
);
