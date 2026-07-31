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

const TOP_K = 4;
const HISTORY_LIMIT = 6;

const sse = (res, payload) => {
  if (res.writableEnded || res.destroyed) return;
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const invalidId = (res, message) => res.status(400).json({ message });

const getOwnedConversation = (conversationId, userId) =>
  Conversation.findOne({ _id: conversationId, userId });

/**
 * Return a user message plus every message before/after it in deterministic
 * order. `_id` breaks ties when documents share the same millisecond.
 */
const getMessagePosition = async ({ conversationId, messageId }) => {
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1, _id: 1 })
    .lean();
  const index = messages.findIndex((message) => message._id.toString() === messageId);
  if (index < 0) return null;
  return {
    message: messages[index],
    previous: messages.slice(0, index),
    following: messages.slice(index + 1),
  };
};

const deleteFollowingMessages = async (following) => {
  if (!following.length) return [];
  const ids = following.map((message) => message._id);
  await Message.deleteMany({ _id: { $in: ids } });
  return ids.map((id) => id.toString());
};

/**
 * Shared SSE pipeline for a new message and a regenerated response.
 * `existingUserMessage` is set for regeneration; normal sends create it after
 * the stream so failed provider requests do not leave an empty conversation.
 */
const streamAssistantResponse = async ({
  req,
  res,
  conversation,
  content,
  priorMessages,
  existingUserMessage = null,
  shouldGenerateTitle = false,
}) => {
  const conversationId = conversation._id.toString();
  const chunks = await retrieveRelevantChunks({
    query: content,
    conversationId,
    topK: TOP_K,
  });
  const chatHistory = toCohereChatHistory(priorMessages.slice(-HISTORY_LIMIT));
  const preamble = buildPreamble(chunks);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  sse(res, {
    type: "sources",
    sources: chunks.map((chunk) => ({
      text: chunk.text,
      documentId: chunk.metadata?.documentId,
      chunkIndex: chunk.metadata?.chunkIndex,
      distance: chunk.distance,
    })),
  });

  const generationController = new AbortController();
  let clientClosed = false;
  const handleClientDisconnect = () => {
    if (clientClosed || res.writableEnded) return;
    clientClosed = true;
    generationController.abort();
  };

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
  } catch (streamError) {
    if (!clientClosed && !generationController.signal.aborted) {
      const message = streamError?.message || "";
      if (/image/i.test(message) && /support/i.test(message)) {
        sse(res, {
          type: "error",
          message: "This model does not support image input. Please send only text messages.",
        });
        return res.end();
      }
      throw streamError;
    }
  }

  const stopped = clientClosed || generationController.signal.aborted;
  const userMessage =
    existingUserMessage ||
    (await Message.create({ conversationId, role: "user", content }));

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
    const titleUpdate = await Conversation.updateOne(
      { _id: conversationId, title: "New conversation" },
      { $set: { title: generatedTitle, updatedAt: new Date() } }
    );
    if (titleUpdate.modifiedCount > 0) conversationTitle = generatedTitle;
  } else {
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { updatedAt: new Date() } }
    );
  }

  // A disconnected client still gets complete database persistence but never
  // receives another SSE frame.
  if (clientClosed || res.writableEnded || res.destroyed) return undefined;

  sse(res, {
    type: "done",
    userMessageId: userMessage._id,
    assistantMessageId: assistantMessage?._id ?? null,
    conversationTitle,
    stopped,
  });
  return res.end();
};

const handleStreamingError = (res, error, next) => {
  if (!res.headersSent) return next(error);
  console.error("[Conversation stream]", error);
  if (!res.writableEnded && !res.destroyed) {
    sse(res, { type: "error", message: "Generation failed. Please try again." });
    res.end();
  }
  return undefined;
};

/** POST /api/conversations/:id/messages */
export const sendMessage = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const content = (req.body?.content ?? req.body?.message ?? "").trim();
    if (!mongoose.isValidObjectId(conversationId)) {
      return invalidId(res, "Invalid conversation id.");
    }
    if (!content) {
      return res.status(400).json({ message: "Message content is required." });
    }

    const conversation = await getOwnedConversation(conversationId, req.userId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    const priorMessages = await Message.find({ conversationId })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    return await streamAssistantResponse({
      req,
      res,
      conversation,
      content,
      priorMessages,
      shouldGenerateTitle:
        priorMessages.length === 0 && conversation.title === "New conversation",
    });
  } catch (error) {
    return handleStreamingError(res, error, next);
  }
};

/** PATCH /api/conversations/:id/messages/:messageId */
export const editMessage = async (req, res, next) => {
  try {
    const { id: conversationId, messageId } = req.params;
    if (!mongoose.isValidObjectId(conversationId) || !mongoose.isValidObjectId(messageId)) {
      return invalidId(res, "Invalid conversation or message id.");
    }
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) {
      return res.status(400).json({ message: "Message content is required." });
    }

    const conversation = await getOwnedConversation(conversationId, req.userId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    const position = await getMessagePosition({ conversationId, messageId });
    if (!position || position.message.role !== "user") {
      return res.status(404).json({ message: "User message not found." });
    }

    const deletedMessageIds = await deleteFollowingMessages(position.following);
    const message = await Message.findByIdAndUpdate(
      messageId,
      { $set: { content } },
      { new: true, runValidators: true }
    ).lean();
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { updatedAt: new Date() } }
    );

    return res.status(200).json({ message, deletedMessageIds });
  } catch (error) {
    return next(error);
  }
};

/** POST /api/conversations/:id/messages/:messageId/regenerate */
export const regenerateMessage = async (req, res, next) => {
  try {
    const { id: conversationId, messageId } = req.params;
    if (!mongoose.isValidObjectId(conversationId) || !mongoose.isValidObjectId(messageId)) {
      return invalidId(res, "Invalid conversation or message id.");
    }
    const conversation = await getOwnedConversation(conversationId, req.userId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    const position = await getMessagePosition({ conversationId, messageId });
    if (!position || position.message.role !== "user") {
      return res.status(404).json({ message: "User message not found." });
    }

    // The previous answer and every downstream turn were based on the old
    // branch, so regeneration starts a clean continuation from this message.
    await deleteFollowingMessages(position.following);
    return await streamAssistantResponse({
      req,
      res,
      conversation,
      content: position.message.content,
      priorMessages: position.previous,
      existingUserMessage: position.message,
    });
  } catch (error) {
    return handleStreamingError(res, error, next);
  }
};
