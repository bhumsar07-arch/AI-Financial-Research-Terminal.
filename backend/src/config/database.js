import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "./env.js";
import * as schema from "../db/schema/index.js";

const isCloudDb =
  config.databaseUrl.includes("supabase.co") ||
  config.databaseUrl.includes("neon.tech") ||
  config.databaseUrl.includes("render.com") ||
  config.databaseUrl.includes("sslmode=require");

// Create connection client for PostgreSQL
// max: maximum number of connections in the pool
export const queryClient = postgres(config.databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: isCloudDb ? "require" : undefined,
});

// Alias sql for convenience
export const sql = queryClient;

// Initialize Drizzle ORM instance with full schema definition
export const db = drizzle(queryClient, { schema });
