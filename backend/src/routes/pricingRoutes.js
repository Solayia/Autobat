import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getPricing,
  updatePricing,
  getPromoCodes,
  createPromoCode,
  togglePromoCode,
  deletePromoCode,
  validatePromoCode
} from '../controllers/pricingController.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

// Tarification
router.get('/pricing', getPricing);
router.patch('/pricing', updatePricing);

// Codes promo
router.get('/promo-codes', getPromoCodes);
router.post('/promo-codes', createPromoCode);
router.post('/promo-codes/validate', validatePromoCode);
router.patch('/promo-codes/:id/toggle', togglePromoCode);
router.delete('/promo-codes/:id', deletePromoCode);

export default router;
