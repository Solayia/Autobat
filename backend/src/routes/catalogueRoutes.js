import express from 'express';
import {
  getOuvrages,
  getOuvrageById,
  createOuvrage,
  updateOuvrage,
  deleteOuvrage,
  exportTemplate,
  importCSV
} from '../controllers/catalogueController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   GET /api/catalogue/export-template
 * @desc    Télécharger un template CSV pour l'import
 * @access  MANAGER, COMPANY_ADMIN
 */
router.get('/export-template', requireRole(['MANAGER', 'COMPANY_ADMIN']), exportTemplate);

/**
 * @route   POST /api/catalogue/import-csv
 * @desc    Importer des ouvrages depuis un CSV
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/import-csv', requireRole(['MANAGER', 'COMPANY_ADMIN']), importCSV);

/**
 * @route   POST /api/catalogue
 * @desc    Créer un ouvrage personnalisé
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), createOuvrage);

/**
 * @route   GET /api/catalogue
 * @desc    Lister les ouvrages du catalogue avec filtres
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
router.get('/', getOuvrages);

/**
 * @route   GET /api/catalogue/:id
 * @desc    Récupérer un ouvrage par ID
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
router.get('/:id', getOuvrageById);

/**
 * @route   PATCH /api/catalogue/:id
 * @desc    Mettre à jour un ouvrage personnalisé
 * @access  MANAGER, COMPANY_ADMIN
 */
router.patch('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), updateOuvrage);

/**
 * @route   DELETE /api/catalogue/:id
 * @desc    Supprimer un ouvrage personnalisé
 * @access  COMPANY_ADMIN
 */
router.delete('/:id', requireRole(['COMPANY_ADMIN']), deleteOuvrage);

export default router;
