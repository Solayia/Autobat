import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Middleware d'authentification JWT
 * Vérifie le token, charge le user, et injecte tenant_id dans le contexte global
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extraire le token du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }

    const token = authHeader.substring(7); // Enlever 'Bearer '

    // Reset du tenant global pour éviter pollution entre requêtes concurrentes
    global.currentTenantId = null;

    // Vérifier le token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expiré', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Token invalide' });
    }

    // Charger le user depuis la DB
    const user = await prisma.user.findUnique({
      where: { id: payload.user_id },
      include: {
        tenant: true,
        employe: true
      }
    });

    if (!user || !user.actif) {
      return res.status(401).json({ error: 'Utilisateur introuvable ou inactif' });
    }

    // Vérifier que le tenant est actif (ACTIF ou TRIAL autorisés)
    const statutsAutorises = ['ACTIF', 'TRIAL'];
    if (!statutsAutorises.includes(user.tenant.statut)) {
      const isPending = user.tenant.statut === 'PENDING';
      return res.status(403).json({
        error: isPending
          ? 'Abonnement non activé. Veuillez finaliser votre paiement.'
          : 'Compte suspendu ou résilié. Contactez le support.',
        code: isPending ? 'PAYMENT_REQUIRED' : 'ACCOUNT_SUSPENDED',
        statut: user.tenant.statut
      });
    }

    // Injecter user et tenant_id dans req
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.tenantId = user.tenant_id;

    // CRITIQUE: Injecter tenant_id dans le contexte global pour Prisma middleware
    global.currentTenantId = user.tenant_id;

    // Mettre à jour last_login (async sans attendre)
    prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    }).catch(err => logger.error('Erreur mise à jour last_login:', err));

    next();
  } catch (error) {
    logger.error('Erreur middleware auth:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Middleware de vérification de rôle
 * Exemple: requireRole(['COMPANY_ADMIN', 'MANAGER'])
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès interdit',
        required_role: allowedRoles
      });
    }

    next();
  };
};

/**
 * Middleware authenticate étendu: autorise aussi les tenants PENDING
 * Utilisé uniquement pour la route de création d'abonnement Stripe
 */
export const authenticatePending = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }

    const token = authHeader.substring(7);
    global.currentTenantId = null;

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expiré', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Token invalide' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.user_id },
      include: { tenant: true, employe: true }
    });

    if (!user || !user.actif) {
      return res.status(401).json({ error: 'Utilisateur introuvable ou inactif' });
    }

    // Autorise ACTIF, TRIAL et PENDING (en attente de paiement)
    const statutsAutorises = ['ACTIF', 'TRIAL', 'PENDING'];
    if (!statutsAutorises.includes(user.tenant.statut)) {
      return res.status(403).json({
        error: 'Compte suspendu ou résilié. Contactez le support.',
        code: 'ACCOUNT_SUSPENDED',
        statut: user.tenant.statut
      });
    }

    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.tenantId = user.tenant_id;
    global.currentTenantId = user.tenant_id;

    next();
  } catch (error) {
    logger.error('Erreur middleware authenticatePending:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Middleware optionnel: authentifier si token présent, sinon continuer
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Pas de token, continuer sans user
  }

  // Si token présent, utiliser authenticate
  return authenticate(req, res, next);
};
