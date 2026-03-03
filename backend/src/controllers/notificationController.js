import prisma from '../config/database.js';

/**
 * GET /api/notifications
 * Retourne les alertes calculées dynamiquement depuis l'état de la DB
 * Pas de table dédiée — toujours à jour
 */
export const getNotifications = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const now = new Date();
    const alerts = [];

    // ── 1. Factures en retard de paiement ───────────────────────────────────
    const facturesEnRetard = await prisma.facture.findMany({
      where: {
        tenant_id: tenantId,
        statut_paiement: { not: 'SOLDE' },
        date_echeance: { lt: now }
      },
      select: { id: true, numero_facture: true, date_echeance: true, montant_ttc: true }
    });

    for (const f of facturesEnRetard) {
      const joursRetard = Math.floor((now - new Date(f.date_echeance)) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `facture-retard-${f.id}`,
        type: 'FACTURE_RETARD',
        severity: joursRetard > 30 ? 'error' : 'warning',
        title: `Facture ${f.numero_facture} en retard`,
        message: `${joursRetard} jour${joursRetard > 1 ? 's' : ''} de retard — ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(f.montant_ttc)}`,
        link: `/factures/${f.id}`,
        created_at: f.date_echeance
      });
    }

    // ── 2. Devis expirés (date_validite passée, toujours ENVOYE) ────────────
    const devisExpires = await prisma.devis.findMany({
      where: {
        tenant_id: tenantId,
        statut: 'ENVOYE',
        date_validite: { lt: now }
      },
      select: { id: true, numero_devis: true, date_validite: true, montant_ttc: true }
    });

    for (const d of devisExpires) {
      const joursExpire = Math.floor((now - new Date(d.date_validite)) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `devis-expire-${d.id}`,
        type: 'DEVIS_EXPIRE',
        severity: 'warning',
        title: `Devis ${d.numero_devis} expiré`,
        message: `Expiré depuis ${joursExpire} jour${joursExpire > 1 ? 's' : ''} — ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(d.montant_ttc)}`,
        link: `/devis/${d.id}`,
        created_at: d.date_validite
      });
    }

    // ── 3. Devis envoyés sans réponse depuis > 14 jours ─────────────────────
    const il_y_a_14_jours = new Date(now);
    il_y_a_14_jours.setDate(il_y_a_14_jours.getDate() - 14);

    const devisEnAttente = await prisma.devis.findMany({
      where: {
        tenant_id: tenantId,
        statut: 'ENVOYE',
        date_envoi: { lt: il_y_a_14_jours },
        date_validite: { gte: now } // Pas encore expiré
      },
      select: { id: true, numero_devis: true, date_envoi: true, montant_ttc: true }
    });

    for (const d of devisEnAttente) {
      const joursAttente = Math.floor((now - new Date(d.date_envoi)) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `devis-attente-${d.id}`,
        type: 'DEVIS_SANS_REPONSE',
        severity: 'info',
        title: `Devis ${d.numero_devis} sans réponse`,
        message: `En attente depuis ${joursAttente} jours — pensez à relancer votre client`,
        link: `/devis/${d.id}`,
        created_at: d.date_envoi
      });
    }

    // ── 4. Chantiers terminés sans facture ───────────────────────────────────
    const chantiersTerminesSansFacture = await prisma.chantier.findMany({
      where: {
        tenant_id: tenantId,
        statut: 'TERMINE',
        factures: { none: {} }
      },
      select: { id: true, nom: true, date_fin_reelle: true, updated_at: true }
    });

    for (const c of chantiersTerminesSansFacture) {
      const dateRef = c.date_fin_reelle || c.updated_at;
      const jours = Math.floor((now - new Date(dateRef)) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `chantier-sans-facture-${c.id}`,
        type: 'CHANTIER_SANS_FACTURE',
        severity: jours > 7 ? 'warning' : 'info',
        title: `Chantier "${c.nom}" à facturer`,
        message: `Terminé il y a ${jours} jour${jours > 1 ? 's' : ''} — aucune facture créée`,
        link: `/chantiers/${c.id}`,
        created_at: dateRef
      });
    }

    // Trier par sévérité puis date décroissante
    const severityOrder = { error: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json({
      count: alerts.length,
      unread: alerts.length, // Toutes non-lues par défaut (computed)
      notifications: alerts
    });
  } catch (error) {
    next(error);
  }
};
