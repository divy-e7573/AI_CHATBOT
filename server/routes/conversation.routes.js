import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import {
  editMessage,
  regenerateMessage,
  sendMessage,
} from "../controllers/chatController.js";
import {
  listConversations,
  createConversation,
  renameConversation,
  getMessages,
  deleteConversation,
} from "../controllers/conversationController.js";

const router = Router();

// All conversation routes require auth.
router.use(authMiddleware);

// Mounted at /api/conversations in server.js
router.get("/", listConversations);
router.post("/", createConversation);
router.patch("/:id", renameConversation);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.patch("/:id/messages/:messageId", editMessage);
router.post("/:id/messages/:messageId/regenerate", regenerateMessage);
router.delete("/:id", deleteConversation);

export default router;
