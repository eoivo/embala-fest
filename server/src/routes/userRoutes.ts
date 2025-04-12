import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  updateUser,
  getUserById,
  getCurrentUser,
  updatePassword,
  deleteUser,
  authenticateManager,
  updateOwnProfile,
  updateAvatar,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";
import { Request, Response, NextFunction } from "express";

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manager, cashier]
 */
router.post("/", registerUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags: [Users]
 *     summary: Authenticate user & get token
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.get("/", protect, admin, getUsers);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user data
 *     security:
 *       - bearerAuth: []
 */
router.get("/me", protect, getCurrentUser);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 */
router.put("/me", protect, updateOwnProfile);

/**
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload user avatar
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/me/avatar",
  protect,
  upload.single("avatar"),
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Nenhum arquivo foi recebido. Verifique se está enviando a imagem corretamente.",
      });
    }
    next();
  },
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message || "Erro no processamento do upload",
      });
    }
    next();
  },
  updateAvatar
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", protect, admin, getUserById);

/**
 * @swagger
 * /api/users/update-password:
 *   put:
 *     tags: [Users]
 *     summary: Update user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 */
router.put("/update-password", protect, updatePassword);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", protect, admin, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Deletar usuário (apenas admin)
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", protect, admin, deleteUser);
router.post("/authenticate-manager", authenticateManager);

export default router;
