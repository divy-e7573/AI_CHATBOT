import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    extractedText: { type: String, default: "" },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    // True when the client stopped an in-progress assistant response. The
    // content still contains every token produced before the interruption.
    stopped: {
      type: Boolean,
      default: false,
    },
    // The model used for this turn. Existing records default to Cohere so
    // historical conversations remain correctly labelled.
    provider: {
      type: String,
      enum: ["cohere", "claude", "openai", "gemini"],
      default: "cohere",
      required: true,
    },
  },
  {
    // Adds createdAt and updatedAt automatically.
    timestamps: true,
  }
);

// Load a conversation's messages in chronological order.
messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
