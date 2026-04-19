import express from "express";
import * as PaymentController from "./payment.controller";
import { requireAuth } from "@shared/middlewares/auth";

const router = express.Router();

router.post("/create-order", requireAuth, PaymentController.createOrder);
router.post("/create-topup-order", requireAuth, PaymentController.createTopupOrder);
router.post("/verify", requireAuth, PaymentController.verifyPayment);

export default router;
