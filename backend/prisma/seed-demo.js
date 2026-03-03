/**
 * Seed démonstration — Compte gérant complet
 * Peuple le tenant "Entreprise Test" (admin@test.fr) avec :
 * - 324 ouvrages (bibliothèque Syla)
 * - 5 clients réalistes
 * - 3 devis (brouillon, envoyé, accepté)
 * - 2 chantiers (en cours + terminé)
 * - 1 facture payée + 1 en attente
 *
 * Usage: node backend/prisma/seed-demo.js
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/config/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('🌱 Démarrage du seed démonstration...\n');

  // ─────────────────────────────────────────────
  // 1. Trouver le tenant admin@test.fr
  // ─────────────────────────────────────────────
  global.currentTenantId = null;

  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@test.fr' },
    include: { tenant: true }
  });

  if (!adminUser) {
    throw new Error('Utilisateur admin@test.fr introuvable. Vérifiez la base de données.');
  }

  const tenantId = adminUser.tenant_id;
  const tenant = adminUser.tenant;
  console.log(`✅ Tenant trouvé: ${tenant.nom} (${tenantId})\n`);

  // ─────────────────────────────────────────────
  // 2. Catalogue Syla (324 ouvrages)
  // ─────────────────────────────────────────────
  console.log('📦 Import catalogue Syla...');

  const sylaPath = resolve(__dirname, '../../Syla/bibliotheque-prix-syla-clean.json');
  const sylaRaw = readFileSync(sylaPath, 'utf-8');
  const sylaItems = JSON.parse(sylaRaw);

  // Supprimer les ouvrages existants du tenant
  await prisma.ouvrage.deleteMany({ where: { tenant_id: tenantId } });

  // Compteur par catégorie pour générer des codes uniques
  const categoryCounts = {};

  let created = 0;
  const catAbbrev = {
    'Charpente': 'CHARP',
    'Couverture': 'COUV',
    'Maçonnerie': 'MACON',
    'Ravalement': 'RAVAL',
    'Plomberie': 'PLOMB',
    'Électricité': 'ELEC',
    'Menuiserie': 'MENUIS',
    'Isolation': 'ISO',
    'Plâtrerie': 'PLATR',
    'Peinture': 'PEINT',
    'Carrelage': 'CARREL',
    'Divers': 'DIV',
    'VRD': 'VRD',
    'Terrassement': 'TERR',
    'Démolition': 'DEMO',
  };

  for (const item of sylaItems) {
    if (!item.denomination || !item.unite || !item.debourse_ht) continue;

    const cat = item.categorie || 'Divers';
    const prefix = catAbbrev[cat] || cat.substring(0, 5).toUpperCase().replace(/\s/g, '');
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    const code = item.code && item.code.trim()
      ? item.code.trim().substring(0, 30)
      : `${prefix}-${String(categoryCounts[cat]).padStart(3, '0')}`;

    // Générer un code unique si collision
    let finalCode = code;
    let suffix = 1;
    while (true) {
      try {
        await prisma.ouvrage.create({
          data: {
            tenant_id: tenantId,
            code: finalCode,
            categorie: cat,
            denomination: item.denomination.trim().substring(0, 500),
            unite: item.unite || 'U',
            prix_unitaire_ht: parseFloat(item.debourse_ht) || 0,
            temps_estime_minutes: estimerTemps(item.unite, item.debourse_ht),
            notes: item.note || null,
            nb_chantiers_realises: 0,
          }
        });
        created++;
        break;
      } catch (e) {
        if (e.code === 'P2002') {
          // Code unique violation — ajouter suffixe
          finalCode = `${code}-${suffix++}`;
        } else {
          throw e;
        }
      }
    }
  }

  console.log(`✅ ${created} ouvrages créés\n`);

  // Récupérer quelques ouvrages pour les devis
  const ouvrages = await prisma.ouvrage.findMany({
    where: { tenant_id: tenantId },
    take: 20,
    orderBy: { categorie: 'asc' }
  });

  // ─────────────────────────────────────────────
  // 3. Clients
  // ─────────────────────────────────────────────
  console.log('👥 Création des clients...');

  await prisma.client.deleteMany({ where: { tenant_id: tenantId } });

  const clients = await Promise.all([
    prisma.client.create({ data: {
      tenant_id: tenantId,
      type: 'ENTREPRISE',
      nom: 'Maisons Bernard',
      email: 'contact@maisons-bernard.fr',
      telephone: '06 12 34 56 78',
      adresse: '14 rue du Châtelet',
      code_postal: '75011',
      ville: 'Paris',
      siret: '52384756900012',
      notes: 'Client fidèle depuis 2020. Paiement à 30j.'
    }}),
    prisma.client.create({ data: {
      tenant_id: tenantId,
      type: 'PARTICULIER',
      prenom: 'Sophie',
      nom: 'Lefebvre',
      email: 'sophie.lefebvre@gmail.com',
      telephone: '06 98 76 54 32',
      adresse: '3 allée des Roses',
      code_postal: '69003',
      ville: 'Lyon',
      notes: 'Rénovation complète maison 1920.'
    }}),
    prisma.client.create({ data: {
      tenant_id: tenantId,
      type: 'ENTREPRISE',
      nom: 'Résidences Horizon',
      email: 'travaux@residences-horizon.fr',
      telephone: '04 72 88 11 22',
      adresse: '89 avenue de la République',
      code_postal: '69006',
      ville: 'Lyon',
      siret: '41237854900078',
      notes: 'Promoteur immobilier — grands chantiers collectifs.'
    }}),
    prisma.client.create({ data: {
      tenant_id: tenantId,
      type: 'PARTICULIER',
      prenom: 'Marc',
      nom: 'Dupuis',
      email: 'm.dupuis@outlook.fr',
      telephone: '07 11 22 33 44',
      adresse: '22 chemin des Vignes',
      code_postal: '33000',
      ville: 'Bordeaux',
    }}),
    prisma.client.create({ data: {
      tenant_id: tenantId,
      type: 'ENTREPRISE',
      nom: 'SCI Les Platanes',
      email: 'gestion@sci-lesplatanes.fr',
      telephone: '05 56 78 90 12',
      adresse: '7 rue Sainte-Catherine',
      code_postal: '33000',
      ville: 'Bordeaux',
      siret: '38745623100045',
    }}),
  ]);

  console.log(`✅ ${clients.length} clients créés\n`);

  // ─────────────────────────────────────────────
  // 4. Devis
  // ─────────────────────────────────────────────
  console.log('📄 Création des devis...');

  await prisma.ligneDevis.deleteMany({ where: { tenant_id: tenantId } });
  await prisma.devis.deleteMany({ where: { tenant_id: tenantId } });

  const currentYear = new Date().getFullYear();

  // Devis 1 — BROUILLON (client Maisons Bernard)
  const lignes1 = [
    { ouvrage: ouvrages[0], qte: 45, ordre: 1 },
    { ouvrage: ouvrages[1], qte: 12, ordre: 2 },
    { ouvrage: ouvrages[2], qte: 8, ordre: 3 },
  ];
  const montant1 = calculMontants(lignes1);
  const devis1 = await prisma.devis.create({
    data: {
      tenant_id: tenantId,
      numero_devis: `DEV-${currentYear}-0001`,
      client_id: clients[0].id,
      objet: 'Réfection toiture complète — Immeuble rue du Châtelet',
      conditions_paiement: '30% à la commande, 70% à la livraison',
      delai_realisation: '6 semaines',
      montant_ht: montant1.ht,
      montant_tva: montant1.tva,
      montant_ttc: montant1.ttc,
      date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      statut: 'BROUILLON',
      notes: 'Inclus : dépose de l\'ancienne couverture, évacuation déchets.',
      lignes: {
        create: lignes1.map(l => ({
          tenant_id: tenantId,
          ouvrage_id: l.ouvrage.id,
          type: 'OUVRAGE',
          description: l.ouvrage.denomination,
          quantite: l.qte,
          unite: l.ouvrage.unite,
          prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
          montant_ht: l.qte * l.ouvrage.prix_unitaire_ht,
          tva_pourcent: 20,
          montant_ttc: l.qte * l.ouvrage.prix_unitaire_ht * 1.2,
          ordre: l.ordre,
        }))
      }
    }
  });

  // Devis 2 — ENVOYE (client Sophie Lefebvre)
  const lignes2 = [
    { ouvrage: ouvrages[3], qte: 80, ordre: 1 },
    { ouvrage: ouvrages[4], qte: 25, ordre: 2 },
    { ouvrage: ouvrages[5], qte: 15, ordre: 3 },
    { ouvrage: ouvrages[6], qte: 6, ordre: 4 },
  ];
  const montant2 = calculMontants(lignes2);
  const devis2 = await prisma.devis.create({
    data: {
      tenant_id: tenantId,
      numero_devis: `DEV-${currentYear}-0002`,
      client_id: clients[1].id,
      objet: 'Rénovation façade et ravalement — Maison 1920',
      conditions_paiement: '50% à la commande, 50% à la réception',
      delai_realisation: '4 semaines',
      montant_ht: montant2.ht,
      montant_tva: montant2.tva,
      montant_ttc: montant2.ttc,
      date_validite: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      date_envoi: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      statut: 'ENVOYE',
      lignes: {
        create: lignes2.map(l => ({
          tenant_id: tenantId,
          ouvrage_id: l.ouvrage.id,
          type: 'OUVRAGE',
          description: l.ouvrage.denomination,
          quantite: l.qte,
          unite: l.ouvrage.unite,
          prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
          montant_ht: l.qte * l.ouvrage.prix_unitaire_ht,
          tva_pourcent: 20,
          montant_ttc: l.qte * l.ouvrage.prix_unitaire_ht * 1.2,
          ordre: l.ordre,
        }))
      }
    }
  });

  // Devis 3 — ACCEPTE (client Résidences Horizon)
  const lignes3 = [
    { ouvrage: ouvrages[7], qte: 200, ordre: 1 },
    { ouvrage: ouvrages[8], qte: 50, ordre: 2 },
    { ouvrage: ouvrages[9], qte: 30, ordre: 3 },
    { ouvrage: ouvrages[10], qte: 12, ordre: 4 },
    { ouvrage: ouvrages[11], qte: 8, ordre: 5 },
  ];
  const montant3 = calculMontants(lignes3);
  const devis3 = await prisma.devis.create({
    data: {
      tenant_id: tenantId,
      numero_devis: `DEV-${currentYear}-0003`,
      client_id: clients[2].id,
      objet: 'Réhabilitation complète résidence Les Lilas — 12 logements',
      conditions_paiement: 'Acompte 40%, 3 appels de fonds, solde réception',
      delai_realisation: '16 semaines',
      montant_ht: montant3.ht,
      montant_tva: montant3.tva,
      montant_ttc: montant3.ttc,
      date_validite: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      date_envoi: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      date_acceptation: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      statut: 'ACCEPTE',
      lignes: {
        create: lignes3.map(l => ({
          tenant_id: tenantId,
          ouvrage_id: l.ouvrage.id,
          type: 'OUVRAGE',
          description: l.ouvrage.denomination,
          quantite: l.qte,
          unite: l.ouvrage.unite,
          prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
          montant_ht: l.qte * l.ouvrage.prix_unitaire_ht,
          tva_pourcent: 20,
          montant_ttc: l.qte * l.ouvrage.prix_unitaire_ht * 1.2,
          ordre: l.ordre,
        }))
      }
    }
  });

  console.log(`✅ 3 devis créés (${devis1.numero_devis}, ${devis2.numero_devis}, ${devis3.numero_devis})\n`);

  // ─────────────────────────────────────────────
  // 5. Chantiers
  // ─────────────────────────────────────────────
  console.log('🏗️  Création des chantiers...');

  await prisma.chantier.deleteMany({ where: { tenant_id: tenantId } });

  const chantier1 = await prisma.chantier.create({
    data: {
      tenant_id: tenantId,
      client_id: clients[2].id,
      devis_id: devis3.id,
      nom: 'Réhabilitation résidence Les Lilas',
      adresse: '89 avenue de la République',
      code_postal: '69006',
      ville: 'Lyon',
      latitude: 45.7640,
      longitude: 4.8357,
      rayon_gps_metres: 100,
      badgeage_par_tache: false,
      date_debut: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      date_fin_prevue: new Date(Date.now() + 14 * 7 * 24 * 60 * 60 * 1000),
      statut: 'EN_COURS',
      notes: 'Chantier principal — 12 logements. Accès par le parking souterrain.',
    }
  });

  const chantier2 = await prisma.chantier.create({
    data: {
      tenant_id: tenantId,
      client_id: clients[0].id,
      nom: 'Réfection toiture Maisons Bernard',
      adresse: '14 rue du Châtelet',
      code_postal: '75011',
      ville: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
      rayon_gps_metres: 100,
      badgeage_par_tache: false,
      date_debut: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      date_fin_prevue: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      date_fin_reelle: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      statut: 'TERMINE',
      notes: 'Chantier terminé avec 2 jours d\'avance.',
    }
  });

  console.log(`✅ 2 chantiers créés\n`);

  // ─────────────────────────────────────────────
  // 6. Factures
  // ─────────────────────────────────────────────
  console.log('💶 Création des factures...');

  await prisma.paiementFacture.deleteMany({ where: { tenant_id: tenantId } });
  await prisma.ligneFacture.deleteMany({});
  await prisma.facture.deleteMany({ where: { tenant_id: tenantId } });

  const dateEcheance1 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // passé
  const fa1MontantHT = calculMontants(lignes2).ht;
  const fa1MontantTVA = calculMontants(lignes2).tva;
  const fa1MontantTTC = calculMontants(lignes2).ttc;

  const facture1 = await prisma.facture.create({
    data: {
      tenant_id: tenantId,
      numero_facture: `FAC-${currentYear}-0001`,
      chantier_id: chantier2.id,
      client_id: clients[0].id,
      // Snapshots entreprise
      entreprise_nom: tenant.nom,
      entreprise_siret: tenant.siret,
      entreprise_adresse: `${tenant.adresse}, ${tenant.code_postal} ${tenant.ville}`,
      entreprise_tel: tenant.telephone,
      entreprise_email: tenant.email,
      // Snapshots client
      client_nom: clients[0].nom,
      client_adresse: `${clients[0].adresse}, ${clients[0].code_postal} ${clients[0].ville}`,
      client_siret: clients[0].siret || '',
      client_tel: clients[0].telephone,
      client_email: clients[0].email,
      // Montants
      montant_ht: fa1MontantHT,
      montant_tva: fa1MontantTVA,
      montant_ttc: fa1MontantTTC,
      acompte_demande: fa1MontantTTC,
      acompte_recu: fa1MontantTTC,
      reste_a_payer: 0,
      statut_paiement: 'SOLDE',
      statut_facture: 'ENVOYEE',
      date_emission: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      date_echeance: dateEcheance1,
      date_envoi: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      date_paiement_complet: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      lignes: {
        create: lignes2.map((l, i) => ({
          ouvrage_id: l.ouvrage.id,
          description: l.ouvrage.denomination,
          quantite: l.qte,
          unite: l.ouvrage.unite,
          prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
          montant_ht: l.qte * l.ouvrage.prix_unitaire_ht,
          tva_pourcent: 20,
          montant_ttc: l.qte * l.ouvrage.prix_unitaire_ht * 1.2,
          ordre: i + 1,
        }))
      },
      paiements: {
        create: [{
          tenant_id: tenantId,
          montant: fa1MontantTTC,
          date_paiement: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          moyen_paiement: 'VIREMENT',
          reference: 'VIR-2026-01847',
          type: 'SOLDE',
          valide: true,
        }]
      }
    }
  });

  // Facture 2 — EN ATTENTE (acompte sur chantier en cours)
  const fa2MontantHT = Math.round(calculMontants(lignes3).ht * 0.4 * 100) / 100;
  const fa2MontantTVA = Math.round(fa2MontantHT * 0.2 * 100) / 100;
  const fa2MontantTTC = Math.round((fa2MontantHT + fa2MontantTVA) * 100) / 100;

  const facture2 = await prisma.facture.create({
    data: {
      tenant_id: tenantId,
      numero_facture: `FAC-${currentYear}-0002`,
      chantier_id: chantier1.id,
      client_id: clients[2].id,
      entreprise_nom: tenant.nom,
      entreprise_siret: tenant.siret,
      entreprise_adresse: `${tenant.adresse}, ${tenant.code_postal} ${tenant.ville}`,
      entreprise_tel: tenant.telephone,
      entreprise_email: tenant.email,
      client_nom: clients[2].nom,
      client_adresse: `${clients[2].adresse}, ${clients[2].code_postal} ${clients[2].ville}`,
      client_siret: clients[2].siret || '',
      client_tel: clients[2].telephone,
      client_email: clients[2].email,
      montant_ht: fa2MontantHT,
      montant_tva: fa2MontantTVA,
      montant_ttc: fa2MontantTTC,
      acompte_demande: fa2MontantTTC,
      acompte_recu: 0,
      reste_a_payer: fa2MontantTTC,
      statut_paiement: 'EN_ATTENTE',
      statut_facture: 'ENVOYEE',
      date_emission: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      date_echeance: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      date_envoi: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      lignes: {
        create: lignes3.slice(0, 3).map((l, i) => ({
          ouvrage_id: l.ouvrage.id,
          description: `[Acompte 40%] ${l.ouvrage.denomination}`,
          quantite: l.qte * 0.4,
          unite: l.ouvrage.unite,
          prix_unitaire_ht: l.ouvrage.prix_unitaire_ht,
          montant_ht: l.qte * 0.4 * l.ouvrage.prix_unitaire_ht,
          tva_pourcent: 20,
          montant_ttc: l.qte * 0.4 * l.ouvrage.prix_unitaire_ht * 1.2,
          ordre: i + 1,
        }))
      }
    }
  });

  console.log(`✅ 2 factures créées (${facture1.numero_facture}, ${facture2.numero_facture})\n`);

  // ─────────────────────────────────────────────
  // Résumé
  // ─────────────────────────────────────────────
  const nbOuvrages = await prisma.ouvrage.count({ where: { tenant_id: tenantId } });
  const nbClients = await prisma.client.count({ where: { tenant_id: tenantId } });
  const nbDevis = await prisma.devis.count({ where: { tenant_id: tenantId } });
  const nbChantiers = await prisma.chantier.count({ where: { tenant_id: tenantId } });
  const nbFactures = await prisma.facture.count({ where: { tenant_id: tenantId } });

  console.log('════════════════════════════════════════');
  console.log('🎉 SEED TERMINÉ — Compte gérant prêt !');
  console.log('════════════════════════════════════════');
  console.log(`📦 Ouvrages   : ${nbOuvrages}`);
  console.log(`👥 Clients    : ${nbClients}`);
  console.log(`📄 Devis      : ${nbDevis} (1 brouillon, 1 envoyé, 1 accepté)`);
  console.log(`🏗️  Chantiers  : ${nbChantiers} (1 en cours, 1 terminé)`);
  console.log(`💶 Factures   : ${nbFactures} (1 soldée, 1 en attente)`);
  console.log('────────────────────────────────────────');
  console.log('🔑 Connexion : admin@test.fr / NouveauMdp123!@#');
  console.log('════════════════════════════════════════\n');
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function calculMontants(lignes) {
  const ht = lignes.reduce((sum, l) => sum + l.qte * l.ouvrage.prix_unitaire_ht, 0);
  const tva = Math.round(ht * 0.2 * 100) / 100;
  return { ht: Math.round(ht * 100) / 100, tva, ttc: Math.round((ht + tva) * 100) / 100 };
}

function estimerTemps(unite, prix) {
  // Estimation grossière du temps basée sur l'unité et le prix
  if (unite === 'F') return Math.round(prix / 50) * 60; // forfait ~ 1h par 50€
  if (unite === 'M²') return 45; // 45 min/m²
  if (unite === 'ML') return 20; // 20 min/ml
  if (unite === 'U') return 30;  // 30 min/unité
  if (unite === 'H') return 60;  // 1h
  if (unite === 'M³') return 90;
  return 30;
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
