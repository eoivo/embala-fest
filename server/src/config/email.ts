import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

// Essas variáveis precisarão ser adicionadas ao arquivo .env
const {
  GMAIL_USER,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_REDIRECT_URI,
  GMAIL_FROM_NAME,
} = process.env;

// Se você não quiser usar OAuth2, pode configurar com email e senha diretamente
// mas é menos seguro e requer "Allow less secure apps" no Gmail
const createTransporter = async () => {
  try {
    // OAuth2 para Gmail
    if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN) {
      const OAuth2 = google.auth.OAuth2;
      const oauth2Client = new OAuth2(
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        GMAIL_REDIRECT_URI || "https://developers.google.com/oauthplayground"
      );

      oauth2Client.setCredentials({
        refresh_token: GMAIL_REFRESH_TOKEN,
      });

      const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
          if (err) {
            reject("Failed to create access token: " + err.message);
          }
          resolve(token);
        });
      });

      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: GMAIL_USER,
          accessToken,
          clientId: GMAIL_CLIENT_ID,
          clientSecret: GMAIL_CLIENT_SECRET,
          refreshToken: GMAIL_REFRESH_TOKEN,
        },
      });
    } else {
      // Para desenvolvimento/testes: ethereal.email (serviço falso para testes)
      // Usamos para facilitar os testes sem precisar de credenciais reais
      console.warn(
        "Gmail OAuth credentials not found, using test account instead"
      );
      const testAccount = await nodemailer.createTestAccount();

      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
  } catch (error) {
    console.error("Error creating email transporter:", error);
    throw error;
  }
};

export default createTransporter;
