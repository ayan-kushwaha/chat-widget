import express from "express";
import * as OrganizationController from "@modules/core/organization/organization.controller.js";
import { requireAuth } from "@shared/middlewares/auth.js";

import { getActivityLogs, exportActivityLogs } from './activity.controller.js';

const router = express.Router();

router.get('/activity', getActivityLogs);
router.get('/activity/export', exportActivityLogs);

router.get("/", requireAuth, OrganizationController.getUserOrganizations);
router.put("/plan", requireAuth, OrganizationController.updateOrganizationPlan);
router.post("/topup", requireAuth, OrganizationController.addTokenTopup); // 🟢 New Route for Top-ups
router.patch("/settings", requireAuth, OrganizationController.updateOrganizationSettings);
router.put("/billing-address", requireAuth, OrganizationController.saveBillingAddress); // 🧾 KYC Billing Info
router.put("/update-user-name", requireAuth, OrganizationController.updateUserNameInOrg); // Update user name in users_access & org
router.patch("/ribbons", requireAuth, OrganizationController.updateAvailableRibbons); // 🎀 Global Ribbon Pool
router.post("/upload-asset", requireAuth, OrganizationController.orgAssetUploadMiddleware, OrganizationController.uploadOrgAsset);
router.post("/generate-knowledge-strategy", requireAuth, OrganizationController.generateKnowledgeStrategy);


export default router;
