import express from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     tags: [Suppliers]
 *     summary: Criar um novo fornecedor (somente admin)
 *     security:
 *       - bearerAuth: []
 */
router.post("/", protect, admin, createSupplier);

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     tags: [Suppliers]
 *     summary: Obter todos os fornecedores
 */
router.get("/", getSuppliers);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     tags: [Suppliers]
 *     summary: Obter fornecedor por ID
 */
router.get("/:id", getSupplierById);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     tags: [Suppliers]
 *     summary: Atualizar fornecedor (somente admin)
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", protect, admin, updateSupplier);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     tags: [Suppliers]
 *     summary: Excluir fornecedor (somente admin)
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", protect, admin, deleteSupplier);

export default router;
