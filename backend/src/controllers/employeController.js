import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import logger from '../config/logger.js';
import { sendEmployeWelcomeEmail } from '../services/emailService.js';

/**
 * @desc    Créer un nouvel employé
 * @route   POST /api/employes
 * @access  COMPANY_ADMIN
 */
export const createEmploye = async (req, res, next) => {
  try {
    const { prenom, nom, email, password, telephone, quota_mensuel_heures, role } = req.body;
    const tenantId = req.tenantId;

    // Validation
    if (!prenom || !nom || !email || !password) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Les champs prenom, nom, email et password sont obligatoires'
      });
    }

    // Valider le rôle
    const validRoles = ['EMPLOYEE', 'MANAGER', 'COMPTABLE', 'COMPANY_ADMIN'];
    const employeRole = role && validRoles.includes(role) ? role : 'EMPLOYEE';
    if (employeRole === 'SUPER_ADMIN') {
      return res.status(400).json({
        code: 'INVALID_ROLE',
        message: 'Le rôle SUPER_ADMIN ne peut pas être assigné'
      });
    }

    // Vérifier email unique dans le tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        tenant_id: tenantId,
        email: email
      }
    });

    if (existingUser) {
      return res.status(409).json({
        code: 'EMAIL_EXISTS',
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier le nombre d'employés autorisés
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: { employes: true }
        }
      }
    });

    if (tenant._count.employes >= tenant.employes_max) {
      return res.status(403).json({
        code: 'EMPLOYES_LIMIT_REACHED',
        message: `Limite d'employés atteinte (${tenant.employes_max}). Augmentez votre nombre de comptes pour ajouter plus d'employés.`,
        current: tenant._count.employes,
        max: tenant.employes_max,
        pricing: {
          first: '100€ HT/mois',
          additional: '20€ HT/mois par employé supplémentaire'
        }
      });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Transaction: créer user + employe
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer le user avec le rôle spécifié
      const user = await tx.user.create({
        data: {
          tenant_id: tenantId,
          email,
          password_hash: passwordHash,
          role: employeRole,
          prenom,
          nom,
          telephone: telephone || null,
          actif: true,
          email_verified: false
        }
      });

      // 2. Créer l'employé
      const employe = await tx.employe.create({
        data: {
          tenant_id: tenantId,
          user_id: user.id,
          quota_mensuel_heures: quota_mensuel_heures ? parseFloat(quota_mensuel_heures) : null
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              prenom: true,
              nom: true,
              telephone: true,
              role: true,
              actif: true
            }
          }
        }
      });

      return employe;
    });

    logger.info(`Employé créé: ${result.user.email} (${result.id})`);

    // Envoyer email de bienvenue à l'employé (async, ne bloque pas la réponse)
    // Note: `tenant` est déjà récupéré plus haut dans la fonction
    sendEmployeWelcomeEmail({
      tenantId,
      to: email,
      prenom,
      nom,
      email,
      password,
      tenantNom: tenant?.nom || 'Votre entreprise'
    }).catch(() => {}); // Silencieux si SMTP absent

    res.status(201).json(result);
  } catch (error) {
    logger.error('Erreur création employé:', error);
    next(error);
  }
};

/**
 * @desc    Lister les employés du tenant
 * @route   GET /api/employes
 * @access  MANAGER, COMPANY_ADMIN
 */
export const getEmployes = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const employes = await prisma.employe.findMany({
      where: {
        tenant_id: tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            prenom: true,
            nom: true,
            telephone: true,
            role: true,
            actif: true,
            last_login: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(employes);
  } catch (error) {
    logger.error('Erreur récupération employés:', error);
    next(error);
  }
};

/**
 * @desc    Modifier un employé
 * @route   PATCH /api/employes/:id
 * @access  COMPANY_ADMIN
 */
export const updateEmploye = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prenom, nom, telephone, quota_mensuel_heures, actif, role } = req.body;
    const tenantId = req.tenantId;

    // Valider le rôle si fourni
    if (role) {
      const validRoles = ['EMPLOYEE', 'MANAGER', 'COMPTABLE', 'COMPANY_ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          code: 'INVALID_ROLE',
          message: 'Rôle invalide. Les rôles autorisés sont: EMPLOYEE, MANAGER, COMPTABLE, COMPANY_ADMIN'
        });
      }
      if (role === 'SUPER_ADMIN') {
        return res.status(400).json({
          code: 'INVALID_ROLE',
          message: 'Le rôle SUPER_ADMIN ne peut pas être assigné'
        });
      }
    }

    // Vérifier que l'employé appartient au tenant
    const employe = await prisma.employe.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: { user: true }
    });

    if (!employe) {
      return res.status(404).json({
        code: 'EMPLOYE_NOT_FOUND',
        message: 'Employé introuvable'
      });
    }

    // Transaction: mettre à jour user + employe
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le user
      const userUpdate = {};
      if (prenom !== undefined) userUpdate.prenom = prenom;
      if (nom !== undefined) userUpdate.nom = nom;
      if (telephone !== undefined) userUpdate.telephone = telephone;
      if (actif !== undefined) userUpdate.actif = actif;
      if (role !== undefined) userUpdate.role = role;

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: employe.user_id },
          data: userUpdate
        });
      }

      // Mettre à jour l'employé
      const employeUpdate = {};
      if (quota_mensuel_heures !== undefined) {
        employeUpdate.quota_mensuel_heures = quota_mensuel_heures ? parseFloat(quota_mensuel_heures) : null;
      }

      const updatedEmploye = await tx.employe.update({
        where: { id },
        data: employeUpdate,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              prenom: true,
              nom: true,
              telephone: true,
              role: true,
              actif: true
            }
          }
        }
      });

      return updatedEmploye;
    });

    logger.info(`Employé modifié: ${result.user.email} (${result.id})`);
    res.json(result);
  } catch (error) {
    logger.error('Erreur modification employé:', error);
    next(error);
  }
};

