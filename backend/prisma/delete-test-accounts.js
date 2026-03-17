/**
 * Script de suppression des comptes test
 * Supprime : "Maison Deco" et "Le Petit Lys"
 * NE TOUCHE PAS : "GREEN CONFORT" (client réel)
 *
 * Usage : node prisma/delete-test-accounts.js
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const COMPTES_A_SUPPRIMER = ['Maison Deco', 'Le Petit Lys'];
const COMPTES_A_PROTEGER = ['GREEN CONFORT'];

async function main() {
  console.log('🔍 Recherche des comptes...\n');

  // Vérification des comptes à protéger
  for (const nom of COMPTES_A_PROTEGER) {
    const t = await prisma.tenant.findFirst({ where: { nom: { contains: nom } } });
    if (t) {
      console.log(`✅ PROTÉGÉ — "${t.nom}" (id: ${t.id}) — NE SERA PAS SUPPRIMÉ`);
    } else {
      console.log(`⚠️  "${nom}" introuvable en base`);
    }
  }

  console.log('');

  // Recherche et suppression des comptes test
  for (const nom of COMPTES_A_SUPPRIMER) {
    const tenant = await prisma.tenant.findFirst({
      where: { nom: { contains: nom } },
      include: { _count: { select: { users: true, chantiers: true, devis: true, factures: true } } }
    });

    if (!tenant) {
      console.log(`⚠️  "${nom}" introuvable — déjà supprimé ?`);
      continue;
    }

    // Sécurité : vérifier que ce n'est pas GREEN CONFORT
    if (COMPTES_A_PROTEGER.some(p => tenant.nom.toLowerCase().includes(p.toLowerCase()))) {
      console.log(`🚫 ARRÊT — "${tenant.nom}" est dans la liste de protection !`);
      process.exit(1);
    }

    console.log(`🗑️  Suppression de "${tenant.nom}" (id: ${tenant.id})`);
    console.log(`   → ${tenant._count.users} users | ${tenant._count.chantiers} chantiers | ${tenant._count.devis} devis | ${tenant._count.factures} factures`);

    // Récupérer les IDs des Employe du tenant
    const employes = await prisma.employe.findMany({ where: { tenant_id: tenant.id }, select: { id: true } });
    const employeIds = employes.map(e => e.id);

    // Supprimer les badgeages (FK sur employe_id → Employe, pas en cascade via tenant)
    if (employeIds.length > 0) {
      const delBadgeages = await prisma.badgeage.deleteMany({ where: { employe_id: { in: employeIds } } });
      console.log(`   → ${delBadgeages.count} badgeages supprimés`);
    }

    await prisma.tenant.delete({ where: { id: tenant.id } });

    console.log(`   ✅ Supprimé\n`);
  }

  console.log('✅ Terminé.');
}

main()
  .catch(e => {
    console.error('❌ Erreur :', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
