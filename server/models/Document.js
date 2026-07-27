import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    // Vector embedding for the chunk, used for RAG similarity search.
    embedding: { type: [Number], default: [] },
    chunkIndex: { type: Number, required: true },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    chunks: {
      type: [chunkSchema],
      default: [],
    },
    // Uploads remain usable through MongoDB lexical retrieval when the
    // optional Chroma service is offline. This flag records whether vectors
    // were also written successfully.
    vectorIndexed: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Adds createdAt and updatedAt automatically.
    timestamps: true,
  }
);

// Fetch documents by owner and by conversation (RAG retrieval scope).
documentSchema.index({ userId: 1 });
documentSchema.index({ conversationId: 1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;
