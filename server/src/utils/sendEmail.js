import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Envia um email usando nodemailer
 * @param {Object} options - Opções do email
 * @param {string} options.to - Email do destinatário
 * @param {string} options.subject - Assunto do email
 * @param {string} options.text - Conteúdo em texto do email (opcional)
 * @param {string} options.html - Conteúdo HTML do email
 * @returns {Promise} - Promise com o resultado do envio
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Criar um transportador de email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Enviar o email
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email enviado: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false, error: error.message };
  }
};

// Exportação padrão para compatibilidade
export default sendEmail;
