import { Router } from "express";
import { sql } from "../config/database.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const router = Router();

// GET /api/health
// Verifies Express server and PostgreSQL connection health
router.get("/health", async (req, res) => {
  try {
    // Run a lightweight query to test PostgreSQL connection
    const result = await sql`SELECT 1 as connected, NOW() as current_time;`;

    return successResponse(
      res,
      {
        status: "healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          queryTime: result[0]?.current_time,
        },
      },
      "Express API and PostgreSQL are running normally"
    );
  } catch (err) {
    console.error("Database health check failed:", err.message);
    return errorResponse(
      res,
      "Express is running but could not connect to PostgreSQL database",
      503,
      "DATABASE_UNAVAILABLE"
    );
  }
});

export default router;
