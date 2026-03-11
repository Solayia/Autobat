import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../config/database.js';
import logger from '../config/logger.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenHash,
  verifyRefreshToken
} from '../utils/jwt.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { seedCatalogueForTenant } from '../utils/seedCatalogue.js';

/**
 * POST /api/auth/register
 * Inscription d'une nouvelle entreprise (COMPANY_ADMIN) + tenant
 */
export const register = async (req, res, next) => {
  try {
    const {
      // Entreprise
      entreprise_nom,
      entreprise_siret,
      entreprise_adresse,
      entreprise_code_postal,
      entreprise_ville,
      entreprise_telephone,
      entreprise_email,
      // User admin
      prenom,
      nom,
      email,
      password,
      telephone
    } = req.body;

    // Validation basique
    if (!email || !password || !entreprise_nom || !entreprise_siret) {
      return res.status(400).json({
        error: 'Champs obligatoires manquants',
        required: ['email', 'password', 'entreprise_nom', 'entreprise_siret']
      });
    }

    // Validation force du mot de passe (niveau bancaire)
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Mot de passe trop faible',
        details: passwordValidation.errors
      });
    }

    // Vérifier SIRET unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { siret: entreprise_siret }
    });

    if (existingTenant) {
      return res.status(409).json({
        error: 'Ce SIRET est déjà enregistré'
      });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // IMPORTANT: Désactiver temporairement le middleware tenant pour créer le nouveau tenant
    const tempTenantId = global.currentTenantId;
    global.currentTenantId = null;

    // Transaction: créer tenant + user admin
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer le tenant
      const tenant = await tx.tenant.create({
        data: {
          nom: entreprise_nom,
          siret: entreprise_siret,
          adresse: entreprise_adresse,
          code_postal: entreprise_code_postal,
          ville: entreprise_ville,
          telephone: entreprise_telephone,
          email: entreprise_email,
          plan: 'STARTER',
          statut: 'PENDING'
        }
      });

      // 2. Créer le user COMPANY_ADMIN
      const user = await tx.user.create({
        data: {
          tenant_id: tenant.id,
          email,
          password_hash: passwordHash,
          role: 'COMPANY_ADMIN',
          prenom,
          nom,
          telephone,
          actif: true,
          email_verified: false
        }
      });

      // 3. Créer un Employe pour le COMPANY_ADMIN (compte comme le 1er employé)
      const employe = await tx.employe.create({
        data: {
          tenant_id: tenant.id,
          user_id: user.id,
          quota_mensuel_heures: null
        }
      });

      return { tenant, user, employe };
    });

    // Restaurer le tenant_id global
    global.currentTenantId = tempTenantId;

    // Seeder le catalogue Syla pour le nouveau tenant (async, non bloquant)
    seedCatalogueForTenant(result.tenant.id).catch(() => {});

    logger.info('Nouvelle inscription:', {
      tenant_id: result.tenant.id,
      user_id: result.user.id,
      email: result.user.email
    });

    // Générer tokens
    const accessToken = generateAccessToken(result.user);
    const refreshToken = generateRefreshToken(result.user);
    const tokenHash = generateTokenHash();

    // Stocker refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        user_id: result.user.id,
        token: tokenHash,
        expires_at: expiresAt
      }
    });

    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: result.user.id,
        email: result.user.email,
        prenom: result.user.prenom,
        nom: result.user.nom,
        role: result.user.role,
        tenant_id: result.tenant.id
      },
      tenant: {
        id: result.tenant.id,
        nom: result.tenant.nom,
        siret: result.tenant.siret,
        plan: result.tenant.plan,
        employes_max: result.tenant.employes_max,
        statut: result.tenant.statut,
        onboarding_completed: false,
        onboarding_step: 0
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 86400 // 24h en secondes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Connexion utilisateur
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email et mot de passe requis'
      });
    }

    // Trouver le user (sans filtre tenant_id car on ne le connait pas encore)
    // Désactiver le middleware Prisma pour toute la durée du login
    global.currentTenantId = null;

    const user = await prisma.user.findFirst({
      where: {
        email,
        actif: true
      },
      include: {
        tenant: true,
        employe: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier tenant actif, en trial ou en attente de paiement
    const statutsAutorises = ['ACTIF', 'TRIAL', 'PENDING'];
    if (!user.tenant || !statutsAutorises.includes(user.tenant.statut)) {
      return res.status(403).json({
        error: 'Compte suspendu ou résilié. Contactez le support.'
      });
    }

    // Vérifier mot de passe
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Générer tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = generateTokenHash();

    // Stocker refresh token (currentTenantId est null = pas de filtre tenant)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: tokenHash,
        expires_at: expiresAt
      }
    });

    // Mettre à jour last_login (currentTenantId est null = pas de filtre tenant)
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    logger.info('Connexion réussie:', {
      user_id: user.id,
      email: user.email,
      tenant_id: user.tenant_id
    });

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        role: user.role,
        tenant_id: user.tenant_id,
        employe_id: user.employe?.id
      },
      tenant: {
        id: user.tenant.id,
        nom: user.tenant.nom,
        siret: user.tenant.siret,
        plan: user.tenant.plan,
        employes_max: user.tenant.employes_max,
        statut: user.tenant.statut,
        onboarding_completed: user.tenant.onboarding_completed,
        onboarding_step: user.tenant.onboarding_step
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 86400
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Rafraîchir l'access token avec un refresh token
 */
export const refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Refresh token requis'
      });
    }

    // Vérifier le refresh token JWT
    const payload = verifyRefreshToken(refresh_token);

    // Charger le user
    const tempTenantId = global.currentTenantId;
    global.currentTenantId = null;

    const user = await prisma.user.findUnique({
      where: { id: payload.user_id },
      include: { tenant: true }
    });

    global.currentTenantId = tempTenantId;

    const statutsAutorisesRefresh = ['ACTIF', 'TRIAL'];
    if (!user || !user.actif || !user.tenant || !statutsAutorisesRefresh.includes(user.tenant.statut)) {
      return res.status(401).json({
        error: 'Utilisateur invalide'
      });
    }

    // Générer nouveaux tokens (rotation)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newTokenHash = generateTokenHash();

    // Stocker nouveau refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: newTokenHash,
        expires_at: expiresAt
      }
    });

    res.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 86400
    });
  } catch (error) {
    if (error.message.includes('invalide')) {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Déconnexion (invalider refresh token)
 */
export const logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      // Supprimer le refresh token de la DB
      await prisma.refreshToken.deleteMany({
        where: {
          token: refresh_token,
          user_id: req.user?.id
        }
      });
    }

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Récupérer les infos du user connecté
 */
export const me = async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      prenom: req.user.prenom,
      nom: req.user.nom,
      role: req.user.role,
      telephone: req.user.telephone,
      avatar_url: req.user.avatar_url,
      tenant_id: req.user.tenant_id,
      employe_id: req.user.employe?.id
    },
    tenant: {
      id: req.user.tenant.id,
      nom: req.user.tenant.nom,
      siret: req.user.tenant.siret,
      plan: req.user.tenant.plan,
      employes_max: req.user.tenant.employes_max,
      statut: req.user.tenant.statut,
      trial_ends_at: req.user.tenant.trial_ends_at,
      stripe_customer_id: req.user.tenant.stripe_customer_id,
      onboarding_completed: req.user.tenant.onboarding_completed,
      onboarding_step: req.user.tenant.onboarding_step
    }
  });
};

