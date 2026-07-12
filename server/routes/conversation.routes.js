import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { sendMessage } from "../controllers/chatController.js";

const router = Router();

// POST /api/conversations/:id/messages  (mounted at /api/conversations)
router.post("/:id/messages", authMiddleware, sendMessage);

export default router;
