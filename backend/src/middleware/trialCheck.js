import prisma from '../config/database.js';

/**
 * Middleware : vérifie la période d'essai
 * Si statut = TRIAL et trial_ends_at < now → 402 Payment Required
 * Routes exemptes : auth, stripe webhook, super-admin
 */
export const trialCheck = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return next(); // Pas authentifié, laissez passer

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { statut: true, trial_ends_at: true }
    });

    if (!tenant) return next();

    if (tenant.statut === 'TRIAL' && tenant.trial_ends_at && tenant.trial_ends_at < new Date()) {
      return res.status(402).json({
        code: 'TRIAL_EXPIRED',
        message: 'Votre période d\'essai a expiré. Veuillez souscrire à un abonnement pour continuer.',
        trial_ends_at: tenant.trial_ends_at
      });
    }

    if (tenant.statut === 'SUSPENDU') {
      return res.status(402).json({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Votre compte est suspendu. Veuillez contacter le support.'
      });
    }

    // Ajouter les infos trial à la requête pour usage éventuel
    req.tenantStatut = tenant.statut;
    req.trialEndsAt = tenant.trial_ends_at;

    next();
  } catch (error) {
    next(error);
  }
};
