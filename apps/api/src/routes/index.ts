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

router.use("/auth", authRoutes); // /api/auth/* (and /auth/* handled in server.ts mounting)
// Actually in server.ts I will mount this router at /api probably?
// The original structure had mixed paths.
// /api/auth -> authRouter
// /auth -> authRouter
// /api -> publicRouter (tickets, reports)
// / -> publicRouter
// /api -> protectedRouter (documents, reminders, etc)
// / -> protectedRouter

// This is messy. I will try to unify under /api but keep compatibility.
// If I mount everything here, I can use this router for /api.

// Auth routes are usually /auth/...
// But original index.ts mounted authRouter at /api/auth AND /auth.

// Ticket routes:
// /tickets (public)
// /tickets/... (mixed)

// I will just export separate routers or mount them here.
// Mounting them here is cleaner.

router.use(authRoutes); // /login, /register, /me (paths inside authRoutes already have no prefix mostly, but some might? No, they are relative)
// authRoutes has /login, /oauth/..., /me, /profile. So /api/login, /api/me.
// Original: /api/auth/login, /auth/login.
// So if I mount at /api, I need to make sure authRoutes has /auth prefix or I mount it at /auth.
// Let's not use a central router if it complicates things too much with legacy paths.
// But central router is best practice.

// Let's assume this router is mounted at /api.
// authRoutes: /login -> /api/login? No, usually /api/auth/login.
// So I should do: router.use("/auth", authRoutes);

// ticketsRoutes: /tickets -> /api/tickets.
router.use(ticketRoutes);

// documentRoutes: /documents -> /api/documents.
router.use(documentRoutes);

// reportRoutes: /reports/... -> /api/reports/...
router.use(reportRoutes);

// reminderRoutes: /reminders -> /api/reminders
router.use(reminderRoutes);

// manualRoutes: /manuals -> /api/manuals
router.use(manualRoutes);

// workflowRoutes: /workflows -> /api/workflows
router.use(workflowRoutes);

// chatRoutes: /chat/completion -> /api/chat/completion
router.use(chatRoutes);

// userRoutes: /users -> /api/users
router.use(userRoutes);

router.get("/hello", (_req, res) => {
  res.json({ message: "API funcionando" });
});

export default router;
