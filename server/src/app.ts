import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "dotenv";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error.js";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import registerRoutes from "./routes/registerRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import consumerRoutes from "./routes/consumerRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import storeSettingsRoutes from "./routes/storeSettingsRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";

config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://embalafest.netlify.app",
      "https://embalafest.netlify.app/",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Adicionar middleware para verificar e ajustar headers CORS (fallback)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://embalafest.netlify.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Responder imediatamente a solicitações OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

app.use(express.json());
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "POS System API",
      version: "1.0.0",
      description: "API documentation for the POS system",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rota para o caminho raiz
app.get("/", (req, res) => {
  res.json({
    message: "Bem-vindo à API do EmbalaFest",
    documentation: "/api-docs",
    health: "/health",
    version: "1.0.0",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/consumers", consumerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/store-settings", storeSettingsRoutes);
app.use("/api/suppliers", supplierRoutes);

app.use(errorHandler);

export default app;
