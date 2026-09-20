import { chatService } from "../services/chat.service.js";

/**
 * Chat Controller — Handles AI Analyst HTTP requests.
 */
export const chatController = {
  /**
   * POST /api/chat/query
   * Ask the AI Analyst a question about a company.
   */
  async ask(req, res) {
    try {
      const userId = req.user.id;
      const { question, companyId, ticker } = req.body;

      if (!question || !companyId) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: question, companyId",
        });
      }

      // Get or create chat session for this company
      const session = await chatService.getOrCreateSession(
        userId,
        companyId,
        ticker
      );

      // Ask the AI analyst
      const result = await chatService.askAnalyst(
        userId,
        session.id,
        companyId,
        question,
        ticker
      );

      return res.json({
        success: true,
        data: {
          sessionId: session.id,
          answer: result.answer,
          citations: result.citations || [],
          sourceCount: result.sourceCount || 0,
          llmProvider: result.llmProvider || "local_extractive",
          engineDetails: result.engineDetails,
          concallAvailable: result.concallAvailable,
          documentsAvailable: result.documentsAvailable,
          userMessage: result.userMessage,
          assistantMessage: result.assistantMessage,
        },
      });
    } catch (err) {
      console.error("[ChatController] Error in ask:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to process your question. Please try again.",
      });
    }
  },

  /**
   * GET /api/chat/sessions
   * Get all chat sessions for the authenticated user.
   */
  async getSessions(req, res) {
    try {
      const userId = req.user.id;
      const sessions = await chatService.getUserSessions(userId);
      return res.json({ success: true, data: sessions });
    } catch (err) {
      console.error("[ChatController] Error getting sessions:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to load chat sessions.",
      });
    }
  },

  /**
   * GET /api/chat/sessions/:id
   * Get all messages for a specific chat session.
   */
  async getSessionMessages(req, res) {
    try {
      const sessionId = parseInt(req.params.id, 10);
      if (isNaN(sessionId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid session ID.",
        });
      }

      const messages = await chatService.getSessionMessages(sessionId);
      return res.json({ success: true, data: messages });
    } catch (err) {
      console.error("[ChatController] Error getting messages:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to load session messages.",
      });
    }
  },

  /**
   * GET /api/chat/llm-status
   * Checks if Gemini is active or if terminal is running in Local Extractive mode.
   */
  async getLlmStatus(req, res) {
    try {
      const test = req.query.test === "true";
      const status = await chatService.getLlmStatus(test);
      return res.json({ success: true, data: status });
    } catch (err) {
      console.error("[ChatController] Error getting LLM status:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to fetch LLM engine status",
      });
    }
  },

  /**
   * POST /api/chat/llm-key
   * Validates and sets Gemini API key.
   */
  async setLlmKey(req, res) {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ success: false, error: "apiKey is required" });
      }
      const result = await chatService.setLlmKey(apiKey);
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error("[ChatController] Error setting LLM key:", err);
      return res.status(400).json({
        success: false,
        error: err.message || "Failed to validate and save Gemini API key",
      });
    }
  },
};

