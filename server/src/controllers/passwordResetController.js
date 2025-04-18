import { validationResult } from "express-validator";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import PasswordReset from "../models/PasswordReset.js";
import { sendEmail } from "../utils/sendEmail.js";

/**
 * Solicita um token de recuperação de senha
 */
export const requestPasswordReset = async (req, res) => {
  // Verifica erros de validação
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;

    // Verifica se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    // Gera um token aleatório
    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token válido por 1 hora

    // Salva o token no banco de dados
    await PasswordReset.findOneAndDelete({ user: user._id });
    await PasswordReset.create({
      user: user._id,
      token,
      expiresAt,
    });

    // URL de redefinição de senha - deve apontar para o frontend
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Enviar e-mail com link de redefinição
    await sendEmail({
      to: user.email,
      subject: "Redefinição de Senha - Embala Fest",
      text: `Você solicitou a redefinição de sua senha. Por favor, clique no link a seguir para redefinir sua senha: ${resetUrl}. Este link expira em 1 hora.`,
      html: `
        <h1>Redefinição de Senha</h1>
        <p>Você solicitou a redefinição de sua senha.</p>
        <p>Por favor, clique no link a seguir para redefinir sua senha:</p>
        <a href="${resetUrl}" target="_blank">Redefinir senha</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta redefinição, por favor ignore este e-mail.</p>
      `,
    });

    res.json({ msg: "E-mail de redefinição de senha enviado" });
  } catch (error) {
    console.error("Erro ao solicitar redefinição de senha:", error);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};

/**
 * Verifica se um token de recuperação é válido
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const passwordReset = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!passwordReset) {
      return res.status(400).json({ msg: "Token inválido ou expirado" });
    }

    res.json({ msg: "Token válido", userId: passwordReset.user });
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};

/**
 * Redefine a senha usando um token válido
 */
export const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { token } = req.params;
    const { password } = req.body;

    // Verificar se o token é válido e não expirou
    const passwordReset = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!passwordReset) {
      return res.status(400).json({ msg: "Token inválido ou expirado" });
    }

    // Atualizar senha do usuário
    const user = await User.findById(passwordReset.user);
    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    user.password = password;
    await user.save();

    // Remover solicitação de redefinição
    await PasswordReset.deleteOne({ _id: passwordReset._id });

    res.json({ msg: "Senha atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};
