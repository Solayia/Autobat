import express from 'express';
import {
  getBadgeagesByChantier,
  createBadgeage,
  adminCreateBadgeage,
  deleteBadgeage
} from '../controllers/badgeageController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getBadgeagesByChantier);
router.post('/', createBadgeage);
router.post('/admin', adminCreateBadgeage);
router.delete('/:id', deleteBadgeage);

export default router;
