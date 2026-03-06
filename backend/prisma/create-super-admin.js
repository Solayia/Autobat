// Script de création des comptes SUPER_ADMIN pour l'équipe Autobat
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
global.currentTenantId = null;

const SUPER_ADMINS = [
  { email: 'adrien.lechevalier@solayia.fr', prenom: 'Adrien', nom: 'Lechevalier' },
  { email: 'kevin.dolie@solayia.fr', prenom: 'Kevin', nom: 'Dolie' },
];
const PASSWORD = 'Autobat2026!';

async function main() {
  // Renommer le compte legacy superadmin@autobat.fr si présent
  const legacy = await prisma.user.findFirst({ where: { email: 'superadmin@autobat.fr' } });
  if (legacy) {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    await prisma.user.update({
      where: { id: legacy.id },
      data: { email: 'adrien.lechevalier@solayia.fr', prenom: 'Adrien', nom: 'Lechevalier', password_hash: passwordHash }
    });
    console.log('✅ Legacy superadmin renamed to adrien.lechevalier@solayia.fr with Autobat2026!');
    return;
  }

  // Vérifier si les comptes officiels existent déjà
  const adrienExists = await prisma.user.findFirst({ where: { email: 'adrien.lechevalier@solayia.fr' } });
  const kevinExists = await prisma.user.findFirst({ where: { email: 'kevin.dolie@solayia.fr' } });

  if (adrienExists && kevinExists) {
    console.log('✅ Super admins déjà configurés — aucune modification.');
    return;
  }

  // Créer le tenant platform si nécessaire
  let platformTenant = await prisma.tenant.findFirst({
    where: { siret: '00000000000000' }
  });

  if (!platformTenant) {
    platformTenant = await prisma.tenant.create({
      data: {
        nom: 'Autobat Platform',
        siret: '00000000000000',
        adresse: 'Interne',
        code_postal: '75000',
        ville: 'Paris',
        telephone: '0000000000',
        email: 'platform@autobat.fr',
        plan: 'ENTERPRISE',
        statut: 'ACTIF'
      }
    });
    console.log('Tenant platform créé:', platformTenant.id);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const admin of SUPER_ADMINS) {
    const exists = await prisma.user.findFirst({ where: { email: admin.email } });
    if (!exists) {
      await prisma.user.create({
        data: {
          tenant_id: platformTenant.id,
          email: admin.email,
          password_hash: passwordHash,
          role: 'SUPER_ADMIN',
          prenom: admin.prenom,
          nom: admin.nom,
          actif: true,
          email_verified: true
        }
      });
      console.log('✅ Super admin créé:', admin.email);
    } else {
      console.log('✅ Super admin existe déjà:', admin.email);
    }
  }

  console.log('Mot de passe:', PASSWORD);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
