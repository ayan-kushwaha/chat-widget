/**
 * Vault Routes — ClickHouse Analytics Secure Route Definitions
 * Cluaiz Backend | services/vault/vault.routes.ts
 */
import { Router } from 'express';
import { getVaultStats, searchMemory, getPsychTrend, getHotZones } from './vault.controller';

const router = Router();

// Memory Vault Endpoints
router.get('/stats', getVaultStats);
router.get('/search', searchMemory);

// Analytics / MRI Endpoints
router.get('/psych-trend/:userId', getPsychTrend);
router.get('/hot-zones', getHotZones);

export default router;
