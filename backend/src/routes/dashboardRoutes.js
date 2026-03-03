import express from 'express';
import { getDashboard, getDashboardEmploye } from '../controllers/dashboardController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   GET /api/dashboard
 * @desc    Récupérer les KPIs du dashboard
 * @access  MANAGER, COMPANY_ADMIN
 */
router.get('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), getDashboard);

/**
 * @route   GET /api/dashboard/employe
 * @desc    Planning et tâches de l'employé connecté
 * @access  EMPLOYEE
 */
router.get('/employe', requireRole(['EMPLOYEE']), getDashboardEmploye);

export default router;
