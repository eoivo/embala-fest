import express from "express";
import passwordResetController from "../controllers/passwordResetController.js";

const router = express.Router();

/**
 * @route   POST /api/password-reset/request
 * @desc    Solicitar recuperação de senha
 * @access  Público
 */
router.post("/request", passwordResetController.requestPasswordReset);

/**
 * @route   GET /api/password-reset/validate/:token
 * @desc    Validar token de recuperação de senha
 * @access  Público
 */
router.get("/validate/:token", passwordResetController.validateResetToken);

/**
 * @route   POST /api/password-reset/reset
 * @desc    Redefinir senha com token válido
 * @access  Público
 */
router.post("/reset", passwordResetController.resetPassword);

export default router;
