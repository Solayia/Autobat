import express from 'express';
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient
} from '../controllers/clientController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  validateCreateClient,
  validateUUID,
  validatePagination,
  validateSearch,
  handleValidationErrors,
  sanitizeInputs
} from '../middleware/validators.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// Sanitization XSS sur toutes les routes
router.use(sanitizeInputs);

/**
 * @route   POST /api/clients
 * @desc    Créer un nouveau client
 * @access  MANAGER, COMPANY_ADMIN
 */
router.post('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), validateCreateClient, createClient);

/**
 * @route   GET /api/clients
 * @desc    Lister les clients avec pagination et recherche
 * @access  MANAGER, COMPANY_ADMIN
 */
router.get('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), validatePagination(), validateSearch(), handleValidationErrors, getClients);

/**
 * @route   GET /api/clients/:id
 * @desc    Récupérer un client par ID
 * @access  MANAGER, COMPANY_ADMIN
 */
router.get('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), validateUUID('id'), handleValidationErrors, getClientById);

/**
 * @route   PUT /api/clients/:id
 * @desc    Mettre à jour un client
 * @access  MANAGER, COMPANY_ADMIN
 */
router.put('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), validateUUID('id'), validateCreateClient, updateClient);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Supprimer un client (soft/hard delete)
 * @access  COMPANY_ADMIN
 */
router.delete('/:id', requireRole(['COMPANY_ADMIN']), validateUUID('id'), handleValidationErrors, deleteClient);

export default router;
