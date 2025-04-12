import express from 'express';
import {
  createSale,
  getSales,
  getSaleById,
  cancelSale,
} from '../controllers/saleController.js';
import { protect, manager } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/sales:
 *   post:
 *     tags: [Sales]
 *     summary: Create a new sale
 *     security:
 *       - bearerAuth: []
 */
router.post('/', protect, createSale);

/**
 * @swagger
 * /api/sales:
 *   get:
 *     tags: [Sales]
 *     summary: Get all sales
 *     security:
 *       - bearerAuth: []
 */
router.get('/', protect, getSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     tags: [Sales]
 *     summary: Get sale by ID
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', protect, getSaleById);

/**
 * @swagger
 * /api/sales/{id}/cancel:
 *   put:
 *     tags: [Sales]
 *     summary: Cancel sale (manager only)
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/cancel', protect, manager, cancelSale);

export default router;