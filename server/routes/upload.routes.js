import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { uploadSingle } from "../middleware/upload.js";
import { uploadDocument } from "../controllers/documentController.js";

const router = Router();

// POST /api/upload  (mounted at /api in server.js)
router.post("/upload", authMiddleware, uploadSingle("file"), uploadDocument);

export default router;
