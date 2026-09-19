import { pgTable, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { companies } from "./companies.js";

// Table: watchlists
// Stores user bookmarked companies
export const watchlists = pgTable(
  "watchlists",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userCompanyIdx: uniqueIndex("idx_watchlist_user_company").on(table.userId, table.companyId),
  })
);
