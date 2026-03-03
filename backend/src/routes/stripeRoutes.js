import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { createCheckoutSession } from '../controllers/stripeController.js';

const router = express.Router();

/**
 * POST /api/stripe/create-checkout-session
 * Créer une session de paiement Stripe pour augmenter le nombre d'employés
 * COMPANY_ADMIN uniquement
 */
router.post('/create-checkout-session', authenticate, authorize(['COMPANY_ADMIN']), createCheckoutSession);

// NOTE: Le webhook /api/stripe/webhook est géré directement dans server.js
// avant les body parsers pour recevoir le body brut nécessaire à la vérification de signature

export default router;
