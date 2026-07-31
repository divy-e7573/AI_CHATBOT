import { streamChat as streamCohereChat } from "../chatService.js";
import { toTextMessages } from "./streamUtils.js";

/** Normalize Cohere's SDK stream to the common provider interface. */
export async function* streamChat({ messages, context, signal }) {
  const chatMessages = toTextMessages(messages);
  const lastMessage = chatMessages.at(-1);
  if (!lastMessage || lastMessage.role !== "user") {
    throw new Error("Cohere needs a user message to generate a response.");
  }

  yield* streamCohereChat({
    message: lastMessage.content,
    preamble: context,
    chatHistory: chatMessages.slice(0, -1),
    signal,
  });
}
