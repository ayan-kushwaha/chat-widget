import { Request, Response } from 'express';
import { Coupon } from '../models/Coupon';

export const createCoupon = async (req: Request, res: Response) => {
    try {
        const { discountType, discountValue } = req.body;

        // Security Lock: Max 15% and strictly Percentage
        // Enforce 'PERCENTAGE' as the only allowed discount type
        if (discountType !== 'PERCENTAGE') {
            return res.status(400).json({ message: "Only Percentage discounts are allowed." });
        }
        if (discountValue > 15) {
            return res.status(400).json({ message: "Discount value cannot exceed 15%." });
        }

        const coupon = new Coupon(req.body);
        await coupon.save();
        res.status(201).json(coupon);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getCoupons = async (req: Request, res: Response) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Coupon.findByIdAndDelete(id);
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { discountValue } = req.body;

        if (discountValue !== undefined) {
            if (discountValue > 15) {
                return res.status(400).json({ message: "Discount value cannot exceed 15%." });
            }
            if (discountValue < 0) {
                return res.status(400).json({ message: "Discount value cannot be negative." });
            }
        }

        const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
        res.json(coupon);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const validateCoupon = async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        const coupon = await Coupon.findOne({ code: code, isActive: true });

        if (!coupon) {
            return res.status(404).json({ isValid: false, message: 'Invalid or inactive coupon' });
        }

        // Strict Case Check (===)
        if (coupon.code !== code) {
            return res.status(404).json({ isValid: false, message: 'Invalid or inactive coupon (Case Sensitive)' });
        }

        if (coupon.validUntil && new Date() > coupon.validUntil) {
            return res.status(400).json({ isValid: false, message: 'Coupon expired' });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ isValid: false, message: 'Usage limit exceeded' });
        }

        // 🟢 Increment Applied Count (Atomic)
        coupon.appliedCount = (coupon.appliedCount || 0) + 1;
        await coupon.save();

        res.json({ isValid: true, coupon });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
