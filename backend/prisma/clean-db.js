// Script de nettoyage complet de la base de données
// Supprime TOUTES les données clients et recréé 2 comptes SUPER_ADMIN
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
global.currentTenantId = null;

async function main() {
  console.log('🧹 Nettoyage complet de la base de données...\n');

  // Supprimer dans l'ordre pour respecter les FK
  await prisma.paiementFacture.deleteMany({});
  await prisma.ligneFacture.deleteMany({});
  await prisma.facture.deleteMany({});
  await prisma.tacheEmploye.deleteMany({});
  await prisma.tache.deleteMany({});
  await prisma.badgeage.deleteMany({});
  await prisma.chantierEmploye.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.chantier.deleteMany({});
  await prisma.ligneDevis.deleteMany({});
  await prisma.devis.deleteMany({});
  await prisma.historiquePrix.deleteMany({});
  await prisma.ouvrage.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.employe.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  console.log('✅ Base de données vidée\n');

  // Recréer le tenant platform interne
  const platformTenant = await prisma.tenant.create({
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

  const passwordHash = await bcrypt.hash('Autobat2026!', 10);

  await prisma.user.create({
    data: {
      tenant_id: platformTenant.id,
      email: 'adrien.lechevalier@solayia.fr',
      password_hash: passwordHash,
      role: 'SUPER_ADMIN',
      prenom: 'Adrien',
      nom: 'Lechevalier',
      actif: true,
      email_verified: true
    }
  });

  await prisma.user.create({
    data: {
      tenant_id: platformTenant.id,
      email: 'kevin.dolie@solayia.fr',
      password_hash: passwordHash,
      role: 'SUPER_ADMIN',
      prenom: 'Kevin',
      nom: 'Dolie',
      actif: true,
      email_verified: true
    }
  });

  console.log('✅ Super admins créés :');
  console.log('   📧 adrien.lechevalier@solayia.fr');
  console.log('   📧 kevin.dolie@solayia.fr');
  console.log('   🔑 Mot de passe : Autobat2026!');
  console.log('\n⚠️  Changez les mots de passe après connexion !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
