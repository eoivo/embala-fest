import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import passwordResetService from "../services/passwordResetService.js";

/**
 * @desc    Solicitar recuperação de senha
 * @route   POST /api/password-reset/request
 * @access  Público
 */
export const requestPasswordReset = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Por favor, forneça um email.",
      });
      return;
    }

    const result = await passwordResetService.requestPasswordReset(email);

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);

/**
 * @desc    Validar token de recuperação de senha
 * @route   GET /api/password-reset/validate/:token
 * @access  Público
 */
export const validateResetToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Token não fornecido.",
      });
      return;
    }

    const result = await passwordResetService.validateResetToken(token);

    res.status(200).json({
      success: true,
      valid: result.valid,
      userId: result.userId,
    });
  }
);

/**
 * @desc    Redefinir senha
 * @route   POST /api/password-reset/reset
 * @access  Público
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        message: "Por favor, forneça um token e uma nova senha.",
      });
      return;
    }

    // Validar requisitos de senha
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    const result = await passwordResetService.resetPassword(token, password);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);

export default {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
};
