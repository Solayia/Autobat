/**
 * Seed données démo — Compte demo@autobat.pro
 * Peuple le tenant démo avec des données réalistes pour les démonstrations :
 * - Info entreprise mise à jour (onboarding terminé)
 * - 3 employés supplémentaires (MANAGER + 2 EMPLOYEE)
 * - 5 clients (mix particuliers/entreprises)
 * - 5 devis (brouillon, envoyé ×2, accepté ×2, refusé)
 * - 3 chantiers (en cours ×2, terminé ×1)
 * - Tâches sur les chantiers en cours
 * - 3 factures (soldée, en attente, partielle)
 * - Objectifs pilotage remplis
 *
 * Idempotent : supprime les données démo existantes avant de re-seeder.
 * NE supprime PAS le catalogue (déjà seedé par create-demo-tenant.js).
 *
 * Usage: node backend/prisma/seed-demo-account.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
global.currentTenantId = null;

const DEMO_EMAIL = 'demo@autobat.pro';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function ht(lignes) {
  return Math.round(lignes.reduce((s, l) => s + l.qte * l.ouvrage.prix_unitaire_ht, 0) * 100) / 100;
}
function montants(lignes) {
  const h = ht(lignes);
  const t = Math.round(h * 0.2 * 100) / 100;
  return { ht: h, tva: t, ttc: Math.round((h + t) * 100) / 100 };
}
function daysAgo(n) { return new Date(Date.now() - n * 86400000); }
function daysFromNow(n) { return new Date(Date.now() + n * 86400000); }

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seed données démo...\n');

  // 0. Trouver le tenant démo
  const adminUser = await prisma.user.findFirst({
    where: { email: DEMO_EMAIL },
    include: { tenant: true }
  });
  if (!adminUser) {
    throw new Error(`Compte démo introuvable (${DEMO_EMAIL}). Lancez d'abord create-demo-tenant.js`);
  }

  const tenantId = adminUser.tenant_id;
  console.log(`✅ Tenant démo: ${adminUser.tenant.nom} (${tenantId})\n`);

  // ──────────────────────────────────────────────
  // 1. Mettre à jour le tenant (infos entreprise + onboarding)
  // ──────────────────────────────────────────────
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      nom: 'Martin BTP',
      siret: '11111111111111',
      adresse: '42 rue des Bâtisseurs',
      code_postal: '69007',
      ville: 'Lyon',
      telephone: '04 72 33 44 55',
      email: DEMO_EMAIL,
      tva_intra: 'FR12111111111',
      capital: '50 000 €',
      rcs: 'RCS Lyon 111 111 111',
      couleur_primaire: '#FF9F43',
      onboarding_completed: true,
      onboarding_step: 5,
      objectif_ca_annuel: 480000,
      objectif_ca_mensuel: 40000,
      objectif_taux_acceptation: 72,
      objectif_taux_encaissement: 88,
      objectif_nb_chantiers_mois: 4,
      objectif_delai_paiement: 30,
    }
  });
  console.log('✅ Tenant mis à jour\n');

  // ──────────────────────────────────────────────
  // 2. Nettoyage données précédentes (sauf catalogue + user démo principal)
  // ──────────────────────────────────────────────
  // Récupérer les users à supprimer (tous sauf l'admin démo)
  const usersToDelete = await prisma.user.findMany({
    where: { tenant_id: tenantId, email: { not: DEMO_EMAIL } },
    select: { id: true }
  });
  const userIdsToDelete = usersToDelete.map(u => u.id);

  // Supprimer dans l'ordre (contraintes FK)
  await prisma.paiementFacture.deleteMany({ where: { tenant_id: tenantId } });
  await prisma.ligneFacture.deleteMany({ where: { facture: { tenant_id: tenantId } } });
  await prisma.facture.deleteMany({ where: { tenant_id: tenantId } });
  await prisma.badgeage.deleteMany({ where: { chantier: { tenant_id: tenantId } } });
  await prisma.tacheEmploye.deleteMany({ where: { tache: { chantier: { tenant_id: tenantId } } } });
  await prisma.chantierEmploye.deleteMany({ where: { chantier: { tenant_id: tenantId } } });
  await prisma.tache.deleteMany({ where: { chantier: { tenant_id: tenantId } } });
  await prisma.document.deleteMany({ where: { tenant_id: tenantId } });
  await prisma.chantierMessage.deleteMany({ where: { tenant_id: tenantId } });
  await prisma.chantier.deleteMany({ where: { tenant_id: tenantId } });
  await prisma.ligneDevis.deleteMany({ where: { tenant_id: tenantId } });
  await prisma.devis.deleteMany({ where: { tenant_id: tenantId } });
  await prisma.client.deleteMany({ where: { tenant_id: tenantId } });

  if (userIdsToDelete.length > 0) {
    await prisma.employe.deleteMany({ where: { user_id: { in: userIdsToDelete } } });
    await prisma.user.deleteMany({ where: { id: { in: userIdsToDelete } } });
  }

  console.log('🧹 Données précédentes supprimées\n');

  // ──────────────────────────────────────────────
  // 3. Employés (3 supplémentaires)
  // ──────────────────────────────────────────────
  console.log('👷 Création des employés...');

  const employes = [];
  const employeeData = [
    { email: 'julie.petit@martin-btp.fr', prenom: 'Julie', nom: 'Petit', role: 'MANAGER', quota: 160 },
    { email: 'thomas.roux@martin-btp.fr', prenom: 'Thomas', nom: 'Roux', role: 'EMPLOYEE', quota: 152 },
    { email: 'antoine.bernard@martin-btp.fr', prenom: 'Antoine', nom: 'Bernard', role: 'EMPLOYEE', quota: 152 },
  ];

  const hash = await bcrypt.hash('Employee123!', 10);
  for (const ed of employeeData) {
    const user = await prisma.user.create({
      data: {
        tenant_id: tenantId,
        email: ed.email,
        password_hash: hash,
        role: ed.role,
        prenom: ed.prenom,
        nom: ed.nom,
        actif: true,
        email_verified: true,
      }
    });
    const emp = await prisma.employe.create({
      data: {
        tenant_id: tenantId,
        user_id: user.id,
        quota_mensuel_heures: ed.quota,
      }
    });
    employes.push({ ...emp, user });
  }

  // L'employe du compte admin démo principal
  const adminEmploye = await prisma.employe.findFirst({ where: { user_id: adminUser.id } });

  console.log(`✅ ${employes.length} employés créés\n`);

  // ──────────────────────────────────────────────
  // 4. Clients (5)
  // ──────────────────────────────────────────────
  console.log('👥 Création des clients...');

  const [c1, c2, c3, c4, c5] = await Promise.all([
    prisma.client.create({ data: {
      tenant_id: tenantId,
      type: 'ENTREPRISE',
      nom: 'Maisons Bernard',
      email: 'contact@maisons-bernard.fr',
      telephone: '04 72 11 22 33',
      adresse: '15 rue Garibaldi',
      code_postal: '69003',
      ville: 'Lyon',
      siret: '52384756900012',
      notes: 'Client fidèle depuis 2021. Promoteur pavillonnaire. Paiement à 30j.',
    }}),
    prisma.client.create({ data: {
      tenant_id: tenantId,
      type: 'PARTICULIER',
      prenom: 'Sophie',
      nom: 'Lefebvre',
      email: 'sophie.lefebvre@gmail.com',
      telephone: '06 98 76 54 32',
      adresse: '3 allée des Roses',
      code_postal: '69008',
      ville: 'Lyon',
      notes: 'Rénovation maison 1920. Très attentive aux finitions.',
    }}),
    prisma.client.create({ data: {
      tenant_id: tenantId,
      type: 'ENTREPRISE',
      nom: 'Résidences Horizon',
      email: 'travaux@residences-horizon.fr',
      telephone: '04 78 88 11 22',
      adresse: '89 avenue de la République',
      code_postal: '69006',
      ville: 'Lyon',
      siret: '41237854900078',
      notes: 'Gros promoteur immobilier — chantiers collectifs. Interlocuteur : M. Chassagne.',
    }}),
    prisma.client.create({ data: {
      tenant_id: tenantId,
      type: 'PARTICULIER',
      prenom: 'Marc',
      nom: 'Dupuis',
      email: 'm.dupuis@outlook.fr',
      telephone: '07 11 22 33 44',
      adresse: '22 chemin des Vignes',
      code_postal: '69290',
      ville: 'Grézieu-la-Varenne',
    }}),
    prisma.client.create({ data: {
      tenant_id: tenantId,
      type: 'ENTREPRISE',
      nom: 'SCI Les Platanes',
      email: 'gestion@sci-lesplatanes.fr',
      telephone: '04 72 45 67 89',
      adresse: '7 place Bellecour',
      code_postal: '69002',
      ville: 'Lyon',
      siret: '38745623100045',
      notes: 'Gestion de 6 immeubles lyonnais. Contact : Mme Moreau.',
    }}),
  ]);

  console.log('✅ 5 clients créés\n');

  // ──────────────────────────────────────────────
  // 5. Récupérer des ouvrages du catalogue
  // ──────────────────────────────────────────────
  const ouvrages = await prisma.ouvrage.findMany({
    where: { tenant_id: tenantId },
    take: 30,
    orderBy: { categorie: 'asc' }
  });

  if (ouvrages.length < 5) {
    console.warn('⚠️  Catalogue vide ou insuffisant — les devis auront peu de lignes');
  }

  const o = (i) => ouvrages[Math.min(i, ouvrages.length - 1)];
  const year = new Date().getFullYear();

  // ──────────────────────────────────────────────
  // 6. Devis (5)
  // ──────────────────────────────────────────────
  console.log('📄 Création des devis...');

  // ── DEV-0001 : BROUILLON — Sophie Lefebvre (salle de bain)
  const l1 = [
    { ouvrage: o(0), qte: 8, ordre: 1 },
    { ouvrage: o(1), qte: 12, ordre: 2 },
    { ouvrage: o(2), qte: 3, ordre: 3 },
  ];
  const m1 = montants(l1);
  const devis1 = await prisma.devis.create({ data: {
    tenant_id: tenantId,
    numero_devis: `DEV-${year}-0001`,
    client_id: c2.id,
    objet: 'Rénovation salle de bain — 8 m²',
    conditions_paiement: '50% à la commande, 50% à la réception',
    delai_realisation: '2 semaines',
    montant_ht: m1.ht, montant_tva: m1.tva, montant_ttc: m1.ttc,
    date_validite: daysFromNow(30),
    statut: 'BROUILLON',
    notes: 'Inclut dépose carrelage existant, évacuation, pose neuf.',
    lignes: { create: l1.map(l => ({
      tenant_id: tenantId, ouvrage_id: l.ouvrage.id, type: 'OUVRAGE',
      description: l.ouvrage.denomination, quantite: l.qte, unite: l.ouvrage.unite,
      prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
      montant_ht: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 100) / 100,
      tva_pourcent: 20,
      montant_ttc: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 1.2 * 100) / 100,
      ordre: l.ordre,
    })) }
  }});

  // ── DEV-0002 : ENVOYE — Marc Dupuis (extension garage)
  const l2 = [
    { ouvrage: o(3), qte: 60, ordre: 1 },
    { ouvrage: o(4), qte: 25, ordre: 2 },
    { ouvrage: o(5), qte: 18, ordre: 3 },
    { ouvrage: o(6), qte: 4, ordre: 4 },
  ];
  const m2 = montants(l2);
  const devis2 = await prisma.devis.create({ data: {
    tenant_id: tenantId,
    numero_devis: `DEV-${year}-0002`,
    client_id: c4.id,
    objet: 'Extension garage accolé — 30 m²',
    conditions_paiement: '40% à la commande, 60% à la livraison',
    delai_realisation: '5 semaines',
    montant_ht: m2.ht, montant_tva: m2.tva, montant_ttc: m2.ttc,
    date_validite: daysFromNow(20),
    date_envoi: daysAgo(4),
    statut: 'ENVOYE',
    lignes: { create: l2.map(l => ({
      tenant_id: tenantId, ouvrage_id: l.ouvrage.id, type: 'OUVRAGE',
      description: l.ouvrage.denomination, quantite: l.qte, unite: l.ouvrage.unite,
      prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
      montant_ht: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 100) / 100,
      tva_pourcent: 20,
      montant_ttc: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 1.2 * 100) / 100,
      ordre: l.ordre,
    })) }
  }});

  // ── DEV-0003 : ACCEPTE — Maisons Bernard (réfection toiture)
  const l3 = [
    { ouvrage: o(7), qte: 180, ordre: 1 },
    { ouvrage: o(8), qte: 45, ordre: 2 },
    { ouvrage: o(9), qte: 20, ordre: 3 },
    { ouvrage: o(10), qte: 8, ordre: 4 },
    { ouvrage: o(11), qte: 2, ordre: 5 },
  ];
  const m3 = montants(l3);
  const devis3 = await prisma.devis.create({ data: {
    tenant_id: tenantId,
    numero_devis: `DEV-${year}-0003`,
    client_id: c1.id,
    objet: 'Réfection toiture complète — Pavillon 180 m²',
    conditions_paiement: '30% à la commande, 70% à la livraison',
    delai_realisation: '4 semaines',
    montant_ht: m3.ht, montant_tva: m3.tva, montant_ttc: m3.ttc,
    date_validite: daysFromNow(15),
    date_envoi: daysAgo(18),
    date_acceptation: daysAgo(10),
    acompte_verse: Math.round(m3.ttc * 0.3 * 100) / 100,
    statut: 'ACCEPTE',
    notes: 'Tuiles à remplacer par tuiles canal ton vieilli. Zinguerie comprise.',
    lignes: { create: l3.map(l => ({
      tenant_id: tenantId, ouvrage_id: l.ouvrage.id, type: 'OUVRAGE',
      description: l.ouvrage.denomination, quantite: l.qte, unite: l.ouvrage.unite,
      prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
      montant_ht: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 100) / 100,
      tva_pourcent: 20,
      montant_ttc: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 1.2 * 100) / 100,
      ordre: l.ordre,
    })) }
  }});

  // ── DEV-0004 : ACCEPTE — Résidences Horizon (réhabilitation résidence)
  const l4 = [
    { ouvrage: o(12), qte: 350, ordre: 1 },
    { ouvrage: o(13), qte: 80, ordre: 2 },
    { ouvrage: o(14), qte: 45, ordre: 3 },
    { ouvrage: o(15), qte: 20, ordre: 4 },
    { ouvrage: o(16), qte: 12, ordre: 5 },
  ];
  const m4 = montants(l4);
  const devis4 = await prisma.devis.create({ data: {
    tenant_id: tenantId,
    numero_devis: `DEV-${year}-0004`,
    client_id: c3.id,
    objet: 'Réhabilitation résidence Les Lilas — 12 logements',
    conditions_paiement: 'Acompte 30%, 3 appels de fonds, solde réception',
    delai_realisation: '18 semaines',
    montant_ht: m4.ht, montant_tva: m4.tva, montant_ttc: m4.ttc,
    date_validite: daysFromNow(60),
    date_envoi: daysAgo(25),
    date_acceptation: daysAgo(14),
    acompte_verse: Math.round(m4.ttc * 0.3 * 100) / 100,
    statut: 'ACCEPTE',
    notes: 'Coordination avec le syndic. Réunion de chantier chaque lundi 8h.',
    lignes: { create: l4.map(l => ({
      tenant_id: tenantId, ouvrage_id: l.ouvrage.id, type: 'OUVRAGE',
      description: l.ouvrage.denomination, quantite: l.qte, unite: l.ouvrage.unite,
      prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
      montant_ht: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 100) / 100,
      tva_pourcent: 20,
      montant_ttc: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 1.2 * 100) / 100,
      ordre: l.ordre,
    })) }
  }});

  // ── DEV-0005 : REFUSE — SCI Les Platanes (ravalement façade)
  const l5 = [
    { ouvrage: o(17), qte: 220, ordre: 1 },
    { ouvrage: o(18), qte: 60, ordre: 2 },
    { ouvrage: o(19), qte: 15, ordre: 3 },
  ];
  const m5 = montants(l5);
  await prisma.devis.create({ data: {
    tenant_id: tenantId,
    numero_devis: `DEV-${year}-0005`,
    client_id: c5.id,
    objet: 'Ravalement façade — Immeuble 7 étages',
    conditions_paiement: '25% commande, 75% réception',
    delai_realisation: '8 semaines',
    montant_ht: m5.ht, montant_tva: m5.tva, montant_ttc: m5.ttc,
    date_validite: daysAgo(5), // validité expirée
    date_envoi: daysAgo(40),
    date_refus: daysAgo(20),
    raison_refus: 'Budget serré — ont choisi un concurrent moins cher. Contacter dans 6 mois.',
    statut: 'REFUSE',
    lignes: { create: l5.map(l => ({
      tenant_id: tenantId, ouvrage_id: l.ouvrage.id, type: 'OUVRAGE',
      description: l.ouvrage.denomination, quantite: l.qte, unite: l.ouvrage.unite,
      prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
      montant_ht: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 100) / 100,
      tva_pourcent: 20,
      montant_ttc: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 1.2 * 100) / 100,
      ordre: l.ordre,
    })) }
  }});

  console.log(`✅ 5 devis créés\n`);

  // ──────────────────────────────────────────────
  // 7. Chantiers (3)
  // ──────────────────────────────────────────────
  console.log('🏗️  Création des chantiers...');

  // ── Chantier 1 : EN_COURS — Résidences Horizon (gros chantier)
  const ch1 = await prisma.chantier.create({ data: {
    tenant_id: tenantId,
    client_id: c3.id,
    devis_id: devis4.id,
    nom: 'Réhabilitation résidence Les Lilas',
    adresse: '89 avenue de la République',
    code_postal: '69006',
    ville: 'Lyon',
    latitude: 45.7731,
    longitude: 4.8421,
    rayon_gps_metres: 150,
    badgeage_par_tache: false,
    date_debut: daysAgo(14),
    date_fin_prevue: daysFromNow(112), // 18 semaines - 2 déjà passées
    statut: 'EN_COURS',
    notes: 'Chantier principal. Réunion chaque lundi 8h. Accès parking sous-sol niveau -1.',
  }});

  // ── Chantier 2 : EN_COURS — Maisons Bernard (toiture)
  const ch2 = await prisma.chantier.create({ data: {
    tenant_id: tenantId,
    client_id: c1.id,
    devis_id: devis3.id,
    nom: 'Réfection toiture — Pavillon Bernard',
    adresse: '15 rue Garibaldi',
    code_postal: '69003',
    ville: 'Lyon',
    latitude: 45.7587,
    longitude: 4.8339,
    rayon_gps_metres: 100,
    badgeage_par_tache: false,
    date_debut: daysAgo(10),
    date_fin_prevue: daysFromNow(18),
    statut: 'EN_COURS',
    notes: 'Intervention sur toiture existante. Échafaudage côté jardin.',
  }});

  // ── Chantier 3 : TERMINE — SCI Les Platanes (isolation combles)
  const ch3 = await prisma.chantier.create({ data: {
    tenant_id: tenantId,
    client_id: c5.id,
    nom: 'Isolation combles perdus — 7 place Bellecour',
    adresse: '7 place Bellecour',
    code_postal: '69002',
    ville: 'Lyon',
    latitude: 45.7579,
    longitude: 4.8320,
    rayon_gps_metres: 100,
    badgeage_par_tache: false,
    date_debut: daysAgo(55),
    date_fin_prevue: daysAgo(30),
    date_fin_reelle: daysAgo(32),
    statut: 'TERMINE',
    notes: 'Chantier terminé avec 2 jours d\'avance. Client très satisfait.',
  }});

  // ── Assigner employés aux chantiers en cours
  await prisma.chantierEmploye.createMany({ data: [
    { chantier_id: ch1.id, employe_id: employes[0].id },  // Julie (manager)
    { chantier_id: ch1.id, employe_id: employes[1].id },  // Thomas
    { chantier_id: ch1.id, employe_id: employes[2].id },  // Antoine
    { chantier_id: ch2.id, employe_id: employes[0].id },  // Julie (manager)
    { chantier_id: ch2.id, employe_id: employes[2].id },  // Antoine
  ]});

  // ── Tâches chantier 1
  await prisma.tache.createMany({ data: [
    { chantier_id: ch1.id, nom: 'Dépose revêtements existants', ordre: 1, statut: 'TERMINE',
      description: 'Dépose carrelage et faïence — 12 logements' },
    { chantier_id: ch1.id, nom: 'Travaux de maçonnerie', ordre: 2, statut: 'EN_COURS',
      description: 'Reprise des cloisons et enduits — niveaux 1 à 4' },
    { chantier_id: ch1.id, nom: 'Pose nouvelle plomberie', ordre: 3, statut: 'EN_COURS',
      description: 'Remplacement colonnes montantes + distribution appartements' },
    { chantier_id: ch1.id, nom: 'Carrelage et faïence', ordre: 4, statut: 'A_FAIRE',
      description: 'Pose nouveau carrelage — cuisines + salles de bain' },
    { chantier_id: ch1.id, nom: 'Peinture parties communes', ordre: 5, statut: 'A_FAIRE',
      description: 'Préparation + peinture halls et couloirs' },
    { chantier_id: ch1.id, nom: 'Réception et levée réserves', ordre: 6, statut: 'A_FAIRE',
      description: 'Visite avec le syndic, corrections mineures' },
  ]});

  // ── Tâches chantier 2
  await prisma.tache.createMany({ data: [
    { chantier_id: ch2.id, nom: 'Installation échafaudage', ordre: 1, statut: 'TERMINE',
      description: 'Pose échafaudage périmétrique côté rue et jardin' },
    { chantier_id: ch2.id, nom: 'Dépose ancienne toiture', ordre: 2, statut: 'TERMINE',
      description: 'Dépose tuiles et lattis existants, bâche provisoire' },
    { chantier_id: ch2.id, nom: 'Reprise charpente', ordre: 3, statut: 'EN_COURS',
      description: 'Remplacement chevrons abîmés, renfort des faitages' },
    { chantier_id: ch2.id, nom: 'Pose nouvelle couverture', ordre: 4, statut: 'A_FAIRE',
      description: 'Pose tuiles canal ton vieilli, zinguerie (gouttières, noues)' },
    { chantier_id: ch2.id, nom: 'Nettoyage et réception', ordre: 5, statut: 'A_FAIRE',
      description: 'Évacuation déchets, dépose échafaudage, réception client' },
  ]});

  // ── Quelques badgeages réalistes sur ch1 (les 5 derniers jours ouvrés)
  const badgeagesData = [];
  for (let day = 5; day >= 1; day--) {
    const date = daysAgo(day);
    const h = date.getHours();
    // Matin : arrivée 7h30, départ 12h
    const arrive = new Date(date); arrive.setHours(7, 30, 0, 0);
    const depart1 = new Date(date); depart1.setHours(12, 0, 0, 0);
    // Après-midi : arrivée 13h, départ 17h30
    const reprise = new Date(date); reprise.setHours(13, 0, 0, 0);
    const depart2 = new Date(date); depart2.setHours(17, 30, 0, 0);

    for (const emp of employes) {
      badgeagesData.push(
        { tenant_id: tenantId, chantier_id: ch1.id, employe_id: emp.id, type: 'ARRIVEE', methode: 'GPS', timestamp: arrive, latitude: 45.7731, longitude: 4.8421, precision_metres: 8, synced: true },
        { tenant_id: tenantId, chantier_id: ch1.id, employe_id: emp.id, type: 'DEPART', methode: 'GPS', timestamp: depart1, latitude: 45.7731, longitude: 4.8421, precision_metres: 10, synced: true },
        { tenant_id: tenantId, chantier_id: ch1.id, employe_id: emp.id, type: 'ARRIVEE', methode: 'GPS', timestamp: reprise, latitude: 45.7731, longitude: 4.8421, precision_metres: 7, synced: true },
        { tenant_id: tenantId, chantier_id: ch1.id, employe_id: emp.id, type: 'DEPART', methode: 'GPS', timestamp: depart2, latitude: 45.7731, longitude: 4.8421, precision_metres: 9, synced: true },
      );
    }
  }
  await prisma.badgeage.createMany({ data: badgeagesData });

  console.log('✅ 3 chantiers créés (tâches + badgeages)\n');

  // ──────────────────────────────────────────────
  // 8. Factures (3)
  // ──────────────────────────────────────────────
  console.log('💶 Création des factures...');

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  // ── FAC-0001 : SOLDEE — Chantier 3 terminé (isolation combles SCI)
  const fac1Ht = Math.round(ht(l5) * 100) / 100;
  const fac1Tva = Math.round(fac1Ht * 0.2 * 100) / 100;
  const fac1Ttc = Math.round((fac1Ht + fac1Tva) * 100) / 100;

  await prisma.facture.create({ data: {
    tenant_id: tenantId,
    numero_facture: `FAC-${year}-0001`,
    chantier_id: ch3.id,
    client_id: c5.id,
    entreprise_nom: tenant.nom,
    entreprise_siret: tenant.siret,
    entreprise_adresse: `${tenant.adresse}, ${tenant.code_postal} ${tenant.ville}`,
    entreprise_tel: tenant.telephone,
    entreprise_email: tenant.email,
    client_nom: c5.nom,
    client_adresse: `${c5.adresse}, ${c5.code_postal} ${c5.ville}`,
    client_siret: c5.siret || '',
    client_tel: c5.telephone,
    client_email: c5.email,
    montant_ht: fac1Ht, montant_tva: fac1Tva, montant_ttc: fac1Ttc,
    acompte_demande: fac1Ttc,
    acompte_recu: fac1Ttc,
    reste_a_payer: 0,
    statut_paiement: 'SOLDE',
    statut_facture: 'ENVOYEE',
    objet: 'Isolation combles perdus — solde',
    date_emission: daysAgo(28),
    date_echeance: daysAgo(0),
    date_envoi: daysAgo(28),
    date_paiement_complet: daysAgo(5),
    lignes: { create: l5.map((l, i) => ({
      ouvrage_id: l.ouvrage.id, description: l.ouvrage.denomination,
      quantite: l.qte, unite: l.ouvrage.unite,
      prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
      montant_ht: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 100) / 100,
      tva_pourcent: 20,
      montant_ttc: Math.round(l.qte * l.ouvrage.prix_unitaire_ht * 1.2 * 100) / 100,
      ordre: i + 1,
    })) },
    paiements: { create: [{
      tenant_id: tenantId,
      montant: fac1Ttc,
      date_paiement: daysAgo(5),
      moyen_paiement: 'VIREMENT',
      reference: `VIR-${year}-0042`,
      type: 'SOLDE',
      valide: true,
    }] }
  }});

  // ── FAC-0002 : EN_ATTENTE — Acompte 30% chantier Résidences Horizon
  const fac2Ht = Math.round(m4.ht * 0.3 * 100) / 100;
  const fac2Tva = Math.round(fac2Ht * 0.2 * 100) / 100;
  const fac2Ttc = Math.round((fac2Ht + fac2Tva) * 100) / 100;

  await prisma.facture.create({ data: {
    tenant_id: tenantId,
    numero_facture: `FAC-${year}-0002`,
    chantier_id: ch1.id,
    devis_id: devis4.id,
    client_id: c3.id,
    entreprise_nom: tenant.nom,
    entreprise_siret: tenant.siret,
    entreprise_adresse: `${tenant.adresse}, ${tenant.code_postal} ${tenant.ville}`,
    entreprise_tel: tenant.telephone,
    entreprise_email: tenant.email,
    client_nom: c3.nom,
    client_adresse: `${c3.adresse}, ${c3.code_postal} ${c3.ville}`,
    client_siret: c3.siret || '',
    client_tel: c3.telephone,
    client_email: c3.email,
    montant_ht: fac2Ht, montant_tva: fac2Tva, montant_ttc: fac2Ttc,
    acompte_demande: fac2Ttc,
    acompte_recu: 0,
    reste_a_payer: fac2Ttc,
    statut_paiement: 'EN_ATTENTE',
    statut_facture: 'ENVOYEE',
    objet: 'Réhabilitation résidence Les Lilas — acompte 30%',
    date_emission: daysAgo(12),
    date_echeance: daysFromNow(18),
    date_envoi: daysAgo(12),
    lignes: { create: l4.slice(0, 3).map((l, i) => ({
      ouvrage_id: l.ouvrage.id,
      description: `[Acompte 30%] ${l.ouvrage.denomination}`,
      quantite: Math.round(l.qte * 0.3 * 100) / 100,
      unite: l.ouvrage.unite,
      prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
      montant_ht: Math.round(l.qte * 0.3 * l.ouvrage.prix_unitaire_ht * 100) / 100,
      tva_pourcent: 20,
      montant_ttc: Math.round(l.qte * 0.3 * l.ouvrage.prix_unitaire_ht * 1.2 * 100) / 100,
      ordre: i + 1,
    })) }
  }});

  // ── FAC-0003 : PARTIEL — Acompte partiel payé, chantier 2 (toiture Maisons Bernard)
  const fac3Ht = Math.round(m3.ht * 0.3 * 100) / 100;
  const fac3Tva = Math.round(fac3Ht * 0.2 * 100) / 100;
  const fac3Ttc = Math.round((fac3Ht + fac3Tva) * 100) / 100;
  const fac3AcompteRecu = Math.round(fac3Ttc * 0.5 * 100) / 100; // 50% payé seulement

  await prisma.facture.create({ data: {
    tenant_id: tenantId,
    numero_facture: `FAC-${year}-0003`,
    chantier_id: ch2.id,
    devis_id: devis3.id,
    client_id: c1.id,
    entreprise_nom: tenant.nom,
    entreprise_siret: tenant.siret,
    entreprise_adresse: `${tenant.adresse}, ${tenant.code_postal} ${tenant.ville}`,
    entreprise_tel: tenant.telephone,
    entreprise_email: tenant.email,
    client_nom: c1.nom,
    client_adresse: `${c1.adresse}, ${c1.code_postal} ${c1.ville}`,
    client_siret: c1.siret || '',
    client_tel: c1.telephone,
    client_email: c1.email,
    montant_ht: fac3Ht, montant_tva: fac3Tva, montant_ttc: fac3Ttc,
    acompte_demande: fac3Ttc,
    acompte_recu: fac3AcompteRecu,
    reste_a_payer: Math.round((fac3Ttc - fac3AcompteRecu) * 100) / 100,
    statut_paiement: 'PARTIEL',
    statut_facture: 'ENVOYEE',
    objet: 'Réfection toiture — acompte 30%',
    date_emission: daysAgo(8),
    date_echeance: daysFromNow(22),
    date_envoi: daysAgo(8),
    lignes: { create: l3.slice(0, 3).map((l, i) => ({
      ouvrage_id: l.ouvrage.id,
      description: `[Acompte 30%] ${l.ouvrage.denomination}`,
      quantite: Math.round(l.qte * 0.3 * 100) / 100,
      unite: l.ouvrage.unite,
      prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
      montant_ht: Math.round(l.qte * 0.3 * l.ouvrage.prix_unitaire_ht * 100) / 100,
      tva_pourcent: 20,
      montant_ttc: Math.round(l.qte * 0.3 * l.ouvrage.prix_unitaire_ht * 1.2 * 100) / 100,
      ordre: i + 1,
    })) },
    paiements: { create: [{
      tenant_id: tenantId,
      montant: fac3AcompteRecu,
      date_paiement: daysAgo(3),
      moyen_paiement: 'CHEQUE',
      reference: `CHQ-${year}-2847`,
      type: 'ACOMPTE',
      valide: true,
    }] }
  }});

  console.log('✅ 3 factures créées\n');

  // ──────────────────────────────────────────────
  // Résumé
  // ──────────────────────────────────────────────
  const [nbClients, nbDevis, nbChantiers, nbFactures, nbBadgeages] = await Promise.all([
    prisma.client.count({ where: { tenant_id: tenantId } }),
    prisma.devis.count({ where: { tenant_id: tenantId } }),
    prisma.chantier.count({ where: { tenant_id: tenantId } }),
    prisma.facture.count({ where: { tenant_id: tenantId } }),
    prisma.badgeage.count({ where: { chantier: { tenant_id: tenantId } } }),
  ]);

  console.log('════════════════════════════════════════════');
  console.log('🎉 SEED DÉMO TERMINÉ — Compte prêt pour demo !');
  console.log('════════════════════════════════════════════');
  console.log(`👷 Employés    : ${employes.length} (+ 1 gérant)`);
  console.log(`👥 Clients     : ${nbClients}`);
  console.log(`📄 Devis       : ${nbDevis} (1 brouillon, 1 envoyé, 2 acceptés, 1 refusé)`);
  console.log(`🏗️  Chantiers  : ${nbChantiers} (2 en cours, 1 terminé)`);
  console.log(`💶 Factures    : ${nbFactures} (1 soldée, 1 en attente, 1 partielle)`);
  console.log(`📍 Badgeages   : ${nbBadgeages}`);
  console.log('────────────────────────────────────────────');
  console.log(`🔑 ${DEMO_EMAIL} / Demo@Autobat2026!`);
  console.log('════════════════════════════════════════════\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
