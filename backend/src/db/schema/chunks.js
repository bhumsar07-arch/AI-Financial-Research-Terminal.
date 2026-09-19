import { pgTable, serial, integer, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { documents } from "./documents.js";
import { companies } from "./companies.js";

// Table: document_chunks
// Stores text chunks and metadata for RAG retrieval
// In Sprint 5, the embedding column is migrated to native pgvector: vector(1536)
export const documentChunks = pgTable("document_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  companyId: integer("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count").notNull(),
  pageNumber: integer("page_number"),
  speakerName: varchar("speaker_name", { length: 100 }),
  speakerRole: varchar("speaker_role", { length: 100 }),
  isManagement: boolean("is_management").default(false),
  section: varchar("section", { length: 100 }),
  embedding: text("embedding"), // Holds serialized vector or converted to native vector in Sprint 5
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
