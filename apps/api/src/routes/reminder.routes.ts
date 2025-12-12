import { Router } from "express";
import { reminderController } from "../controllers/reminderController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/reminders", authMiddleware, reminderController.list);
router.post("/reminders", authMiddleware, reminderController.create);
router.put("/reminders/:id", authMiddleware, reminderController.update);
router.delete("/reminders/:id", authMiddleware, reminderController.delete);
router.post("/reminders/reorder", authMiddleware, reminderController.reorder);
router.get("/reminders/counts", authMiddleware, reminderController.getCounts);

export default router;
