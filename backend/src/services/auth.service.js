import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { users } from "../db/schema/users.js";
import { config } from "../config/env.js";

// Salt rounds define how computationally hard the password hash is
const SALT_ROUNDS = 10;

// Helper: Hash a plain-text password using bcrypt
export const hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

// Helper: Compare plain-text password with stored hash
export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Helper: Generate a signed JSON Web Token (JWT)
export const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
};

// Helper: Verify a JWT and decode its payload
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

// Service: Register a new user
export const registerUser = async ({ name, email, password }) => {
  // Normalize email to lowercase
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser.length > 0) {
    const error = new Error("A user with this email address already exists");
    error.statusCode = 409;
    error.code = "EMAIL_ALREADY_EXISTS";
    throw error;
  }

  // 2. Hash the password
  const passwordHash = await hashPassword(password);

  // 3. Insert user into PostgreSQL
  const [newUser] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "analyst",
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

  // 4. Generate JWT for the new user
  const token = generateToken(newUser);

  return { user: newUser, token };
};

// Service: Authenticate user login
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  // If user does not exist, return generic error (prevents email enumeration attacks)
  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  // 2. Compare password with stored hash
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  // 3. Strip sensitive passwordHash before returning
  const sanitizedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  // 4. Generate JWT
  const token = generateToken(sanitizedUser);

  return { user: sanitizedUser, token };
};

// Service: Fetch user profile by ID
export const getUserById = async (userId) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
};
