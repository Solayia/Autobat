import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DB_PATH = resolve(ROOT, 'prisma/test.db');

export async function setup() {
  // Env pour ce process global
  process.env.DATABASE_URL = `file:${DB_PATH}`;
  process.env.JWT_SECRET = 'test-jwt-secret-32chars-minimum-ok';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32chars-min-ok';
  process.env.NODE_ENV = 'test';

  // Supprimer l'ancienne DB de test
  for (const f of [DB_PATH, `${DB_PATH}-wal`, `${DB_PATH}-shm`]) {
    if (existsSync(f)) unlinkSync(f);
  }

  // Créer le schéma
  execSync('npx prisma db push --schema prisma/schema.test.prisma --skip-generate', {
    cwd: ROOT,
    env: { ...process.env },
    stdio: 'pipe'
  });

  // Seed minimal
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: `file:${DB_PATH}` } } });
  await prisma.$connect();

  const bcrypt = await import('bcrypt');
  const hash = await bcrypt.hash('Test1234!', 10);

  await prisma.tenant.create({
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

  await prisma.tenant.create({
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

  await prisma.user.create({
    data: {
      id: 'user-admin-1',
      tenant_id: 'tenant-test-1',
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
      tenant_id: 'tenant-test-2',
      email: 'admin2@test.fr',
      password_hash: hash,
      prenom: 'Admin',
      nom: 'Tenant2',
      role: 'COMPANY_ADMIN',
      email_verified: true
    }
  });

  await prisma.$disconnect();
}

export async function teardown() {
  for (const f of [DB_PATH, `${DB_PATH}-wal`, `${DB_PATH}-shm`]) {
    if (existsSync(f)) {
      try { unlinkSync(f); } catch {}
    }
  }
}
