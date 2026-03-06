// One-time fix: restore adrien.lechevalier@solayia.fr account
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
global.currentTenantId = null;

async function main() {
  const old = await prisma.user.findUnique({ where: { email: 'superadmin@autobat.fr' } });

  if (!old) {
    console.log('superadmin@autobat.fr not found — nothing to fix.');
    return;
  }

  const passwordHash = await bcrypt.hash('Autobat2026!', 10);
  await prisma.user.update({
    where: { id: old.id },
    data: { email: 'adrien.lechevalier@solayia.fr', prenom: 'Adrien', nom: 'Lechevalier', password_hash: passwordHash }
  });

  console.log('✅ adrien.lechevalier@solayia.fr restored with Autobat2026!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
