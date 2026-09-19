import dotenv from "dotenv";

// Load variables from .env file into process.env
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/financial_terminal",
  jwtSecret: process.env.JWT_SECRET || "fallback_secret_key_terminal_2026",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  ragServiceUrl: process.env.RAG_SERVICE_URL || "http://localhost:8000",
};
