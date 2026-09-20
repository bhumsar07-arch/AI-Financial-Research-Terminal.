import { Router } from "express";
import { chatController } from "../controllers/chat.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// All chat routes require authentication
router.use(authenticateToken);

// POST /api/chat/query — Ask AI Analyst a question
router.post("/query", chatController.ask);

// GET /api/chat/sessions — List user's chat sessions
router.get("/sessions", chatController.getSessions);

// GET /api/chat/sessions/:id — Get messages for a session
router.get("/sessions/:id", chatController.getSessionMessages);

// GET /api/chat/llm-status — Get live LLM engine status
router.get("/llm-status", chatController.getLlmStatus);

// POST /api/chat/llm-key — Set and validate Gemini API key
router.post("/llm-key", chatController.setLlmKey);

export default router;

