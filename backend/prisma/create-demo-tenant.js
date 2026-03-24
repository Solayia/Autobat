// Script de création du compte démo Autobat
// Compte permanent avec is_demo=true — accès illimité, jamais modifié par Stripe
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
global.currentTenantId = null;

const DEMO_EMAIL = 'demo@autobat.pro';
const DEMO_PASSWORD = 'Demo@Autobat2026!';
const DEMO_SIRET = '11111111111111';

async function seedCatalogue(tenantId) {
  const SYLA_PATH = resolve(__dirname, './data/syla.json');
  try {
    const raw = readFileSync(SYLA_PATH, 'utf-8');
    const items = JSON.parse(raw);

    await prisma.ouvrage.deleteMany({ where: { tenant_id: tenantId } });

    let created = 0;
    for (const item of items) {
      if (!item.denomination) continue;
      await prisma.ouvrage.create({
        data: {
          tenant_id: tenantId,
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
    }
    console.log(`✅ Catalogue seedé: ${created} ouvrages`);
    return created;
  } catch (err) {
    console.warn('⚠️  Catalogue non seedé (fichier syla.json manquant?):', err.message);
    return 0;
  }
}

async function main() {
  // Vérifier si le compte démo existe déjà
  const existingUser = await prisma.user.findFirst({ where: { email: DEMO_EMAIL } });
  if (existingUser) {
    console.log('ℹ️  Compte démo déjà existant:', DEMO_EMAIL);

    // S'assurer que le tenant est bien marqué is_demo
    const tenant = await prisma.tenant.findUnique({ where: { id: existingUser.tenant_id } });
    if (tenant && !tenant.is_demo) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { is_demo: true, statut: 'ACTIF' }
      });
      console.log('✅ Tenant mis à jour: is_demo=true, statut=ACTIF');
    } else {
      console.log('✅ Tenant démo déjà configuré correctement');
    }
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Créer le tenant démo
  let tenant = await prisma.tenant.findFirst({ where: { siret: DEMO_SIRET } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        nom: 'Compte Démo',
        siret: DEMO_SIRET,
        adresse: '1 rue de la Démo',
        code_postal: '75001',
        ville: 'Paris',
        telephone: '0600000000',
        email: 'demo@autobat.pro',
        plan: 'ENTERPRISE',
        statut: 'ACTIF',
        is_demo: true,
        employes_max: 50,
        cgu_accepted_at: new Date(),
        cgv_accepted_at: new Date(),
      }
    });
    console.log('✅ Tenant démo créé:', tenant.id);
  } else {
    // Tenant existe mais is_demo pas encore activé
    if (!tenant.is_demo) {
      tenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: { is_demo: true, statut: 'ACTIF' }
      });
    }
    console.log('ℹ️  Tenant démo déjà existant:', tenant.id);
  }

  // 2. Créer le user COMPANY_ADMIN
  const user = await prisma.user.create({
    data: {
      tenant_id: tenant.id,
      email: DEMO_EMAIL,
      password_hash: passwordHash,
      role: 'COMPANY_ADMIN',
      prenom: 'Compte',
      nom: 'Démo',
      telephone: '0600000000',
      actif: true,
      email_verified: true
    }
  });
  console.log('✅ User démo créé:', user.id);

  // 3. Créer l'entrée Employe
  await prisma.employe.create({
    data: {
      tenant_id: tenant.id,
      user_id: user.id,
      quota_mensuel_heures: null
    }
  });
  console.log('✅ Employe démo créé');

  // 4. Seeder le catalogue
  await seedCatalogue(tenant.id);

  console.log('\n🎭 Compte démo prêt:');
  console.log('   Email   :', DEMO_EMAIL);
  console.log('   Password:', DEMO_PASSWORD);
  console.log('   Tenant  :', tenant.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
