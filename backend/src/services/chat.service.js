import { db } from "../db/index.js";
import { chatSessions, chatMessages } from "../db/schema/chats.js";
import { companies } from "../db/schema/companies.js";
import { eq, desc } from "drizzle-orm";

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:8000";

/**
 * Chat Service — Session management and RAG proxy for AI Analyst.
 */
export const chatService = {
  /**
   * Create a new chat session for a user + company.
   */
  async createSession(userId, companyId, title) {
    const [session] = await db
      .insert(chatSessions)
      .values({
        userId,
        companyId,
        title: title || "New Research Session",
      })
      .returning();
    return session;
  },

  /**
   * Get all sessions for a user, newest first.
   */
  async getUserSessions(userId) {
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
    return sessions;
  },

  /**
   * Get all messages for a specific session.
   */
  async getSessionMessages(sessionId) {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
    return messages;
  },

  /**
   * Core AI Analyst function:
   * 1. Stores the user's question in chat_messages.
   * 2. Calls the Python RAG service POST /query.
   * 3. Stores the AI answer + citations in chat_messages.
   * 4. Returns the full result.
   */
  async askAnalyst(userId, sessionId, companyId, question, ticker = "ITC") {
    // 1. Save user message
    const [userMsg] = await db
      .insert(chatMessages)
      .values({
        sessionId,
        role: "user",
        content: question,
        citations: null,
      })
      .returning();

    // 2. Call Python RAG service
    let ragResponse;
    try {
      const res = await fetch(`${RAG_SERVICE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: question,
          company_id: companyId,
          ticker: ticker,
          top_k: 5,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`RAG service error (${res.status}): ${errBody}`);
      }

      ragResponse = await res.json();
    } catch (err) {
      // If RAG service is down, store error message
      const [errorMsg] = await db
        .insert(chatMessages)
        .values({
          sessionId,
          role: "assistant",
          content:
            "I'm unable to connect to the AI analysis service right now. Please ensure the RAG service is running on port 8000 and try again.",
          citations: null,
        })
        .returning();

      return {
        userMessage: userMsg,
        assistantMessage: errorMsg,
        answer: errorMsg.content,
        error: err.message,
      };
    }

    // 3. Save assistant response with citations
    const [assistantMsg] = await db
      .insert(chatMessages)
      .values({
        sessionId,
        role: "assistant",
        content: ragResponse.answer,
        citations: JSON.stringify(ragResponse.citations || []),
      })
      .returning();

    // 4. Update session timestamp
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));

      return {
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        answer: ragResponse.answer,
        citations: ragResponse.citations || [],
        sourceCount: ragResponse.source_count,
        llmProvider: ragResponse.llm_provider,
        engineDetails: ragResponse.engine_details,
        concallAvailable: ragResponse.concall_available,
        documentsAvailable: ragResponse.documents_available,
      };
  },

  /**
   * Auto-create or retrieve an existing session for company research.
   */
  async getOrCreateSession(userId, companyId, ticker) {
    // Check if user already has a session for this company
    const existing = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));

    const companySession = existing.find(
      (s) => s.companyId === companyId
    );

    if (companySession) {
      return companySession;
    }

    // Create new session
    return await this.createSession(
      userId,
      companyId,
      `${ticker || "Company"} Research Analysis`
    );
  },

  /**
   * Check live LLM engine status (Gemini vs Local Extractive)
   */
  async getLlmStatus(test = false) {
    const res = await fetch(`${RAG_SERVICE_URL}/llm/status?test=${test}`);
    if (!res.ok) throw new Error("Failed to query RAG LLM status");
    return await res.json();
  },

  /**
   * Save and validate Gemini API Key
   */
  async setLlmKey(apiKey) {
    const res = await fetch(`${RAG_SERVICE_URL}/llm/set-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to update LLM key" }));
      throw new Error(err.detail || "Failed to update LLM key");
    }
    return await res.json();
  },
};

