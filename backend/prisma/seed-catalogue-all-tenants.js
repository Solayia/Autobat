/**
 * Script: seed-catalogue-all-tenants.js
 * Seed le catalogue Syla pour tous les tenants existants sans ouvrages.
 * Usage: node backend/prisma/seed-catalogue-all-tenants.js
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  const sylaPath = resolve(__dirname, 'data/syla.json');
  const items = JSON.parse(readFileSync(sylaPath, 'utf-8'));

  const tenants = await prisma.tenant.findMany({ select: { id: true, nom: true } });
  console.log(`Tenants trouvés: ${tenants.length}`);

  for (const tenant of tenants) {
    const count = await prisma.ouvrage.count({ where: { tenant_id: tenant.id } });
    if (count > 0) {
      console.log(`  [SKIP] ${tenant.nom} — ${count} ouvrages déjà présents`);
      continue;
    }

    console.log(`  [SEED] ${tenant.nom} (${tenant.id})...`);
    let created = 0;

    // Désactiver le middleware tenant pour ce script
    for (const item of items) {
      if (!item.denomination) continue;
      try {
        await prisma.ouvrage.create({
          data: {
            tenant_id: tenant.id,
            categorie: item.categorie || 'Divers',
            code: item.code || '',
            denomination: item.denomination,
            unite: item.unite || 'F',
            prix_unitaire_ht: parseFloat(item.debourse_ht) || 0,
            temps_estime_minutes: null,
            temps_reel_moyen: null,
            nb_chantiers_realises: 0,
            notes: item.note || null,
          }
        });
        created++;
      } catch (e) {
        // ignore duplicate
      }
    }
    console.log(`  ✅ ${created} ouvrages créés pour ${tenant.nom}`);
  }

  await prisma.$disconnect();
  console.log('\nTerminé.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
