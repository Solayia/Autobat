import prisma from '../config/database.js';
import logger from '../config/logger.js';
import { triggerAutoLearningForChantier } from './catalogueController.js';

/**
 * GET /api/chantiers/mes-chantiers
 * Retourne les chantiers assignés à l'employé connecté avec statut badge du jour
 */
export const getMesChantiers = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;

    const employe = await prisma.employe.findFirst({
      where: { user_id: userId, tenant_id: tenantId }
    });
    if (!employe) return res.status(404).json({ message: 'Profil employé introuvable' });

    const chantierEmployes = await prisma.chantierEmploye.findMany({
      where: { employe_id: employe.id },
      include: {
        chantier: {
          include: {
            client: { select: { nom: true, prenom: true } },
            taches: {
              where: { statut: { not: 'TERMINEE' } },
              orderBy: { ordre: 'asc' },
              select: { id: true, nom: true, statut: true, ouvrage_id: true }
            }
          }
        }
      }
    });

    const chantiersActifs = chantierEmployes
      .map(ce => ce.chantier)
      .filter(c => c.statut === 'EN_COURS');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const chantiersAvecStatut = await Promise.all(chantiersActifs.map(async (chantier) => {
      const dernierBadge = await prisma.badgeage.findFirst({
        where: {
          chantier_id: chantier.id,
          employe_id: employe.id,
          type: { in: ['PRESENCE_DEBUT', 'PRESENCE_FIN'] },
          timestamp: { gte: today, lt: tomorrow }
        },
        orderBy: { timestamp: 'desc' }
      });

      return {
        id: chantier.id,
        nom: chantier.nom,
        adresse: chantier.adresse,
        code_postal: chantier.code_postal,
        ville: chantier.ville,
        latitude: chantier.latitude,
        longitude: chantier.longitude,
        rayon_gps_metres: chantier.rayon_gps_metres,
        badgeage_par_tache: chantier.badgeage_par_tache,
        statut: chantier.statut,
        client_nom: chantier.client?.nom || '',
        taches: chantier.taches,
        badge_actuel: dernierBadge?.type || null,
        heure_debut_badge: dernierBadge?.type === 'PRESENCE_DEBUT' ? dernierBadge.timestamp : null
      };
    }));

    res.json({ chantiers: chantiersAvecStatut, employe_id: employe.id });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chantiers - Créer un nouveau chantier
 */
