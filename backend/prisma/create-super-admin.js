// Script de création du compte SUPER_ADMIN pour l'équipe Autobat
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
global.currentTenantId = null;

async function main() {
  // Vérifier si le SUPER_ADMIN existe déjà
  const existing = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (existing) {
    console.log('SUPER_ADMIN existe déjà:', existing.email);
    return;
  }

  // Créer un tenant platform (interne Autobat)
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

  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash('SuperAutobat2026!', 10);

  // Créer le SUPER_ADMIN
  const superAdmin = await prisma.user.create({
    data: {
      tenant_id: platformTenant.id,
      email: 'superadmin@autobat.fr',
      password_hash: passwordHash,
      role: 'SUPER_ADMIN',
      prenom: 'Super',
      nom: 'Admin',
      actif: true,
      email_verified: true
    }
  });

  console.log('\n✅ SUPER_ADMIN créé avec succès !');
  console.log('Email:    superadmin@autobat.fr');
  console.log('Password: SuperAutobat2026!');
  console.log('ID:', superAdmin.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
