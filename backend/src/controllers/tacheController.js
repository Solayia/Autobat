import prisma from '../config/database.js';
import logger from '../config/logger.js';
import { updatePrixAutoLearning } from './catalogueController.js';

/**
 * @desc    Créer une tâche pour un chantier
 * @route   POST /api/chantiers/:chantierId/taches
 * @access  MANAGER, COMPANY_ADMIN
 */
export const createTache = async (req, res, next) => {
  try {
    const { chantierId } = req.params;
    const { nom, description, piece, quantite_prevue, unite, ouvrage_id, ordre } = req.body;
    const tenantId = req.tenantId;

    // Validation
    if (!nom) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Le nom de la tâche est obligatoire'
      });
    }

    // Vérifier que le chantier appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Calculer l'ordre automatiquement si non fourni
    let finalOrdre = ordre;
    if (!finalOrdre) {
      const maxOrdre = await prisma.tache.aggregate({
        where: { chantier_id: chantierId },
        _max: { ordre: true }
      });
      finalOrdre = (maxOrdre._max.ordre || 0) + 1;
    }

    // Créer la tâche
    const tache = await prisma.tache.create({
      data: {
        chantier_id: chantierId,
        ouvrage_id: ouvrage_id || null,
        nom,
        description: description || null,
        piece: piece || null,
        quantite_prevue: quantite_prevue ? parseFloat(quantite_prevue) : null,
        unite: unite || null,
        statut: 'A_FAIRE',
        ordre: finalOrdre
      },
      include: {
        ouvrage: true
      }
    });

    logger.info(`Tâche créée: ${tache.nom} (${tache.id}) pour chantier ${chantierId}`);
    res.status(201).json(tache);
  } catch (error) {
    logger.error('Erreur création tâche:', error);
    next(error);
  }
};

/**
 * @desc    Lister les tâches d'un chantier
 * @route   GET /api/chantiers/:chantierId/taches
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
export const getTachesByChantier = async (req, res, next) => {
  try {
    const { chantierId } = req.params;
    const tenantId = req.tenantId;

    // Vérifier que le chantier appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    const taches = await prisma.tache.findMany({
      where: { chantier_id: chantierId },
      include: {
        ouvrage: true,
        employes_assignes: {
          include: {
            employe: {
              include: {
                user: {
                  select: {
                    id: true,
                    prenom: true,
                    nom: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        badgeages: {
          select: {
            id: true,
            type: true,
            timestamp: true,
            employe_id: true
          }
        }
      },
      orderBy: { ordre: 'asc' }
    });

    res.json(taches);
  } catch (error) {
    logger.error('Erreur récupération tâches:', error);
    next(error);
  }
};

/**
 * @desc    Mettre à jour une tâche
 * @route   PATCH /api/chantiers/:chantierId/taches/:id
 * @access  MANAGER, COMPANY_ADMIN
 */
