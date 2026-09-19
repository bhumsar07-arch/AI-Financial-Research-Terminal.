import { eq, or, ilike, and, asc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { companies, financialMetrics } from "../db/schema/index.js";

// Company Service
// Handles database queries for company profiles and financial statements.

// Helper to convert number strings from database to JavaScript numbers
const toNumber = (val) => {
  if (val === null || val === undefined) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

// 1. Search companies by ticker or name
export const searchCompanies = async (query = "") => {
  const cleanQuery = query.trim();

  let queryBuilder = db
    .select({
      id: companies.id,
      ticker: companies.ticker,
      name: companies.name,
      exchange: companies.exchange,
      sector: companies.sector,
      industry: companies.industry,
    })
    .from(companies);

  if (cleanQuery) {
    queryBuilder = queryBuilder.where(
      or(
        ilike(companies.ticker, `%${cleanQuery}%`),
        ilike(companies.name, `%${cleanQuery}%`)
      )
    );
  }

  const results = await queryBuilder.limit(20);
  return results;
};

// 2. Get single company details by ticker
export const getCompanyByTicker = async (ticker) => {
  if (!ticker) return null;
  const upperTicker = ticker.trim().toUpperCase();

  const [company] = await db
    .select({
      id: companies.id,
      ticker: companies.ticker,
      name: companies.name,
      exchange: companies.exchange,
      sector: companies.sector,
      industry: companies.industry,
      description: companies.description,
      currency: companies.currency,
      website: companies.website,
    })
    .from(companies)
    .where(sql`upper(${companies.ticker}) = ${upperTicker}`);

  return company || null;
};

// 3. Get financial statements and computed ratios for a company
export const getCompanyFinancials = async (ticker, periodType = "annual") => {
  const company = await getCompanyByTicker(ticker);
  if (!company) {
    return null;
  }

  // Validate periodType: only 'annual' or 'quarterly' allowed
  const cleanPeriod = periodType.toLowerCase() === "quarterly" ? "quarterly" : "annual";

  const rows = await db
    .select()
    .from(financialMetrics)
    .where(
      and(
        eq(financialMetrics.companyId, company.id),
        eq(financialMetrics.periodType, cleanPeriod)
      )
    )
    .orderBy(asc(financialMetrics.fiscalYear), asc(financialMetrics.periodEndDate));

  // Format the output structure with clean numeric values
  const periods = rows.map((row) => ({
    id: row.id,
    fiscalYear: row.fiscalYear,
    fiscalQuarter: row.fiscalQuarter,
    periodEndDate: row.periodEndDate,
    revenue: toNumber(row.revenue),
    cogs: toNumber(row.cogs),
    grossProfit: toNumber(row.grossProfit),
    operatingExpenses: toNumber(row.operatingExpenses),
    ebitda: toNumber(row.ebitda),
    operatingProfit: toNumber(row.operatingProfit),
    depreciation: toNumber(row.depreciation),
    interestExpense: toNumber(row.interestExpense),
    taxExpense: toNumber(row.taxExpense),
    netProfit: toNumber(row.netProfit),
    eps: toNumber(row.eps),
    totalAssets: toNumber(row.totalAssets),
    currentAssets: toNumber(row.currentAssets),
    totalDebt: toNumber(row.totalDebt),
    totalLiabilities: toNumber(row.totalLiabilities),
    shareholderEquity: toNumber(row.shareholderEquity),
    operatingCashFlow: toNumber(row.operatingCashFlow),
    capitalExpenditure: toNumber(row.capitalExpenditure),
    ratios: {
      grossMargin: toNumber(row.grossMargin),
      operatingMargin: toNumber(row.operatingMargin),
      netMargin: toNumber(row.netMargin),
      roe: toNumber(row.roe),
      debtToEquity: toNumber(row.debtToEquity),
      freeCashFlow: toNumber(row.freeCashFlow),
    },
  }));

  return {
    companyId: company.id,
    ticker: company.ticker,
    name: company.name,
    currency: company.currency,
    periodType: cleanPeriod,
    periods,
  };
};
