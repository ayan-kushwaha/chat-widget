import { Response } from "express";
import { AuthRequest } from "@shared/middlewares/auth.js";
import axios from "axios";

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:8000/api/v1";

export const getNeuralGraph = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.user!;
    
    // Ensure we hit the /api/v1 prefix correctly even if AI_ENGINE_URL is just the domain
    const baseURL = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
    
    // Call the Python AI Engine's Graph endpoint
    const response = await axios.get(`${baseURL}/graph/${orgId}`);
    
    res.json(response.data);
  } catch (error: any) {
    console.error("❌ [Neural] Failed to fetch Neural Graph from AI Engine:", error?.response?.data || error.message);
    res.status(500).json({ success: false, message: "Neural Graph Engine unavailable." });
  }
};

export const getVisualGraph = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId: userOrgId } = req.user!;
    const { orgId } = req.params;
    const { limit } = req.query;

    const targetOrgId = orgId || userOrgId;
    
    const baseURL = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
    const response = await axios.get(`${baseURL}/graph/visualize/${targetOrgId}`, {
      params: { limit }
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error("❌ [Neural] Failed to fetch Visual Graph:", error?.response?.data || error.message);
    res.status(500).json({ success: false, message: "Visualization Engine unavailable." });
  }
};

export const deleteGraphNode = async (req: AuthRequest, res: Response) => {
  try {
    const { nodeId } = req.params;
    
    // Ensure we hit the /api/v1 prefix correctly
    const baseURL = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
    
    // Call the Python AI Engine's Delete Node endpoint
    const response = await axios.delete(`${baseURL}/graph/node/${nodeId}`);
    
    res.json(response.data);
  } catch (error: any) {
    console.error("❌ [Neural] Failed to delete node in AI Engine:", error?.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to delete from Neural core." });
  }
};