export const updateTache = async (req, res, next) => {
  try {
    const { chantierId, id } = req.params;
    const { nom, description, piece, quantite_prevue, unite, statut, ordre } = req.body;
    const tenantId = req.tenantId;

    // Vérifier que le chantier appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Vérifier que la tâche existe
    const tache = await prisma.tache.findFirst({
      where: {
        id,
        chantier_id: chantierId
      }
    });

    if (!tache) {
      return res.status(404).json({
        code: 'TACHE_NOT_FOUND',
        message: 'Tâche introuvable'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    if (nom !== undefined) updateData.nom = nom;
    if (description !== undefined) updateData.description = description;
    if (piece !== undefined) updateData.piece = piece;
    if (quantite_prevue !== undefined) updateData.quantite_prevue = quantite_prevue ? parseFloat(quantite_prevue) : null;
    if (unite !== undefined) updateData.unite = unite;
    if (statut !== undefined) {
      // Valider le statut
      const statutsValides = ['A_FAIRE', 'EN_COURS', 'TERMINEE'];
      if (!statutsValides.includes(statut)) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Statut invalide. Valeurs acceptées: A_FAIRE, EN_COURS, TERMINEE'
        });
      }
      updateData.statut = statut;
    }
    if (ordre !== undefined) updateData.ordre = parseInt(ordre);

    const updatedTache = await prisma.tache.update({
      where: { id },
      data: updateData,
      include: {
        ouvrage: true
      }
    });

    // ── Auto-learning : déclencher quand une tâche passe à TERMINEE ──
    // Calcule le temps réel cumulé de TOUS les employés, par employé séparément
    // pour éviter les interférences entre cycles de différents employés.
    if (statut === 'TERMINEE' && tache.statut !== 'TERMINEE' && updatedTache.ouvrage_id) {
      try {
        const tacheBadges = await prisma.badgeage.findMany({
          where: { tache_id: id },
          orderBy: { timestamp: 'asc' }
        });

        // Grouper par employe_id
        const byEmploye = {};
        for (const b of tacheBadges) {
          if (!byEmploye[b.employe_id]) byEmploye[b.employe_id] = [];
          byEmploye[b.employe_id].push(b);
        }

        // Calculer le temps par employé (cycles DEBUT/REPRISE → PAUSE/FIN)
        let totalMinutes = 0;
        for (const badges of Object.values(byEmploye)) {
          let debutCycle = null;
          for (const b of badges) {
            if (b.type === 'TACHE_DEBUT' || b.type === 'TACHE_REPRISE') {
              debutCycle = new Date(b.timestamp);
            } else if ((b.type === 'TACHE_PAUSE' || b.type === 'TACHE_FIN') && debutCycle) {
              totalMinutes += (new Date(b.timestamp) - debutCycle) / 60000;
              debutCycle = null;
            }
          }
        }

        if (totalMinutes > 0) {
          await updatePrixAutoLearning(updatedTache.ouvrage_id, totalMinutes);
          logger.info(`Auto-learning déclenché: tâche ${updatedTache.nom}, ${totalMinutes.toFixed(1)} min cumulées (${Object.keys(byEmploye).length} employé(s))`);
        }
      } catch (autoErr) {
        logger.error('Erreur auto-learning après TERMINEE:', autoErr);
      }
    }

    logger.info(`Tâche modifiée: ${updatedTache.nom} (${updatedTache.id})`);
    res.json(updatedTache);
  } catch (error) {
    logger.error('Erreur modification tâche:', error);
    next(error);
  }
};

/**
 * @desc    Créer des tâches depuis les lignes de devis du chantier
 * @route   POST /api/chantiers/:chantierId/taches/from-devis
 * @access  MANAGER, COMPANY_ADMIN
 */
