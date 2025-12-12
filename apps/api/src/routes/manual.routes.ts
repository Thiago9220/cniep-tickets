import { Router } from "express";
import { manualController } from "../controllers/manualController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/manuals", authMiddleware, manualController.list);
router.post("/manuals", authMiddleware, manualController.create);
router.delete("/manuals/:id", authMiddleware, manualController.delete);

export default router;
