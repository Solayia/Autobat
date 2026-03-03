import prisma from '../config/database.js';
import logger from '../config/logger.js';

const OBJECTIF_MRR_KEY = 'objectif_mrr_mensuel';
const DEFAULT_OBJECTIF_MRR = 80000;

const getConfig = async (cle, defaultVal) => {
  const row = await prisma.configPlateforme.findUnique({ where: { cle } });
  return row ? parseFloat(row.valeur) : defaultVal;
};

const setConfig = async (cle, valeur) => {
  await prisma.configPlateforme.upsert({
    where: { cle },
    update: { valeur: String(valeur) },
    create: { cle, valeur: String(valeur) }
  });
};

// Calcule le MRR actuel depuis les tenants réels
const getMRRActuel = async () => {
  const tenants = await prisma.tenant.findMany({
    where: { siret: { not: '00000000000000' }, statut: 'ACTIF' },
    select: { _count: { select: { users: true } } }
  });
  return tenants.reduce((sum, t) => {
    const nb = t._count.users;
    if (nb === 0) return sum;
    return sum + 100 + Math.max(0, nb - 1) * 20;
  }, 0);
};

const STATUTS_ACTIFS = ['PROSPECT', 'CONTACTE', 'DEMO', 'ESSAI'];
const TOUS_STATUTS = ['PROSPECT', 'CONTACTE', 'DEMO', 'ESSAI', 'CONVERTI', 'PERDU'];

/**
 * GET /api/super-admin/sales/stats
 */
