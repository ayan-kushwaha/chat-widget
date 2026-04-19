import express from "express";
import * as UploadController from "./upload.controller.js";

const router = express.Router();

// Image upload (with AI option)
router.post("/image", UploadController.uploadMiddleware, UploadController.uploadImage);

// File upload (PDF/DOC - Agent only)
router.post("/file", UploadController.uploadMiddleware, UploadController.uploadFile);

export default router;

