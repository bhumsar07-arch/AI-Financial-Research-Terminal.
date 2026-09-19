import app from "./app.js";
import { config } from "./config/env.js";
import { queryClient } from "./config/database.js";

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Financial Terminal API Server Running`);
  console.log(`📍 Port:        http://localhost:${config.port}`);
  console.log(`🩺 Health API:  http://localhost:${config.port}/api/health`);
  console.log(`🔐 Auth API:    http://localhost:${config.port}/api/auth`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`====================================================`);
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Closing HTTP server gracefully...`);
  server.close(async () => {
    console.log("[Server] HTTP server closed.");
    try {
      await queryClient.end();
      console.log("[Database] PostgreSQL connection pool closed.");
    } catch (err) {
      console.error("[Database] Error closing PostgreSQL connection:", err);
    }
    process.exit(0);
  });
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
