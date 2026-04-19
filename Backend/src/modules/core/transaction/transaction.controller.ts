import { Request, Response } from 'express';
import { Transaction } from './Transaction';
import mongoose from 'mongoose';

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const type = req.query.type as string;
        const year = req.query.year as string;

        if (!orgId) {
            return res.status(400).json({ success: false, message: "Organization ID is required" });
        }

        console.log("Fetching transactions for Org:", orgId);
        // Explicitly convert to ObjectId and log it
        const orgObjectId = new mongoose.Types.ObjectId(orgId);
        console.log("Converted ObjectId:", orgObjectId);

        const query: any = { organizationId: orgObjectId };
        console.log("Final Query:", JSON.stringify(query));

        if (type) {
            query.type = type;
        }

        if (year) {
            const startDate = new Date(`${year}-01-01`);
            const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get Transactions Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// Get latest transaction for invoice generation
export const getLatestTransaction = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const orgId = (req as any).user?.organizationId;

        if (!orgId) {
            return res.status(400).json({ success: false, message: "Organization ID not found" });
        }

        console.log("Fetching latest transaction for Org:", orgId);

        const orgObjectId = new mongoose.Types.ObjectId(orgId);

        // Find latest successful transaction
        const transaction = await Transaction.findOne({
            organizationId: orgObjectId,
            status: 'success'
        })
            .sort({ createdAt: -1 })
            .limit(1)
            .lean();

        if (!transaction) {
            return res.json({
                success: false,
                message: "No transaction found"
            });
        }

        res.json({
            success: true,
            transaction
        });
    } catch (error) {
        console.error("Get Latest Transaction Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const TransactionController = {
    getTransactions,
    getLatestTransaction
};
