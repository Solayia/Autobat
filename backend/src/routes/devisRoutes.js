import express from 'express';
import {
  createDevis,
  getDevis,
  getDevisById,
  updateDevis,
  sendDevis,
  acceptDevis,
  refuseDevis,
  downloadPDF,
  duplicateDevis,
  deleteDevis,
  suggestNumero,
  checkNumero
} from '../controllers/devisController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   POST /api/devis
 * @desc    Créer un nouveau devis
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), createDevis);

/**
 * @route   GET /api/devis
 * @desc    Lister les devis avec pagination et filtres
 * @access  MANAGER, COMPANY_ADMIN
 */
router.get('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), getDevis);

/**
 * @route   GET /api/devis/suggest-numero
 */
router.get('/suggest-numero', requireRole(['MANAGER', 'COMPANY_ADMIN']), suggestNumero);

/**
 * @route   GET /api/devis/check-numero
 */
router.get('/check-numero', requireRole(['MANAGER', 'COMPANY_ADMIN']), checkNumero);

/**
 * @route   GET /api/devis/:id
 * @desc    Récupérer un devis par ID
 * @access  MANAGER, COMPANY_ADMIN
 */
router.get('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), getDevisById);

/**
 * @route   PATCH /api/devis/:id
 * @desc    Mettre à jour un devis (seulement si BROUILLON)
 * @access  MANAGER, COMPANY_ADMIN
 */
router.patch('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), updateDevis);

/**
 * @route   POST /api/devis/:id/send
 * @desc    Envoyer un devis par email
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/:id/send', requireRole(['MANAGER', 'COMPANY_ADMIN']), sendDevis);

/**
 * @route   POST /api/devis/:id/accept
 * @desc    Marquer un devis comme accepté
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/:id/accept', requireRole(['MANAGER', 'COMPANY_ADMIN']), acceptDevis);

/**
 * @route   POST /api/devis/:id/refuse
 * @desc    Marquer un devis comme refusé
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/:id/refuse', requireRole(['MANAGER', 'COMPANY_ADMIN']), refuseDevis);

/**
 * @route   GET /api/devis/:id/pdf
 * @desc    Télécharger le PDF d'un devis
 * @access  MANAGER, COMPANY_ADMIN
 */
router.get('/:id/pdf', requireRole(['MANAGER', 'COMPANY_ADMIN']), downloadPDF);

/**
 * @route   POST /api/devis/:id/duplicate
 * @desc    Dupliquer un devis
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/:id/duplicate', requireRole(['MANAGER', 'COMPANY_ADMIN']), duplicateDevis);

/**
 * @route   DELETE /api/devis/:id
 * @desc    Supprimer un devis (seulement si BROUILLON)
 * @access  MANAGER, COMPANY_ADMIN
 */
router.delete('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), deleteDevis);

export default router;
