import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { retrieveRelevantChunks } from "../services/ragService.js";
import {
  buildPreamble,
  deriveConversationTitle,
  generateConversationTitle,
  toCohereChatHistory,
  streamChat,
} from "../services/chatService.js";

const TOP_K = 4; // relevant chunks to retrieve
const HISTORY_LIMIT = 6; // prior messages to include as chat history

// Write a single SSE event.
const sse = (res, payload) => {
  if (res.writableEnded || res.destroyed) return;
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
    const shouldGenerateTitle =
      priorMessages.length === 0 && conversation.title === "New conversation";

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

    const generationController = new AbortController();
    let clientClosed = false;
    const handleClientDisconnect = () => {
      if (clientClosed || res.writableEnded) return;
      clientClosed = true;
      generationController.abort();
    };

    // `res.close` is the reliable signal for a client that aborts an SSE
    // response. Keep the request listeners as well for clients that close
    // while the request is still being received.
    req.on("aborted", handleClientDisconnect);
    req.on("close", () => {
      if (req.aborted) handleClientDisconnect();
    });
    res.on("close", handleClientDisconnect);

    let assistantText = "";
    try {
      for await (const text of streamChat({
        message: content,
        preamble,
        chatHistory,
        signal: generationController.signal,
      })) {
        if (clientClosed) break;
        assistantText += text;
        sse(res, { type: "token", text });
      }
    } catch (streamErr) {
      // Aborting the provider request is expected when the browser presses
      // Stop generating or disconnects. Persist the partial answer below.
      if (clientClosed || generationController.signal.aborted) {
        // continue to persistence
      } else {
        // Cohere may reject the request if it detects non-text content
        // (e.g. "does not support image input"). Surface a clear message
        // instead of a cryptic upstream error.
        const msg = streamErr?.message || "";
        if (/image/i.test(msg) && /support/i.test(msg)) {
          sse(res, {
            type: "error",
            message:
              "This model does not support image input. Please send only text messages.",
          });
          return res.end();
        }
        throw streamErr; // re-throw for the outer catch
      }
    }

    const stopped = clientClosed || generationController.signal.aborted;

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
        stopped,
      });
    }

    let conversationTitle = null;
    if (shouldGenerateTitle && !stopped) {
      let generatedTitle;
      try {
        generatedTitle = await generateConversationTitle({
          userMessage: content,
          assistantMessage: assistantText,
        });
      } catch (titleError) {
        console.warn("[Chat] AI title generation failed; using fallback:", titleError.message);
      }
      generatedTitle = generatedTitle || deriveConversationTitle(content);

      // Only replace the untouched default. A manual rename made while the
      // answer was streaming always wins.
      const titleUpdate = await Conversation.updateOne(
        { _id: conversationId, title: "New conversation" },
        { $set: { title: generatedTitle, updatedAt: new Date() } }
      );
      if (titleUpdate.modifiedCount > 0) conversationTitle = generatedTitle;
    } else {
      // Bump conversation activity time so it sorts to the top of the list.
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { updatedAt: new Date() } }
      );
    }

    // The browser has already gone away, so never attempt another SSE write.
    if (clientClosed || res.writableEnded) return undefined;

    sse(res, {
      type: "done",
      userMessageId: userMessage._id,
      assistantMessageId: assistantMessage?._id ?? null,
      conversationTitle,
      stopped,
    });
    return res.end();
  } catch (err) {
    // If streaming already started we can't set a status code — emit an SSE error.
    if (res.headersSent) {
      console.error(`[POST /api/conversations/:id/messages] stream error:`, err);
      if (res.writableEnded || res.destroyed) return undefined;
      const msg = err?.message || "";
      if (/image/i.test(msg) && /support/i.test(msg)) {
        sse(res, {
          type: "error",
          message:
            "This model does not support image input. Please send only text messages.",
        });
      } else {
        sse(res, { type: "error", message: "Generation failed. Please try again." });
      }
      return res.end();
    }
    return next(err);
  }
};
