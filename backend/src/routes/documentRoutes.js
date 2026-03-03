import express from 'express';
import {
  uploadDocument,
  getDocumentsByChantier,
  deleteDocument,
  createFolder,
  upload
} from '../controllers/documentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   POST /api/chantiers/:chantierId/documents/folders
 * @desc    Créer un dossier virtuel
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/folders', requireRole(['MANAGER', 'COMPANY_ADMIN']), createFolder);

/**
 * @route   POST /api/chantiers/:chantierId/documents
 * @desc    Upload un document
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
router.post('/', upload.single('file'), uploadDocument);

/**
 * @route   GET /api/chantiers/:chantierId/documents
 * @desc    Lister les documents d'un chantier
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
router.get('/', getDocumentsByChantier);

/**
 * @route   DELETE /api/chantiers/:chantierId/documents/:id
 * @desc    Supprimer un document
 * @access  MANAGER, COMPANY_ADMIN
 */
router.delete('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), deleteDocument);

export default router;
