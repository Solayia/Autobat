import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const email = 'john@testbtp.fr';
const newPassword = 'Password123!';

// Trouve l'utilisateur
const existingUser = await prisma.user.findFirst({
  where: { email },
  select: { id: true, tenant_id: true, email: true, prenom: true, nom: true }
});

if (!existingUser) {
  console.log('❌ Utilisateur non trouvé');
  await prisma.$disconnect();
  process.exit(1);
}

// Hash le nouveau mot de passe
const hashedPassword = await bcrypt.hash(newPassword, 10);

// Met à jour l'utilisateur
const user = await prisma.user.update({
  where: { id: existingUser.id },
  data: { password_hash: hashedPassword },
  select: { email: true, prenom: true, nom: true }
});

console.log(`✅ Mot de passe réinitialisé pour ${user.email} (${user.prenom} ${user.nom})`);
console.log(`📧 Email: ${email}`);
console.log(`🔑 Nouveau mot de passe: ${newPassword}`);

await prisma.$disconnect();
