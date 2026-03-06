// Active tous les comptes PENDING → TRIAL (7 jours)
// Utilisé quand le webhook Stripe n'a pas pu mettre à jour le statut
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
global.currentTenantId = null;

async function main() {
  const pending = await prisma.tenant.findMany({
    where: { siret: { not: '00000000000000' }, statut: 'PENDING' },
    select: { id: true, nom: true, email: true }
  });

  if (pending.length === 0) {
    console.log('Aucun compte PENDING à activer.');
    return;
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  for (const t of pending) {
    await prisma.tenant.update({
      where: { id: t.id },
      data: { statut: 'TRIAL', trial_ends_at: trialEndsAt }
    });
    console.log(`✅ Activé TRIAL: ${t.nom} (${t.email})`);
  }

  console.log(`\nEssai gratuit activé jusqu'au: ${trialEndsAt.toLocaleDateString('fr-FR')}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
