import express from 'express';
import { getFeatures, createFeature, updateFeature, deleteFeature, checkFeatureUsage, archiveFeature } from '../controllers/featureController';

const router = express.Router();

router.get('/', getFeatures);
router.post('/', createFeature);
router.patch('/:id', updateFeature);
router.delete('/:id', deleteFeature);

// Safe delete endpoints
router.get('/:id/usage', checkFeatureUsage);
router.post('/:id/archive', archiveFeature);

export default router;
