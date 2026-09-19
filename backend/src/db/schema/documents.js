import { pgTable, serial, integer, varchar, text, date, bigint, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

// Table: documents
// Stores metadata for filings, annual reports, and transcripts
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(), // 'annual_report', 'conference_call_transcript', etc.
  fiscalYear: integer("fiscal_year").notNull(),
  fiscalQuarter: varchar("fiscal_quarter", { length: 5 }), // 'Q1', 'Q2', etc.
  documentDate: date("document_date").notNull(),
  sourceUrl: text("source_url"),
  filePath: text("file_path"),
  pageCount: integer("page_count"),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
