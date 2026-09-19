import * as authService from "../services/auth.service.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// Helper: Basic email validation regex
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation checks
    if (!name || name.trim().length === 0) {
      return errorResponse(res, "Full name is required", 400, "VALIDATION_ERROR");
    }

    if (!email || !isValidEmail(email)) {
      return errorResponse(res, "A valid email address is required", 400, "VALIDATION_ERROR");
    }

    if (!password || password.length < 8) {
      return errorResponse(res, "Password must be at least 8 characters long", 400, "VALIDATION_ERROR");
    }

    // 2. Call service layer
    const result = await authService.registerUser({ name, email, password });

    return successResponse(
      res,
      result,
      "User account created successfully",
      201
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validation checks
    if (!email || !password) {
      return errorResponse(res, "Email and password are required", 400, "VALIDATION_ERROR");
    }

    // 2. Call service layer
    const result = await authService.loginUser({ email, password });

    return successResponse(
      res,
      result,
      "Login successful",
      200
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
// Returns the profile of the currently authenticated user
export const getMe = async (req, res, next) => {
  try {
    // req.user was populated by authenticateToken middleware
    return successResponse(
      res,
      req.user,
      "Current user profile retrieved",
      200
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    // With stateless JWT, the client discards the token.
    // In production, token blacklisting or cookie clearing happens here.
    return successResponse(
      res,
      null,
      "Logged out successfully. Client should discard the stored token.",
      200
    );
  } catch (err) {
    next(err);
  }
};
