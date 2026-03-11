import { google } from 'googleapis';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

const SCOPES = ['https://mail.google.com/'];

const getOAuth2Client = () => {
  // Utilise la route frontend /gmail-callback pour éviter les problèmes de proxy Nginx
  const redirectUri = `${process.env.FRONTEND_URL || process.env.APP_URL}/gmail-callback`;
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

/**
 * GET /api/settings/gmail/auth-url
 * Génère l'URL Google OAuth2 et la retourne au frontend.
 * Le state contient le tenantId encodé en base64.
 */
export const getGmailAuthUrl = async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      return res.status(400).json({
        code: 'GOOGLE_NOT_CONFIGURED',
        message: 'Google OAuth2 non configuré. Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans le fichier .env.'
      });
    }

    const oauth2Client = getOAuth2Client();
    const state = Buffer.from(JSON.stringify({ tenantId: req.tenantId })).toString('base64url');

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state,
      prompt: 'consent' // Force le refresh_token à chaque fois
    });

    res.json({ url: authUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/settings/gmail/callback
 * Callback OAuth2 appelé par Google après autorisation.
 * Stocke le refresh_token dans la DB puis redirige vers le frontend.
 * ⚠️  Route PUBLIQUE (pas de middleware auth) — protégée par le state parameter.
 */
export const handleGmailCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { code, state, error } = req.query;

  if (error) {
    logger.warn(`[Gmail OAuth] Erreur Google: ${error}`);
    return res.redirect(`${frontendUrl}/settings?tab=email&gmail=error&msg=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/settings?tab=email&gmail=error&msg=missing_params`);
  }

  try {
    // Décoder le state pour récupérer le tenantId
    const { tenantId } = JSON.parse(Buffer.from(state, 'base64url').toString());
    if (!tenantId) throw new Error('tenantId manquant dans le state');

    // Échanger le code contre les tokens
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      // Peut arriver si l'utilisateur a déjà autorisé — récupérer le token existant
      logger.warn(`[Gmail OAuth] Pas de refresh_token reçu pour tenant ${tenantId}. Révoquer l'accès depuis Google et réessayer.`);
      return res.redirect(`${frontendUrl}/settings?tab=email&gmail=error&msg=no_refresh_token`);
    }

    // Récupérer l'adresse Gmail via l'API Gmail (couverte par le scope mail.google.com)
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const gmailEmail = profile.data.emailAddress;

    // Stocker dans la DB
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        gmail_email: gmailEmail,
        gmail_refresh_token: tokens.refresh_token,
        smtp_user: gmailEmail,
        smtp_configured: true
      }
    });

    logger.info(`[Gmail OAuth] Gmail connecté: ${gmailEmail} pour tenant ${tenantId}`);
    res.redirect(`${frontendUrl}/settings?tab=email&gmail=success`);
  } catch (err) {
    logger.error(`[Gmail OAuth] Erreur callback: ${err.message}`);
    res.redirect(`${frontendUrl}/settings?tab=email&gmail=error&msg=${encodeURIComponent(err.message)}`);
  }
};

/**
 * DELETE /api/settings/gmail
 * Déconnecter Gmail du tenant.
 */
export const disconnectGmail = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    // Révoquer le token côté Google (best effort)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { gmail_refresh_token: true }
    });

    if (tenant?.gmail_refresh_token) {
      try {
        const oauth2Client = getOAuth2Client();
        await oauth2Client.revokeToken(tenant.gmail_refresh_token);
      } catch {
        // Ignorer les erreurs de révocation (token peut déjà être invalide)
      }
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        gmail_email: null,
        gmail_refresh_token: null,
        smtp_configured: false
      }
    });

    logger.info(`[Gmail OAuth] Gmail déconnecté pour tenant ${tenantId}`);
    res.json({ message: 'Gmail déconnecté avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/settings/gmail/exchange
 * Échange le code OAuth2 contre des tokens et les stocke en DB.
 * Appelé par la page frontend /gmail-callback après redirection Google.
 */
export const exchangeGmailCode = async (req, res, next) => {
  try {
    const { code, state } = req.body;

    if (!code || !state) {
      return res.status(400).json({ message: 'Code ou state manquant' });
    }

    // Décoder le tenantId depuis le state
    let tenantId;
    try {
      ({ tenantId } = JSON.parse(Buffer.from(state, 'base64url').toString()));
    } catch {
      return res.status(400).json({ message: 'State invalide' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId manquant dans le state' });
    }

    // Échanger le code contre les tokens
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res.status(400).json({ message: 'Aucun refresh_token reçu. Révoquez l\'accès depuis votre compte Google et réessayez.' });
    }

    // Récupérer l'adresse Gmail
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const gmailEmail = profile.data.emailAddress;

    // Stocker en DB
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        gmail_email: gmailEmail,
        gmail_refresh_token: tokens.refresh_token,
        smtp_user: gmailEmail,
        smtp_configured: true
      }
    });

    logger.info(`[Gmail OAuth] Gmail connecté via exchange: ${gmailEmail} pour tenant ${tenantId}`);
    res.json({ ok: true, email: gmailEmail });
  } catch (error) {
    logger.error(`[Gmail OAuth] Erreur exchange: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/settings/gmail/status
 * Retourne le statut Gmail du tenant (email connecté, sans token).
 */
export const getGmailStatus = async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { gmail_email: true, smtp_configured: true, gmail_refresh_token: true }
    });

    res.json({
      connected: !!(tenant?.gmail_refresh_token && tenant?.smtp_configured),
      email: tenant?.gmail_email || null
    });
  } catch (error) {
    next(error);
  }
};
