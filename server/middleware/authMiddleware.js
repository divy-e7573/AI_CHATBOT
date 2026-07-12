import { verifyToken } from "../utils/token.js";

/**
 * Verify a JWT from either the httpOnly cookie or the Authorization header
 * ("Bearer <token>") and attach req.userId. Rejects with 401 if missing/invalid.
 */
const authMiddleware = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Fall back to the Authorization header if no cookie is present.
    if (!token) {
      const header = req.headers.authorization || "";
      if (header.startsWith("Bearer ")) {
        token = header.slice(7).trim();
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export default authMiddleware;
