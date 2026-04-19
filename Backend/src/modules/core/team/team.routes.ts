import { Router } from "express";
import * as TeamController from "@modules/core/team/team.controller.js";
import { requireAuth } from "@shared/middlewares/auth.js";

const router = Router();

router.get("/members", requireAuth, TeamController.getTeamMembers);
router.post("/add-member", requireAuth, TeamController.addTeamMember);
router.put("/update-role", requireAuth, TeamController.updateMemberRole);
router.delete("/remove-member", requireAuth, TeamController.removeMember);
router.post("/activate-account", TeamController.activateAccount);

export default router;
