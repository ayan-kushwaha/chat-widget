import { Router } from "express";
import { requireAuth } from "@shared/middlewares/auth.js";
import { getNeuralGraph, getVisualGraph, deleteGraphNode } from "./neural.controller.js";

const router = Router();

// Protect neural endpoints
router.use(requireAuth);

router.get("/graph", getNeuralGraph);
router.get("/graph/visualize/:orgId", getVisualGraph);
router.delete("/node/:nodeId", deleteGraphNode);

export default router;
