import { Request, Response } from "express";
import * as TeamService from "@modules/core/team/team.service.js";
import jwt from "jsonwebtoken";

// Helper to get Org ID from header or token
const getOrgId = (req: Request) => {
    const headerOrgId = req.headers['x-org-id'] as string;
    if (headerOrgId) return headerOrgId;
    return (req as any).user.orgId;
};

export const getTeamMembers = async (req: Request, res: Response) => {
    try {
        const orgId = getOrgId(req);
        const result = await TeamService.getTeamMembers(orgId);
        res.json({ success: true, ...result });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const addTeamMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const orgId = getOrgId(req);
        const { email, role, name } = req.body;

        if (!email || !role) throw new Error("Email and role are required");

        const result = await TeamService.addTeamMember(orgId, email, role, name, userId);
        res.json({ success: true, ...result });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const updateMemberRole = async (req: Request, res: Response) => {
    try {
        const requestingUserId = (req as any).user.id;
        const orgId = getOrgId(req);
        const { userId, role } = req.body;

        if (!userId || !role) throw new Error("UserId and role are required");

        const result = await TeamService.updateMemberRole(orgId, userId, role, requestingUserId);
        res.json({ success: true, ...result });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const removeMember = async (req: Request, res: Response) => {
    try {
        const requestingUserId = (req as any).user.id;
        const orgId = getOrgId(req);
        const { userId } = req.body;

        if (!userId) throw new Error("UserId is required");

        const result = await TeamService.removeMember(orgId, userId, requestingUserId);
        res.json({ success: true, ...result });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const activateAccount = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) throw new Error("Token and password are required");

        const result = await TeamService.activateAccount(token, password);
        res.json({ success: true, ...result });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
};
