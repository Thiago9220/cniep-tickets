import { Router } from "express";
import { userController } from "../controllers/userController";
import { adminMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/users", adminMiddleware, userController.list);
router.patch("/users/:id/role", adminMiddleware, userController.updateRole);
router.patch("/users/:id/kanban-permission", adminMiddleware, userController.updateKanbanPermission);
router.delete("/admin/users/:id", adminMiddleware, userController.delete);

export default router;
