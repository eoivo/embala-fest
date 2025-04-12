import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "dotenv";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error.js";

// Routes
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import registerRoutes from "./routes/registerRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import consumerRoutes from "./routes/consumerRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import storeSettingsRoutes from "./routes/storeSettingsRoutes.js";

// Load environment variables
config();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://embalafest.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Swagger configuration
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/consumers", consumerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/store-settings", storeSettingsRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;
