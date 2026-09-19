import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes (require valid JWT Bearer token)
router.get("/me", authenticateToken, authController.getMe);
router.post("/logout", authenticateToken, authController.logout);

export default router;
