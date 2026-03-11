import express from 'express';
import {
  getBadgeagesByChantier,
  createBadgeage,
  adminCreateBadgeage
} from '../controllers/badgeageController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getBadgeagesByChantier);
router.post('/', createBadgeage);
router.post('/admin', adminCreateBadgeage);

export default router;
