import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  createSubscriptionCheckout,
  createPortalSession,
  upgradeEmployees
} from '../controllers/stripeController.js';

const router = express.Router();

/**
 * POST /api/stripe/create-subscription-checkout
 * Créer une session d'abonnement Stripe avec trial 7j (appelée après inscription)
 * COMPANY_ADMIN uniquement
 */
router.post('/create-subscription-checkout', authenticate, authorize(['COMPANY_ADMIN']), createSubscriptionCheckout);

/**
 * POST /api/stripe/portal
 * Créer une session Customer Portal Stripe (gérer carte, factures, annuler)
 * COMPANY_ADMIN uniquement
 */
router.post('/portal', authenticate, authorize(['COMPANY_ADMIN']), createPortalSession);

/**
 * POST /api/stripe/upgrade-employees
 * Mettre à jour le nombre d'employés dans l'abonnement Stripe (récurrent)
 * COMPANY_ADMIN uniquement
 */
router.post('/upgrade-employees', authenticate, authorize(['COMPANY_ADMIN']), upgradeEmployees);

// NOTE: Le webhook /api/stripe/webhook est géré directement dans server.js
// avant les body parsers pour recevoir le body brut nécessaire à la vérification de signature

export default router;
