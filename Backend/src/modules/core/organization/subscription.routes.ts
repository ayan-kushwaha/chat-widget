import express from 'express';
import {
    createSubscription,
    getSubscription,
    getRenewalPreview,
    renewSubscription
} from './subscription.controller';

const router = express.Router();

// Create new subscription (with snapshot)
router.post('/subscriptions', createSubscription);

// Get current subscription details
router.get('/subscriptions/:organizationId', getSubscription);

// Preview renewal pricing changes
router.post('/subscriptions/:organizationId/renewal-preview', getRenewalPreview);

// Confirm renewal (creates new snapshot)
router.post('/subscriptions/:organizationId/renew', renewSubscription);

export default router;
