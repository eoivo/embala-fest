import express from "express";
import {
  getStoreSettings,
  updateStoreSettings,
  getAvailablePaymentMethods
} from "../controllers/storeSettingsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/store-settings:
 *   get:
 *     tags: [Store Settings]
 *     summary: Obter configurações da loja
 *     security:
 *       - bearerAuth: []
 *   put:
 *     tags: [Store Settings]
 *     summary: Atualizar configurações da loja (admin)
 *     security:
 *       - bearerAuth: []
 */
router.get("/", protect, getStoreSettings);
router.put("/", protect, updateStoreSettings);

/**
 * @swagger
 * /api/store-settings/payment-methods:
 *   get:
 *     tags: [Store Settings]
 *     summary: Obter métodos de pagamento disponíveis
 *     security:
 *       - bearerAuth: []
 */
router.get("/payment-methods", protect, getAvailablePaymentMethods);

export default router; 