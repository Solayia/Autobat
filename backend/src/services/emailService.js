import nodemailer from 'nodemailer';
import logger from '../config/logger.js';
import prisma from '../config/database.js';

/**
 * Crée un transporteur Nodemailer à partir de la config SMTP d'un tenant (stockée en DB).
 * Supporte deux modes :
 *   - OAuth2 Gmail : si gmail_refresh_token est présent
 *   - SMTP classique : sinon (smtp_host + smtp_user + smtp_password)
 * Retourne null si la config est incomplète.
 */
const createTransporter = (smtpConfig) => {
  const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, gmail_email, gmail_refresh_token } = smtpConfig;

  // Mode OAuth2 Gmail
  if (gmail_refresh_token && gmail_email) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      logger.error('[Email] OAuth2 Gmail: GOOGLE_CLIENT_ID/SECRET manquants dans .env');
      return null;
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: gmail_email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: gmail_refresh_token
      }
    });
  }

  // Mode SMTP classique
  if (!smtp_host || !smtp_user || !smtp_password) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtp_host,
    port: smtp_port || 587,
    secure: smtp_secure || false,
    auth: { user: smtp_user, pass: smtp_password }
  });
};

/**
 * Récupère la config SMTP d'un tenant depuis la DB.
 * @param {string} tenantId
 * @returns {object|null} config SMTP ou null si non configuré
 */
const getTenantSmtpConfig = async (tenantId) => {
  if (!tenantId) return null;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      smtp_host: true,
      smtp_port: true,
      smtp_secure: true,
      smtp_user: true,
      smtp_password: true,
      smtp_from: true,
      smtp_configured: true,
      gmail_email: true,
      gmail_refresh_token: true
    }
  });
  if (!tenant?.smtp_configured) return null;
  return tenant;
};

/**
 * Envoie un email via la config SMTP du tenant.
 * Echoue silencieusement si SMTP non configuré.
 * @param {string} tenantId - Pour récupérer la config SMTP en DB
 * @param {object} mailOptions - { to, subject, html, attachments? }
 * @returns {Promise<boolean>} true si envoyé, false sinon
 */
const sendMail = async (tenantId, { to, subject, html, attachments = [] }) => {
  const smtpConfig = await getTenantSmtpConfig(tenantId);

  if (!smtpConfig) {
    logger.warn(`[Email] SMTP non configuré pour tenant ${tenantId} — email non envoyé à ${to}: "${subject}"`);
    return false;
  }

  const transporter = createTransporter(smtpConfig);
  if (!transporter) {
    logger.warn(`[Email] Config SMTP incomplète pour tenant ${tenantId}`);
    return false;
  }

  try {
    const senderEmail = smtpConfig.gmail_email || smtpConfig.smtp_user;
    const from = smtpConfig.smtp_from || `Autobat <${senderEmail}>`;
    await transporter.sendMail({ from, to, subject, html, attachments });
    logger.info(`[Email] Envoyé à ${to}: "${subject}" (tenant: ${tenantId})`);
    return true;
  } catch (err) {
    logger.error(`[Email] Erreur envoi à ${to} (tenant: ${tenantId}):`, err.message);
    return false;
  }
};

/**
 * Teste la connexion SMTP d'un tenant (depuis Settings).
 * @param {object} smtpConfig - Config à tester (pas encore sauvegardée en DB)
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
/**
 * Envoie un email via le SMTP système (.env) — pour les emails d'inscription (avant config tenant).
 * Echoue silencieusement si non configuré.
 */
const sendMailSystem = async ({ to, subject, html, attachments = [] }) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    logger.warn(`[Email Système] SMTP non configuré — email non envoyé à ${to}`);
    return false;
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
  });
  try {
    const from = SMTP_FROM || `Autobat <${SMTP_USER}>`;
    await transporter.sendMail({ from, to, subject, html, attachments });
    logger.info(`[Email Système] Envoyé à ${to}: "${subject}"`);
    return true;
  } catch (err) {
    logger.error(`[Email Système] Erreur envoi à ${to}:`, err.message);
    return false;
  }
};

