import { Router } from "express";
import { workflowController } from "../controllers/workflowController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/workflows", authMiddleware, workflowController.list);
router.get("/workflows/:id", authMiddleware, workflowController.get);
router.post("/workflows", authMiddleware, workflowController.create);
router.put("/workflows/:id", authMiddleware, workflowController.update);
router.delete("/workflows/:id", authMiddleware, workflowController.delete);

export default router;
