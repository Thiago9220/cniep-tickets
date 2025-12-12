import { Router } from "express";
import { ticketController } from "../controllers/ticketController";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";
import { uploadMemory } from "../config/upload";

const router = Router();

// Public routes (List & Read & Stats)
router.get("/tickets", ticketController.listTickets);
router.get("/tickets/:id", ticketController.getTicket);

// Stats routes (Public)
router.get("/tickets/stats/overview", ticketController.getOverviewStats);
router.get("/tickets/stats/monthly", ticketController.getMonthlyEvolution);
router.get("/tickets/stats/critical", ticketController.getCriticalTickets);
router.get("/tickets/stats/weekly/:weekKey", ticketController.getWeeklyStats);
router.get("/tickets/stats/month/:monthKey", ticketController.getMonthStats);
router.get("/tickets/stats/available-periods", ticketController.getAvailablePeriods);
router.get("/tickets/stats/quarterly/:quarterKey", ticketController.getQuarterlyStats);
router.get("/tickets/stats/available-quarters", ticketController.getAvailableQuarters);

// Admin routes (Write)
router.post("/tickets", adminMiddleware, ticketController.createTicket);
router.put("/tickets/:id", adminMiddleware, ticketController.updateTicket);
router.patch("/tickets/:id/stage", adminMiddleware, ticketController.updateTicketStage);
router.post("/tickets/reorder", adminMiddleware, ticketController.reorderTickets);
router.delete("/tickets/:id", adminMiddleware, ticketController.deleteTicket);
router.post("/tickets/import", adminMiddleware, uploadMemory.single("file"), ticketController.importTickets);

// Interaction routes
// Comments
router.get("/tickets/:id/comments", ticketController.listComments); // Public
router.post("/tickets/:id/comments", authMiddleware, ticketController.addComment); // Auth

// Activities
router.get("/tickets/:id/activities", ticketController.listActivities); // Public

// Followers
router.get("/tickets/:id/followers", authMiddleware, ticketController.listFollowers);
router.post("/tickets/:id/follow", authMiddleware, ticketController.toggleFollow);

export default router;
