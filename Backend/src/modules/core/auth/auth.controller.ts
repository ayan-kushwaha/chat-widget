import { Request, Response } from "express";
import * as AuthService from "@modules/core/auth/auth.service.js";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await AuthService.register(email, password);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await AuthService.forgotPassword(email);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const result = await AuthService.resetPassword(token, newPassword);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { userId, orgId } = req.body;
    const result = await AuthService.deleteAccount(userId, orgId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const reactivateAccount = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.body;
    const result = await AuthService.reactivateAccount(orgId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const result = await AuthService.getMe(decoded.id, decoded.orgId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(401).json({ success: false, message: err.message });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { email, name, googleId, picture } = req.body;
    const result = await AuthService.googleLogin(email, name, googleId, picture);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const sendLinkEmailOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const userId = (req as any).user?.id;
    const orgId = (req as any).user?.orgId || req.headers['x-org-id'];
    if (!userId || !orgId) throw new Error("Unauthorized");
    if (!email) throw new Error("Email is required");
    const result = await AuthService.sendLinkEmailOtp(userId, orgId as string, email);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const verifyLinkEmailOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const userId = (req as any).user?.id;
    const orgId = (req as any).user?.orgId || req.headers['x-org-id'];
    if (!userId || !orgId) throw new Error("Unauthorized");
    if (!email || !otp) throw new Error("Email and OTP are required");
    const result = await AuthService.verifyLinkEmailOtp(userId, orgId as string, email, otp);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const unlinkEmailAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const orgId = (req as any).user?.orgId || req.headers['x-org-id'];
    if (!userId || !orgId) throw new Error("Unauthorized");
    const result = await AuthService.unlinkEmail(userId, orgId as string);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const setSecondaryPassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, password } = req.body;
    const userId = (req as any).user?.id;
    const orgId = (req as any).user?.orgId || req.headers['x-org-id'];
    if (!userId || !orgId) throw new Error("Unauthorized");
    if (!password) throw new Error("Password is required");
    const result = await AuthService.setSecondaryPassword(userId, orgId as string, { current: currentPassword, new: password });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, password } = req.body;
    const userId = (req as any).user?.id;
    const orgId = (req as any).user?.orgId || req.headers['x-org-id'];
    if (!userId || !orgId) throw new Error("Unauthorized");
    if (!password) throw new Error("Password is required");
    const result = await AuthService.changePassword(userId, orgId as string, { current: currentPassword, new: password });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const sendSecondaryPasswordResetOtpController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const orgId = (req as any).user?.orgId || req.headers['x-org-id'];
    if (!userId || !orgId) throw new Error("Unauthorized");
    const result = await AuthService.sendSecondaryPasswordResetOtp(userId, orgId as string);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const resetSecondaryPasswordWithOtpController = async (req: Request, res: Response) => {
  try {
    const { otp, newPassword } = req.body;
    const userId = (req as any).user?.id;
    const orgId = (req as any).user?.orgId || req.headers['x-org-id'];
    if (!userId || !orgId) throw new Error("Unauthorized");
    if (!otp || !newPassword) throw new Error("OTP and new password are required");
    const result = await AuthService.resetSecondaryPasswordWithOtp(userId, orgId as string, otp, newPassword);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
