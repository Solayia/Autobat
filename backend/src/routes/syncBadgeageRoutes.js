import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { syncBadgeages } from '../controllers/badgeageController.js';

const router = Router();

router.use(authenticate);

/**
 * POST /api/badgeages/sync
 * Synchronise les badgeages stockés offline (IndexedDB) vers la base de données
 */
router.post('/sync', syncBadgeages);

export default router;
