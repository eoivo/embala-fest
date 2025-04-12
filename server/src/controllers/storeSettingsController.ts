import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { StoreSettings } from "../models/storeSettings.js";
import { AuthRequest } from "../middleware/auth.js";

/**
 * Obter as configurações da loja
 */
export const getStoreSettings = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Buscar as configurações da loja (sempre usa o primeiro documento)
      let settings = await StoreSettings.findOne();

      // Se não existir configurações, criar um documento com valores padrão
      if (!settings) {
        settings = await StoreSettings.create({});
      }

      res.json(settings);
    } catch (error: any) {
      res.status(500);
      throw new Error(error.message || "Erro ao obter configurações da loja");
    }
  }
);

/**
 * Atualizar as configurações da loja
 */
export const updateStoreSettings = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      // Verificar se o usuário tem permissão (admin ou manager)
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        res.status(403);
        throw new Error(
          "Apenas administradores e gerentes podem alterar as configurações da loja"
        );
      }

      const {
        storeName,
        cnpj,
        phone,
        email,
        address,
        openingHours,
        paymentMethods,
      } = req.body;

      // Buscar as configurações existentes ou criar um novo documento
      let settings = await StoreSettings.findOne();

      if (!settings) {
        settings = new StoreSettings({});
      }

      // Atualizar os campos
      if (storeName !== undefined) settings.storeName = storeName;
      if (cnpj !== undefined) settings.cnpj = cnpj;
      if (phone !== undefined) settings.phone = phone;
      if (email !== undefined) settings.email = email;
      if (address !== undefined) settings.address = address;
      if (openingHours !== undefined) settings.openingHours = openingHours;

      // Atualizar métodos de pagamento se fornecidos
      if (paymentMethods) {
        if (paymentMethods.cash !== undefined)
          settings.paymentMethods.cash = paymentMethods.cash;
        if (paymentMethods.credit !== undefined)
          settings.paymentMethods.credit = paymentMethods.credit;
        if (paymentMethods.debit !== undefined)
          settings.paymentMethods.debit = paymentMethods.debit;
        if (paymentMethods.pix !== undefined)
          settings.paymentMethods.pix = paymentMethods.pix;
      }

      await settings.save();

      res.json({
        success: true,
        message: "Configurações da loja atualizadas com sucesso",
        settings,
      });
    } catch (error: any) {
      res.status(res.statusCode === 200 ? 500 : res.statusCode);
      throw new Error(
        error.message || "Erro ao atualizar configurações da loja"
      );
    }
  }
);

/**
 * Obter métodos de pagamento disponíveis
 */
export const getAvailablePaymentMethods = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const settings = await StoreSettings.findOne();

      if (!settings) {
        // Se não tiver configurações, retorna todos os métodos como disponíveis
        res.json({
          cash: true,
          credit: true,
          debit: true,
          pix: true,
        });
        return;
      }

      // Retorna apenas os métodos de pagamento habilitados
      res.json(settings.paymentMethods);
    } catch (error: any) {
      res.status(500);
      throw new Error(
        error.message || "Erro ao obter métodos de pagamento disponíveis"
      );
    }
  }
);
