import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "./env.js";
import * as schema from "../db/schema/index.js";

// Create connection client for PostgreSQL
// max: maximum number of connections in the pool
export const queryClient = postgres(config.databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Alias sql for convenience
export const sql = queryClient;

// Initialize Drizzle ORM instance with full schema definition
export const db = drizzle(queryClient, { schema });
