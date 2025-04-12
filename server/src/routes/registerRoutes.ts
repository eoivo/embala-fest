import express from "express";
import {
  openRegister,
  closeRegister,
  getRegisterHistory,
  getCurrentRegister,
  addCashWithdrawal,
  getRegisterDashboard,
} from "../controllers/registerController.js";
import { protect, manager } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/register/open:
 *   post:
 *     tags: [Register]
 *     summary: Open a new register
 *     security:
 *       - bearerAuth: []
 */
router.post("/open", protect, openRegister);

/**
 * @swagger
 * /api/register/close:
 *   post:
 *     tags: [Register]
 *     summary: Close current register (requires manager authentication)
 *     security:
 *       - bearerAuth: []
 */
router.post("/close", protect, closeRegister);

/**
 * @swagger
 * /api/register/history:
 *   get:
 *     tags: [Register]
 *     summary: Get register history
 *     security:
 *       - bearerAuth: []
 */
router.get("/history", protect, getRegisterHistory);

/**
 * @swagger
 * /api/register/current:
 *   get:
 *     tags: [Register]
 *     summary: Get current register
 *     security:
 *       - bearerAuth: []
 */
router.get("/current", protect, getCurrentRegister);

/**
 * @swagger
 * /api/register/withdrawal:
 *   post:
 *     tags: [Register]
 *     summary: Add cash withdrawal
 *     security:
 *       - bearerAuth: []
 */
router.post("/withdrawal", protect, manager, addCashWithdrawal);

/**
 * @swagger
 * /api/register/dashboard:
 *   get:
 *     tags: [Register]
 *     summary: Get register dashboard data
 *     security:
 *       - bearerAuth: []
 */
router.get("/dashboard", protect, getRegisterDashboard);

export default router;
