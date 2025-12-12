import { Router } from "express";
import { authController } from "../controllers/authController";
import { loginRateLimiter } from "../middlewares/rateLimiter";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";
import { uploadAvatar } from "../config/upload";

const router = Router();

// Public routes
router.post("/login", loginRateLimiter, authController.login);
router.post("/oauth/google", loginRateLimiter, authController.googleAuth);
router.post("/oauth/github", loginRateLimiter, authController.githubAuth);
router.post("/forgot-password", loginRateLimiter, authController.forgotPassword);
router.post("/reset-password", loginRateLimiter, authController.resetPassword);

// Registration is disabled for public
router.post("/register", loginRateLimiter, (req, res) => {
  res.status(403).json({
    error: "Registro público desabilitado. Entre em contato com um administrador para obter acesso."
  });
});

// Protected routes
router.get("/me", authMiddleware, authController.getMe);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/avatar", authMiddleware, authController.updateAvatar); // Update URL manually

// Avatar upload
router.post("/avatar/upload", authMiddleware, uploadAvatar.single("avatar"), authController.uploadAvatar);

// Admin routes
router.post("/admin/create-user", adminMiddleware, authController.createUserAdmin);

export default router;