/**
 * PATCH /api/auth/profile
 * Mettre à jour les infos du profil de l'utilisateur connecté
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { prenom, nom, telephone } = req.body;
    const userId = req.userId;

    if (!prenom || !nom) {
      return res.status(400).json({ error: 'Prénom et nom sont requis' });
    }

    const tempTenantId = global.currentTenantId;
    global.currentTenantId = null;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { prenom, nom, telephone: telephone || null },
      select: { id: true, email: true, prenom: true, nom: true, telephone: true, role: true, tenant_id: true }
    });

    global.currentTenantId = tempTenantId;

    res.json({ message: 'Profil mis à jour', user: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Demander un lien de réinitialisation de mot de passe
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const tempTenantId = global.currentTenantId;
    global.currentTenantId = null;

    const user = await prisma.user.findFirst({
      where: { email, actif: true }
    });

    global.currentTenantId = tempTenantId;

    // Toujours répondre la même chose (sécurité : ne pas révéler si l'email existe)
    const successMsg = 'Si ce compte existe, un lien de réinitialisation a été envoyé.';

    if (!user) {
      return res.json({ message: successMsg });
    }

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // Supprimer les anciens tokens non utilisés
    await prisma.passwordResetToken.deleteMany({
      where: { user_id: user.id, used: false }
    });

    await prisma.passwordResetToken.create({
      data: { user_id: user.id, token, expires_at: expiresAt }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // En dev : afficher le lien dans les logs
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[DEV] Lien de reset mot de passe pour ${email} : ${resetUrl}`);
    }

    // Envoyer l'email de reset (best-effort — ne bloque pas la réponse)
    sendPasswordResetEmail({
      to: user.email,
      prenom: user.prenom,
      resetUrl
    }).catch(err => logger.error('[Auth] Erreur envoi email reset:', err.message));

    // En dev sans SMTP configuré : retourner l'URL directement pour permettre le test
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ message: successMsg, dev_reset_url: resetUrl });
    }

    res.json({ message: successMsg });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Réinitialiser le mot de passe avec un token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
    }

    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Mot de passe trop faible',
        details: passwordValidation.errors
      });
    }

    const tempTenantId = global.currentTenantId;
    global.currentTenantId = null;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    global.currentTenantId = tempTenantId;

    if (!resetToken || resetToken.used || resetToken.expires_at < new Date()) {
      return res.status(400).json({
        error: 'Lien invalide ou expiré. Veuillez refaire une demande.'
      });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    global.currentTenantId = null;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.user_id },
        data: { password_hash: passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      }),
      // Invalider tous les refresh tokens (sécurité)
      prisma.refreshToken.deleteMany({
        where: { user_id: resetToken.user_id }
      })
    ]);
    global.currentTenantId = tempTenantId;

    logger.info('Mot de passe réinitialisé via token', { user_id: resetToken.user_id });

    res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/change-password
 * Changer le mot de passe de l'utilisateur connecté
 */
export const changePassword = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.userId;

    // Validation
    if (!old_password || !new_password) {
      return res.status(400).json({
        error: 'Ancien et nouveau mot de passe requis'
      });
    }

    // Validation force du nouveau mot de passe (niveau bancaire)
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Nouveau mot de passe trop faible',
        details: passwordValidation.errors
      });
    }

    // Récupérer l'utilisateur
    const tempTenantId = global.currentTenantId;
    global.currentTenantId = null;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    global.currentTenantId = tempTenantId;

    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur introuvable'
      });
    }

    // Vérifier l'ancien mot de passe
    const passwordValid = await bcrypt.compare(old_password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        error: 'Ancien mot de passe incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash }
    });

    logger.info('Mot de passe changé', {
      service: 'autobat-api',
      user_id: userId
    });

    res.json({ message: 'Mot de passe changé avec succès' });
  } catch (error) {
    next(error);
  }
};
