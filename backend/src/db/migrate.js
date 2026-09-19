import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, queryClient } from "./index.js";

// Automated migration runner using Drizzle ORM
async function runMigrations() {
  console.log("[Migration] Running automated database migrations...");
  try {
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("[Migration] Database schema migrations applied successfully! ✅");
  } catch (err) {
    console.error("[Migration] Error running migrations:", err);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

runMigrations();
