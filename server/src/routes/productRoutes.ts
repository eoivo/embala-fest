import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.post('/', protect, admin, createProduct);

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
 */
router.get('/', getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update product (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', protect, admin, updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', protect, admin, deleteProduct);

export default router;