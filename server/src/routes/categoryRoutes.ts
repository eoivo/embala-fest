import express from "express";
import { categoryController } from "../controllers/categoryController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, categoryController.getAll);
router.get("/:id", protect, categoryController.getById);
router.post("/", protect, categoryController.create);
router.put("/:id", protect, categoryController.update);
router.delete("/:id", protect, categoryController.remove);

export default router;
