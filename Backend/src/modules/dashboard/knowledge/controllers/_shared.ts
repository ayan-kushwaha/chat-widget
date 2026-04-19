// Shared imports and helpers for all knowledge controllers
import { Request, Response } from 'express';
import { AuthRequest } from "@shared/middlewares/auth.js";
import { Brain } from "@modules/dashboard/brain/models/Brain.js";
import { Site } from "@modules/dashboard/knowledge/models/Site.js";
import { KnowledgeDocument } from "@modules/dashboard/knowledge/models/KnowledgeDocument.js";
import { Organization } from "@modules/core/organization/Organization.js";
import { validateKnowledgeInput } from "@modules/shared/utils/validation.js";
import { embedQueue, crawlQueue } from "../../../../jobs/queues.js";
import { usageService } from "../../../../services/usage.service.js";
import { ActivityType } from "../../../../models/ActivityLog.js";
import { scheduleCrawl } from "../../../../jobs/scheduler.js";
import TurndownService from "turndown";

export const turndownService = new TurndownService({ headingStyle: 'atx' });

export { Request, Response, AuthRequest, Brain, Site, KnowledgeDocument, Organization, validateKnowledgeInput, embedQueue, crawlQueue, usageService, ActivityType, scheduleCrawl };

export const getOrCreateBrain = async (orgId: string) => {
  let brain = await Brain.findOne({ orgId });
  if (!brain) {
    brain = await Brain.create({ orgId, personality_config: {}, policy_core: {} });
  }
  return brain;
};