/**
 * @desc    Supprimer un employé
 * @route   DELETE /api/employes/:id
 * @access  COMPANY_ADMIN
 */
export const deleteEmploye = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    // Vérifier que l'employé appartient au tenant
    const employe = await prisma.employe.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: { user: true }
    });

    if (!employe) {
      return res.status(404).json({
        code: 'EMPLOYE_NOT_FOUND',
        message: 'Employé introuvable'
      });
    }

    // Supprimer l'employé (cascade supprimera le user)
    await prisma.user.delete({
      where: { id: employe.user_id }
    });

    logger.info(`Employé supprimé: ${employe.user.email} (${id})`);
    res.json({ message: 'Employé supprimé avec succès' });
  } catch (error) {
    logger.error('Erreur suppression employé:', error);
    next(error);
  }
};

/**
 * @desc    Réinitialiser le mot de passe d'un employé
 * @route   PATCH /api/employes/:id/reset-password
 * @access  COMPANY_ADMIN
 */
export const resetEmployePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    const tenantId = req.tenantId;

    if (!new_password) {
      return res.status(400).json({ message: 'Le nouveau mot de passe est requis' });
    }

    // Vérifier la complexité du mot de passe
    const { validatePassword } = await import('../utils/passwordValidator.js');
    const validation = validatePassword(new_password);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.errors[0] });
    }

    // Vérifier que l'employé appartient au tenant
    const employe = await prisma.employe.findFirst({
      where: { id, tenant_id: tenantId },
      include: { user: { select: { id: true, email: true } } }
    });

    if (!employe) {
      return res.status(404).json({ message: 'Employé introuvable' });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    await prisma.user.update({
      where: { id: employe.user_id },
      data: { password_hash: passwordHash }
    });

    logger.info(`Mot de passe réinitialisé pour: ${employe.user.email} (${id})`);
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    logger.error('Erreur réinitialisation mot de passe:', error);
    next(error);
  }
};

/**
 * @desc    Exporter les heures des employés en CSV
 * @route   GET /api/employes/export-heures
 * @access  MANAGER, COMPANY_ADMIN
 */
export const exportHeuresCSV = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { mois, annee } = req.query; // Format: mois=2, annee=2026

    const now = new Date();
    const targetYear = parseInt(annee) || now.getFullYear();
    const targetMonth = parseInt(mois) || now.getMonth() + 1; // 1-12

    const dateDebut = new Date(targetYear, targetMonth - 1, 1);
    const dateFin = new Date(targetYear, targetMonth, 1);

    // Récupérer tous les employés du tenant
    const employes = await prisma.employe.findMany({
      where: { tenant_id: tenantId },
      include: {
        user: { select: { prenom: true, nom: true, email: true, role: true, actif: true } }
      }
    });

    // Pour chaque employé, calculer les heures du mois
    const rows = [];

    for (const emp of employes) {
      const badgeages = await prisma.badgeage.findMany({
        where: {
          employe_id: emp.id,
          tenant_id: tenantId,
          timestamp: { gte: dateDebut, lt: dateFin }
        },
        orderBy: { timestamp: 'asc' }
      });

      // Calculer les heures de présence (DEBUT/FIN pairs)
      let totalMinutes = 0;
      let dernierDebut = null;

      for (const b of badgeages) {
        if (b.type === 'PRESENCE_DEBUT') {
          dernierDebut = new Date(b.timestamp);
        } else if (b.type === 'PRESENCE_FIN' && dernierDebut) {
          const duree = (new Date(b.timestamp) - dernierDebut) / (1000 * 60);
          totalMinutes += duree;
          dernierDebut = null;
        }
      }

      const totalHeures = (totalMinutes / 60).toFixed(2);
      const nbJours = new Set(
        badgeages
          .filter(b => b.type === 'PRESENCE_DEBUT')
          .map(b => new Date(b.timestamp).toDateString())
      ).size;

      rows.push({
        prenom: emp.user.prenom,
        nom: emp.user.nom,
        email: emp.user.email,
        role: emp.user.role,
        actif: emp.user.actif ? 'Oui' : 'Non',
        quota_heures: emp.quota_mensuel_heures || '',
        heures_realisees: totalHeures,
        nb_jours_travailles: nbJours,
        ecart: emp.quota_mensuel_heures
          ? (totalHeures - emp.quota_mensuel_heures).toFixed(2)
          : ''
      });
    }

    // Générer CSV
    const headers = [
      'Prénom', 'Nom', 'Email', 'Rôle', 'Actif',
      'Quota mensuel (h)', 'Heures réalisées (h)', 'Jours travaillés', 'Écart (h)'
    ];

    const csvLines = [
      `Export heures - ${targetMonth.toString().padStart(2, '0')}/${targetYear}`,
      '',
      headers.join(';'),
      ...rows.map(r => [
        r.prenom, r.nom, r.email, r.role, r.actif,
        r.quota_heures, r.heures_realisees, r.nb_jours_travailles, r.ecart
      ].join(';'))
    ];

    const csv = csvLines.join('\n');
    const filename = `heures-employes-${targetYear}-${String(targetMonth).padStart(2, '0')}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM UTF-8 pour Excel
  } catch (error) {
    logger.error('Erreur export heures:', error);
    next(error);
  }
};
