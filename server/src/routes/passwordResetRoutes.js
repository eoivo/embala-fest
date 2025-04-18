import express from "express";
import { check } from "express-validator";
import * as passwordResetController from "../controllers/passwordResetController.js";

const router = express.Router();

/**
 * @swagger
 * /api/password-reset/request:
 *   post:
 *     summary: Solicita recuperação de senha
 *     tags: [Recuperação de Senha]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: E-mail de recuperação enviado com sucesso
 *       400:
 *         description: Erro na solicitação
 *       404:
 *         description: Usuário não encontrado
 */
router.post(
  "/request",
  [check("email", "Por favor, insira um e-mail válido").isEmail()],
  passwordResetController.requestPasswordReset
);

/**
 * @swagger
 * /api/password-reset/validate/{token}:
 *   get:
 *     summary: Verifica se um token de recuperação é válido
 *     tags: [Recuperação de Senha]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token de redefinição de senha
 *     responses:
 *       200:
 *         description: Token válido
 *       400:
 *         description: Token inválido ou expirado
 */
router.get("/validate/:token", passwordResetController.verifyResetToken);

/**
 * @swagger
 * /api/password-reset/verify-token:
 *   post:
 *     summary: Verifica se um token de recuperação é válido
 *     tags: [Recuperação de Senha]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token válido
 *       400:
 *         description: Token inválido ou expirado
 */
router.post(
  "/verify-token",
  [check("token", "Token é obrigatório").notEmpty()],
  passwordResetController.verifyResetToken
);

/**
 * @swagger
 * /api/password-reset/reset:
 *   post:
 *     summary: Redefine a senha usando um token válido
 *     tags: [Recuperação de Senha]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso
 *       400:
 *         description: Erro na redefinição de senha
 */
router.post(
  "/reset",
  [
    check("token", "Token é obrigatório").notEmpty(),
    check("password", "A senha deve ter pelo menos 6 caracteres").isLength({
      min: 6,
    }),
  ],
  passwordResetController.resetPassword
);

export default router;
