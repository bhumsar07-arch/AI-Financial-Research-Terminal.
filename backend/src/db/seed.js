import { eq } from "drizzle-orm";
import { db, queryClient } from "./index.js";
import { companies, financialMetrics } from "./schema/index.js";
import { calculateAllRatios } from "../services/financial.service.js";

// Database Seeder
// This script adds sample company and financial data for ITC Limited to the database.
// You can run it anytime with: npm run db:seed

export async function seedDatabase() {
  console.log("[Seed] Starting database seeding...");

  try {
    // 1. Check if ITC already exists in the companies table
    const existingCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.ticker, "ITC"));

    let companyId;

    if (existingCompanies.length > 0) {
      companyId = existingCompanies[0].id;
      console.log(`[Seed] Company ITC already exists with ID: ${companyId}. Cleaning up old financial metrics...`);
      // Delete old financial records for ITC to avoid duplicates
      await db.delete(financialMetrics).where(eq(financialMetrics.companyId, companyId));
    } else {
      console.log("[Seed] Inserting ITC Limited company profile...");
      const [insertedCompany] = await db
        .insert(companies)
        .values({
          ticker: "ITC",
          name: "ITC Limited",
          exchange: "NSE",
          sector: "Consumer Goods",
          industry: "Tobacco & FMCG",
          description:
            "ITC Limited is one of India's foremost private sector companies and a multi-business conglomerate with market-leading presence in FMCG, Hotels, Packaging, Paperboards & Specialty Papers, and Agri-Business.",
          currency: "INR",
          website: "https://www.itcportal.com",
        })
        .returning();

      companyId = insertedCompany.id;
      console.log(`[Seed] Created ITC with ID: ${companyId}`);
    }

    // 2. Prepare Historical Annual Financial Statements (FY2021 to FY2025)
    // Numbers in INR Crores
    const annualStatements = [
      {
        fiscalYear: 2021,
        periodType: "annual",
        fiscalQuarter: null,
        periodEndDate: "2021-03-31",
        revenue: "49257.44",
        cogs: "21890.12",
        grossProfit: "27367.32",
        operatingExpenses: "11845.20",
        ebitda: "17003.50",
        operatingProfit: "15522.12",
        depreciation: "1481.38",
        interestExpense: "45.48",
        taxExpense: "4048.80",
        netProfit: "13161.19",
        eps: "10.70",
        totalAssets: "75260.00",
        currentAssets: "30420.00",
        totalDebt: "5.60",
        totalLiabilities: "16250.00",
        shareholderEquity: "59010.00",
        operatingCashFlow: "12527.00",
        capitalExpenditure: "1980.00",
      },
      {
        fiscalYear: 2022,
        periodType: "annual",
        fiscalQuarter: null,
        periodEndDate: "2022-03-31",
        revenue: "60668.09",
        cogs: "28430.45",
        grossProfit: "32237.64",
        operatingExpenses: "13247.10",
        ebitda: "20659.10",
        operatingProfit: "18990.54",
        depreciation: "1668.56",
        interestExpense: "42.01",
        taxExpense: "4771.40",
        netProfit: "15242.66",
        eps: "12.37",
        totalAssets: "79150.00",
        currentAssets: "32510.00",
        totalDebt: "5.20",
        totalLiabilities: "17750.00",
        shareholderEquity: "61400.00",
        operatingCashFlow: "14808.00",
        capitalExpenditure: "2120.00",
      },
      {
        fiscalYear: 2023,
        periodType: "annual",
        fiscalQuarter: null,
        periodEndDate: "2023-03-31",
        revenue: "70919.00",
        cogs: "31742.00",
        grossProfit: "39177.00",
        operatingExpenses: "14780.00",
        ebitda: "26040.00",
        operatingProfit: "24397.00",
        depreciation: "1643.00",
        interestExpense: "42.00",
        taxExpense: "6220.00",
        netProfit: "19192.00",
        eps: "15.48",
        totalAssets: "87580.00",
        currentAssets: "35120.00",
        totalDebt: "4.80",
        totalLiabilities: "18780.00",
        shareholderEquity: "68800.00",
        operatingCashFlow: "17850.00",
        capitalExpenditure: "2350.00",
      },
      {
        fiscalYear: 2024,
        periodType: "annual",
        fiscalQuarter: null,
        periodEndDate: "2024-03-31",
        revenue: "76825.00",
        cogs: "33325.00",
        grossProfit: "43500.00",
        operatingExpenses: "17350.00",
        ebitda: "26150.00",
        operatingProfit: "24800.00",
        depreciation: "1350.00",
        interestExpense: "45.00",
        taxExpense: "6510.00",
        netProfit: "20450.00",
        eps: "16.42",
        totalAssets: "93400.00",
        currentAssets: "38200.00",
        totalDebt: "50.00",
        totalLiabilities: "20900.00",
        shareholderEquity: "72500.00",
        operatingCashFlow: "21300.00",
        capitalExpenditure: "2400.00",
      },
      {
        fiscalYear: 2025,
        periodType: "annual",
        fiscalQuarter: null,
        periodEndDate: "2025-03-31",
        revenue: "83500.00",
        cogs: "36000.00",
        grossProfit: "47500.00",
        operatingExpenses: "18700.00",
        ebitda: "28800.00",
        operatingProfit: "27200.00",
        depreciation: "1600.00",
        interestExpense: "48.00",
        taxExpense: "7100.00",
        netProfit: "22150.00",
        eps: "17.75",
        totalAssets: "99800.00",
        currentAssets: "41200.00",
        totalDebt: "45.00",
        totalLiabilities: "22800.00",
        shareholderEquity: "77000.00",
        operatingCashFlow: "23500.00",
        capitalExpenditure: "2600.00",
      },
    ];

    // 3. Prepare FY2024 Quarterly Statements (Q1 to Q4)
    const quarterlyStatements = [
      {
        fiscalYear: 2024,
        periodType: "quarterly",
        fiscalQuarter: "Q1",
        periodEndDate: "2023-06-30",
        revenue: "18220.00",
        cogs: "7970.00",
        grossProfit: "10250.00",
        operatingExpenses: "4350.00",
        ebitda: "6250.00",
        operatingProfit: "5900.00",
        depreciation: "350.00",
        interestExpense: "11.00",
        taxExpense: "1536.00",
        netProfit: "4903.00",
        eps: "3.94",
        totalAssets: "89500.00",
        currentAssets: "36000.00",
        totalDebt: "48.00",
        totalLiabilities: "19500.00",
        shareholderEquity: "70000.00",
        operatingCashFlow: "4800.00",
        capitalExpenditure: "550.00",
      },
      {
        fiscalYear: 2024,
        periodType: "quarterly",
        fiscalQuarter: "Q2",
        periodEndDate: "2023-09-30",
        revenue: "19270.00",
        cogs: "8420.00",
        grossProfit: "10850.00",
        operatingExpenses: "4400.00",
        ebitda: "6450.00",
        operatingProfit: "6100.00",
        depreciation: "350.00",
        interestExpense: "11.00",
        taxExpense: "1562.00",
        netProfit: "4927.00",
        eps: "3.96",
        totalAssets: "90800.00",
        currentAssets: "36800.00",
        totalDebt: "49.00",
        totalLiabilities: "20000.00",
        shareholderEquity: "70800.00",
        operatingCashFlow: "5100.00",
        capitalExpenditure: "580.00",
      },
      {
        fiscalYear: 2024,
        periodType: "quarterly",
        fiscalQuarter: "Q3",
        periodEndDate: "2023-12-31",
        revenue: "19485.00",
        cogs: "8385.00",
        grossProfit: "11100.00",
        operatingExpenses: "4500.00",
        ebitda: "6600.00",
        operatingProfit: "6250.00",
        depreciation: "350.00",
        interestExpense: "11.50",
        taxExpense: "1653.50",
        netProfit: "5335.00",
        eps: "4.28",
        totalAssets: "92100.00",
        currentAssets: "37400.00",
        totalDebt: "50.00",
        totalLiabilities: "20500.00",
        shareholderEquity: "71600.00",
        operatingCashFlow: "5400.00",
        capitalExpenditure: "620.00",
      },
      {
        fiscalYear: 2024,
        periodType: "quarterly",
        fiscalQuarter: "Q4",
        periodEndDate: "2024-03-31",
        revenue: "19850.00",
        cogs: "8550.00",
        grossProfit: "11300.00",
        operatingExpenses: "4450.00",
        ebitda: "6850.00",
        operatingProfit: "6550.00",
        depreciation: "300.00",
        interestExpense: "11.50",
        taxExpense: "1758.50",
        netProfit: "5285.00",
        eps: "4.24",
        totalAssets: "93400.00",
        currentAssets: "38200.00",
        totalDebt: "50.00",
        totalLiabilities: "20900.00",
        shareholderEquity: "72500.00",
        operatingCashFlow: "6000.00",
        capitalExpenditure: "650.00",
      },
    ];

    const allStatements = [...annualStatements, ...quarterlyStatements];

    // 4. Calculate deterministic ratios and insert each row
    for (const stmt of allStatements) {
      const ratios = calculateAllRatios(stmt);

      await db.insert(financialMetrics).values({
        companyId,
        periodType: stmt.periodType,
        fiscalYear: stmt.fiscalYear,
        fiscalQuarter: stmt.fiscalQuarter,
        periodEndDate: stmt.periodEndDate,
        revenue: stmt.revenue,
        cogs: stmt.cogs,
        grossProfit: stmt.grossProfit,
        operatingExpenses: stmt.operatingExpenses,
        ebitda: stmt.ebitda,
        operatingProfit: stmt.operatingProfit,
        depreciation: stmt.depreciation,
        interestExpense: stmt.interestExpense,
        taxExpense: stmt.taxExpense,
        netProfit: stmt.netProfit,
        eps: stmt.eps,
        totalAssets: stmt.totalAssets,
        currentAssets: stmt.currentAssets,
        totalDebt: stmt.totalDebt,
        totalLiabilities: stmt.totalLiabilities,
        shareholderEquity: stmt.shareholderEquity,
        operatingCashFlow: stmt.operatingCashFlow,
        capitalExpenditure: stmt.capitalExpenditure,
        freeCashFlow: String(ratios.freeCashFlow),
        grossMargin: String(ratios.grossMargin),
        operatingMargin: String(ratios.operatingMargin),
        netMargin: String(ratios.netMargin),
        roe: String(ratios.roe),
        debtToEquity: String(ratios.debtToEquity),
      });
    }

    console.log(`[Seed] Successfully inserted ${allStatements.length} financial statement periods for ITC! ✅`);
    console.log("[Seed] Database seeding completed successfully! 🌟");
  } catch (err) {
    console.error("[Seed] Error seeding database:", err);
    throw err;
  }
}

// Allow running directly from terminal: node src/db/seed.js
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  seedDatabase()
    .then(async () => {
      await queryClient.end();
      process.exit(0);
    })
    .catch(async () => {
      await queryClient.end();
      process.exit(1);
    });
}
