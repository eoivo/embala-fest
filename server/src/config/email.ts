import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const {
  GMAIL_USER,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_REDIRECT_URI,
  GMAIL_FROM_NAME,
} = process.env;

const createTransporter = async () => {
  try {
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

      const accessToken = await new Promise<string>((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
          if (err) {
            reject("Failed to create access token: " + err.message);
          }
          resolve(token as string);
        });
      });

      const gmailConfig: any = {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          type: "OAuth2",
          user: GMAIL_USER,
          accessToken,
          clientId: GMAIL_CLIENT_ID,
          clientSecret: GMAIL_CLIENT_SECRET,
          refreshToken: GMAIL_REFRESH_TOKEN,
        },
      };

      return nodemailer.createTransport(gmailConfig);
    } else {
      console.warn(
        "Gmail OAuth credentials not found, using test account instead"
      );
      const testAccount = await nodemailer.createTestAccount();

      const etherealConfig: any = {
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      };

      return nodemailer.createTransport(etherealConfig);
    }
  } catch (error) {
    console.error("Error creating email transporter:", error);
    throw error;
  }
};

export default createTransporter;
