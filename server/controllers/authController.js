import bcrypt from "bcryptjs";

import User from "../models/User.js";
import {
  signToken,
  setTokenCookie,
  clearTokenCookie,
} from "../utils/token.js";
import { validateSignup, validateLogin } from "../utils/validators.js";

const SALT_ROUNDS = 10;

// Shape the user object returned to the client (never expose passwordHash).
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

/**
 * POST /api/auth/signup
 * Hash the password, create the user, set an httpOnly cookie, and return a JWT.
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {};

    const errors = validateSignup({ name, email, password });
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = signToken(user._id.toString());
    setTokenCookie(res, token);

    return res.status(201).json({ user: toPublicUser(user), token });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/login
 * Verify credentials, set an httpOnly cookie, and return a JWT.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    const errors = validateLogin({ email, password });
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Same message for missing user vs. bad password to avoid user enumeration.
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user._id.toString());
    setTokenCookie(res, token);

    return res.status(200).json({ user: toPublicUser(user), token });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clear the auth cookie.
 */
export const logout = async (req, res) => {
  clearTokenCookie(res);
  return res.status(200).json({ message: "Logged out." });
};
