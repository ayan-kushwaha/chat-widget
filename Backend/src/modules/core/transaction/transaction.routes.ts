import express from 'express';
import { TransactionController } from './transaction.controller';
import { requireAuth } from "@shared/middlewares/auth.js";

const router = express.Router();

// GET /api/transactions/:orgId
router.get('/:orgId', requireAuth, TransactionController.getTransactions);

// GET /api/transactions/latest - Get latest transaction for current org
router.get('/latest/current', requireAuth, TransactionController.getLatestTransaction);

export { router as transactionRoutes };
