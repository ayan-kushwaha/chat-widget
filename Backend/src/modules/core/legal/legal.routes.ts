import express from "express";
import * as LegalController from "./controllers/legal.controller.js";

const router = express.Router();

// Public Routes (For Website/Footer)
router.get("/", LegalController.getAllPages);
router.get("/:slug", LegalController.getPageBySlug);

// Admin Routes (To be protected by Admin Middleware later)
// For now, allowing open creation to let you seed the DB via Postman/Curl easily
router.post("/", LegalController.createPage);
router.put("/:id", LegalController.updatePage);
router.delete("/:id", LegalController.deletePage);

export default router;
