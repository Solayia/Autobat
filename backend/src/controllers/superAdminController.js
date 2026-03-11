import prisma from '../config/database.js';
import logger from '../config/logger.js';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Exécute une requête en mode SUPER_ADMIN (sans filtre tenant)
 */
const withSuperAdmin = async (fn) => {
  const prev = global.currentTenantId;
  global.currentTenantId = null;
  try {
    return await fn();
  } finally {
    global.currentTenantId = prev;
  }
};

// ═══════════════════════════════════════════════
// STATS & PILOTAGE
// ═══════════════════════════════════════════════

/**
 * GET /api/super-admin/stats
 * Stats globales de la plateforme (business metrics)
 */
export const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalTenants,
      tenantsActifs,
      tenantsSuspendus,
      newTenantsThisMonth,
      newTenantsLastMonth,
      nouveaux7j,
      onboardingIncomplet,
      totalUsers,
      activeUsers30d,
      totalDevis,
      devisCreeCeMois,
      totalChantiers,
      chantiersActifs,
      totalFactures,
      badgeagesAujourdhui,
      badgeages30j,
      tenantsEtablissements
    ] = await withSuperAdmin(() =>
      Promise.all([
        prisma.tenant.count({ where: { siret: { not: '00000000000000' } } }),
        prisma.tenant.count({ where: { statut: 'ACTIF', siret: { not: '00000000000000' } } }),
        prisma.tenant.count({ where: { statut: 'SUSPENDU', siret: { not: '00000000000000' } } }),
        prisma.tenant.count({ where: { date_inscription: { gte: startOfMonth }, siret: { not: '00000000000000' } } }),
        prisma.tenant.count({ where: { date_inscription: { gte: startOfLastMonth, lte: endOfLastMonth }, siret: { not: '00000000000000' } } }),
        prisma.tenant.count({ where: { date_inscription: { gte: last7Days }, siret: { not: '00000000000000' } } }),
        prisma.tenant.count({ where: { onboarding_completed: false, statut: 'ACTIF', siret: { not: '00000000000000' } } }),
        prisma.user.count({ where: { tenant: { siret: { not: '00000000000000' } } } }),
        prisma.user.count({ where: { last_login: { gte: last30Days }, tenant: { siret: { not: '00000000000000' } } } }),
        prisma.devis.count(),
        prisma.devis.count({ where: { created_at: { gte: startOfMonth } } }),
        prisma.chantier.count(),
        prisma.chantier.count({ where: { statut: 'EN_COURS' } }),
        prisma.facture.count(),
        prisma.badgeage.count({ where: { timestamp: { gte: today } } }),
        prisma.badgeage.count({ where: { timestamp: { gte: last30Days } } }),
        prisma.tenant.findMany({
          where: { siret: { not: '00000000000000' } },
          select: {
            _count: { select: { users: true } }
          }
        })
      ])
    );

    // MRR réel : 100€ (1er compte) + 20€/compte supplémentaire
    const mrr = tenantsEtablissements.reduce((sum, t) => {
      const nb = t._count.users;
      if (nb === 0) return sum;
      return sum + 100 + Math.max(0, nb - 1) * 20;
    }, 0);

    // CA total facturé
    const facturesAgg = await withSuperAdmin(() =>
      prisma.facture.aggregate({
        _sum: { montant_ttc: true },
        where: {
          OR: [
            { statut_facture: { in: ['ENVOYEE', 'PAYEE'] } },
            { statut_paiement: { in: ['PARTIEL', 'PAYE'] } }
          ]
        }
      })
    );

    // Tenants à risque (COMPANY_ADMIN jamais connecté ou inactif depuis 14j, inscrit > 7j)
    const tenantsARisque = await withSuperAdmin(() =>
      prisma.tenant.findMany({
        where: {
          statut: 'ACTIF',
          siret: { not: '00000000000000' },
          date_inscription: { lte: last7Days },
          users: {
            some: {
              role: 'COMPANY_ADMIN',
              OR: [
                { last_login: null },
                { last_login: { lte: last14Days } }
              ]
            }
          }
        },
        select: {
          id: true,
          nom: true,
          date_inscription: true,
          users: {
            where: { role: 'COMPANY_ADMIN' },
            select: { last_login: true, email: true }
          }
        },
        take: 5,
        orderBy: { date_inscription: 'asc' }
      })
    );

    // Dernières inscriptions
    const derniersInscrits = await withSuperAdmin(() =>
      prisma.tenant.findMany({
        where: { siret: { not: '00000000000000' } },
        select: {
          id: true,
          nom: true,
          date_inscription: true,
          plan: true,
          onboarding_completed: true,
          users: {
            where: { role: 'COMPANY_ADMIN' },
            select: { prenom: true, nom: true, email: true, last_login: true }
          }
        },
        orderBy: { date_inscription: 'desc' },
        take: 5
      })
    );

    // Nouveaux tenants par mois (6 derniers mois)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const tenantsParMois = await withSuperAdmin(() =>
      prisma.tenant.findMany({
        where: { date_inscription: { gte: sixMonthsAgo }, siret: { not: '00000000000000' } },
        select: { date_inscription: true }
      })
    );

    const croissance = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      croissance[key] = 0;
    }
    tenantsParMois.forEach(t => {
      const d = new Date(t.date_inscription);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (croissance[key] !== undefined) croissance[key]++;
    });

    res.json({
      tenants: {
        total: totalTenants,
        actifs: tenantsActifs,
        suspendus: tenantsSuspendus,
        nouveaux_ce_mois: newTenantsThisMonth,
        nouveaux_mois_dernier: newTenantsLastMonth,
        nouveaux_7j: nouveaux7j,
        onboarding_incomplet: onboardingIncomplet,
        croissance_pourcent: newTenantsLastMonth > 0
          ? Math.round(((newTenantsThisMonth - newTenantsLastMonth) / newTenantsLastMonth) * 100)
          : null
      },
      users: {
        total: totalUsers,
        actifs_30j: activeUsers30d,
        taux_engagement: totalUsers > 0 ? Math.round((activeUsers30d / totalUsers) * 100) : 0
      },
      business: {
        mrr_estime: mrr,
        arr_estime: mrr * 12,
        ca_total_facture: facturesAgg._sum.montant_ttc || 0,
        devis: totalDevis,
        devis_ce_mois: devisCreeCeMois,
        chantiers: totalChantiers,
        chantiers_actifs: chantiersActifs,
        factures: totalFactures,
        badgeages_aujourd_hui: badgeagesAujourdhui,
        badgeages_30j: badgeages30j
      },
      alertes: {
        clients_a_risque: tenantsARisque.map(t => ({
          id: t.id,
          nom: t.nom,
          date_inscription: t.date_inscription,
          last_login: t.users[0]?.last_login || null,
          email: t.users[0]?.email || null
        })),
        onboarding_incomplet: onboardingIncomplet
      },
      derniers_inscrits: derniersInscrits.map(t => ({
        id: t.id,
        nom: t.nom,
        date_inscription: t.date_inscription,
        plan: t.plan,
        onboarding_completed: t.onboarding_completed,
        admin: t.users[0] ? {
          prenom: t.users[0].prenom,
          nom: t.users[0].nom,
          email: t.users[0].email,
          last_login: t.users[0].last_login
        } : null
      })),
      croissance_mensuelle: croissance
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════
// GESTION TENANTS
// ═══════════════════════════════════════════════

/**
 * GET /api/super-admin/tenants
 */
export const getTenants = async (req, res, next) => {
  try {
    const { statut, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { siret: { not: '00000000000000' } };
    if (statut) where.statut = statut;
    if (search) {
      where.OR = [
        { nom: { contains: search } },
        { siret: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const [tenants, total] = await withSuperAdmin(() =>
      Promise.all([
        prisma.tenant.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date_inscription: 'desc' },
          include: {
            _count: {
              select: { users: true, chantiers: true, devis: true, factures: true }
            }
          }
        }),
        prisma.tenant.count({ where })
      ])
    );

    res.json({
      tenants,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/super-admin/tenants/:id
 */
export const getTenantById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await withSuperAdmin(() =>
      prisma.tenant.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              prenom: true,
              nom: true,
              role: true,
              actif: true,
              last_login: true,
              created_at: true
            },
            orderBy: { role: 'asc' }
          },
          _count: {
            select: {
              clients: true,
              chantiers: true,
              devis: true,
              factures: true,
              catalogue: true,
              employes: true
            }
          }
        }
      })
    );

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant introuvable' });
    }

    // Stats financières du tenant
    const [devisCA, facturesCA] = await withSuperAdmin(() =>
      Promise.all([
        prisma.devis.aggregate({
          where: { tenant_id: id, statut: 'ACCEPTE' },
          _sum: { montant_ttc: true }
        }),
        prisma.facture.aggregate({
          where: { tenant_id: id },
          _sum: { montant_ttc: true, acompte_recu: true }
        })
      ])
    );

    res.json({
      ...tenant,
      financier: {
        devis_ca_accepte: devisCA._sum.montant_ttc || 0,
        factures_total: facturesCA._sum.montant_ttc || 0,
        encaisse: facturesCA._sum.acompte_recu || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/super-admin/tenants/:id/statut
 */
export const updateTenantStatut = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut, raison } = req.body;

    if (!['ACTIF', 'SUSPENDU'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide (ACTIF | SUSPENDU)' });
    }

    // Empêcher suspension du tenant platform
    const tenant = await withSuperAdmin(() =>
      prisma.tenant.findUnique({ where: { id }, select: { siret: true, nom: true } })
    );
    if (tenant?.siret === '00000000000000') {
      return res.status(403).json({ message: 'Impossible de modifier le tenant platform' });
    }

    const updated = await withSuperAdmin(() =>
      prisma.tenant.update({
        where: { id },
        data: { statut },
        select: { id: true, nom: true, statut: true }
      })
    );

    logger.info(`[SUPER_ADMIN] Tenant ${id} (${tenant?.nom}) → ${statut}`, {
      admin_id: req.userId,
      raison: raison || 'Non précisée'
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/super-admin/tenants/:id
 * Supprime un tenant et toutes ses données (cascade)
 */
export const deleteTenant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await withSuperAdmin(() =>
      prisma.tenant.findUnique({ where: { id }, select: { siret: true, nom: true } })
    );

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant introuvable' });
    }

    if (tenant.siret === '00000000000000') {
      return res.status(403).json({ message: 'Impossible de supprimer le tenant platform' });
    }

    await withSuperAdmin(() =>
      prisma.tenant.delete({ where: { id } })
    );

    logger.warn(`[SUPER_ADMIN] Tenant ${id} (${tenant.nom}) SUPPRIMÉ`, {
      admin_id: req.userId
    });

    res.json({ message: `Tenant "${tenant.nom}" supprimé définitivement` });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/super-admin/tenants/:id/impersonate
 * Génère un token de connexion pour le COMPANY_ADMIN du tenant
 */
export const impersonateTenant = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Trouver le COMPANY_ADMIN du tenant
    const adminUser = await withSuperAdmin(() =>
      prisma.user.findFirst({
        where: {
          tenant_id: id,
          role: 'COMPANY_ADMIN',
          actif: true
        },
        include: { tenant: true, employe: true }
      })
    );

    if (!adminUser) {
      return res.status(404).json({ message: 'Aucun COMPANY_ADMIN actif trouvé pour ce tenant' });
    }

    // Générer un token d'accès court (2h) avec flag impersonation
    const impersonationToken = jwt.sign(
      {
        user_id: adminUser.id,
        tenant_id: adminUser.tenant_id,
        role: adminUser.role,
        email: adminUser.email,
        impersonated_by: req.userId,
        is_impersonation: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    logger.warn(`[SUPER_ADMIN] Impersonation: tenant ${id} (${adminUser.tenant.nom}) par ${req.userId}`, {
      admin_id: req.userId,
      target_user: adminUser.id,
      tenant_id: id
    });

    res.json({
      access_token: impersonationToken,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        prenom: adminUser.prenom,
        nom: adminUser.nom,
        role: adminUser.role,
        tenant_id: adminUser.tenant_id,
        employe_id: adminUser.employe?.id
      },
      tenant: {
        id: adminUser.tenant.id,
        nom: adminUser.tenant.nom,
        siret: adminUser.tenant.siret,
        plan: adminUser.tenant.plan,
        employes_max: adminUser.tenant.employes_max,
        statut: adminUser.tenant.statut,
        onboarding_completed: adminUser.tenant.onboarding_completed,
        onboarding_step: adminUser.tenant.onboarding_step
      },
      expires_in: 7200,
      is_impersonation: true
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════
// LOGS
// ═══════════════════════════════════════════════

/**
 * GET /api/super-admin/logs
 * Lit les dernières lignes du fichier de log
 */
export const getLogs = async (req, res, next) => {
  try {
    const { type = 'combined', lines = 100 } = req.query;
    const logFile = type === 'error' ? 'logs/error.log' : 'logs/combined.log';
    const logPath = path.join(__dirname, '../../', logFile);

    if (!fs.existsSync(logPath)) {
      return res.json({ logs: [], total: 0 });
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const allLines = content.trim().split('\n').filter(Boolean);
    const lastLines = allLines.slice(-parseInt(lines)).reverse();

    const parsedLogs = lastLines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { message: line, timestamp: new Date().toISOString(), level: 'info' };
      }
    });

    res.json({
      logs: parsedLogs,
      total: allLines.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/super-admin/logs
 * Vider les logs
 */
export const clearLogs = async (req, res, next) => {
  try {
    const { type = 'combined' } = req.query;
    const logFile = type === 'error' ? 'logs/error.log' : 'logs/combined.log';
    const logPath = path.join(__dirname, '../../', logFile);

    if (fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '');
    }

    logger.info(`[SUPER_ADMIN] Logs ${type} vidés par ${req.userId}`);
    res.json({ message: 'Logs vidés' });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════
// USERS CROSS-TENANT
// ═══════════════════════════════════════════════

/**
 * GET /api/super-admin/users
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { email, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { tenant: { siret: { not: '00000000000000' } } };
    if (email) where.email = { contains: email };

    const [users, total] = await withSuperAdmin(() =>
      Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            email: true,
            prenom: true,
            nom: true,
            role: true,
            actif: true,
            last_login: true,
            created_at: true,
            tenant_id: true,
            tenant: { select: { id: true, nom: true, statut: true } }
          }
        }),
        prisma.user.count({ where })
      ])
    );

    res.json({
      users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};
