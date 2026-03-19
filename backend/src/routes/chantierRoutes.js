import express from 'express';
import {
  createChantier,
  getChantiers,
  getChantierById,
  updateChantier,
  startChantier,
  completeChantier,
  cancelChantier,
  reopenChantier,
  assignEmployees,
  getMesChantiers
} from '../controllers/chantierController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import tacheRoutes from './tacheRoutes.js';
import documentRoutes from './documentRoutes.js';
import badgeageRoutes from './badgeageRoutes.js';
import discussionRoutes from './discussionRoutes.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   POST /api/chantiers
 * @desc    Créer un nouveau chantier
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), createChantier);

/**
 * @route   GET /api/chantiers
 * @desc    Lister les chantiers avec pagination et filtres
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
// IMPORTANT: Route spécifique AVANT /:id
router.get('/mes-chantiers', getMesChantiers);

router.get('/', getChantiers);

/**
 * @route   GET /api/chantiers/:id
 * @desc    Récupérer un chantier par ID
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
router.get('/:id', getChantierById);

/**
 * @route   PATCH /api/chantiers/:id
 * @desc    Mettre à jour un chantier
 * @access  MANAGER, COMPANY_ADMIN
 */
router.patch('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), updateChantier);

/**
 * @route   POST /api/chantiers/:id/start
 * @desc    Démarrer un chantier (PLANIFIE -> EN_COURS)
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/:id/start', requireRole(['MANAGER', 'COMPANY_ADMIN']), startChantier);

/**
 * @route   POST /api/chantiers/:id/complete
 * @desc    Terminer un chantier (EN_COURS -> TERMINE)
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/:id/complete', requireRole(['MANAGER', 'COMPANY_ADMIN']), completeChantier);

/**
 * @route   POST /api/chantiers/:id/cancel
 * @desc    Annuler un chantier
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/:id/cancel', requireRole(['MANAGER', 'COMPANY_ADMIN']), cancelChantier);

/**
 * @route   POST /api/chantiers/:id/reopen
 * @desc    Rouvrir un chantier terminé (TERMINE -> EN_COURS)
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/:id/reopen', requireRole(['MANAGER', 'COMPANY_ADMIN']), reopenChantier);

/**
 * @route   POST /api/chantiers/:id/assign
 * @desc    Assigner des employés à un chantier
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/:id/assign', requireRole(['MANAGER', 'COMPANY_ADMIN']), assignEmployees);

/**
 * Subroutes pour les tâches d'un chantier
 * /api/chantiers/:chantierId/taches
 */
router.use('/:chantierId/taches', tacheRoutes);

/**
 * Subroutes pour les documents d'un chantier
 * /api/chantiers/:chantierId/documents
 */
router.use('/:chantierId/documents', documentRoutes);

/**
 * Subroutes pour les badgeages d'un chantier
 * /api/chantiers/:chantierId/badgeages
 */
router.use('/:chantierId/badgeages', badgeageRoutes);

/**
 * Subroutes pour la discussion d'un chantier
 * /api/chantiers/:chantierId/messages
 */
router.use('/:chantierId/messages', discussionRoutes);

export default router;
