import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { globalSearch } from '../controllers/searchController.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/search?q=terme
 * Recherche globale multi-entités
 */
router.get('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), globalSearch);

export default router;