export const testSmtpConnection = async (smtpConfig) => {
  const transporter = createTransporter(smtpConfig);
  if (!transporter) {
    return { ok: false, error: 'Configuration SMTP incomplète' };
  }
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

// ─── Layout HTML commun ────────────────────────────────────────────────────────

const baseLayout = (content, tenantNom = 'Autobat') => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tenantNom}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f3f4f6; color: #111827; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; }
    .header p { margin: 4px 0 0; color: #bfdbfe; font-size: 14px; }
    .body { padding: 36px 40px; }
    .body p { line-height: 1.7; color: #374151; margin: 0 0 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .card-row .label { color: #6b7280; }
    .card-row .value { font-weight: 600; color: #111827; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0; }
    .btn-outline { display: inline-block; border: 2px solid #2563eb; color: #2563eb; text-decoration: none; padding: 12px 26px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-orange { background: #fef3c7; color: #d97706; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .footer { background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
    .footer a { color: #6b7280; text-decoration: none; }
    .highlight { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 14px; color: #1e40af; }
    .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 14px; color: #92400e; }
  </style>
</head>
<body>
  <div class="wrapper">
    ${content}
    <div class="footer">
      <p>Cet email a été envoyé par <strong>${tenantNom}</strong> via Autobat.</p>
      <p style="margin-top:4px">© ${new Date().getFullYear()} Autobat — Logiciel de gestion BTP</p>
    </div>
  </div>
</body>
</html>`;

// ─── Emails spécifiques ────────────────────────────────────────────────────────

/**
 * Email bienvenue au gérant lors de l'inscription
 * (pas de tenantId car SMTP pas encore configuré — utilise le SMTP système s'il existe)
 */
export const sendWelcomeEmail = async ({ to, prenom, tenantNom, loginUrl }) => {
  const frontendUrl = loginUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
  const html = baseLayout(`
    <div class="header">
      <h1>🏗️ Bienvenue sur Autobat !</h1>
      <p>Votre compte entreprise est prêt</p>
    </div>
    <div class="body">
      <p>Bonjour <strong>${prenom}</strong>,</p>
      <p>Votre espace <strong>${tenantNom}</strong> vient d'être créé sur Autobat. Vous pouvez dès maintenant gérer vos devis, chantiers et facturation depuis votre tableau de bord.</p>
      <p style="text-align:center; margin: 28px 0">
        <a href="${frontendUrl}/login" class="btn">Accéder à mon espace →</a>
      </p>
      <div class="highlight">
        Vous bénéficiez d'une <strong>période d'essai gratuite</strong>. Profitez-en pour explorer toutes les fonctionnalités !
      </div>
      <p>En cas de question, répondez simplement à cet email.</p>
    </div>
  `, tenantNom);

  // Pour l'inscription, utilise SMTP système (.env) en fallback si disponible
  return sendMailSystem({ to, subject: `Bienvenue sur Autobat — ${tenantNom}`, html });
};

/**
 * Email à l'employé lors de la création de son compte (envoi des identifiants)
 */
export const sendEmployeWelcomeEmail = async ({ tenantId, to, prenom, nom, email, password, tenantNom, loginUrl }) => {
  const frontendUrl = loginUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
  const html = baseLayout(`
    <div class="header">
      <h1>Votre compte Autobat</h1>
      <p>${tenantNom} vous a créé un accès</p>
    </div>
    <div class="body">
      <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
      <p>Votre responsable vous a créé un compte sur <strong>Autobat</strong>, le logiciel de gestion de chantiers de <strong>${tenantNom}</strong>.</p>
      <div class="card">
        <div class="card-row"><span class="label">Email de connexion</span><span class="value">${email}</span></div>
        <div class="card-row"><span class="label">Mot de passe temporaire</span><span class="value" style="font-family:monospace; letter-spacing:2px">${password}</span></div>
      </div>
      <div class="warning">
        Pour votre sécurité, <strong>changez votre mot de passe</strong> lors de votre première connexion dans "Mon profil".
      </div>
      <p style="text-align:center; margin: 28px 0">
        <a href="${frontendUrl}/login" class="btn">Me connecter →</a>
      </p>
    </div>
  `, tenantNom);

  return sendMail(tenantId, { to, subject: `Votre accès Autobat — ${tenantNom}`, html });
};

/**
 * Email client lors de l'envoi d'un devis
 */
export const sendDevisEmail = async ({ tenantId, devis, tenant, pdfUrl }) => {
  const clientEmail = devis.client?.email;
  if (!clientEmail) return false;

  const clientNom = devis.client?.prenom
    ? `${devis.client.prenom} ${devis.client.nom}`
    : devis.client?.nom || 'Client';

  const validiteDate = devis.date_validite
    ? new Date(devis.date_validite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Non précisée';

  const montantTTC = devis.montant_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '—';

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const pdfLink = pdfUrl || `${frontendUrl}/devis/${devis.id}`;

  const html = baseLayout(`
    <div class="header">
      <h1>Votre devis ${devis.numero_devis}</h1>
      <p>${tenant?.nom || 'Votre entreprise'} — ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
    <div class="body">
      <p>Bonjour <strong>${clientNom}</strong>,</p>
      <p>Veuillez trouver ci-dessous votre devis pour les travaux suivants :</p>
      <div class="card">
        <div class="card-row"><span class="label">Référence</span><span class="value">${devis.numero_devis}</span></div>
        ${devis.objet ? `<div class="card-row"><span class="label">Objet</span><span class="value">${devis.objet}</span></div>` : ''}
        <div class="card-row"><span class="label">Montant TTC</span><span class="value" style="color:#2563eb; font-size:18px">${montantTTC}</span></div>
        <div class="card-row"><span class="label">Valable jusqu'au</span><span class="value">${validiteDate}</span></div>
        ${devis.conditions_paiement ? `<div class="card-row"><span class="label">Conditions de paiement</span><span class="value">${devis.conditions_paiement}</span></div>` : ''}
        ${devis.delai_realisation ? `<div class="card-row"><span class="label">Délai de réalisation</span><span class="value">${devis.delai_realisation}</span></div>` : ''}
      </div>
      <p style="text-align:center; margin: 28px 0">
        <a href="${pdfLink}" class="btn">Consulter mon devis →</a>
      </p>
      <p style="font-size:13px; color:#6b7280">Pour accepter ou refuser ce devis, cliquez sur le lien ci-dessus ou répondez directement à cet email.</p>
      ${tenant?.telephone ? `<p style="font-size:13px; color:#6b7280">Contact : ${tenant.telephone} · ${tenant.email || ''}</p>` : ''}
    </div>
  `, tenant?.nom);

  return sendMail(tenantId, {
    to: clientEmail,
    subject: `Devis ${devis.numero_devis} — ${tenant?.nom || 'Votre prestataire'}`,
    html
  });
};

/**
 * Email client lors de l'envoi d'une facture
 */
export const sendFactureEmail = async ({ tenantId, facture, tenant, pdfUrl }) => {
  const clientEmail = facture.client_email;
  if (!clientEmail) return false;

  const echeanceDate = facture.date_echeance
    ? new Date(facture.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Non précisée';

  const montantTTC = facture.montant_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '—';
  const resteAPayer = facture.reste_a_payer?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || montantTTC;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const pdfLink = pdfUrl || `${frontendUrl}/factures/${facture.id}`;

  const html = baseLayout(`
    <div class="header">
      <h1>Votre facture ${facture.numero_facture}</h1>
      <p>${facture.entreprise_nom} — ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
    <div class="body">
      <p>Bonjour <strong>${facture.client_nom}</strong>,</p>
      <p>Veuillez trouver ci-dessous votre facture :</p>
      <div class="card">
        <div class="card-row"><span class="label">N° Facture</span><span class="value">${facture.numero_facture}</span></div>
        <div class="card-row"><span class="label">Montant TTC</span><span class="value" style="color:#2563eb; font-size:18px">${montantTTC}</span></div>
        ${facture.acompte_recu > 0 ? `<div class="card-row"><span class="label">Acompte versé</span><span class="value">−${facture.acompte_recu?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span></div>` : ''}
        <div class="card-row"><span class="label">Reste à payer</span><span class="value" style="font-size:18px; color:#dc2626">${resteAPayer}</span></div>
        <div class="card-row"><span class="label">Date d'échéance</span><span class="value">${echeanceDate}</span></div>
      </div>
      <div class="card" style="margin-top:12px; background:#f0fdf4; border-color:#bbf7d0">
        <p style="margin:0; font-size:14px; color:#166534"><strong>Coordonnées bancaires :</strong></p>
        <p style="margin:8px 0 0; font-size:13px; color:#166534">${facture.entreprise_nom} · SIRET : ${facture.entreprise_siret}</p>
        ${tenant?.rib ? `<p style="margin:4px 0 0; font-size:13px; color:#166534; font-family:monospace">${tenant.rib}</p>` : ''}
      </div>
      <p style="text-align:center; margin: 28px 0">
        <a href="${pdfLink}" class="btn">Consulter ma facture →</a>
      </p>
      <p style="font-size:12px; color:#9ca3af">
        Pénalités de retard applicables en cas de non-paiement à l'échéance.
        En cas de question, contactez-nous à ${facture.entreprise_email} · ${facture.entreprise_tel}.
      </p>
    </div>
  `, facture.entreprise_nom);

  return sendMail(tenantId, {
    to: clientEmail,
    subject: `Facture ${facture.numero_facture} — ${facture.entreprise_nom}`,
    html
  });
};

/**
 * Email de rappel pour facture impayée
 */
export const sendRappelImpayeEmail = async ({ tenantId, facture, tenant, joursRetard }) => {
  const clientEmail = facture.client_email;
  if (!clientEmail) return false;

  const resteAPayer = facture.reste_a_payer?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '—';
  const echeanceDate = facture.date_echeance
    ? new Date(facture.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const pdfLink = `${frontendUrl}/factures/${facture.id}`;

  const html = baseLayout(`
    <div class="header" style="background: linear-gradient(135deg, #dc2626, #b91c1c)">
      <h1>Rappel : Facture en attente</h1>
      <p>${facture.numero_facture} — ${facture.entreprise_nom}</p>
    </div>
    <div class="body">
      <p>Bonjour <strong>${facture.client_nom}</strong>,</p>
      <p>Sauf erreur de notre part, nous n'avons pas encore reçu le règlement de la facture suivante :</p>
      <div class="card">
        <div class="card-row"><span class="label">N° Facture</span><span class="value">${facture.numero_facture}</span></div>
        <div class="card-row"><span class="label">Date d'échéance</span><span class="value">${echeanceDate}</span></div>
        <div class="card-row"><span class="label">Retard</span><span class="value" style="color:#dc2626">${joursRetard || '?'} jours</span></div>
        <div class="card-row"><span class="label">Montant restant dû</span><span class="value" style="color:#dc2626; font-size:18px">${resteAPayer}</span></div>
      </div>
      <div class="warning">
        Conformément à la réglementation, des <strong>pénalités de retard</strong> peuvent s'appliquer à compter de la date d'échéance.
      </div>
      <p>Nous vous remercions de bien vouloir régulariser cette situation dans les plus brefs délais. En cas de règlement déjà effectué, merci d'ignorer ce message.</p>
      <p style="text-align:center; margin: 28px 0">
        <a href="${pdfLink}" class="btn">Voir la facture →</a>
      </p>
      <p style="font-size:13px; color:#6b7280">Pour tout renseignement, contactez-nous : ${facture.entreprise_email} · ${facture.entreprise_tel}</p>
    </div>
  `, facture.entreprise_nom);

  return sendMail(tenantId, {
    to: clientEmail,
    subject: `RAPPEL — Facture ${facture.numero_facture} en attente de règlement`,
    html
  });
};

/**
 * Email de réinitialisation de mot de passe (SMTP système)
 */
export const sendPasswordResetEmail = async ({ to, prenom, resetUrl }) => {
  const html = baseLayout(`
    <div class="header">
      <h1>Réinitialisation de mot de passe</h1>
      <p>Autobat — Gestion BTP</p>
    </div>
    <div class="body">
      <p>Bonjour${prenom ? ` <strong>${prenom}</strong>` : ''},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
      <p style="text-align:center; margin: 28px 0">
        <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe →</a>
      </p>
      <div class="highlight">
        Ce lien est valable <strong>1 heure</strong>. Passé ce délai, vous devrez refaire une demande.
      </div>
      <p style="font-size:13px; color:#6b7280">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe reste inchangé.</p>
    </div>
  `, 'Autobat');

  return sendMailSystem({
    to,
    subject: 'Réinitialisation de votre mot de passe Autobat',
    html
  });
};
