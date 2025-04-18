import { logger } from "../config/logger";
import nodemailer from "nodemailer";
import { sendEmail } from "../utils/sendEmail.js";

/**
 * Serviço para envio de emails
 */
export const emailService = {
  /**
   * Enviar email para recuperação de senha
   * @param to Email do destinatário
   * @param resetToken Token de recuperação
   * @param username Nome do usuário (opcional)
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    username?: string
  ): Promise<boolean> {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
      const name = username || "cliente";

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${frontendUrl}/logos/logo-icon.png" alt="EmbalaFest Logo" style="width: 80px; height: 80px;" />
          </div>
          <h2 style="color: #6332cd; text-align: center;">Recuperação de Senha</h2>
          <p>Olá ${name},</p>
          <p>Recebemos uma solicitação para recuperar sua senha do sistema EmbalaFest.</p>
          <p>Clique no botão abaixo para redefinir sua senha. Este link é válido por 1 hora.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #6332cd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Redefinir minha senha
            </a>
          </div>
          <p>Se você não solicitou a recuperação de senha, por favor ignore este email.</p>
          <p>Atenciosamente,<br />Equipe EmbalaFest</p>
          <div style="font-size: 12px; color: #888; margin-top: 30px; text-align: center; border-top: 1px solid #e1e1e1; padding-top: 15px;">
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      `;

      // Usar a função sendEmail diretamente
      const result = await sendEmail({
        to,
        subject: "Recuperação de Senha - EmbalaFest",
        text: `Você solicitou a redefinição de sua senha. Por favor, acesse o link a seguir para redefinir sua senha: ${resetUrl}. Este link expira em 1 hora.`,
        html: emailContent,
      });

      if (result.success) {
        logger.info(`Email de recuperação enviado para: ${to}`);
        return true;
      } else {
        throw new Error(result.error || "Falha ao enviar email");
      }
    } catch (error) {
      logger.error("Erro ao enviar email de recuperação de senha:", error);
      return false;
    }
  },
};

export default emailService;
