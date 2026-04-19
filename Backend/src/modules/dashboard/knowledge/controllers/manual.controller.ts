import { Request, Response } from 'express';
import { AuthRequest } from "@shared/middlewares/auth.js";
import { Brain } from "@modules/dashboard/brain/models/Brain.js";
import { validateKnowledgeInput } from "@modules/shared/utils/validation.js";
import { embedQueue } from "../../../../jobs/queues.js";
import { usageService } from "../../../../services/usage.service.js";
import TurndownService from "turndown";
const turndownService = new TurndownService({ headingStyle: 'atx' });

// ➕ Add Manual Text Entry
export const addManualKnowledge = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.user!;
    const { title, content, description, summary, tags, intent_summary, priority, skipTrain } = req.body;

    const validation = validateKnowledgeInput({ title, description: description || summary, intent_summary, tags, content });
    if (!validation.success) return res.status(400).json({ success: false, message: validation.message });

    await usageService.checkFreshLimit(orgId, 'max_manual_qa');

    const { ManualDocument } = await import("../models/ManualDocument.js");
    const isDraft = skipTrain === 'true' || skipTrain === true;
    
    // STRICT RULE: All new saves/updates are strictly 'drafts'. No auto-trigger. 
    // User must click 'Train AI' button to actually embed the vectors.
    const doc = await ManualDocument.create({
      orgId,
      title: title || "Untitled Document",
      content,
      description: description || summary || "",
      tags: tags || [],
      intent_summary: intent_summary || "",
      priority: priority || "medium",
      status: 'draft',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "✅ Draft saved! Click 'Train' on the card to index.",
      data: { id: doc._id, title: doc.title, status: doc.status }
    });
  } catch (err: any) {
    console.error("❌ Add Manual Knowledge error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✏️ Update Manual Text (Legacy PUT route)
export const updateManualKnowledge = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.user!;
    const { sourceId } = req.params;
    const { title, content, description, tags, intent_summary, skipTrain } = req.body;

    const { ManualDocument } = await import("../models/ManualDocument.js");
    const entry = await ManualDocument.findOne({ _id: sourceId, orgId });
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    if (title) entry.title = title;
    if (content) entry.content = content;
    if (description) (entry as any).description = description;
    if (tags) (entry as any).tags = tags;
    if (intent_summary !== undefined) (entry as any).intent_summary = intent_summary;

    // STRICT RULE: Downgrade updated legacy saves to 'draft'
    (entry as any).status = 'draft';
    await entry.save();

    res.json({ success: true, message: "✅ Updated as Draft! Run 'Train AI' on the card.", data: { id: entry._id } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPersonalityConfig = async (req: Request, res: Response) => {
  res.json({ success: true, config: {} });
};

export const updatePersonalityConfig = async (req: Request, res: Response) => {
  res.json({ success: true, message: "Personality config updated." });
};
