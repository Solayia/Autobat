import express from 'express';
import {
  getFactures,
  getFactureById,
  createFacture,
  updateFacture,
  envoyerFacture,
  enregistrerPaiement,
  deleteFacture,
  genererPDFFacture,
  envoyerRappelImpaye
} from '../controllers/factureController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/factures - Lister les factures
router.get(
  '/',
  requireRole(['MANAGER', 'COMPANY_ADMIN']),
  getFactures
);

// GET /api/factures/:id - Détails d'une facture
router.get(
  '/:id',
  requireRole(['MANAGER', 'COMPANY_ADMIN']),
  getFactureById
);

// POST /api/factures - Créer une facture
router.post(
  '/',
  requireRole(['MANAGER', 'COMPANY_ADMIN']),
  createFacture
);

// PATCH /api/factures/:id - Modifier une facture (BROUILLON)
router.patch(
  '/:id',
  requireRole(['MANAGER', 'COMPANY_ADMIN']),
  updateFacture
);

// POST /api/factures/:id/envoyer - Envoyer une facture
router.post(
  '/:id/envoyer',
  requireRole(['MANAGER', 'COMPANY_ADMIN']),
  envoyerFacture
);

// POST /api/factures/:id/paiement - Enregistrer un paiement
router.post(
  '/:id/paiement',
  requireRole(['MANAGER', 'COMPANY_ADMIN']),
  enregistrerPaiement
);

// POST /api/factures/:id/rappel - Envoyer un rappel impayé
router.post(
  '/:id/rappel',
  requireRole(['MANAGER', 'COMPANY_ADMIN']),
  envoyerRappelImpaye
);

// GET /api/factures/:id/pdf - Générer le PDF d'une facture
router.get(
  '/:id/pdf',
  requireRole(['MANAGER', 'COMPANY_ADMIN']),
  genererPDFFacture
);

// DELETE /api/factures/:id - Supprimer une facture (BROUILLON)
router.delete(
  '/:id',
  requireRole(['COMPANY_ADMIN']),
  deleteFacture
);

export default router;
