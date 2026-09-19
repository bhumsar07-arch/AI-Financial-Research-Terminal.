import { pgTable, serial, integer, varchar, date, numeric, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

// Table: financial_metrics
// Stores reported statements and calculated financial ratios
export const financialMetrics = pgTable("financial_metrics", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  periodType: varchar("period_type", { length: 10 }).notNull(), // 'annual' or 'quarterly'
  fiscalYear: integer("fiscal_year").notNull(),
  fiscalQuarter: varchar("fiscal_quarter", { length: 5 }), // 'Q1', 'Q2', 'Q3', 'Q4', or null
  periodEndDate: date("period_end_date").notNull(),

  // Income Statement
  revenue: numeric("revenue", { precision: 15, scale: 2 }).notNull(),
  cogs: numeric("cogs", { precision: 15, scale: 2 }),
  grossProfit: numeric("gross_profit", { precision: 15, scale: 2 }),
  operatingExpenses: numeric("operating_expenses", { precision: 15, scale: 2 }),
  ebitda: numeric("ebitda", { precision: 15, scale: 2 }).notNull(),
  operatingProfit: numeric("operating_profit", { precision: 15, scale: 2 }).notNull(),
  depreciation: numeric("depreciation", { precision: 15, scale: 2 }),
  interestExpense: numeric("interest_expense", { precision: 15, scale: 2 }),
  taxExpense: numeric("tax_expense", { precision: 15, scale: 2 }),
  netProfit: numeric("net_profit", { precision: 15, scale: 2 }).notNull(),
  eps: numeric("eps", { precision: 10, scale: 2 }),

  // Balance Sheet
  totalAssets: numeric("total_assets", { precision: 15, scale: 2 }),
  currentAssets: numeric("current_assets", { precision: 15, scale: 2 }),
  totalDebt: numeric("total_debt", { precision: 15, scale: 2 }),
  totalLiabilities: numeric("total_liabilities", { precision: 15, scale: 2 }),
  shareholderEquity: numeric("shareholder_equity", { precision: 15, scale: 2 }),

  // Cash Flow
  operatingCashFlow: numeric("operating_cash_flow", { precision: 15, scale: 2 }),
  capitalExpenditure: numeric("capital_expenditure", { precision: 15, scale: 2 }),
  freeCashFlow: numeric("free_cash_flow", { precision: 15, scale: 2 }),

  // Derived Ratios (Calculated by backend deterministic code)
  grossMargin: numeric("gross_margin", { precision: 6, scale: 2 }),
  operatingMargin: numeric("operating_margin", { precision: 6, scale: 2 }),
  netMargin: numeric("net_margin", { precision: 6, scale: 2 }),
  roe: numeric("roe", { precision: 6, scale: 2 }),
  debtToEquity: numeric("debt_to_equity", { precision: 6, scale: 2 }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
