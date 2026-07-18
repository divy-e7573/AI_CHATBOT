import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { retrieveRelevantChunks } from "../services/ragService.js";
import {
  buildPreamble,
  toCohereChatHistory,
  streamChat,
} from "../services/chatService.js";

const TOP_K = 4; // relevant chunks to retrieve
const HISTORY_LIMIT = 6; // prior messages to include as chat history

// Write a single SSE event.
const sse = (res, payload) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

/**
 * POST /api/conversations/:id/messages
 * Body: { content: string }
 *
 * RAG + streaming chat:
 *   embed query -> retrieve top-K chunks (this conversation) -> build preamble
 *   + last-6 history -> stream Cohere response over SSE -> persist both messages.
 */
export const sendMessage = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const content = (req.body?.content ?? req.body?.message ?? "").trim();

    // --- Validation (runs before we switch into SSE mode) ---
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id." });
    }
    if (!content) {
      return res.status(400).json({ message: "Message content is required." });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.userId,
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    // --- RAG retrieval + history (still safe to send JSON errors here) ---
    const chunks = await retrieveRelevantChunks({
      query: content,
      conversationId,
      topK: TOP_K,
    });

    const priorMessages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .lean();

    const chatHistory = toCohereChatHistory(priorMessages.reverse());
    const preamble = buildPreamble(chunks);

    // --- Switch to SSE; from here on, errors are sent as SSE events ---
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Surface the retrieved sources up front so the client can show citations.
    sse(res, {
      type: "sources",
      sources: chunks.map((c) => ({
        text: c.text,
        documentId: c.metadata?.documentId,
        chunkIndex: c.metadata?.chunkIndex,
        distance: c.distance,
      })),
    });

    let clientClosed = false;
    req.on("close", () => {
      clientClosed = true;
    });

    let assistantText = "";
    for await (const text of streamChat({ message: content, preamble, chatHistory })) {
      if (clientClosed) break;
      assistantText += text;
      sse(res, { type: "token", text });
    }

    // --- Persist both messages after streaming completes ---
    const userMessage = await Message.create({
      conversationId,
      role: "user",
      content,
    });

    let assistantMessage = null;
    if (assistantText.trim()) {
      assistantMessage = await Message.create({
        conversationId,
        role: "assistant",
        content: assistantText,
      });
    }

    // Bump conversation activity time so it sorts to the top of the list.
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { updatedAt: new Date() } }
    );

    sse(res, {
      type: "done",
      userMessageId: userMessage._id,
      assistantMessageId: assistantMessage?._id ?? null,
    });
    return res.end();
  } catch (err) {
    // If streaming already started we can't set a status code — emit an SSE error.
    if (res.headersSent) {
      console.error(`[POST /api/conversations/:id/messages] stream error:`, err);
      sse(res, { type: "error", message: "Generation failed. Please try again." });
      return res.end();
    }
    return next(err);
  }
};
