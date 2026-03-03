import prisma from '../config/database.js';
import logger from '../config/logger.js';

/**
 * @desc    Recherche globale (clients, devis, chantiers)
 * @route   GET /api/search?q=terme
 * @access  MANAGER, COMPANY_ADMIN
 */
export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    const tenantId = req.tenantId;

    if (!q || q.trim().length < 2) {
      return res.json({ clients: [], devis: [], chantiers: [] });
    }

    const term = q.trim();

    const [clients, devis, chantiers] = await Promise.all([
      // Clients
      prisma.client.findMany({
        where: {
          tenant_id: tenantId,
          actif: true,
          OR: [
            { nom: { contains: term } },
            { email: { contains: term } },
            { telephone: { contains: term } },
            { ville: { contains: term } }
          ]
        },
        select: { id: true, nom: true, prenom: true, type: true, email: true, ville: true },
        take: 5,
        orderBy: { nom: 'asc' }
      }),

      // Devis
      prisma.devis.findMany({
        where: {
          tenant_id: tenantId,
          OR: [
            { numero_devis: { contains: term } },
            { objet: { contains: term } },
            { client: { nom: { contains: term } } }
          ]
        },
        select: {
          id: true,
          numero_devis: true,
          objet: true,
          statut: true,
          montant_ttc: true,
          date_creation: true,
          client: { select: { nom: true, prenom: true } }
        },
        take: 5,
        orderBy: { date_creation: 'desc' }
      }),

      // Chantiers
      prisma.chantier.findMany({
        where: {
          tenant_id: tenantId,
          OR: [
            { nom: { contains: term } },
            { ville: { contains: term } },
            { adresse: { contains: term } },
            { client: { nom: { contains: term } } }
          ]
        },
        select: {
          id: true,
          nom: true,
          ville: true,
          statut: true,
          date_debut: true,
          client: { select: { nom: true } }
        },
        take: 5,
        orderBy: { date_debut: 'desc' }
      })
    ]);

    res.json({ clients, devis, chantiers });
  } catch (error) {
    logger.error('Erreur recherche globale:', error);
    next(error);
  }
};
