import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

// Table: companies
// Stores publicly traded company profiles
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  ticker: varchar("ticker", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  exchange: varchar("exchange", { length: 50 }).notNull(),
  sector: varchar("sector", { length: 100 }).notNull(),
  industry: varchar("industry", { length: 100 }).notNull(),
  description: text("description"),
  currency: varchar("currency", { length: 10 }).default("INR").notNull(),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
