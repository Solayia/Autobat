import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNotifications } from '../controllers/notificationController.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/notifications
 * Alertes calculées dynamiquement (factures retard, devis expirés, etc.)
 */
router.get('/', getNotifications);

export default router;
