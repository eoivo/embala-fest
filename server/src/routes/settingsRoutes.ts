import express from "express";
import {
  getAutoCloseSettings,
  updateAutoCloseSettings,
} from "../controllers/settingsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/settings/auto-close:
 *   get:
 *     tags: [Settings]
 *     summary: Obter configurações de fechamento automático
 *     security:
 *       - bearerAuth: []
 *   put:
 *     tags: [Settings]
 *     summary: Atualizar configurações de fechamento automático
 *     security:
 *       - bearerAuth: []
 */
router.get("/auto-close", protect, getAutoCloseSettings);
router.put("/auto-close", protect, updateAutoCloseSettings);

export default router;
