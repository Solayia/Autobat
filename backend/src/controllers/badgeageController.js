import prisma from '../config/database.js';
import logger from '../config/logger.js';

/**
 * @desc    Lister les badgeages d'un chantier
 * @route   GET /api/chantiers/:chantierId/badgeages
 * @access  EMPLOYEE (soi), MANAGER, COMPANY_ADMIN
 */
export const getBadgeagesByChantier = async (req, res, next) => {
  try {
    const { chantierId } = req.params;
    const { employe_id, type, date_debut, date_fin, page = 1, limit = 50 } = req.query;
    const tenantId = req.tenantId;
    const userRole = req.userRole;
    const userId = req.userId;

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

    // Construire les filtres
    const where = {
      chantier_id: chantierId,
      tenant_id: tenantId
    };

    // EMPLOYEE ne peut voir que ses propres badgeages
    if (userRole === 'EMPLOYEE') {
      const employe = await prisma.employe.findFirst({
        where: {
          user_id: userId,
          tenant_id: tenantId
        }
      });

      if (!employe) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'Accès refusé'
        });
      }

      where.employe_id = employe.id;
    } else if (employe_id) {
      // MANAGER et COMPANY_ADMIN peuvent filtrer par employé
      where.employe_id = employe_id;
    }

    if (type) {
      where.type = type;
    }

    if (date_debut || date_fin) {
      where.timestamp = {};
      if (date_debut) {
        where.timestamp.gte = new Date(date_debut);
      }
      if (date_fin) {
        where.timestamp.lte = new Date(date_fin);
      }
    }

    const [badgeages, total] = await Promise.all([
      prisma.badgeage.findMany({
        where,
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
          },
          tache: {
            select: {
              id: true,
              nom: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.badgeage.count({ where })
    ]);

    res.json({
      badgeages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Erreur récupération badgeages:', error);
    next(error);
  }
};

/**
 * @desc    Créer un badgeage manuel
 * @route   POST /api/chantiers/:chantierId/badgeages
 * @access  EMPLOYEE (soi), MANAGER, COMPANY_ADMIN
 */
export const createBadgeage = async (req, res, next) => {
  try {
    const { chantierId } = req.params;
    const { type, tache_id, latitude, longitude, precision_metres } = req.body;
    const tenantId = req.tenantId;
    const userId = req.userId;

    // Validation
    if (!type) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Le type de badgeage est obligatoire'
      });
    }

    const typesValides = ['PRESENCE_DEBUT', 'PRESENCE_FIN', 'TACHE_DEBUT', 'TACHE_PAUSE', 'TACHE_REPRISE', 'TACHE_FIN'];
    if (!typesValides.includes(type)) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: `Type invalide. Valeurs acceptées: ${typesValides.join(', ')}`
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

    // Récupérer l'employé
    const employe = await prisma.employe.findFirst({
      where: {
        user_id: userId,
        tenant_id: tenantId
      }
    });

    if (!employe) {
      return res.status(404).json({
        code: 'EMPLOYE_NOT_FOUND',
        message: 'Employé introuvable'
      });
    }

    // Créer le badgeage
    const badgeage = await prisma.badgeage.create({
      data: {
        tenant_id: tenantId,
        chantier_id: chantierId,
        employe_id: employe.id,
        tache_id: tache_id || null,
        type,
        methode: 'MANUEL',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        precision_metres: precision_metres ? parseInt(precision_metres) : null,
        timestamp: new Date(),
        synced: true
      },
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
        },
        tache: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });

    logger.info(`Badgeage manuel créé: ${badgeage.type} pour employé ${employe.id} sur chantier ${chantierId}`);

    res.status(201).json(badgeage);
  } catch (error) {
    logger.error('Erreur création badgeage:', error);
    next(error);
  }
};

/**
 * @desc    Badgeage admin : créer un badge au nom d'un employé
 * @route   POST /api/chantiers/:chantierId/badgeages/admin
 * @access  MANAGER, COMPANY_ADMIN
 */
