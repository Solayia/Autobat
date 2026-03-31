import express from 'express';
import { getPlanningSlots } from '../controllers/tacheController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

/**
 * @route   GET /api/planning
 * @desc    Récupérer les créneaux planifiés pour une période
 * @query   date_debut, date_fin (ISO strings)
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
router.get('/', getPlanningSlots);

export default router;
