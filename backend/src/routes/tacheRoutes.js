import express from 'express';
import {
  createTache,
  getTachesByChantier,
  updateTache,
  deleteTache,
  createTachesFromDevis,
  assignEmployeToTache,
  unassignEmployeFromTache
} from '../controllers/tacheController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true }); // mergeParams pour accéder à :chantierId

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   POST /api/chantiers/:chantierId/taches/from-devis
 * @desc    Créer des tâches depuis les lignes de devis
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/from-devis', requireRole(['MANAGER', 'COMPANY_ADMIN']), createTachesFromDevis);

/**
 * @route   POST /api/chantiers/:chantierId/taches
 * @desc    Créer une tâche pour un chantier
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), createTache);

/**
 * @route   GET /api/chantiers/:chantierId/taches
 * @desc    Lister les tâches d'un chantier
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
router.get('/', getTachesByChantier);

/**
 * @route   PATCH /api/chantiers/:chantierId/taches/:id
 * @desc    Mettre à jour une tâche
 * @access  MANAGER, COMPANY_ADMIN
 */
router.patch('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), updateTache);

/**
 * @route   DELETE /api/chantiers/:chantierId/taches/:id
 * @desc    Supprimer une tâche
 * @access  MANAGER, COMPANY_ADMIN
 */
router.delete('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), deleteTache);

/**
 * @route   POST /api/chantiers/:chantierId/taches/:id/assign
 * @desc    Assigner un employé à une tâche
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/:id/assign', requireRole(['MANAGER', 'COMPANY_ADMIN']), assignEmployeToTache);

/**
 * @route   DELETE /api/chantiers/:chantierId/taches/:id/assign/:employeId
 * @desc    Retirer l'assignation d'un employé d'une tâche
 * @access  MANAGER, COMPANY_ADMIN
 */
router.delete('/:id/assign/:employeId', requireRole(['MANAGER', 'COMPANY_ADMIN']), unassignEmployeFromTache);

export default router;