export const adminCreateBadgeage = async (req, res, next) => {
  try {
    const { chantierId } = req.params;
    const { type, employe_id, tache_id, latitude, longitude, precision_metres } = req.body;
    const tenantId = req.tenantId;
    const userRole = req.userRole;

    if (!['MANAGER', 'COMPANY_ADMIN'].includes(userRole)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Accès réservé aux managers et admins' });
    }

    if (!type || !employe_id) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'type et employe_id sont obligatoires' });
    }

    const typesValides = ['PRESENCE_DEBUT', 'PRESENCE_FIN', 'TACHE_DEBUT', 'TACHE_PAUSE', 'TACHE_REPRISE', 'TACHE_FIN'];
    if (!typesValides.includes(type)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: `Type invalide` });
    }

    const chantier = await prisma.chantier.findFirst({ where: { id: chantierId, tenant_id: tenantId } });
    if (!chantier) return res.status(404).json({ code: 'CHANTIER_NOT_FOUND', message: 'Chantier introuvable' });

    const employe = await prisma.employe.findFirst({ where: { id: employe_id, tenant_id: tenantId } });
    if (!employe) return res.status(404).json({ code: 'EMPLOYE_NOT_FOUND', message: 'Employé introuvable' });

    const badgeage = await prisma.badgeage.create({
      data: {
        tenant_id: tenantId,
        chantier_id: chantierId,
        employe_id: employe.id,
        tache_id: tache_id || null,
        type,
        methode: 'MANUEL',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        precision_metres: precision_metres ? parseInt(precision_metres) : null,
        timestamp: new Date(),
        synced: true
      },
      include: {
        employe: { include: { user: { select: { id: true, prenom: true, nom: true, email: true } } } },
        tache: { select: { id: true, nom: true } }
      }
    });

    logger.info(`Badgeage admin: ${type} pour employé ${employe_id} sur chantier ${chantierId}`);
    res.status(201).json(badgeage);
  } catch (error) {
    logger.error('Erreur badgeage admin:', error);
    next(error);
  }
};

/**
 * @desc    Synchroniser des badgeages offline (IndexedDB → API)
 * @route   POST /api/badgeages/sync
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
export const syncBadgeages = async (req, res, next) => {
  try {
    const { badges } = req.body;
    const tenantId = req.tenantId;
    const userId = req.userId;

    if (!Array.isArray(badges) || badges.length === 0) {
      return res.status(400).json({ message: 'badges requis (tableau non vide)' });
    }

    const employe = await prisma.employe.findFirst({
      where: { user_id: userId, tenant_id: tenantId }
    });
    if (!employe) return res.status(404).json({ message: 'Employé introuvable' });

    const synced = [];
    const errors = [];
    const typesValides = ['PRESENCE_DEBUT', 'PRESENCE_FIN', 'TACHE_DEBUT', 'TACHE_PAUSE', 'TACHE_REPRISE', 'TACHE_FIN'];

    for (const badge of badges) {
      const { local_id, chantier_id, type, latitude, longitude, precision_metres, timestamp, tache_id } = badge;
      try {
        const chantier = await prisma.chantier.findFirst({
          where: { id: chantier_id, tenant_id: tenantId }
        });
        if (!chantier) { errors.push({ local_id, error: 'Chantier introuvable' }); continue; }
        if (!typesValides.includes(type)) { errors.push({ local_id, error: 'Type invalide' }); continue; }

        const created = await prisma.badgeage.create({
          data: {
            tenant_id: tenantId,
            chantier_id,
            employe_id: employe.id,
            tache_id: tache_id || null,
            type,
            methode: 'GPS',
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            precision_metres: precision_metres ? parseInt(precision_metres) : null,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            synced: true
          }
        });
        synced.push({ local_id, id: created.id });
      } catch (e) {
        errors.push({ local_id, error: e.message });
      }
    }

    logger.info(`Sync offline: ${synced.length} badgeage(s) synchronisé(s) pour employé ${employe.id}`);
    res.json({ synced: synced.length, results: synced, errors });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer un badgeage (correction d'erreur)
 * @route   DELETE /api/chantiers/:chantierId/badgeages/:id
 * @access  MANAGER, COMPANY_ADMIN
 */
export const deleteBadgeage = async (req, res, next) => {
  try {
    const { chantierId, id } = req.params;
    const tenantId = req.tenantId;
    const userRole = req.userRole;

    if (!['MANAGER', 'COMPANY_ADMIN'].includes(userRole)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Accès réservé aux managers et admins' });
    }

    // Vérifier que le badgeage appartient bien à un chantier du tenant
    const badgeage = await prisma.badgeage.findFirst({
      where: {
        id,
        chantier_id: chantierId,
        chantier: { tenant_id: tenantId }
      }
    });

    if (!badgeage) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Badgeage introuvable' });
    }

    await prisma.badgeage.delete({ where: { id } });

    logger.info(`Badgeage supprimé: ${id} sur chantier ${chantierId} par ${userRole}`);
    res.json({ message: 'Badgeage supprimé avec succès' });
  } catch (error) {
    logger.error('Erreur suppression badgeage:', error);
    next(error);
  }
};
