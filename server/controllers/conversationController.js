import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Document from "../models/Document.js";
import { deleteConversationVectors } from "../services/ragService.js";

// Fetch a conversation owned by the requester, or null.
const findOwnedConversation = (conversationId, userId) =>
  Conversation.findOne({ _id: conversationId, userId });

/**
 * GET /api/conversations
 * List the logged-in user's conversations, most recently active first.
 */
export const listConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .lean();
    return res.status(200).json({ conversations });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/conversations
 * Create a new (empty) conversation. Body: { title? }.
 */
export const createConversation = async (req, res, next) => {
  try {
    const rawTitle = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const conversation = await Conversation.create({
      userId: req.userId,
      ...(rawTitle ? { title: rawTitle } : {}),
    });
    return res.status(201).json({ conversation });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/conversations/:id/messages
 * Return all messages in a conversation, chronological order.
 */
export const getMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id." });
    }

    const conversation = await findOwnedConversation(conversationId, req.userId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({ messages });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/conversations/:id
 * Delete the conversation plus its messages, document records, and vectors.
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id." });
    }

    const conversation = await findOwnedConversation(conversationId, req.userId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    // Chroma is optional; cleanup there should not prevent deletion of the
    // conversation's source-of-truth MongoDB records.
    try {
      await deleteConversationVectors(conversationId);
    } catch (err) {
      console.warn("[RAG] Could not delete conversation vectors:", err.message);
    }

    await Promise.all([
      Message.deleteMany({ conversationId }),
      Document.deleteMany({ conversationId }),
    ]);

    await Conversation.deleteOne({ _id: conversationId });

    return res.status(200).json({ message: "Conversation deleted." });
  } catch (err) {
    return next(err);
  }
};
