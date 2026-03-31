import prisma from '../config/database.js';
import logger from '../config/logger.js';

// ──────────────────────────────────────────────────────────────
// FOURNISSEURS
// ──────────────────────────────────────────────────────────────

export const getFournisseurs = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const fournisseurs = await prisma.fournisseur.findMany({
      where: { tenant_id: tenantId },
      orderBy: { nom: 'asc' }
    });
    res.json(fournisseurs);
  } catch (error) {
    next(error);
  }
};

export const createFournisseur = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { nom, siret, email, telephone, adresse } = req.body;
    if (!nom) return res.status(400).json({ message: 'Le nom du fournisseur est obligatoire' });

    const fournisseur = await prisma.fournisseur.create({
      data: { tenant_id: tenantId, nom, siret: siret || null, email: email || null, telephone: telephone || null, adresse: adresse || null }
    });
    res.status(201).json(fournisseur);
  } catch (error) {
    next(error);
  }
};

export const updateFournisseur = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { nom, siret, email, telephone, adresse } = req.body;

    const existing = await prisma.fournisseur.findFirst({ where: { id, tenant_id: tenantId } });
    if (!existing) return res.status(404).json({ message: 'Fournisseur introuvable' });

    const updated = await prisma.fournisseur.update({
      where: { id },
      data: { nom, siret: siret || null, email: email || null, telephone: telephone || null, adresse: adresse || null }
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteFournisseur = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const existing = await prisma.fournisseur.findFirst({ where: { id, tenant_id: tenantId } });
    if (!existing) return res.status(404).json({ message: 'Fournisseur introuvable' });

    await prisma.fournisseur.delete({ where: { id } });
    res.json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// FACTURES FOURNISSEURS
// ──────────────────────────────────────────────────────────────

async function generateNumero(tenantId) {
  const year = new Date().getFullYear();
  const count = await prisma.factureFournisseur.count({
    where: { tenant_id: tenantId, numero: { startsWith: `FRSN-${year}-` } }
  });
  return `FRSN-${year}-${String(count + 1).padStart(4, '0')}`;
}

export const getFacturesFournisseurs = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { statut, chantier_id, fournisseur_id } = req.query;

    const where = { tenant_id: tenantId };
    if (statut) where.statut = statut;
    if (chantier_id) where.chantier_id = chantier_id;
    if (fournisseur_id) where.fournisseur_id = fournisseur_id;

    const factures = await prisma.factureFournisseur.findMany({
      where,
      include: {
        fournisseur: true,
        chantier: { select: { id: true, nom: true, client: { select: { nom: true } } } }
      },
      orderBy: { date_facture: 'desc' }
    });
    res.json(factures);
  } catch (error) {
    next(error);
  }
};

export const getFactureFournisseur = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const facture = await prisma.factureFournisseur.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        fournisseur: true,
        chantier: { select: { id: true, nom: true, client: { select: { nom: true } } } }
      }
    });
    if (!facture) return res.status(404).json({ message: 'Facture fournisseur introuvable' });
    res.json(facture);
  } catch (error) {
    next(error);
  }
};

export const createFactureFournisseur = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const {
      fournisseur_id, fournisseur_nom, // Allow inline creation
      chantier_id, date_facture, date_echeance,
      categorie, description, montant_ht, taux_tva,
      notes
    } = req.body;

    if (!date_facture) return res.status(400).json({ message: 'La date de facture est obligatoire' });
    if (!montant_ht) return res.status(400).json({ message: 'Le montant HT est obligatoire' });

    // Resolve fournisseur
    let resolvedFournisseurId = fournisseur_id;
    if (!resolvedFournisseurId && fournisseur_nom) {
      const newFournisseur = await prisma.fournisseur.create({
        data: { tenant_id: tenantId, nom: fournisseur_nom }
      });
      resolvedFournisseurId = newFournisseur.id;
    }
    if (!resolvedFournisseurId) return res.status(400).json({ message: 'Fournisseur obligatoire' });

    const ht = parseFloat(montant_ht);
    const tva = parseFloat(taux_tva ?? 20);
    const montantTva = Math.round(ht * tva) / 100;
    const montantTtc = ht + montantTva;

    const numero = await generateNumero(tenantId);

    const facture = await prisma.factureFournisseur.create({
      data: {
        tenant_id: tenantId,
        numero,
        fournisseur_id: resolvedFournisseurId,
        chantier_id: chantier_id || null,
        date_facture: new Date(date_facture),
        date_echeance: date_echeance ? new Date(date_echeance) : null,
        categorie: categorie || 'AUTRE',
        description: description || null,
        montant_ht: ht,
        taux_tva: tva,
        montant_tva: montantTva,
        montant_ttc: montantTtc,
        notes: notes || null
      },
      include: { fournisseur: true, chantier: { select: { id: true, nom: true } } }
    });

    res.status(201).json(facture);
  } catch (error) {
    logger.error('Erreur création facture fournisseur:', error);
    next(error);
  }
};

export const updateFactureFournisseur = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const existing = await prisma.factureFournisseur.findFirst({ where: { id, tenant_id: tenantId } });
    if (!existing) return res.status(404).json({ message: 'Facture fournisseur introuvable' });

    const {
      fournisseur_id, chantier_id, date_facture, date_echeance,
      categorie, description, montant_ht, taux_tva,
      statut, date_paiement, notes
    } = req.body;

    const ht = montant_ht != null ? parseFloat(montant_ht) : existing.montant_ht;
    const tva = taux_tva != null ? parseFloat(taux_tva) : existing.taux_tva;
    const montantTva = Math.round(ht * tva) / 100;
    const montantTtc = ht + montantTva;

    const updated = await prisma.factureFournisseur.update({
      where: { id },
      data: {
        ...(fournisseur_id !== undefined && { fournisseur_id }),
        ...(chantier_id !== undefined && { chantier_id: chantier_id || null }),
        ...(date_facture !== undefined && { date_facture: new Date(date_facture) }),
        ...(date_echeance !== undefined && { date_echeance: date_echeance ? new Date(date_echeance) : null }),
        ...(categorie !== undefined && { categorie }),
        ...(description !== undefined && { description }),
        montant_ht: ht,
        taux_tva: tva,
        montant_tva: montantTva,
        montant_ttc: montantTtc,
        ...(statut !== undefined && { statut }),
        ...(date_paiement !== undefined && { date_paiement: date_paiement ? new Date(date_paiement) : null }),
        ...(notes !== undefined && { notes })
      },
      include: { fournisseur: true, chantier: { select: { id: true, nom: true } } }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteFactureFournisseur = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const existing = await prisma.factureFournisseur.findFirst({ where: { id, tenant_id: tenantId } });
    if (!existing) return res.status(404).json({ message: 'Facture fournisseur introuvable' });

    await prisma.factureFournisseur.delete({ where: { id } });
    res.json({ message: 'Facture fournisseur supprimée' });
  } catch (error) {
    next(error);
  }
};

export const marquerPayee = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { date_paiement } = req.body;

    const existing = await prisma.factureFournisseur.findFirst({ where: { id, tenant_id: tenantId } });
    if (!existing) return res.status(404).json({ message: 'Facture fournisseur introuvable' });

    const updated = await prisma.factureFournisseur.update({
      where: { id },
      data: { statut: 'PAYEE', date_paiement: date_paiement ? new Date(date_paiement) : new Date() }
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
