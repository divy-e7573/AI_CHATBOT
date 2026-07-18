import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import documentRoutes from "./routes/document.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";

dotenv.config();

const app = express();

// Core middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api", uploadRoutes);

// 404 handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Centralized error handler. 4xx messages are ours and safe to show; for 5xx
// (incl. upstream AI/DB failures) log the details but return a generic message
// so provider error bodies never leak to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  const status = err.status || 500;
  res.status(status).json({
    message:
      status < 500
        ? err.message || "Request failed"
        : "Something went wrong. Please try again.",
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
