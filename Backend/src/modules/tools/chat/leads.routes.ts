import express from "express";
import * as leadController from "@modules/tools/chat/lead.controller.js";
import { requireAuth } from "../../shared/middlewares/auth.js";

const router = express.Router();

// Forms
router.post("/forms", requireAuth, leadController.createForm);
router.get("/forms", requireAuth, leadController.getForms);
router.get("/forms/:id", requireAuth, leadController.getFormById);
router.put("/forms/:id", requireAuth, leadController.updateForm);
router.delete("/forms/:id", requireAuth, leadController.deleteForm);

// Leads
router.get("/", requireAuth, leadController.getLeads);
router.post("/", leadController.submitLead); // Public or protected depending on use case (widget vs dashboard)
router.put("/:id", requireAuth, leadController.updateLead);

export default router;
