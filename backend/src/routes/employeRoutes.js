import express from 'express';
import {
  createEmploye,
  getEmployes,
  updateEmploye,
  deleteEmploye,
  resetEmployePassword,
  exportHeuresCSV
} from '../controllers/employeController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   POST /api/employes
 * @desc    Créer un nouvel employé
 * @access  COMPANY_ADMIN
 */
router.post('/', requireRole(['COMPANY_ADMIN']), createEmploye);

/**
 * @route   GET /api/employes
 * @desc    Lister les employés
 * @access  MANAGER, COMPANY_ADMIN
 */
router.get('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), getEmployes);

/**
 * @route   PATCH /api/employes/:id
 * @desc    Modifier un employé
 * @access  COMPANY_ADMIN
 */
router.patch('/:id', requireRole(['COMPANY_ADMIN']), updateEmploye);

/**
 * @route   DELETE /api/employes/:id
 * @desc    Supprimer un employé
 * @access  COMPANY_ADMIN
 */
router.delete('/:id', requireRole(['COMPANY_ADMIN']), deleteEmploye);

/**
 * @route   PATCH /api/employes/:id/reset-password
 * @desc    Réinitialiser le mot de passe d'un employé
 * @access  COMPANY_ADMIN
 */
router.patch('/:id/reset-password', requireRole(['COMPANY_ADMIN']), resetEmployePassword);

/**
 * @route   GET /api/employes/export-heures
 * @desc    Exporter les heures en CSV (mois/annee en query params)
 * @access  MANAGER, COMPANY_ADMIN
 */
router.get('/export-heures', requireRole(['MANAGER', 'COMPANY_ADMIN']), exportHeuresCSV);

export default router;
