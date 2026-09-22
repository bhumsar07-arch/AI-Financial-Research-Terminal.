import { verifyToken, getUserById } from "../services/auth.service.js";
import { errorResponse } from "../utils/apiResponse.js";

// Middleware: Authenticate incoming requests using Bearer JWT
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // Check if Authorization header is present and begins with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // In local development mode only, provide seamless fallback to default user if configured
      if (process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
        const devUser = await getUserById(1);
        if (devUser) {
          req.user = devUser;
          return next();
        }
      }

      return errorResponse(
        res,
        "Authentication required. Please provide a valid Bearer token in the Authorization header.",
        401,
        "TOKEN_MISSING"
      );
    }

    // Extract the token string after "Bearer "
    const token = authHeader.split(" ")[1];

    if (!token) {
      return errorResponse(res, "Access token is empty", 401, "TOKEN_EMPTY");
    }

    // Verify token signature and expiration
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtError) {
      if (process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
        const devUser = await getUserById(1);
        if (devUser) {
          req.user = devUser;
          return next();
        }
      }
      if (jwtError.name === "TokenExpiredError") {
        return errorResponse(res, "Authentication token has expired. Please log in again.", 401, "TOKEN_EXPIRED");
      }
      return errorResponse(res, "Invalid authentication token signature.", 401, "TOKEN_INVALID");
    }

    // Fetch user from database to ensure account still exists
    const user = await getUserById(decoded.sub);
    if (!user) {
      return errorResponse(res, "User account no longer exists.", 401, "USER_NOT_FOUND");
    }

    // Attach user object to request for downstream route handlers
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
