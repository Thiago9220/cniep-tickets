import { Router } from "express";
import { reportController } from "../controllers/reportController";

const router = Router();

// Weekly
router.get("/reports/weekly", reportController.listWeekly);
router.get("/reports/weekly/:weekKey", reportController.getWeekly);
router.post("/reports/weekly", reportController.upsertWeekly);
router.delete("/reports/weekly/:weekKey", reportController.deleteWeekly);

// Monthly
router.get("/reports/monthly", reportController.listMonthly);
router.post("/reports/monthly", reportController.upsertMonthly);

// Quarterly
router.get("/reports/quarterly", reportController.listQuarterly);
router.post("/reports/quarterly", reportController.upsertQuarterly);

export default router;
