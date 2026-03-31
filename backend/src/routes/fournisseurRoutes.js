import express from 'express';
import {
  getFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur,
  getFacturesFournisseurs, getFactureFournisseur,
  createFactureFournisseur, updateFactureFournisseur, deleteFactureFournisseur,
  marquerPayee
} from '../controllers/fournisseurController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// Fournisseurs
router.get('/fournisseurs', getFournisseurs);
router.post('/fournisseurs', requireRole(['MANAGER', 'COMPANY_ADMIN']), createFournisseur);
router.patch('/fournisseurs/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), updateFournisseur);
router.delete('/fournisseurs/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), deleteFournisseur);

// Factures fournisseurs
router.get('/', getFacturesFournisseurs);
router.post('/', requireRole(['MANAGER', 'COMPANY_ADMIN']), createFactureFournisseur);
router.get('/:id', getFactureFournisseur);
router.patch('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), updateFactureFournisseur);
router.delete('/:id', requireRole(['MANAGER', 'COMPANY_ADMIN']), deleteFactureFournisseur);
router.post('/:id/payer', requireRole(['MANAGER', 'COMPANY_ADMIN']), marquerPayee);

export default router;
