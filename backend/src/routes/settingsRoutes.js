import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { getSettings, updateSettings, uploadLogo, handleUploadLogo, updateSubscription, updateObjectifs, updateOnboarding, getSmtpSettings, updateSmtpSettings, testSmtp } from '../controllers/settingsController.js';
import { getGmailAuthUrl, handleGmailCallback, disconnectGmail, getGmailStatus } from '../controllers/gmailController.js';

const router = express.Router();

// ─── Route PUBLIQUE : callback OAuth2 Google (appelée par le navigateur après autorisation) ───
router.get('/gmail/callback', handleGmailCallback);

// Toutes les routes suivantes nécessitent l'authentification
router.use(authenticate);

/**
 * GET /api/settings
 * Récupérer les paramètres du tenant
 */
router.get('/', getSettings);

/**
 * PATCH /api/settings
 * Mettre à jour les paramètres (COMPANY_ADMIN uniquement)
 */
router.patch('/', authorize(['COMPANY_ADMIN']), updateSettings);

/**
 * POST /api/settings/logo
 * Upload du logo de l'entreprise (COMPANY_ADMIN uniquement)
 */
router.post('/logo', authorize(['COMPANY_ADMIN']), uploadLogo, handleUploadLogo);

/**
 * PATCH /api/settings/subscription
 * Mettre à jour l'abonnement (nombre d'employés max) (COMPANY_ADMIN uniquement)
 */
router.patch('/subscription', authorize(['COMPANY_ADMIN']), updateSubscription);

/**
 * PATCH /api/settings/objectifs
 * Mettre à jour les objectifs de pilotage (COMPANY_ADMIN uniquement)
 */
router.patch('/objectifs', authorize(['COMPANY_ADMIN']), updateObjectifs);

/**
 * PATCH /api/settings/onboarding
 * Sauvegarder la progression de l'onboarding (COMPANY_ADMIN uniquement)
 */
router.patch('/onboarding', authorize(['COMPANY_ADMIN']), updateOnboarding);

/**
 * GET /api/settings/smtp
 * Récupérer la config SMTP (sans mot de passe) — COMPANY_ADMIN uniquement
 */
router.get('/smtp', authorize(['COMPANY_ADMIN']), getSmtpSettings);

/**
 * PUT /api/settings/smtp
 * Sauvegarder la config SMTP — COMPANY_ADMIN uniquement
 */
router.put('/smtp', authorize(['COMPANY_ADMIN']), updateSmtpSettings);

/**
 * POST /api/settings/smtp/test
 * Tester la connexion SMTP — COMPANY_ADMIN uniquement
 */
router.post('/smtp/test', authorize(['COMPANY_ADMIN']), testSmtp);

/**
 * GET /api/settings/gmail/auth-url
 * Génère l'URL OAuth2 Google pour connecter Gmail — COMPANY_ADMIN uniquement
 */
router.get('/gmail/auth-url', authorize(['COMPANY_ADMIN']), getGmailAuthUrl);

/**
 * GET /api/settings/gmail/status
 * Statut de la connexion Gmail — COMPANY_ADMIN uniquement
 */
router.get('/gmail/status', authorize(['COMPANY_ADMIN']), getGmailStatus);

/**
 * DELETE /api/settings/gmail
 * Déconnecter Gmail — COMPANY_ADMIN uniquement
 */
router.delete('/gmail', authorize(['COMPANY_ADMIN']), disconnectGmail);

export default router;
