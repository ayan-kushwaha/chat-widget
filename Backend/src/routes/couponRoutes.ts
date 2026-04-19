import express from 'express';
import { createCoupon, getCoupons, deleteCoupon, validateCoupon, updateCoupon } from '../controllers/couponController';

const router = express.Router();

router.post('/', createCoupon);
router.get('/', getCoupons);
router.patch('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);
router.post('/validate', validateCoupon);

export default router;
