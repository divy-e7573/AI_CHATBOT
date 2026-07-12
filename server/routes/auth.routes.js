import { Router } from "express";

import { signup, login, logout } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Example protected route: returns the authenticated user's id.
router.get("/me", authMiddleware, (req, res) => {
  res.json({ userId: req.userId });
});

export default router;
