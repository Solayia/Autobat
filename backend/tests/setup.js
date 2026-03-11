import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DB_PATH = resolve(__dirname, '../prisma/test.db');

// Base de données de test séparée
process.env.DATABASE_URL = `file:${DB_PATH}`;
process.env.JWT_SECRET = 'test-jwt-secret-32chars-minimum-ok';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32chars-min-ok';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.FRONTEND_URL = 'http://localhost:5173';

let prisma;

// Créer le schema de test avant tous les tests
beforeAll(async () => {
  // Supprimer la DB de test si elle existe (y compris les fichiers WAL/SHM)
  for (const f of [DB_PATH, `${DB_PATH}-wal`, `${DB_PATH}-shm`]) {
    if (existsSync(f)) unlinkSync(f);
  }
  // Créer les tables
  execSync('npx prisma db push --schema prisma/schema.test.prisma --skip-generate', {
    env: { ...process.env },
    stdio: 'inherit',
    cwd: resolve(__dirname, '..')
  });

  prisma = new PrismaClient();
  await prisma.$connect();

  // Seed minimal : 2 tenants pour tester l'isolation
  const tenant1 = await prisma.tenant.create({
    data: {
      id: 'tenant-test-1',
      nom: 'Tenant Test 1',
      siret: '12345678901234',
      adresse: '1 rue Test',
      code_postal: '75001',
      ville: 'Paris',
      email: 'tenant1@test.fr',
      telephone: '0600000001',
      statut: 'ACTIF'
    }
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      id: 'tenant-test-2',
      nom: 'Tenant Test 2',
      siret: '98765432109876',
      adresse: '2 rue Test',
      code_postal: '69001',
      ville: 'Lyon',
      email: 'tenant2@test.fr',
      telephone: '0600000002',
      statut: 'ACTIF'
    }
  });

  // Un admin par tenant
  const bcrypt = await import('bcrypt');
  const hash = await bcrypt.hash('Test1234!', 10);

  await prisma.user.create({
    data: {
      id: 'user-admin-1',
      tenant_id: tenant1.id,
      email: 'admin1@test.fr',
      password_hash: hash,
      prenom: 'Admin',
      nom: 'Tenant1',
      role: 'COMPANY_ADMIN',
      email_verified: true
    }
  });

  await prisma.user.create({
    data: {
      id: 'user-admin-2',
      tenant_id: tenant2.id,
      email: 'admin2@test.fr',
      password_hash: hash,
      prenom: 'Admin',
      nom: 'Tenant2',
      role: 'COMPANY_ADMIN',
      email_verified: true
    }
  });

  await prisma.$disconnect();
});

// Supprimer la DB de test après tous les tests
afterAll(async () => {
  for (const f of [DB_PATH, `${DB_PATH}-wal`, `${DB_PATH}-shm`]) {
    if (existsSync(f)) unlinkSync(f);
  }
});
