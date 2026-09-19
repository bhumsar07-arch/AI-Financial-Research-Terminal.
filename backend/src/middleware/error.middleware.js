import { errorResponse } from "../utils/apiResponse.js";

// Centralized error handling middleware for Express
// Any unhandled error passed to next(err) will be caught here
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message || err);

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "An unexpected error occurred on the server";

  return errorResponse(res, message, statusCode, errorCode);
};
