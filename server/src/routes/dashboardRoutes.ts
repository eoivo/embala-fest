import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, dashboardController.getDashboardData);
router.get("/vendas", protect, dashboardController.getVendasPorPeriodo);

export default router;
