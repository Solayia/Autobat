// Supprime tous les tenants clients (non-plateforme) et leurs données
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
global.currentTenantId = null;

async function main() {
  // Trouver tous les tenants non-plateforme
  const clientTenants = await prisma.tenant.findMany({
    where: { siret: { not: '00000000000000' } },
    select: { id: true, nom: true, siret: true, statut: true }
  });

  if (clientTenants.length === 0) {
    console.log('Aucun tenant client à supprimer.');
    return;
  }

  console.log(`${clientTenants.length} tenant(s) à supprimer :`);
  clientTenants.forEach(t => console.log(`  - ${t.nom} (${t.siret}) [${t.statut}]`));

  const ids = clientTenants.map(t => t.id);

  // Supprimer dans l'ordre FK
  await prisma.paiementFacture.deleteMany({ where: { facture: { tenant_id: { in: ids } } } });
  await prisma.ligneFacture.deleteMany({ where: { facture: { tenant_id: { in: ids } } } });
  await prisma.facture.deleteMany({ where: { tenant_id: { in: ids } } });
  await prisma.tacheEmploye.deleteMany({ where: { tache: { chantier: { tenant_id: { in: ids } } } } });
  await prisma.tache.deleteMany({ where: { chantier: { tenant_id: { in: ids } } } });
  await prisma.badgeage.deleteMany({ where: { tenant_id: { in: ids } } });
  await prisma.chantierEmploye.deleteMany({ where: { chantier: { tenant_id: { in: ids } } } });
  await prisma.document.deleteMany({ where: { chantier: { tenant_id: { in: ids } } } });
  await prisma.chantier.deleteMany({ where: { tenant_id: { in: ids } } });
  await prisma.ligneDevis.deleteMany({ where: { devis: { tenant_id: { in: ids } } } });
  await prisma.devis.deleteMany({ where: { tenant_id: { in: ids } } });
  await prisma.historiquePrix.deleteMany({ where: { ouvrage: { tenant_id: { in: ids } } } });
  await prisma.ouvrage.deleteMany({ where: { tenant_id: { in: ids } } });
  await prisma.client.deleteMany({ where: { tenant_id: { in: ids } } });
  await prisma.notification.deleteMany({ where: { tenant_id: { in: ids } } });
  await prisma.employe.deleteMany({ where: { tenant_id: { in: ids } } });
  await prisma.passwordResetToken.deleteMany({ where: { user: { tenant_id: { in: ids } } } });
  await prisma.refreshToken.deleteMany({ where: { user: { tenant_id: { in: ids } } } });
  await prisma.user.deleteMany({ where: { tenant_id: { in: ids } } });
  await prisma.tenant.deleteMany({ where: { id: { in: ids } } });

  console.log('✅ Tous les tenants clients supprimés.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
