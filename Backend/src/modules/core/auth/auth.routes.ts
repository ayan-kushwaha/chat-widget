import { Router } from "express";
import * as AuthController from "@modules/core/auth/auth.controller.js";
import { googleAuth } from "@modules/core/auth/auth.controller.js";
import { requireAuth } from "@shared/middlewares/auth.js";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google", googleAuth);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/delete-account", AuthController.deleteAccount);
router.post("/reactivate-account", AuthController.reactivateAccount);
router.get("/me", AuthController.getMe);
router.post("/send-link-otp", requireAuth, AuthController.sendLinkEmailOtp);
router.post("/verify-link-otp", requireAuth, AuthController.verifyLinkEmailOtp);
router.post("/set-secondary-password", requireAuth, AuthController.setSecondaryPassword);
router.post("/change-password", requireAuth, AuthController.changePassword);
router.post("/send-secondary-password-reset-otp", requireAuth, AuthController.sendSecondaryPasswordResetOtpController);
router.post("/reset-secondary-password-with-otp", requireAuth, AuthController.resetSecondaryPasswordWithOtpController);
router.delete("/unlink-email", requireAuth, AuthController.unlinkEmailAccount);
export default router;
