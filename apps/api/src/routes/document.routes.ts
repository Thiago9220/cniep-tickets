import { Router } from "express";
import { documentController } from "../controllers/documentController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { uploadRateLimiter } from "../middlewares/rateLimiter";
import { uploadDocs } from "../config/upload";

const router = Router();

// Routes are prefixed with /documents in the main router, or we can define them here.
// Assuming this router is mounted at /api

router.post("/documents", authMiddleware, uploadRateLimiter, uploadDocs.single("file"), documentController.upload);
router.get("/documents", authMiddleware, documentController.list);
router.get("/documents/:id/download", authMiddleware, documentController.download);
router.delete("/documents/:id", authMiddleware, documentController.delete);

export default router;
