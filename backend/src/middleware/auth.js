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

    // Vérifier que le tenant est actif
    if (user.tenant.statut !== 'ACTIF') {
      return res.status(403).json({ error: 'Compte suspendu. Contactez le support.' });
    }

    // Injecter user et tenant_id dans req
    req.user = user;
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
