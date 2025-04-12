import express from "express";
import {
  createConsumer,
  getConsumers,
  getConsumerById,
  updateConsumer,
  deleteConsumer,
} from "../controllers/consumerController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/consumers:
 *   post:
 *     tags: [Consumers]
 *     summary: Register a new consumer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 */
router.post("/", protect, createConsumer);

/**
 * @swagger
 * /api/consumers:
 *   get:
 *     tags: [Consumers]
 *     summary: Get all consumers
 *     security:
 *       - bearerAuth: []
 */
router.get("/", protect, getConsumers);

/**
 * @swagger
 * /api/consumers/{id}:
 *   get:
 *     tags: [Consumers]
 *     summary: Get consumer by ID
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", protect, getConsumerById);

/**
 * @swagger
 * /api/consumers/{id}:
 *   put:
 *     tags: [Consumers]
 *     summary: Update consumer
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", protect, updateConsumer);

/**
 * @swagger
 * /api/consumers/{id}:
 *   delete:
 *     tags: [Consumers]
 *     summary: Delete consumer (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", protect, admin, deleteConsumer);

export default router;
