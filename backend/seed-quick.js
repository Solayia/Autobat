import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 'cmlkkhnn0000110y1zowu4bj2'; // Test BTP tenant

  const ouvrages = [
    {
      tenant_id: tenantId,
      code: 'MAC-001',
      categorie: 'Maçonnerie',
      denomination: 'Mur en parpaings 20cm - fourniture et pose',
      unite: 'm²',
      prix_unitaire_ht: 45.50,
      temps_estime_minutes: 120,
      nb_chantiers_realises: 0
    },
    {
      tenant_id: tenantId,
      code: 'PEI-001',
      categorie: 'Peinture',
      denomination: 'Peinture intérieure - 2 couches',
      unite: 'm²',
      prix_unitaire_ht: 18.50,
      temps_estime_minutes: 45,
      nb_chantiers_realises: 0
    },
    {
      tenant_id: tenantId,
      code: 'PLO-001',
      categorie: 'Plomberie',
      denomination: 'Installation lavabo avec robinetterie',
      unite: 'u',
      prix_unitaire_ht: 280.00,
      temps_estime_minutes: 180,
      nb_chantiers_realises: 0
    },
    {
      tenant_id: tenantId,
      code: 'ELE-001',
      categorie: 'Électricité',
      denomination: 'Point lumineux complet',
      unite: 'u',
      prix_unitaire_ht: 95.00,
      temps_estime_minutes: 60,
      nb_chantiers_realises: 0
    },
    {
      tenant_id: tenantId,
      code: 'CAR-001',
      categorie: 'Carrelage',
      denomination: 'Pose carrelage 30x30 - fourniture et pose',
      unite: 'm²',
      prix_unitaire_ht: 65.00,
      temps_estime_minutes: 90,
      nb_chantiers_realises: 0
    }
  ];

  console.log('🌱 Seeding ouvrages...');

  for (const ouvrage of ouvrages) {
    await prisma.ouvrage.create({
      data: ouvrage
    });
    console.log(`✅ Created: ${ouvrage.code} - ${ouvrage.denomination}`);
  }

  console.log(`\n✅ ${ouvrages.length} ouvrages créés avec succès!`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
