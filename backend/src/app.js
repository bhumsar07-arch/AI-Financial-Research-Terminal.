import express from "express";
import cors from "cors";
import helmet from "helmet";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { errorResponse } from "./utils/apiResponse.js";

// Initialize Express application
const app = express();

// 1. Security Middleware
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS)
// Allows our React frontend on port 5173 to communicate with Express on port 5000
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// 3. Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Simple Request Logger (Useful for debugging in development)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 5. Mount API Routes
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/chat", chatRoutes);

// 6. Handle 404 for Unknown Routes
app.use((req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, "ROUTE_NOT_FOUND");
});

// 7. Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

export default app;
