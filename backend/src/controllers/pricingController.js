import prisma from '../config/database.js';
import logger from '../config/logger.js';

// Clés de config utilisées
const PRIX_BASE_KEY = 'prix_base';
const PRIX_PAR_COMPTE_KEY = 'prix_par_compte';

const DEFAULT_PRIX_BASE = 100;
const DEFAULT_PRIX_PAR_COMPTE = 20;

// Helper : lire une config
const getConfig = async (cle, defaultVal) => {
  const row = await prisma.configPlateforme.findUnique({ where: { cle } });
  return row ? parseFloat(row.valeur) : defaultVal;
};

// Helper : écrire une config
const setConfig = async (cle, valeur) => {
  await prisma.configPlateforme.upsert({
    where: { cle },
    update: { valeur: String(valeur) },
    create: { cle, valeur: String(valeur) }
  });
};

// ═══════════════════════════════════════════════
// TARIFICATION
// ═══════════════════════════════════════════════

/**
 * GET /api/super-admin/pricing
 */
export const getPricing = async (req, res, next) => {
  try {
    const [prixBase, prixParCompte] = await Promise.all([
      getConfig(PRIX_BASE_KEY, DEFAULT_PRIX_BASE),
      getConfig(PRIX_PAR_COMPTE_KEY, DEFAULT_PRIX_PAR_COMPTE)
    ]);

    // Exemples de simulation
    const exemples = [1, 3, 5, 10, 15].map(n => ({
      users: n,
      prix: n === 0 ? 0 : prixBase + Math.max(0, n - 1) * prixParCompte
    }));

    res.json({ prix_base: prixBase, prix_par_compte: prixParCompte, exemples });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/super-admin/pricing
 */
export const updatePricing = async (req, res, next) => {
  try {
    const { prix_base, prix_par_compte } = req.body;

    if (prix_base !== undefined) {
      if (typeof prix_base !== 'number' || prix_base < 0) {
        return res.status(400).json({ message: 'prix_base invalide' });
      }
      await setConfig(PRIX_BASE_KEY, prix_base);
    }

    if (prix_par_compte !== undefined) {
      if (typeof prix_par_compte !== 'number' || prix_par_compte < 0) {
        return res.status(400).json({ message: 'prix_par_compte invalide' });
      }
      await setConfig(PRIX_PAR_COMPTE_KEY, prix_par_compte);
    }

    logger.info(`[SUPER_ADMIN] Tarification mise à jour: base=${prix_base}€, /compte=${prix_par_compte}€`, {
      admin_id: req.userId
    });

    const [newBase, newParCompte] = await Promise.all([
      getConfig(PRIX_BASE_KEY, DEFAULT_PRIX_BASE),
      getConfig(PRIX_PAR_COMPTE_KEY, DEFAULT_PRIX_PAR_COMPTE)
    ]);

    res.json({ prix_base: newBase, prix_par_compte: newParCompte });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════
// CODES PROMO
// ═══════════════════════════════════════════════

/**
 * GET /api/super-admin/promo-codes
 */
export const getPromoCodes = async (req, res, next) => {
  try {
    const { actif } = req.query;
    const where = {};
    if (actif !== undefined) where.actif = actif === 'true';

    const codes = await prisma.codePromo.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    res.json(codes);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/super-admin/promo-codes
 */
export const createPromoCode = async (req, res, next) => {
  try {
    const { code, description, type, valeur, max_uses, expires_at } = req.body;

    if (!code || !type || valeur === undefined) {
      return res.status(400).json({ message: 'code, type et valeur sont requis' });
    }

    if (!['PERCENT', 'FIXED'].includes(type)) {
      return res.status(400).json({ message: 'type doit être PERCENT ou FIXED' });
    }

    if (type === 'PERCENT' && (valeur <= 0 || valeur > 100)) {
      return res.status(400).json({ message: 'Un pourcentage doit être entre 1 et 100' });
    }

    if (type === 'FIXED' && valeur <= 0) {
      return res.status(400).json({ message: 'La réduction fixe doit être positive' });
    }

    const existing = await prisma.codePromo.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return res.status(409).json({ message: `Le code "${code.toUpperCase()}" existe déjà` });
    }

    const promoCode = await prisma.codePromo.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        type,
        valeur,
        max_uses: max_uses || null,
        expires_at: expires_at ? new Date(expires_at) : null
      }
    });

    logger.info(`[SUPER_ADMIN] Code promo créé: ${promoCode.code}`, { admin_id: req.userId });
    res.status(201).json(promoCode);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/super-admin/promo-codes/:id/toggle
 * Active ou désactive un code
 */
export const togglePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const code = await prisma.codePromo.findUnique({ where: { id } });
    if (!code) return res.status(404).json({ message: 'Code introuvable' });

    const updated = await prisma.codePromo.update({
      where: { id },
      data: { actif: !code.actif }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/super-admin/promo-codes/:id
 */
export const deletePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const code = await prisma.codePromo.findUnique({ where: { id } });
    if (!code) return res.status(404).json({ message: 'Code introuvable' });

    await prisma.codePromo.delete({ where: { id } });

    logger.info(`[SUPER_ADMIN] Code promo supprimé: ${code.code}`, { admin_id: req.userId });
    res.json({ message: `Code "${code.code}" supprimé` });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/super-admin/promo-codes/validate
 * Valide un code promo (pour test ou usage manuel)
 */
export const validatePromoCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'code requis' });

    const promo = await prisma.codePromo.findUnique({ where: { code: code.toUpperCase() } });

    if (!promo) return res.status(404).json({ valide: false, message: 'Code inexistant' });
    if (!promo.actif) return res.status(400).json({ valide: false, message: 'Code désactivé' });
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(400).json({ valide: false, message: 'Code expiré' });
    }
    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
      return res.status(400).json({ valide: false, message: 'Nombre maximum d\'utilisations atteint' });
    }

    res.json({
      valide: true,
      code: promo.code,
      type: promo.type,
      valeur: promo.valeur,
      description: promo.description
    });
  } catch (error) {
    next(error);
  }
};
