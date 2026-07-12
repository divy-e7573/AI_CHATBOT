import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { sendMessage } from "../controllers/chatController.js";
import {
  listConversations,
  createConversation,
  getMessages,
  deleteConversation,
} from "../controllers/conversationController.js";

const router = Router();

// All conversation routes require auth.
router.use(authMiddleware);

// Mounted at /api/conversations in server.js
router.get("/", listConversations);
router.post("/", createConversation);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.delete("/:id", deleteConversation);

export default router;