export const getSalesStats = async (req, res, next) => {
  try {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

    const [objectifMrr, mrrActuel, allLeads, convertisM, perdusM, actionsUrgentes] = await Promise.all([
      getConfig(OBJECTIF_MRR_KEY, DEFAULT_OBJECTIF_MRR),
      getMRRActuel(),
      prisma.lead.findMany({ select: { statut: true, mrr_estime: true } }),
      prisma.lead.count({ where: { statut: 'CONVERTI', converted_at: { gte: debutMois } } }),
      prisma.lead.count({ where: { statut: 'PERDU', updated_at: { gte: debutMois } } }),
      prisma.lead.findMany({
        where: { next_action_date: { lte: now }, statut: { notIn: ['CONVERTI', 'PERDU'] } },
        orderBy: { next_action_date: 'asc' },
        take: 5
      })
    ]);

    // Grouper par statut manuellement
    const pipeline = {};
    TOUS_STATUTS.forEach(s => { pipeline[s] = { count: 0, mrr: 0 }; });
    allLeads.forEach(l => {
      if (pipeline[l.statut]) {
        pipeline[l.statut].count++;
        pipeline[l.statut].mrr += l.mrr_estime || 0;
      }
    });

    const leadsActifs = STATUTS_ACTIFS.reduce((s, k) => s + pipeline[k].count, 0);
    const mrrPipeline = STATUTS_ACTIFS.reduce((s, k) => s + pipeline[k].mrr, 0);
    const tauxConversion = (convertisM + perdusM) > 0
      ? Math.round(convertisM / (convertisM + perdusM) * 100)
      : 0;

    res.json({
      mrr_actuel: mrrActuel,
      objectif_mrr: objectifMrr,
      progression_pct: objectifMrr > 0 ? Math.round(mrrActuel / objectifMrr * 100) : 0,
      mrr_pipeline: mrrPipeline,
      leads_actifs: leadsActifs,
      convertis_ce_mois: convertisM,
      taux_conversion_mois: tauxConversion,
      pipeline,
      actions_urgentes: actionsUrgentes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/super-admin/sales/leads
 */
export const getLeads = async (req, res, next) => {
  try {
    const { statut, search } = req.query;
    const where = {};
    if (statut && statut !== 'TOUS') where.statut = statut;
    if (search) {
      where.OR = [
        { nom: { contains: search } },
        { entreprise: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: [{ updated_at: 'desc' }]
    });

    res.json(leads);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/super-admin/sales/leads
 */
export const createLead = async (req, res, next) => {
  try {
    const { nom, email, telephone, entreprise, poste, source, nb_employes_estimes, mrr_estime, notes, next_action, next_action_date } = req.body;

    if (!nom) return res.status(400).json({ message: 'Le nom est requis' });

    // Calcul automatique MRR estimé si nb_employes fourni
    let mrrCalc = mrr_estime ? parseFloat(mrr_estime) : null;
    if (!mrrCalc && nb_employes_estimes) {
      const nb = parseInt(nb_employes_estimes);
      mrrCalc = 100 + Math.max(0, nb - 1) * 20;
    }

    const lead = await prisma.lead.create({
      data: {
        nom,
        email: email || null,
        telephone: telephone || null,
        entreprise: entreprise || null,
        poste: poste || null,
        source: source || 'MANUEL',
        nb_employes_estimes: nb_employes_estimes ? parseInt(nb_employes_estimes) : null,
        mrr_estime: mrrCalc,
        notes: notes || null,
        next_action: next_action || null,
        next_action_date: next_action_date ? new Date(next_action_date) : null
      }
    });

    logger.info(`[SUPER_ADMIN] Lead créé: ${lead.nom}`, { admin_id: req.user?.id });
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/super-admin/sales/leads/:id
 */
export const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ message: 'Lead introuvable' });

    const { nom, email, telephone, entreprise, poste, source, statut, nb_employes_estimes, mrr_estime, notes, next_action, next_action_date, raison_perte } = req.body;

    const data = {};
    if (nom !== undefined) data.nom = nom;
    if (email !== undefined) data.email = email || null;
    if (telephone !== undefined) data.telephone = telephone || null;
    if (entreprise !== undefined) data.entreprise = entreprise || null;
    if (poste !== undefined) data.poste = poste || null;
    if (source !== undefined) data.source = source;
    if (notes !== undefined) data.notes = notes || null;
    if (next_action !== undefined) data.next_action = next_action || null;
    if (next_action_date !== undefined) data.next_action_date = next_action_date ? new Date(next_action_date) : null;
    if (raison_perte !== undefined) data.raison_perte = raison_perte || null;

    if (nb_employes_estimes !== undefined) {
      data.nb_employes_estimes = nb_employes_estimes ? parseInt(nb_employes_estimes) : null;
      // Recalculer MRR si pas fourni manuellement
      if (mrr_estime === undefined && data.nb_employes_estimes) {
        data.mrr_estime = 100 + Math.max(0, data.nb_employes_estimes - 1) * 20;
      }
    }
    if (mrr_estime !== undefined) data.mrr_estime = mrr_estime ? parseFloat(mrr_estime) : null;

    if (statut !== undefined) {
      data.statut = statut;
      if (statut === 'CONVERTI' && lead.statut !== 'CONVERTI') {
        data.converted_at = new Date();
      }
    }

    const updated = await prisma.lead.update({ where: { id }, data });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/super-admin/sales/leads/:id
 */
export const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ message: 'Lead introuvable' });

    await prisma.lead.delete({ where: { id } });
    logger.info(`[SUPER_ADMIN] Lead supprimé: ${lead.nom}`, { admin_id: req.user?.id });
    res.json({ message: 'Lead supprimé' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/super-admin/sales/objectif
 */
export const updateObjectifMrr = async (req, res, next) => {
  try {
    const { objectif_mrr } = req.body;
    if (!objectif_mrr || typeof objectif_mrr !== 'number' || objectif_mrr <= 0) {
      return res.status(400).json({ message: 'objectif_mrr invalide' });
    }
    await setConfig(OBJECTIF_MRR_KEY, objectif_mrr);
    logger.info(`[SUPER_ADMIN] Objectif MRR mis à jour: ${objectif_mrr}€`, { admin_id: req.user?.id });
    res.json({ objectif_mrr });
  } catch (error) {
    next(error);
  }
};
