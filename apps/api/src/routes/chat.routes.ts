import { Router } from "express";
import { chatController } from "../controllers/chatController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/chat/completion", authMiddleware, chatController.completion);

export default router;