export const createTachesFromDevis = async (req, res, next) => {
  try {
    const { chantierId } = req.params;
    const tenantId = req.tenantId;

    // Vérifier que le chantier appartient au tenant et a un devis
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      },
      include: {
        devis: {
          include: {
            lignes: {
              include: {
                ouvrage: true
              }
            }
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

    if (!chantier.devis) {
      return res.status(400).json({
        code: 'NO_DEVIS',
        message: 'Ce chantier n\'a pas de devis associé'
      });
    }

    if (!chantier.devis.lignes || chantier.devis.lignes.length === 0) {
      return res.status(400).json({
        code: 'NO_LIGNES',
        message: 'Le devis ne contient aucune ligne'
      });
    }

    // Créer un map des sections pour retrouver facilement les parents
    const sectionsMap = {};
    chantier.devis.lignes.forEach(ligne => {
      if (ligne.type === 'SECTION') {
        sectionsMap[ligne.id] = ligne.description;
      }
    });

    // Filtrer les lignes de type OUVRAGE et MAIN_OEUVRE (les deux deviennent des tâches)
    // Exclut les SECTION (titres) et MATERIAU (fournitures)
    const lignesValides = chantier.devis.lignes.filter(ligne => {
      return ligne.type === 'OUVRAGE' || ligne.type === 'MAIN_OEUVRE';
    });

    if (lignesValides.length === 0) {
      return res.status(400).json({
        code: 'NO_LIGNES_VALIDES',
        message: 'Le devis ne contient aucune ligne valide à convertir en tâche'
      });
    }

    // Vérifier s'il y a déjà des tâches pour ce chantier
    const existingTaches = await prisma.tache.count({
      where: { chantier_id: chantierId }
    });

    if (existingTaches > 0) {
      return res.status(400).json({
        code: 'TACHES_EXIST',
        message: `Ce chantier a déjà ${existingTaches} tâche(s). Supprimez-les d'abord si vous voulez régénérer depuis le devis.`
      });
    }

    // Créer les tâches depuis les lignes de devis valides
    const tachesData = lignesValides.map((ligne, index) => {
      // Titre de la tâche = description de la ligne
      const nom = ligne.description || `Ligne ${index + 1} du devis`;

      // Description de la tâche = nom de la section parente (si elle existe)
      let description = null;
      if (ligne.parent_ligne_id && sectionsMap[ligne.parent_ligne_id]) {
        description = sectionsMap[ligne.parent_ligne_id];
      }

      return {
        chantier_id: chantierId,
        ouvrage_id: ligne.ouvrage_id,
        nom,
        description,
        quantite_prevue: ligne.quantite || null,
        unite: ligne.unite || null,
        statut: 'A_FAIRE',
        ordre: index + 1
      };
    });

    // Créer toutes les tâches en une seule transaction
    const createdTaches = await prisma.$transaction(
      tachesData.map(data => prisma.tache.create({ data, include: { ouvrage: true } }))
    );

    logger.info(`${createdTaches.length} tâches créées depuis devis pour chantier ${chantierId}`);
    res.status(201).json({
      message: `${createdTaches.length} tâches créées avec succès`,
      taches: createdTaches
    });
  } catch (error) {
    logger.error('Erreur création tâches depuis devis:', error);
    next(error);
  }
};

/**
 * @desc    Supprimer une tâche
 * @route   DELETE /api/chantiers/:chantierId/taches/:id
 * @access  MANAGER, COMPANY_ADMIN
 */
export const deleteTache = async (req, res, next) => {
  try {
    const { chantierId, id } = req.params;
    const tenantId = req.tenantId;

    // Vérifier que le chantier appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Vérifier que la tâche existe
    const tache = await prisma.tache.findFirst({
      where: {
        id,
        chantier_id: chantierId
      }
    });

    if (!tache) {
      return res.status(404).json({
        code: 'TACHE_NOT_FOUND',
        message: 'Tâche introuvable'
      });
    }

    await prisma.tache.delete({
      where: { id }
    });

    logger.info(`Tâche supprimée: ${tache.nom} (${tache.id})`);
    res.json({ message: 'Tâche supprimée avec succès' });
  } catch (error) {
    logger.error('Erreur suppression tâche:', error);
    next(error);
  }
};

/**
 * @desc    Assigner un employé à une tâche
 * @route   POST /api/chantiers/:chantierId/taches/:id/assign
 * @access  MANAGER, COMPANY_ADMIN
 */
export const assignEmployeToTache = async (req, res, next) => {
  try {
    const { chantierId, id } = req.params;
    const { employe_id } = req.body;
    const tenantId = req.tenantId;

    if (!employe_id) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'L\'ID de l\'employé est obligatoire'
      });
    }

    // Vérifier que le chantier appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Vérifier que la tâche existe
    const tache = await prisma.tache.findFirst({
      where: {
        id,
        chantier_id: chantierId
      }
    });

    if (!tache) {
      return res.status(404).json({
        code: 'TACHE_NOT_FOUND',
        message: 'Tâche introuvable'
      });
    }

    // Vérifier que l'employé existe et appartient au tenant
    const employe = await prisma.employe.findFirst({
      where: {
        id: employe_id,
        tenant_id: tenantId
      }
    });

    if (!employe) {
      return res.status(404).json({
        code: 'EMPLOYE_NOT_FOUND',
        message: 'Employé introuvable'
      });
    }

    // Assigner l'employé (upsert pour éviter les doublons)
    const assignment = await prisma.tacheEmploye.upsert({
      where: {
        tache_id_employe_id: {
          tache_id: id,
          employe_id: employe_id
        }
      },
      create: {
        tache_id: id,
        employe_id: employe_id
      },
      update: {},
      include: {
        employe: {
          include: {
            user: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                email: true
              }
            }
          }
        }
      }
    });

    logger.info(`Employé ${employe_id} assigné à la tâche ${id}`);
    res.status(201).json(assignment);
  } catch (error) {
    logger.error('Erreur assignation employé:', error);
    next(error);
  }
};

/**
 * @desc    Retirer l'assignation d'un employé d'une tâche
 * @route   DELETE /api/chantiers/:chantierId/taches/:id/assign/:employeId
 * @access  MANAGER, COMPANY_ADMIN
 */
export const unassignEmployeFromTache = async (req, res, next) => {
  try {
    const { chantierId, id, employeId } = req.params;
    const tenantId = req.tenantId;

    // Vérifier que le chantier appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Supprimer l'assignation
    await prisma.tacheEmploye.deleteMany({
      where: {
        tache_id: id,
        employe_id: employeId
      }
    });

    logger.info(`Employé ${employeId} retiré de la tâche ${id}`);
    res.json({ message: 'Employé retiré de la tâche avec succès' });
  } catch (error) {
    logger.error('Erreur retrait assignation:', error);
    next(error);
  }
};
