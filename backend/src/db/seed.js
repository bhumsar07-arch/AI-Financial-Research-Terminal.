import { eq } from "drizzle-orm";
import { db, queryClient } from "./index.js";
import { companies } from "./schema/index.js";

// Database Seeder
// Ensures anchor company (ITC Limited) profile exists in the database.
// Financial statements and chunks are extracted directly from official filings
// via the Python ingestion pipeline: python -m app.ingestion.pipeline
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
      console.log(`[Seed] Company ITC already exists with ID: ${companyId}.`);
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

    console.log("[Seed] Anchor company profile ensured. Document filings and statements synced via Python ingestion pipeline.");
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
