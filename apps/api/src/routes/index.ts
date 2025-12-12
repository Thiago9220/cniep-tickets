import { Router } from "express";
import authRoutes from "./auth.routes";
import ticketRoutes from "./ticket.routes";
import documentRoutes from "./document.routes";
import reportRoutes from "./report.routes";
import reminderRoutes from "./reminder.routes";
import manualRoutes from "./manual.routes";
import workflowRoutes from "./workflow.routes";
import chatRoutes from "./chat.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use(authRoutes);

router.use(ticketRoutes);
router.use(documentRoutes);
router.use(reportRoutes);
router.use(reminderRoutes);
router.use(manualRoutes);
router.use(workflowRoutes);
router.use(chatRoutes);
router.use(userRoutes);

router.get("/hello", (_req, res) => {
  res.json({ message: "API funcionando" });
});

export default router;