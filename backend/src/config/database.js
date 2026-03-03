import { PrismaClient } from '@prisma/client';

// Prisma Client avec middleware pour isolation multi-tenant
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Middleware pour isolation tenant_id automatique
// CRITIQUE: Toutes les requêtes doivent être filtrées par tenant_id
prisma.$use(async (params, next) => {
  // Récupérer le tenant_id du contexte (sera injecté par le middleware auth)
  const tenantId = global.currentTenantId;

  if (!tenantId) {
    // Pas de tenant_id = requête système ou erreur
    return next(params);
  }

  // Liste des modèles multi-tenant (tous sauf Tenant lui-même)
  // Note: Tache n'a pas de tenant_id car isolé via chantier_id
  const multiTenantModels = [
    'User', 'Client', 'Ouvrage', 'Devis', 'LigneDevis',
    'Chantier', 'Badgeage', 'Document',
    'Facture', 'LigneFacture', 'PaiementFacture',
    'Employe', 'Notification'
  ];

  if (multiTenantModels.includes(params.model)) {
    // Lecture: filtrer par tenant_id
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args = params.args || {};
      params.args.where = {
        ...params.args.where,
        tenant_id: tenantId
      };
    }

    // findUnique: ajouter tenant_id au where si pas déjà présent
    if (params.action === 'findUnique') {
      params.args = params.args || {};
      params.args.where = {
        ...params.args.where,
        tenant_id: tenantId
      };
    }

    // Création: injecter tenant_id
    if (params.action === 'create') {
      params.args = params.args || {};
      params.args.data = {
        ...params.args.data,
        tenant_id: tenantId
      };
    }

    // createMany: injecter tenant_id à chaque objet
    if (params.action === 'createMany') {
      params.args = params.args || {};
      params.args.data = params.args.data.map(item => ({
        ...item,
        tenant_id: tenantId
      }));
    }

    // Update/Delete: filtrer par tenant_id
    if (params.action === 'update' || params.action === 'updateMany' ||
        params.action === 'delete' || params.action === 'deleteMany') {
      params.args = params.args || {};
      params.args.where = {
        ...params.args.where,
        tenant_id: tenantId
      };
    }
  }

  return next(params);
});

// Gestion déconnexion propre
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
