import prisma from '../config/database.js';
import logger from '../config/logger.js';

/**
 * GET /api/support/features
 * Liste les feature requests validées (vote ouvert) — visible à tous les users
 * + les siennes en PENDING
 */
export const getFeatureRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const features = await prisma.featureRequest.findMany({
      where: {
        OR: [
          { statut: { in: ['VALIDATED', 'IN_DEVELOPMENT', 'SHIPPED'] } },
          { user_id: userId } // ses propres demandes en PENDING/REJECTED aussi
        ]
      },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { prenom: true, nom: true } },
        votes: { select: { user_id: true } }
      }
    });

    // Ajouter nb_votes + has_voted pour l'utilisateur courant
    const result = features.map(f => ({
      ...f,
      nb_votes: f.votes.length,
      has_voted: f.votes.some(v => v.user_id === userId)
    }));

    // Trier : IN_DEVELOPMENT en premier, puis VALIDATED par votes, puis le reste
    result.sort((a, b) => {
      const order = { IN_DEVELOPMENT: 0, VALIDATED: 1, SHIPPED: 2, PENDING: 3, REJECTED: 4 };
      if (order[a.statut] !== order[b.statut]) return order[a.statut] - order[b.statut];
      return b.nb_votes - a.nb_votes;
    });

    res.json(result);
  } catch (error) {
    logger.error('[Features] getFeatureRequests:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST /api/support/features
 * Créer une demande de fonctionnalité (PENDING jusqu'à validation superadmin)
 */
export const createFeatureRequest = async (req, res) => {
  try {
    const { titre, description } = req.body;
    const tenantId = req.tenantId;
    const userId = req.userId;

    if (!titre?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'titre et description sont requis' });
    }

    const feature = await prisma.featureRequest.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        titre: titre.trim(),
        description: description.trim()
      },
      include: {
        user: { select: { prenom: true, nom: true } },
        votes: { select: { user_id: true } }
      }
    });

    res.status(201).json({ ...feature, nb_votes: 0, has_voted: false });
  } catch (error) {
    logger.error('[Features] createFeatureRequest:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST /api/support/features/:id/vote
 * Toggle vote (ajoute si pas voté, retire si déjà voté)
 */
export const toggleVote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Vérifier que la feature est validée (vote seulement sur VALIDATED/IN_DEVELOPMENT)
    const feature = await prisma.featureRequest.findUnique({ where: { id } });
    if (!feature) return res.status(404).json({ error: 'Fonctionnalité introuvable' });
    if (!['VALIDATED', 'IN_DEVELOPMENT'].includes(feature.statut)) {
      return res.status(400).json({ error: 'Vote impossible sur cette demande' });
    }

    const existingVote = await prisma.featureVote.findUnique({
      where: { user_id_feature_request_id: { user_id: userId, feature_request_id: id } }
    });

    if (existingVote) {
      await prisma.featureVote.delete({ where: { id: existingVote.id } });
      res.json({ voted: false });
    } else {
      await prisma.featureVote.create({ data: { user_id: userId, feature_request_id: id } });
      res.json({ voted: true });
    }
  } catch (error) {
    logger.error('[Features] toggleVote:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── Super Admin ──────────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/support/features
 * Toutes les feature requests (toutes statuts)
 */
export const getAllFeatureRequests = async (req, res) => {
  try {
    const { statut } = req.query;

    const features = await prisma.featureRequest.findMany({
      where: statut ? { statut } : undefined,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { prenom: true, nom: true, email: true } },
        votes: { select: { user_id: true } }
      }
    });

    const result = features.map(f => ({ ...f, nb_votes: f.votes.length }));
    res.json(result);
  } catch (error) {
    logger.error('[Features] getAllFeatureRequests:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * PATCH /api/super-admin/support/features/:id
 * Changer le statut (PENDING → VALIDATED → IN_DEVELOPMENT → SHIPPED)
 */
export const updateFeatureStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const validStatuts = ['PENDING', 'VALIDATED', 'IN_DEVELOPMENT', 'SHIPPED', 'REJECTED'];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const feature = await prisma.featureRequest.update({
      where: { id },
      data: { statut },
      include: { votes: { select: { user_id: true } } }
    });

    res.json({ ...feature, nb_votes: feature.votes.length });
  } catch (error) {
    logger.error('[Features] updateFeatureStatus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * GET /api/super-admin/support/faq
 * Toutes les FAQ (admin)
 */
export const getAllFaq = async (req, res) => {
  try {
    const items = await prisma.faqItem.findMany({ orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }] });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST /api/super-admin/support/faq
 */
export const createFaqItem = async (req, res) => {
  try {
    const { categorie, question, reponse, ordre } = req.body;
    const item = await prisma.faqItem.create({
      data: { categorie, question, reponse, ordre: ordre || 0 }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * PATCH /api/super-admin/support/faq/:id
 */
export const updateFaqItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { categorie, question, reponse, ordre, actif } = req.body;
    const item = await prisma.faqItem.update({
      where: { id },
      data: { ...(categorie && { categorie }), ...(question && { question }), ...(reponse && { reponse }), ...(ordre !== undefined && { ordre }), ...(actif !== undefined && { actif }) }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * DELETE /api/super-admin/support/faq/:id
 */
export const deleteFaqItem = async (req, res) => {
  try {
    await prisma.faqItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
