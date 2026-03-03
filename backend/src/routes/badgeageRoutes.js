import express from 'express';
import {
  getBadgeagesByChantier,
  createBadgeage
} from '../controllers/badgeageController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   GET /api/chantiers/:chantierId/badgeages
 * @desc    Lister les badgeages d'un chantier
 * @access  EMPLOYEE (soi), MANAGER, COMPANY_ADMIN
 */
router.get('/', getBadgeagesByChantier);

/**
 * @route   POST /api/chantiers/:chantierId/badgeages
 * @desc    Créer un badgeage manuel
 * @access  EMPLOYEE (soi), MANAGER, COMPANY_ADMIN
 */
router.post('/', createBadgeage);

export default router;
