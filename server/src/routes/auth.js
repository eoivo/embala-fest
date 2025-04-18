import { Router } from "express";
import { check } from "express-validator";
import { register, login, getUser } from "../controllers/authController.js";
import {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
} from "../controllers/passwordResetController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// Rotas de autenticação
router.post(
  "/register",
  [
    check("name", "Nome é obrigatório").not().isEmpty(),
    check("email", "Por favor, inclua um email válido").isEmail(),
    check(
      "password",
      "Por favor, digite uma senha com 6 ou mais caracteres"
    ).isLength({ min: 6 }),
  ],
  register
);

router.post(
  "/login",
  [
    check("email", "Por favor, inclua um email válido").isEmail(),
    check("password", "Senha é obrigatória").exists(),
  ],
  login
);

router.get("/user", authMiddleware, getUser);

// Rotas de redefinição de senha
router.post(
  "/password-reset",
  [check("email", "Por favor, inclua um email válido").isEmail()],
  requestPasswordReset
);

router.get("/password-reset/:token", verifyResetToken);

router.post(
  "/password-reset/:token",
  [
    check(
      "password",
      "Por favor, digite uma senha com 6 ou mais caracteres"
    ).isLength({ min: 6 }),
  ],
  resetPassword
);

export default router;
