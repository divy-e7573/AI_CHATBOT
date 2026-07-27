import fs from "fs/promises";
import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import { ingestDocument } from "../services/ragService.js";

/**
 * POST /api/upload
 * Multipart form: field "file" (PDF/TXT) + body field "conversationId".
 * Requires auth (req.userId is set by authMiddleware).
 */
export const uploadDocument = async (req, res, next) => {
  const filePath = req.file?.path;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No file uploaded. Send it in the 'file' field." });
    }

    const { conversationId } = req.body ?? {};
    if (!conversationId || !mongoose.isValidObjectId(conversationId)) {
      return res
        .status(400)
        .json({ message: "A valid conversationId is required." });
    }

    // Ensure the conversation exists and belongs to the requesting user.
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.userId,
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const { documentId, chunkCount, vectorIndexed } = await ingestDocument({
      filePath: req.file.path,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      userId: req.userId,
      conversationId,
    });

    return res.status(201).json({
      status: "processed",
      documentId,
      chunkCount,
      vectorIndexed,
      filename: req.file.originalname,
    });
  } catch (err) {
    return next(err);
  } finally {
    // The extracted chunks are persisted in MongoDB; the temporary original
    // file is no longer needed after either success or failure.
    if (filePath) {
      await fs.unlink(filePath).catch(() => {});
    }
  }
};
