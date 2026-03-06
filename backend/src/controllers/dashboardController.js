import prisma from '../config/database.js';
import logger from '../config/logger.js';

/**
 * GET /api/dashboard - KPIs dashboard
 */
export const getDashboard = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const periode = req.query.periode || 'MOIS';

    // Calculer les dates selon la période
    const now = new Date();
    let dateDebut;

    switch (periode) {
      case 'JOUR':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'SEMAINE':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = début de semaine
        dateDebut = new Date(now);
        dateDebut.setDate(now.getDate() + diff);
        dateDebut.setHours(0, 0, 0, 0);
        break;
      case 'ANNEE':
        dateDebut = new Date(now.getFullYear(), 0, 1);
        break;
      case 'TRIMESTRE':
        const trimestre = Math.floor(now.getMonth() / 3);
        dateDebut = new Date(now.getFullYear(), trimestre * 3, 1);
        break;
      case 'MOIS':
      default:
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. Compter les clients
    const nbClients = await prisma.client.count({
      where: { tenant_id: tenantId }
    });

    // 2. Compter les chantiers actifs (EN_COURS)
    const nbChantiersActifs = await prisma.chantier.count({
      where: {
        tenant_id: tenantId,
        statut: 'EN_COURS'
      }
    });

    // 3. Compter les chantiers terminés sur la période
    const nbChantiersTermines = await prisma.chantier.count({
      where: {
        tenant_id: tenantId,
        statut: 'TERMINE',
        date_fin_reelle: {
          gte: dateDebut
        }
      }
    });

    // 4. Compter les devis en attente (ENVOYE)
    const nbDevisEnAttente = await prisma.devis.count({
      where: {
        tenant_id: tenantId,
        statut: 'ENVOYE'
      }
    });

    // 5. Compter les devis envoyés sur la période
    const nbDevisEnvoyes = await prisma.devis.count({
      where: {
        tenant_id: tenantId,
        statut: {
          in: ['ENVOYE', 'ACCEPTE', 'REFUSE']
        },
        date_envoi: {
          gte: dateDebut
        }
      }
    });

    // 6. Calculer le taux d'acceptation des devis
    const nbDevisAcceptes = await prisma.devis.count({
      where: {
        tenant_id: tenantId,
        statut: 'ACCEPTE',
        date_envoi: {
          gte: dateDebut
        }
      }
    });

    const tauxAcceptation = nbDevisEnvoyes > 0
      ? ((nbDevisAcceptes / nbDevisEnvoyes) * 100).toFixed(1)
      : 0;

    // 7. Calculer le CA facturé HT (factures de la période)
    const facturesPeriode = await prisma.facture.findMany({
      where: {
        tenant_id: tenantId,
        date_emission: {
          gte: dateDebut
        }
      },
      select: {
        montant_ht: true,
        montant_ttc: true,
        statut_paiement: true
      }
    });

    const caFactureHT = facturesPeriode.reduce((sum, f) => sum + (f.montant_ht || 0), 0);
    const caFactureTTC = facturesPeriode.reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

    // CA encaissé (factures entièrement payées sur la période)
    const caEncaisse = facturesPeriode
      .filter(f => f.statut_paiement === 'PAYE')
      .reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

    // 8. Calculer les heures totales badgées sur la période (paires PRESENCE_DEBUT/FIN)
    const badgeagesPeriode = await prisma.badgeage.findMany({
      where: {
        tenant_id: tenantId,
        type: { in: ['PRESENCE_DEBUT', 'PRESENCE_FIN'] },
        timestamp: { gte: dateDebut }
      },
      orderBy: [{ employe_id: 'asc' }, { timestamp: 'asc' }]
    });

    let minutesTotales = 0;
    const badgesParEmploye = {};
    for (const b of badgeagesPeriode) {
      if (!badgesParEmploye[b.employe_id]) badgesParEmploye[b.employe_id] = [];
      badgesParEmploye[b.employe_id].push(b);
    }
    for (const badges of Object.values(badgesParEmploye)) {
      let dernierDebut = null;
      for (const b of badges) {
        if (b.type === 'PRESENCE_DEBUT') {
          dernierDebut = b.timestamp;
        } else if (b.type === 'PRESENCE_FIN' && dernierDebut) {
          minutesTotales += (new Date(b.timestamp) - new Date(dernierDebut)) / 60000;
          dernierDebut = null;
        }
      }
    }
    const heuresTotales = minutesTotales / 60;

    // 9. Calculer les montants de factures par statut
    // Montant payé = total des acomptes reçus (tous les acomptes déjà versés)
    const facturesPaye = await prisma.facture.aggregate({
      where: {
        tenant_id: tenantId
      },
      _sum: {
        acompte_recu: true
      }
    });
    const montantPaye = facturesPaye._sum.acompte_recu || 0;

    // Montant en attente = reste à payer pour les factures EN_ATTENTE/PARTIEL non encore en retard
    const facturesEnAttente = await prisma.facture.aggregate({
      where: {
        tenant_id: tenantId,
        statut_paiement: {
          in: ['EN_ATTENTE', 'PARTIEL']
        },
        date_echeance: {
          gte: now
        }
      },
      _sum: {
        reste_a_payer: true
      }
    });
    const montantEnAttente = facturesEnAttente._sum.reste_a_payer || 0;

    // Calculer les factures en retard (échéance dépassée)
    const facturesRetard = await prisma.facture.findMany({
      where: {
        tenant_id: tenantId,
        statut_paiement: {
          in: ['EN_ATTENTE', 'PARTIEL']
        },
        date_echeance: {
          lt: now
        }
      },
      select: {
        reste_a_payer: true
      }
    });

    const montantRetard = facturesRetard.reduce((sum, f) => sum + (f.reste_a_payer || 0), 0);

    // 10. Lister les factures récentes (top 10)
    const facturesRecentes = await prisma.facture.findMany({
      where: {
        tenant_id: tenantId
      },
      select: {
        id: true,
        numero_facture: true,
        client_nom: true,
        montant_ttc: true,
        statut_paiement: true,
        date_echeance: true,
        date_emission: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });

    // 11. Lister les chantiers actifs (top 6)
    const chantiersActifs = await prisma.chantier.findMany({
      where: {
        tenant_id: tenantId,
        statut: 'EN_COURS'
      },
      select: {
        id: true,
        nom: true,
        statut: true,
        date_debut: true,
        date_fin_prevue: true,
        client: {
          select: {
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: {
        date_debut: 'desc'
      },
      take: 6
    });

    const chantiersFormatted = chantiersActifs.map(c => ({
      id: c.id,
      nom: c.nom,
      statut: c.statut,
      date_debut: c.date_debut,
      date_fin_prevue: c.date_fin_prevue,
      client: {
        nom: `${c.client.prenom || ''} ${c.client.nom}`.trim()
      }
    }));

    // Réponse
    const response = {
      periode,
      mois: now.toISOString().substring(0, 7),

      kpis: {
        nb_clients: nbClients,
        nb_chantiers_actifs: nbChantiersActifs,
        nb_chantiers_termines: nbChantiersTermines,
        nb_devis_en_attente: nbDevisEnAttente,
        nb_devis_envoyes: nbDevisEnvoyes,
        taux_acceptation_devis: parseFloat(tauxAcceptation),
        ca_facture_ht: parseFloat(caFactureHT.toFixed(2)),
        ca_facture_ttc: parseFloat(caFactureTTC.toFixed(2)),
        ca_encaisse: parseFloat(caEncaisse.toFixed(2)),
        heures_totales: parseFloat(heuresTotales.toFixed(1)),
        // Nouveaux KPIs pour factures
        montant_paye: parseFloat(montantPaye.toFixed(2)),
        montant_en_attente: parseFloat(montantEnAttente.toFixed(2)),
        montant_retard: parseFloat(montantRetard.toFixed(2))
      },

      factures_recentes: facturesRecentes,
      chantiers_actifs: chantiersFormatted,
      chantiers_en_cours: chantiersFormatted // Backward compatibility
    };

    logger.info('Dashboard récupéré', {
      service: 'autobat-api',
      tenant_id: tenantId,
      periode
    });

    res.json(response);
  } catch (error) {
    logger.error('Erreur récupération dashboard', {
      service: 'autobat-api',
      error: error.message
    });
    next(error);
  }
};

/**
 * GET /api/dashboard/employe - Planning et tâches de l'employé connecté
 */
export const getDashboardEmploye = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const employe = req.user.employe;

    if (!employe) {
      return res.status(404).json({
        code: 'EMPLOYE_NOT_FOUND',
        message: 'Aucune fiche employé trouvée pour cet utilisateur'
      });
    }

    // Calcul semaine courante (lundi → samedi)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Dim, 1=Lun, ... 6=Sam
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 5); // Samedi
    endOfWeek.setHours(23, 59, 59, 999);

    // Chantiers assignés à l'employé qui se déroulent cette semaine
    const chantiersAssignes = await prisma.chantier.findMany({
      where: {
        tenant_id: tenantId,
        employes_assignes: {
          some: { employe_id: employe.id }
        },
        statut: { in: ['PLANIFIE', 'EN_COURS'] },
        date_debut: { lte: endOfWeek },
        OR: [
          { date_fin_prevue: null },
          { date_fin_prevue: { gte: startOfWeek } }
        ]
      },
      include: {
        client: { select: { nom: true } }
      },
      orderBy: { date_debut: 'asc' }
    });

    // Tâches assignées à l'employé (chantiers actifs, non terminées)
    const tachesAssignees = await prisma.tache.findMany({
      where: {
        chantier: {
          tenant_id: tenantId,
          statut: { in: ['PLANIFIE', 'EN_COURS'] }
        },
        employes_assignes: {
          some: { employe_id: employe.id }
        },
        statut: { in: ['A_FAIRE', 'EN_COURS'] }
      },
      include: {
        chantier: {
          select: { id: true, nom: true, adresse: true, ville: true, statut: true }
        }
      },
      orderBy: [{ chantier_id: 'asc' }, { ordre: 'asc' }]
    });

    res.json({
      employe_id: employe.id,
      chantiers_semaine: chantiersAssignes,
      taches_assignees: tachesAssignees,
      semaine: {
        debut: startOfWeek,
        fin: endOfWeek
      }
    });
  } catch (error) {
    logger.error('Erreur dashboard employé', {
      service: 'autobat-api',
      error: error.message
    });
    next(error);
  }
};
