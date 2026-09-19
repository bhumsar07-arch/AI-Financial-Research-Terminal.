import { pgTable, serial, integer, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { companies } from "./companies.js";

// Table: chat_sessions
// Stores conversation threads created by users
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  companyId: integer("company_id")
    .references(() => companies.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Table: chat_messages
// Stores turns, queries, answers, and structured citation links
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => chatSessions.id, { onDelete: "cascade" })
    .notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  citations: jsonb("citations"), // Array of citation objects
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
