import crypto from "crypto";
import { User, IUser } from "../models/user";
import emailService from "./emailService";
import { logger } from "../config/logger";

/**
 * Serviço para gerenciar recuperação de senha
 */
export const passwordResetService = {
  /**
   * Gera um token para redefinição de senha e envia um email para o usuário
   * @param email Email do usuário
   */
  async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar se o email existe
      const user = await User.findOne({ email });
      if (!user) {
        // Por segurança, não revelamos se o email existe ou não
        return {
          success: true,
          message:
            "Se o email estiver registrado no sistema, enviaremos as instruções de recuperação.",
        };
      }

      // Gerar um token aleatório
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Salvar o token no usuário com prazo de expiração (1 hora)
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
      await user.save();

      // Enviar email
      const emailSent = await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.name
      );

      if (!emailSent) {
        throw new Error("Falha ao enviar email de recuperação");
      }

      logger.info(`Token de recuperação gerado para o usuário: ${user.email}`);
      return {
        success: true,
        message:
          "Se o email estiver registrado no sistema, enviaremos as instruções de recuperação.",
      };
    } catch (error) {
      logger.error("Erro ao solicitar recuperação de senha:", error);
      return {
        success: false,
        message: "Erro ao processar a solicitação de recuperação de senha.",
      };
    }
  },

  /**
   * Valida um token de redefinição de senha
   * @param token Token de redefinição
   */
  async validateResetToken(
    token: string
  ): Promise<{ valid: boolean; userId?: string }> {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: user._id.toString(),
      };
    } catch (error) {
      logger.error("Erro ao validar token de redefinição:", error);
      return { valid: false };
    }
  },

  /**
   * Redefine a senha do usuário
   * @param token Token de redefinição
   * @param newPassword Nova senha
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return {
          success: false,
          message:
            "Token inválido ou expirado. Por favor, solicite uma nova redefinição de senha.",
        };
      }

      // Atualizar senha
      user.password = newPassword;
      // Limpar token de redefinição
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      logger.info(`Senha alterada com sucesso para o usuário: ${user.email}`);
      return {
        success: true,
        message:
          "Senha alterada com sucesso! Você já pode fazer login com sua nova senha.",
      };
    } catch (error) {
      logger.error("Erro ao redefinir senha:", error);
      return {
        success: false,
        message: "Erro ao redefinir senha. Por favor, tente novamente.",
      };
    }
  },
};

export default passwordResetService;
