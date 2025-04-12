import express from "express";
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getProductsReport,
  exportDailyReportToExcel,
  exportDailyReportToPDF,
  exportWeeklyReportToExcel,
  exportWeeklyReportToPDF,
  exportMonthlyReportToExcel,
  exportMonthlyReportToPDF,
  exportProductsReportToExcel,
  exportProductsReportToPDF,
} from "../controllers/reportController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Rota para relatório diário
router.get("/daily", protect, getDailyReport);

// Rota para relatório semanal
router.get("/weekly", protect, getWeeklyReport);

// Rota para relatório mensal
router.get("/monthly", protect, getMonthlyReport);

// Rota para relatório de produtos
router.get("/products", protect, getProductsReport);

// Rotas para exportação de relatórios
router.get("/daily/export/excel", protect, exportDailyReportToExcel);
router.get("/daily/export/pdf", protect, exportDailyReportToPDF);
router.get("/weekly/export/excel", protect, exportWeeklyReportToExcel);
router.get("/weekly/export/pdf", protect, exportWeeklyReportToPDF);
router.get("/monthly/export/excel", protect, exportMonthlyReportToExcel);
router.get("/monthly/export/pdf", protect, exportMonthlyReportToPDF);
router.get("/products/export/excel", protect, exportProductsReportToExcel);
router.get("/products/export/pdf", protect, exportProductsReportToPDF);

export default router;
