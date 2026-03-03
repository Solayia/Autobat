import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🗑️  Nettoyage de la base de données...\n');

  try {
    // Supprimer dans l'ordre inverse des dépendances
    await prisma.paiementFacture.deleteMany();
    await prisma.ligneFacture.deleteMany();
    await prisma.facture.deleteMany();
    await prisma.document.deleteMany();
    await prisma.badgeage.deleteMany();
    await prisma.tache.deleteMany();
    await prisma.chantier.deleteMany();
    await prisma.ligneDevis.deleteMany();
    await prisma.devis.deleteMany();
    await prisma.ouvrage.deleteMany();
    await prisma.client.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.employe.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    console.log('✅ Base de données nettoyée\n');

    // Créer un compte propre pour les tests
    console.log('👤 Création d\'un compte de test...\n');

    const passwordHash = await bcrypt.hash('Test123!', 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer le tenant
      const tenant = await tx.tenant.create({
        data: {
          nom: 'Entreprise Test',
          siret: '12345678901234',
          adresse: '123 Rue de Test',
          code_postal: '75001',
          ville: 'Paris',
          telephone: '0123456789',
          email: 'contact@entreprisetest.fr',
          plan: 'STARTER',
          statut: 'ACTIF',
          employes_max: 10
        }
      });

      // 2. Créer le user COMPANY_ADMIN
      const user = await tx.user.create({
        data: {
          tenant_id: tenant.id,
          email: 'admin@test.fr',
          password_hash: passwordHash,
          role: 'COMPANY_ADMIN',
          prenom: 'Admin',
          nom: 'Test',
          telephone: '0123456789',
          actif: true,
          email_verified: true
        }
      });

      // 3. Créer un Employe pour le COMPANY_ADMIN
      const employe = await tx.employe.create({
        data: {
          tenant_id: tenant.id,
          user_id: user.id,
          quota_mensuel_heures: null
        }
      });

      return { tenant, user, employe };
    });

    console.log('✅ Compte créé avec succès!\n');
    console.log('='.repeat(60));
    console.log('🏢 ENTREPRISE:');
    console.log(`   Nom: ${result.tenant.nom}`);
    console.log(`   SIRET: ${result.tenant.siret}`);
    console.log(`   Email: ${result.tenant.email}`);
    console.log('');
    console.log('👤 COMPTE ADMIN:');
    console.log(`   Email: ${result.user.email}`);
    console.log(`   Mot de passe: Test123!`);
    console.log(`   Rôle: ${result.user.role}`);
    console.log('='.repeat(60));
    console.log('\n✅ Base de données réinitialisée!\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