export const createChantier = async (req, res, next) => {
  try {
    const {
      devis_id,
      client_id,
      nom,
      adresse,
      code_postal,
      ville,
      date_debut,
      date_fin_prevue,
      latitude,
      longitude,
      rayon_metres,
      badgeage_par_tache,
      notes,
      employee_ids
    } = req.body;
    const tenantId = req.tenantId;

    // Validation
    if (!nom || !date_debut || !date_fin_prevue || !adresse || !code_postal || !ville || !latitude || !longitude) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Le nom, les dates, l\'adresse complète et les coordonnées GPS sont obligatoires'
      });
    }

    // Vérifier que les dates sont cohérentes
    const dateDebut = new Date(date_debut);
    const dateFinPrevue = new Date(date_fin_prevue);
    if (dateFinPrevue < dateDebut) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'La date de fin prévue ne peut pas être antérieure à la date de début'
      });
    }

    // Si devis_id est fourni, vérifier qu'il appartient au tenant et récupérer le client_id
    let resolvedClientId = null;

    if (devis_id) {
      const devis = await prisma.devis.findFirst({
        where: {
          id: devis_id,
          tenant_id: tenantId
        }
      });

      if (!devis) {
        return res.status(404).json({
          code: 'DEVIS_NOT_FOUND',
          message: 'Devis introuvable'
        });
      }

      // Vérifier que le devis est accepté
      if (devis.statut !== 'ACCEPTE') {
        return res.status(400).json({
          code: 'DEVIS_NOT_ACCEPTED',
          message: 'Seuls les devis acceptés peuvent être convertis en chantier'
        });
      }

      resolvedClientId = devis.client_id;
    }

    // Si pas de client_id via le devis, utiliser le client_id fourni directement
    if (!resolvedClientId && client_id) {
      const client = await prisma.client.findFirst({
        where: { id: client_id, tenant_id: tenantId }
      });
      if (!client) {
        return res.status(404).json({
          code: 'CLIENT_NOT_FOUND',
          message: 'Client introuvable'
        });
      }
      resolvedClientId = client.id;
    }

    if (!resolvedClientId) {
      return res.status(400).json({
        code: 'CLIENT_REQUIS',
        message: 'Un client est obligatoire. Fournissez client_id ou devis_id.'
      });
    }

    // Créer le chantier
    const chantier = await prisma.chantier.create({
      data: {
        tenant_id: tenantId,
        devis_id: devis_id || null,
        client_id: resolvedClientId,
        nom,
        adresse,
        code_postal,
        ville,
        statut: 'EN_COURS', // Statut par défaut du schema
        date_debut: new Date(date_debut),
        date_fin_prevue: date_fin_prevue ? new Date(date_fin_prevue) : null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        rayon_gps_metres: rayon_metres ? parseInt(rayon_metres) : 100, // Valeur par défaut du schema
        badgeage_par_tache: badgeage_par_tache !== undefined ? badgeage_par_tache : false,
        notes: notes || null
      },
      include: {
        client: true,
        devis: true
      }
    });

    // Assigner les employés si fournis
    if (employee_ids && employee_ids.length > 0) {
      // Vérifier que tous les employés appartiennent au tenant
      const employes = await prisma.employe.findMany({
        where: {
          id: { in: employee_ids },
          tenant_id: tenantId
        }
      });

      if (employes.length !== employee_ids.length) {
        // Certains employés n'existent pas ou n'appartiennent pas au tenant
        logger.warn(`Certains employés n'ont pas pu être assignés au chantier ${chantier.id}`);
      }

      // Créer les assignations
      await prisma.chantierEmploye.createMany({
        data: employes.map(employe => ({
          chantier_id: chantier.id,
          employe_id: employe.id
        }))
      });
    }

    // Recharger le chantier avec les employés
    const chantierWithEmployes = await prisma.chantier.findUnique({
      where: { id: chantier.id },
      include: {
        client: true,
        devis: true,
        employes_assignes: {
          include: {
            employe: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    logger.info(`Chantier créé: ${chantier.nom} (${chantier.id}) par tenant ${tenantId}`);
    res.status(201).json(chantierWithEmployes);
  } catch (error) {
    logger.error('Erreur création chantier:', error);
    next(error);
  }
};

/**
 * GET /api/chantiers - Lister les chantiers avec pagination et filtres
 */
export const getChantiers = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { page = 1, limit = 20, search, statut } = req.query;

    const where = {
      tenant_id: tenantId
    };

    // Filtre par statut
    if (statut) {
      where.statut = statut;
    }

    // Filtre par recherche (nom ou référence)
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [chantiers, total] = await Promise.all([
      prisma.chantier.findMany({
        where,
        include: {
          client: true,
          devis: true,
          employes_assignes: {
            include: {
              employe: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.chantier.count({ where })
    ]);

    res.json({
      data: chantiers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Erreur récupération chantiers:', error);
    next(error);
  }
};

/**
 * GET /api/chantiers/:id - Récupérer un chantier par ID
 */
export const getChantierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const chantier = await prisma.chantier.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: {
        client: true,
        devis: {
          include: {
            lignes: true
          }
        },
        employes_assignes: {
          include: {
            employe: {
              include: {
                user: true
              }
            }
          }
        },
        taches: {
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    res.json(chantier);
  } catch (error) {
    logger.error('Erreur récupération chantier:', error);
    next(error);
  }
};

/**
 * PATCH /api/chantiers/:id - Mettre à jour un chantier
 */
export const updateChantier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const {
      nom,
      adresse,
      code_postal,
      ville,
      date_debut,
      date_fin_prevue,
      latitude,
      longitude,
      rayon_metres,
      badgeage_par_tache,
      notes
    } = req.body;

    // Vérifier que le chantier existe et appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Vérifier que le chantier peut être modifié
    if (chantier.statut === 'TERMINE' || chantier.statut === 'ANNULE') {
      return res.status(400).json({
        code: 'CHANTIER_CLOSED',
        message: 'Un chantier terminé ou annulé ne peut pas être modifié'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    if (nom !== undefined) updateData.nom = nom;
    if (adresse !== undefined) updateData.adresse = adresse;
    if (code_postal !== undefined) updateData.code_postal = code_postal;
    if (ville !== undefined) updateData.ville = ville;
    if (date_debut !== undefined) updateData.date_debut = new Date(date_debut);
    if (date_fin_prevue !== undefined) updateData.date_fin_prevue = date_fin_prevue ? new Date(date_fin_prevue) : null;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (rayon_metres !== undefined) updateData.rayon_gps_metres = parseInt(rayon_metres);
    if (badgeage_par_tache !== undefined) updateData.badgeage_par_tache = badgeage_par_tache;
    if (notes !== undefined) updateData.notes = notes;

    // Vérifier la cohérence des dates si elles sont modifiées
    const finalDateDebut = updateData.date_debut || chantier.date_debut;
    const finalDateFin = updateData.date_fin_prevue || chantier.date_fin_prevue;
    if (finalDateFin < finalDateDebut) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'La date de fin prévue ne peut pas être antérieure à la date de début'
      });
    }

    const updatedChantier = await prisma.chantier.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        devis: true,
        employes_assignes: {
          include: {
            employe: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    logger.info(`Chantier modifié: ${updatedChantier.nom} (${updatedChantier.id})`);
    res.json(updatedChantier);
  } catch (error) {
    logger.error('Erreur modification chantier:', error);
    next(error);
  }
};

/**
 * POST /api/chantiers/:id/start - Démarrer un chantier
 */
export const startChantier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const chantier = await prisma.chantier.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Note: Le statut par défaut est EN_COURS dans le schema
    // Cette fonction change juste la date_debut si nécessaire
    const updatedChantier = await prisma.chantier.update({
      where: { id },
      data: {
        statut: 'EN_COURS',
        date_debut: new Date() // Mettre à jour la date de début réelle
      },
      include: {
        client: true,
        devis: true,
        employes_assignes: {
          include: {
            employe: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    logger.info(`Chantier démarré: ${updatedChantier.nom} (${updatedChantier.id})`);
    res.json(updatedChantier);
  } catch (error) {
    logger.error('Erreur démarrage chantier:', error);
    next(error);
  }
};

/**
 * POST /api/chantiers/:id/complete - Terminer un chantier
 */
export const completeChantier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const chantier = await prisma.chantier.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    if (chantier.statut !== 'EN_COURS') {
      return res.status(400).json({
        code: 'INVALID_STATUS',
        message: 'Seul un chantier en cours peut être terminé'
      });
    }

    const updatedChantier = await prisma.chantier.update({
      where: { id },
      data: {
        statut: 'TERMINE',
        date_fin_reelle: new Date()
      },
      include: {
        client: true,
        devis: true,
        employes_assignes: {
          include: {
            employe: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    logger.info(`Chantier terminé: ${updatedChantier.nom} (${updatedChantier.id})`);

    // Déclencher l'auto-learning en arrière-plan (non-bloquant)
    setImmediate(() => {
      triggerAutoLearningForChantier(updatedChantier.id).catch(err => {
        logger.error('Erreur auto-learning post-completion:', { error: err.message });
      });
    });

    res.json(updatedChantier);
  } catch (error) {
    logger.error('Erreur terminaison chantier:', error);
    next(error);
  }
};

/**
 * POST /api/chantiers/:id/reopen - Rouvrir un chantier terminé
 */
export const reopenChantier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const chantier = await prisma.chantier.findFirst({
      where: { id, tenant_id: tenantId }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    if (chantier.statut !== 'TERMINE') {
      return res.status(400).json({
        code: 'INVALID_STATUS',
        message: 'Seul un chantier terminé peut être rouvert'
      });
    }

    const updatedChantier = await prisma.chantier.update({
      where: { id },
      data: {
        statut: 'EN_COURS',
        date_fin_reelle: null
      },
      include: {
        client: true,
        devis: true,
        employes_assignes: {
          include: {
            employe: { include: { user: true } }
          }
        }
      }
    });

    logger.info(`Chantier rouvert: ${updatedChantier.nom} (${updatedChantier.id})`);
    res.json(updatedChantier);
  } catch (error) {
    logger.error('Erreur réouverture chantier:', error);
    next(error);
  }
};

/**
 * POST /api/chantiers/:id/cancel - Annuler un chantier
 */
export const cancelChantier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const chantier = await prisma.chantier.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    if (chantier.statut === 'TERMINE' || chantier.statut === 'ANNULE') {
      return res.status(400).json({
        code: 'INVALID_STATUS',
        message: 'Un chantier terminé ou déjà annulé ne peut pas être annulé'
      });
    }

    const updatedChantier = await prisma.chantier.update({
      where: { id },
      data: {
        statut: 'ANNULE'
      },
      include: {
        client: true,
        devis: true,
        employes_assignes: {
          include: {
            employe: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    logger.info(`Chantier annulé: ${updatedChantier.nom} (${updatedChantier.id})`);
    res.json(updatedChantier);
  } catch (error) {
    logger.error('Erreur annulation chantier:', error);
    next(error);
  }
};

/**
 * POST /api/chantiers/:id/assign - Assigner des employés à un chantier
 */
export const assignEmployees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { employee_ids } = req.body;
    const tenantId = req.tenantId;

    if (!employee_ids || !Array.isArray(employee_ids)) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'employee_ids doit être un tableau'
      });
    }

    const chantier = await prisma.chantier.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Vérifier que tous les employés appartiennent au tenant
    const employes = await prisma.employe.findMany({
      where: {
        id: { in: employee_ids },
        tenant_id: tenantId
      }
    });

    if (employes.length !== employee_ids.length) {
      return res.status(400).json({
        code: 'INVALID_EMPLOYEES',
        message: 'Certains employés sont introuvables ou n\'appartiennent pas à votre entreprise'
      });
    }

    // Supprimer les anciennes assignations
    await prisma.chantierEmploye.deleteMany({
      where: {
        chantier_id: id
      }
    });

    // Créer les nouvelles assignations
    await prisma.chantierEmploye.createMany({
      data: employes.map(employe => ({
        chantier_id: id,
        employe_id: employe.id
      }))
    });

    // Recharger le chantier avec les employés
    const updatedChantier = await prisma.chantier.findUnique({
      where: { id },
      include: {
        client: true,
        devis: true,
        employes_assignes: {
          include: {
            employe: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    logger.info(`Employés assignés au chantier: ${chantier.nom} (${chantier.id})`);
    res.json(updatedChantier);
  } catch (error) {
    logger.error('Erreur assignation employés:', error);
    next(error);
  }
};

/**
 * DELETE /api/chantiers/:id - Supprimer un chantier
 * Uniquement si PLANIFIE ou ANNULE (pas EN_COURS ou TERMINE avec facture)
 */
export const deleteChantier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const chantier = await prisma.chantier.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        factures: { select: { id: true } },
        badgeages: { select: { id: true }, take: 1 }
      }
    });

    if (!chantier) {
      return res.status(404).json({ code: 'CHANTIER_NOT_FOUND', message: 'Chantier introuvable' });
    }

    if (chantier.factures.length > 0) {
      return res.status(400).json({
        code: 'CHANTIER_HAS_FACTURES',
        message: 'Impossible de supprimer un chantier avec des factures associées'
      });
    }

    // Supprimer les données liées
    await prisma.tache.deleteMany({ where: { chantier_id: id } });
    await prisma.badgeage.deleteMany({ where: { chantier_id: id } });
    await prisma.chantierEmploye.deleteMany({ where: { chantier_id: id } });

    await prisma.chantier.delete({ where: { id } });

    logger.info(`Chantier supprimé: ${chantier.nom} (${id})`);
    res.json({ message: 'Chantier supprimé avec succès' });
  } catch (error) {
    logger.error('Erreur suppression chantier:', error);
    next(error);
  }
};

/**
 * GET /api/chantiers/:id/heures - Stats heures prévues vs réalisées
 */
export const getChantierHeures = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const chantier = await prisma.chantier.findFirst({ where: { id, tenant_id: tenantId } });
    if (!chantier) return res.status(404).json({ error: 'Chantier introuvable' });

    // Heures prévues = somme des duree_minutes des TacheEmploye
    const assignments = await prisma.tacheEmploye.findMany({
      where: { tache: { chantier_id: id } },
      select: { duree_minutes: true }
    });
    const minutes_prevues = assignments.reduce((sum, a) => sum + (a.duree_minutes || 0), 0);

    // Heures réalisées = paires PRESENCE_DEBUT / PRESENCE_FIN
    const badgeages = await prisma.badgeage.findMany({
      where: { chantier_id: id, type: { in: ['PRESENCE_DEBUT', 'PRESENCE_FIN'] } },
      orderBy: [{ employe_id: 'asc' }, { timestamp: 'asc' }],
      select: { employe_id: true, type: true, timestamp: true }
    });

    const byEmploye = {};
    for (const b of badgeages) {
      if (!byEmploye[b.employe_id]) byEmploye[b.employe_id] = [];
      byEmploye[b.employe_id].push(b);
    }
    let minutes_realisees = 0;
    for (const badges of Object.values(byEmploye)) {
      for (let i = 0; i < badges.length - 1; i++) {
        if (badges[i].type === 'PRESENCE_DEBUT' && badges[i + 1].type === 'PRESENCE_FIN') {
          minutes_realisees += (new Date(badges[i + 1].timestamp) - new Date(badges[i].timestamp)) / 60000;
          i++;
        }
      }
    }

    res.json({
      heures_prevues: Math.round(minutes_prevues / 6) / 10,
      heures_realisees: Math.round(minutes_realisees / 6) / 10,
      nb_assignations: assignments.length
    });
  } catch (error) {
    logger.error('Erreur stats heures chantier:', error);
    next(error);
  }
};
