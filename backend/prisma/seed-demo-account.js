/**
 * Seed données démo — Compte demo@autobat.pro
 * Couvre TOUTES les fonctionnalités pour les démonstrations :
 *
 * ✅ Catalogue       — auto-learning (nb_chantiers_realises > 0)
 * ✅ Clients         — 6 (entreprises + particuliers)
 * ✅ Devis           — tous statuts + 1 avec sections
 * ✅ Chantiers       — PLANIFIE / EN_COURS ×2 / TERMINE
 * ✅ Tâches          — A_FAIRE / EN_COURS / TERMINE dans chaque chantier
 * ✅ Factures        — BROUILLON / EN_ATTENTE / EN_RETARD / PARTIEL / PAYE
 * ✅ Badgeages       — 10 jours d'historique sur chantier actif
 * ✅ Messages        — discussions sur les chantiers
 * ✅ Documents       — metadata sur chantier actif
 * ✅ Pilotage        — 6 mois d'historique CA + chantiers terminés
 * ✅ Planning        — tâches assignées aux employés
 * ✅ Objectifs       — tous remplis
 *
 * Idempotent : supprime les données démo avant de re-seeder.
 * NE supprime PAS le catalogue (géré par create-demo-tenant.js).
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
global.currentTenantId = null;

const DEMO_EMAIL = 'demo@autobat.pro';

// ─── Helpers ────────────────────────────────────────────────────────────────
const r2 = (n) => Math.round(n * 100) / 100;
const dAgo = (n) => new Date(Date.now() - n * 86400000);
const dFut = (n) => new Date(Date.now() + n * 86400000);
const mAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d; };

function mkMontants(lignes) {
  const h = r2(lignes.reduce((s, l) => s + l.qte * l.prix, 0));
  const t = r2(h * 0.2);
  return { ht: h, tva: t, ttc: r2(h + t) };
}

function mkLignesDevis(tenantId, lignes) {
  return lignes.map((l) => ({
    tenant_id: tenantId,
    ouvrage_id: l.ouvrage?.id ?? null,
    type: l.type ?? 'OUVRAGE',
    description: l.desc ?? l.ouvrage?.denomination ?? '',
    quantite: l.qte ?? 0,
    unite: l.ouvrage?.unite ?? l.unite ?? '',
    prix_unitaire_ht: l.prix ?? 0,
    montant_ht: r2((l.qte ?? 0) * (l.prix ?? 0)),
    tva_pourcent: l.type === 'SECTION' ? 0 : 20,
    montant_ttc: r2((l.qte ?? 0) * (l.prix ?? 0) * (l.type === 'SECTION' ? 1 : 1.2)),
    ordre: l.ordre,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seed démo complet...\n');

  // 0. Trouver le tenant démo
  const adminUser = await prisma.user.findFirst({
    where: { email: DEMO_EMAIL },
    include: { tenant: true },
  });
  if (!adminUser) throw new Error(`Compte démo introuvable. Lancez d'abord create-demo-tenant.js`);

  const tenantId = adminUser.tenant_id;
  console.log(`✅ Tenant: ${adminUser.tenant.nom} (${tenantId})\n`);

  // ── 1. Mettre à jour le tenant ──────────────────────────────────────────
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
      rib: 'FR76 3000 4000 0100 0234 5678 912',
      couleur_primaire: '#FF9F43',
      onboarding_completed: true,
      onboarding_step: 5,
      objectif_ca_annuel: 480000,
      objectif_ca_mensuel: 40000,
      objectif_taux_acceptation: 72,
      objectif_taux_encaissement: 88,
      objectif_nb_chantiers_mois: 4,
      objectif_delai_paiement: 30,
    },
  });
  console.log('✅ Tenant mis à jour\n');

  // ── 2. Nettoyage ────────────────────────────────────────────────────────
  const usersToDelete = await prisma.user.findMany({
    where: { tenant_id: tenantId, email: { not: DEMO_EMAIL } },
    select: { id: true },
  });
  const uids = usersToDelete.map((u) => u.id);

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
  if (uids.length > 0) {
    await prisma.employe.deleteMany({ where: { user_id: { in: uids } } });
    await prisma.user.deleteMany({ where: { id: { in: uids } } });
  }
  console.log('🧹 Données précédentes supprimées\n');

  // ── 3. Employés ─────────────────────────────────────────────────────────
  console.log('👷 Création des employés...');
  const hash = await bcrypt.hash('Employee123!', 10);
  const empDefs = [
    { email: 'julie.petit@martin-btp.fr',     prenom: 'Julie',   nom: 'Petit',   role: 'MANAGER',  quota: 160 },
    { email: 'thomas.roux@martin-btp.fr',     prenom: 'Thomas',  nom: 'Roux',    role: 'EMPLOYEE', quota: 152 },
    { email: 'antoine.bernard@martin-btp.fr', prenom: 'Antoine', nom: 'Bernard', role: 'EMPLOYEE', quota: 152 },
  ];
  const empObjs = [];
  for (const ed of empDefs) {
    const u = await prisma.user.create({
      data: { tenant_id: tenantId, email: ed.email, password_hash: hash, role: ed.role,
              prenom: ed.prenom, nom: ed.nom, actif: true, email_verified: true },
    });
    const emp = await prisma.employe.create({
      data: { tenant_id: tenantId, user_id: u.id, quota_mensuel_heures: ed.quota },
    });
    empObjs.push({ ...emp, user: u });
  }
  const adminEmp = await prisma.employe.findFirst({ where: { user_id: adminUser.id } });
  console.log(`✅ ${empObjs.length} employés créés\n`);

  // ── 4. Clients ──────────────────────────────────────────────────────────
  console.log('👥 Création des clients...');
  const [cBernard, cLefebvre, cHorizon, cDupuis, cPlatanes, cMoreau] = await Promise.all([
    prisma.client.create({ data: { tenant_id: tenantId, type: 'ENTREPRISE',
      nom: 'Maisons Bernard', email: 'contact@maisons-bernard.fr', telephone: '04 72 11 22 33',
      adresse: '15 rue Garibaldi', code_postal: '69003', ville: 'Lyon', siret: '52384756900012',
      notes: 'Client fidèle depuis 2021. Promoteur pavillonnaire. Paiement à 30j.' }}),
    prisma.client.create({ data: { tenant_id: tenantId, type: 'PARTICULIER',
      prenom: 'Sophie', nom: 'Lefebvre', email: 'sophie.lefebvre@gmail.com', telephone: '06 98 76 54 32',
      adresse: '3 allée des Roses', code_postal: '69008', ville: 'Lyon',
      notes: 'Rénovation maison 1920. Très attentive aux finitions.' }}),
    prisma.client.create({ data: { tenant_id: tenantId, type: 'ENTREPRISE',
      nom: 'Résidences Horizon', email: 'travaux@residences-horizon.fr', telephone: '04 78 88 11 22',
      adresse: '89 avenue de la République', code_postal: '69006', ville: 'Lyon', siret: '41237854900078',
      notes: 'Gros promoteur immobilier — chantiers collectifs. Contact : M. Chassagne.' }}),
    prisma.client.create({ data: { tenant_id: tenantId, type: 'PARTICULIER',
      prenom: 'Marc', nom: 'Dupuis', email: 'm.dupuis@outlook.fr', telephone: '07 11 22 33 44',
      adresse: '22 chemin des Vignes', code_postal: '69290', ville: 'Grézieu-la-Varenne' }}),
    prisma.client.create({ data: { tenant_id: tenantId, type: 'ENTREPRISE',
      nom: 'SCI Les Platanes', email: 'gestion@sci-lesplatanes.fr', telephone: '04 72 45 67 89',
      adresse: '7 place Bellecour', code_postal: '69002', ville: 'Lyon', siret: '38745623100045',
      notes: 'Gestion de 6 immeubles lyonnais. Contact : Mme Moreau.' }}),
    prisma.client.create({ data: { tenant_id: tenantId, type: 'PARTICULIER',
      prenom: 'Isabelle', nom: 'Moreau', email: 'isabelle.moreau@free.fr', telephone: '06 55 44 33 22',
      adresse: '18 impasse du Moulin', code_postal: '69380', ville: 'Lozanne',
      notes: 'Nouveau client. Projet extension via recommandation Maisons Bernard.' }}),
  ]);
  console.log('✅ 6 clients créés\n');

  // ── 5. Catalogue — activer l'auto-learning sur quelques ouvrages ─────────
  const allOuvrages = await prisma.ouvrage.findMany({ where: { tenant_id: tenantId }, take: 40, orderBy: { categorie: 'asc' } });
  if (allOuvrages.length === 0) throw new Error('Catalogue vide — lancez d\'abord create-demo-tenant.js');

  // Simuler de l'auto-learning sur les 10 premiers ouvrages
  for (let i = 0; i < Math.min(10, allOuvrages.length); i++) {
    const o = allOuvrages[i];
    const nbChantiers = 2 + i * 2; // 2, 4, 6, ...
    const ecartPct = (i % 2 === 0 ? 0.08 : -0.05); // +8% ou -5%
    const nouveauPrix = r2(o.prix_unitaire_ht * (1 + ecartPct));
    await prisma.ouvrage.update({
      where: { id: o.id },
      data: {
        nb_chantiers_realises: nbChantiers,
        prix_unitaire_ht: nouveauPrix,
        temps_reel_moyen: (o.temps_estime_minutes ?? 30) * (1 + ecartPct * 0.5),
        derniere_maj_auto: dAgo(nbChantiers * 7),
      },
    });
    if (ecartPct !== 0) {
      await prisma.historiquePrix.create({
        data: {
          ouvrage_id: o.id,
          ancien_prix: o.prix_unitaire_ht,
          nouveau_prix: nouveauPrix,
          raison: `Auto-learning après ${nbChantiers} chantiers`,
          ecart_pourcent: r2(ecartPct * 100),
        },
      });
    }
  }
  // Recharger avec les nouveaux prix — filtrer prix > 0 pour éviter divisions par zéro
  const ouvrages = await prisma.ouvrage.findMany({ where: { tenant_id: tenantId, prix_unitaire_ht: { gt: 0 } }, take: 40, orderBy: { categorie: 'asc' } });
  const o = (i) => ouvrages[Math.min(i, ouvrages.length - 1)];
  console.log('✅ Auto-learning simulé sur 10 ouvrages\n');

  const year = new Date().getFullYear();

  // ── 6. DEVIS ─────────────────────────────────────────────────────────────
  console.log('📄 Création des devis...');

  // D1 — BROUILLON avec sections (démo de la structure avancée)
  // On crée les lignes manuellement pour pouvoir référencer la section parente
  const m_d1_s1_l1 = { ouvrage: o(0), qte: 12, prix: o(0).prix_unitaire_ht };
  const m_d1_s1_l2 = { ouvrage: o(1), qte: 8,  prix: o(1).prix_unitaire_ht };
  const m_d1_s2_l1 = { ouvrage: o(2), qte: 24, prix: o(2).prix_unitaire_ht };
  const m_d1_s2_l2 = { ouvrage: o(3), qte: 6,  prix: o(3).prix_unitaire_ht };
  const htD1 = r2([m_d1_s1_l1, m_d1_s1_l2, m_d1_s2_l1, m_d1_s2_l2].reduce((s, l) => s + l.qte * l.prix, 0));
  const devis1 = await prisma.devis.create({ data: {
    tenant_id: tenantId, numero_devis: `DEV-${year}-0001`, client_id: cLefebvre.id,
    objet: 'Rénovation cuisine et salle de bain — Maison 1920',
    conditions_paiement: '50% à la commande, 50% à la réception',
    delai_realisation: '3 semaines',
    montant_ht: htD1, montant_tva: r2(htD1 * 0.2), montant_ttc: r2(htD1 * 1.2),
    date_validite: dFut(30), statut: 'BROUILLON',
    notes: 'Devis en cours de rédaction. Section cuisine à finaliser.',
  }});
  // Créer les lignes avec sections
  const sec1 = await prisma.ligneDevis.create({ data: {
    tenant_id: tenantId, devis_id: devis1.id, type: 'SECTION',
    description: 'Cuisine — Démolition et préparation', quantite: 0, unite: '',
    prix_unitaire_ht: 0, montant_ht: 0, tva_pourcent: 0, montant_ttc: 0, ordre: 1,
  }});
  await prisma.ligneDevis.createMany({ data: [
    { tenant_id: tenantId, devis_id: devis1.id, type: 'OUVRAGE', ouvrage_id: o(0).id,
      description: o(0).denomination, quantite: 12, unite: o(0).unite,
      prix_unitaire_ht: o(0).prix_unitaire_ht, montant_ht: r2(12 * o(0).prix_unitaire_ht),
      tva_pourcent: 20, montant_ttc: r2(12 * o(0).prix_unitaire_ht * 1.2), ordre: 2 },
    { tenant_id: tenantId, devis_id: devis1.id, type: 'OUVRAGE', ouvrage_id: o(1).id,
      description: o(1).denomination, quantite: 8, unite: o(1).unite,
      prix_unitaire_ht: o(1).prix_unitaire_ht, montant_ht: r2(8 * o(1).prix_unitaire_ht),
      tva_pourcent: 20, montant_ttc: r2(8 * o(1).prix_unitaire_ht * 1.2), ordre: 3 },
  ]});
  const sec2 = await prisma.ligneDevis.create({ data: {
    tenant_id: tenantId, devis_id: devis1.id, type: 'SECTION',
    description: 'Salle de bain — Carrelage et faïence', quantite: 0, unite: '',
    prix_unitaire_ht: 0, montant_ht: 0, tva_pourcent: 0, montant_ttc: 0, ordre: 4,
  }});
  await prisma.ligneDevis.createMany({ data: [
    { tenant_id: tenantId, devis_id: devis1.id, type: 'OUVRAGE', ouvrage_id: o(2).id,
      description: o(2).denomination, quantite: 24, unite: o(2).unite,
      prix_unitaire_ht: o(2).prix_unitaire_ht, montant_ht: r2(24 * o(2).prix_unitaire_ht),
      tva_pourcent: 20, montant_ttc: r2(24 * o(2).prix_unitaire_ht * 1.2), ordre: 5 },
    { tenant_id: tenantId, devis_id: devis1.id, type: 'OUVRAGE', ouvrage_id: o(3).id,
      description: o(3).denomination, quantite: 6, unite: o(3).unite,
      prix_unitaire_ht: o(3).prix_unitaire_ht, montant_ht: r2(6 * o(3).prix_unitaire_ht),
      tva_pourcent: 20, montant_ttc: r2(6 * o(3).prix_unitaire_ht * 1.2), ordre: 6 },
  ]});

  // D2 — ENVOYE récent (Marc Dupuis - extension)
  const l2 = [{ ouvrage: o(4), qte: 60 }, { ouvrage: o(5), qte: 25 }, { ouvrage: o(6), qte: 18 }, { ouvrage: o(7), qte: 4 }];
  const m2 = mkMontants(l2.map(l => ({ ...l, prix: l.ouvrage.prix_unitaire_ht })));
  const devis2 = await prisma.devis.create({ data: {
    tenant_id: tenantId, numero_devis: `DEV-${year}-0002`, client_id: cDupuis.id,
    objet: 'Extension garage accolé — 30 m²',
    conditions_paiement: '40% à la commande, 60% à la livraison',
    delai_realisation: '5 semaines',
    montant_ht: m2.ht, montant_tva: m2.tva, montant_ttc: m2.ttc,
    date_validite: dFut(22), date_envoi: dAgo(4), statut: 'ENVOYE',
    notes: 'Dalles béton armé. Porte de garage sectionnelle motorisée incluse.',
    lignes: { create: mkLignesDevis(tenantId, l2.map((l, i) => ({ ouvrage: l.ouvrage, qte: l.qte, prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))) },
  }});

  // D3 — ENVOYE ancien presque expiré (SCI Les Platanes - ravalement)
  const l3b = [{ ouvrage: o(8), qte: 220 }, { ouvrage: o(9), qte: 60 }, { ouvrage: o(10), qte: 15 }];
  const m3b = mkMontants(l3b.map(l => ({ ...l, prix: l.ouvrage.prix_unitaire_ht })));
  const devis3 = await prisma.devis.create({ data: {
    tenant_id: tenantId, numero_devis: `DEV-${year}-0003`, client_id: cPlatanes.id,
    objet: 'Ravalement façade + isolation par l\'extérieur — Immeuble 6 étages',
    conditions_paiement: '25% commande, 75% réception',
    delai_realisation: '10 semaines',
    montant_ht: m3b.ht, montant_tva: m3b.tva, montant_ttc: m3b.ttc,
    date_validite: dFut(3), date_envoi: dAgo(27), statut: 'ENVOYE',
    notes: 'Relance envoyée il y a 5 jours — décision attendue.',
    lignes: { create: mkLignesDevis(tenantId, l3b.map((l, i) => ({ ouvrage: l.ouvrage, qte: l.qte, prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))) },
  }});

  // D4 — ACCEPTE → lié au chantier EN_COURS Toiture Bernard
  const l4 = [{ ouvrage: o(11), qte: 180 }, { ouvrage: o(12), qte: 45 }, { ouvrage: o(13), qte: 20 }, { ouvrage: o(14), qte: 8 }];
  const m4 = mkMontants(l4.map(l => ({ ...l, prix: l.ouvrage.prix_unitaire_ht })));
  const devis4 = await prisma.devis.create({ data: {
    tenant_id: tenantId, numero_devis: `DEV-${year}-0004`, client_id: cBernard.id,
    objet: 'Réfection toiture complète — Pavillon 180 m²',
    conditions_paiement: '30% à la commande, 70% à la livraison',
    delai_realisation: '4 semaines',
    montant_ht: m4.ht, montant_tva: m4.tva, montant_ttc: m4.ttc,
    date_validite: dFut(14), date_envoi: dAgo(18), date_acceptation: dAgo(10),
    acompte_verse: r2(m4.ttc * 0.3), statut: 'ACCEPTE',
    notes: 'Tuiles canal ton vieilli. Zinguerie et gouttières comprises.',
    lignes: { create: mkLignesDevis(tenantId, l4.map((l, i) => ({ ouvrage: l.ouvrage, qte: l.qte, prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))) },
  }});

  // D5 — ACCEPTE → lié au chantier EN_COURS Résidences Horizon
  const l5 = [{ ouvrage: o(15), qte: 350 }, { ouvrage: o(16), qte: 80 }, { ouvrage: o(17), qte: 45 }, { ouvrage: o(18), qte: 20 }, { ouvrage: o(19), qte: 12 }];
  const m5 = mkMontants(l5.map(l => ({ ...l, prix: l.ouvrage.prix_unitaire_ht })));
  const devis5 = await prisma.devis.create({ data: {
    tenant_id: tenantId, numero_devis: `DEV-${year}-0005`, client_id: cHorizon.id,
    objet: 'Réhabilitation résidence Les Lilas — 12 logements',
    conditions_paiement: 'Acompte 30%, 3 appels de fonds, solde réception',
    delai_realisation: '18 semaines',
    montant_ht: m5.ht, montant_tva: m5.tva, montant_ttc: m5.ttc,
    date_validite: dFut(60), date_envoi: dAgo(25), date_acceptation: dAgo(14),
    acompte_verse: r2(m5.ttc * 0.3), statut: 'ACCEPTE',
    notes: 'Coordination avec le syndic. Réunion de chantier chaque lundi 8h.',
    lignes: { create: mkLignesDevis(tenantId, l5.map((l, i) => ({ ouvrage: l.ouvrage, qte: l.qte, prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))) },
  }});

  // D6 — ACCEPTE → lié au chantier PLANIFIE Lefebvre
  const l6 = [{ ouvrage: o(20), qte: 8 }, { ouvrage: o(21), qte: 14 }, { ouvrage: o(22), qte: 3 }];
  const m6 = mkMontants(l6.map(l => ({ ...l, prix: l.ouvrage.prix_unitaire_ht })));
  const devis6 = await prisma.devis.create({ data: {
    tenant_id: tenantId, numero_devis: `DEV-${year}-0006`, client_id: cLefebvre.id,
    objet: 'Rénovation salle de bain — 8 m² (maison 1920)',
    conditions_paiement: '50% commande, 50% réception',
    delai_realisation: '2 semaines',
    montant_ht: m6.ht, montant_tva: m6.tva, montant_ttc: m6.ttc,
    date_validite: dFut(45), date_envoi: dAgo(8), date_acceptation: dAgo(3),
    statut: 'ACCEPTE', notes: 'Démarrage prévu le mois prochain.',
    lignes: { create: mkLignesDevis(tenantId, l6.map((l, i) => ({ ouvrage: l.ouvrage, qte: l.qte, prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))) },
  }});

  // D7 — REFUSE (Isabelle Moreau - terrasse)
  const l7 = [{ ouvrage: o(23), qte: 45 }, { ouvrage: o(24), qte: 12 }];
  const m7 = mkMontants(l7.map(l => ({ ...l, prix: l.ouvrage.prix_unitaire_ht })));
  await prisma.devis.create({ data: {
    tenant_id: tenantId, numero_devis: `DEV-${year}-0007`, client_id: cMoreau.id,
    objet: 'Création terrasse bois + pergola — 45 m²',
    conditions_paiement: '50% commande, 50% réception',
    delai_realisation: '3 semaines',
    montant_ht: m7.ht, montant_tva: m7.tva, montant_ttc: m7.ttc,
    date_validite: dAgo(5), date_envoi: dAgo(38), date_refus: dAgo(18),
    raison_refus: 'Budget dépassé. A choisi bois composite moins cher. À recontacter automne.',
    statut: 'REFUSE',
    lignes: { create: mkLignesDevis(tenantId, l7.map((l, i) => ({ ouvrage: l.ouvrage, qte: l.qte, prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))) },
  }});

  console.log('✅ 7 devis créés (brouillon/envoyé×2/accepté×3/refusé)\n');

  // ── 7. CHANTIERS ACTUELS ─────────────────────────────────────────────────
  console.log('🏗️  Création des chantiers...');

  // CH_A — EN_COURS, Toiture Maisons Bernard
  const chA = await prisma.chantier.create({ data: {
    tenant_id: tenantId, client_id: cBernard.id, devis_id: devis4.id,
    nom: 'Réfection toiture — Pavillon Bernard',
    adresse: '15 rue Garibaldi', code_postal: '69003', ville: 'Lyon',
    latitude: 45.7587, longitude: 4.8339, rayon_gps_metres: 100,
    badgeage_par_tache: false,
    date_debut: dAgo(10), date_fin_prevue: dFut(18), statut: 'EN_COURS',
    notes: 'Accès par le portail côté jardin. Échafaudage déjà en place.',
  }});

  // CH_B — EN_COURS, Résidences Horizon (gros chantier)
  const chB = await prisma.chantier.create({ data: {
    tenant_id: tenantId, client_id: cHorizon.id, devis_id: devis5.id,
    nom: 'Réhabilitation résidence Les Lilas',
    adresse: '89 avenue de la République', code_postal: '69006', ville: 'Lyon',
    latitude: 45.7731, longitude: 4.8421, rayon_gps_metres: 150,
    badgeage_par_tache: true,
    date_debut: dAgo(14), date_fin_prevue: dFut(112), statut: 'EN_COURS',
    notes: 'Réunion chantier chaque lundi 8h. Parking souterrain niveau -1.',
  }});

  // CH_C — PLANIFIE, Lefebvre (prochain mois)
  const chC = await prisma.chantier.create({ data: {
    tenant_id: tenantId, client_id: cLefebvre.id, devis_id: devis6.id,
    nom: 'Rénovation salle de bain — Lefebvre',
    adresse: '3 allée des Roses', code_postal: '69008', ville: 'Lyon',
    latitude: 45.7480, longitude: 4.8455, rayon_gps_metres: 50,
    badgeage_par_tache: false,
    date_debut: dFut(14), date_fin_prevue: dFut(28), statut: 'PLANIFIE',
    notes: 'Démarrage dans 2 semaines. Thomas Roux responsable chantier.',
  }});

  // CH_D — TERMINE, SCI Les Platanes (isolation combles)
  const chD = await prisma.chantier.create({ data: {
    tenant_id: tenantId, client_id: cPlatanes.id,
    nom: 'Isolation combles — 7 place Bellecour',
    adresse: '7 place Bellecour', code_postal: '69002', ville: 'Lyon',
    latitude: 45.7579, longitude: 4.8320, rayon_gps_metres: 100,
    badgeage_par_tache: false,
    date_debut: dAgo(55), date_fin_prevue: dAgo(30), date_fin_reelle: dAgo(32),
    statut: 'TERMINE', notes: 'Terminé 2 jours avant. Client très satisfait.',
  }});

  // ── Assigner employés
  await prisma.chantierEmploye.createMany({ data: [
    { chantier_id: chA.id, employe_id: empObjs[2].id },  // Antoine
    { chantier_id: chA.id, employe_id: empObjs[0].id },  // Julie (manager)
    { chantier_id: chB.id, employe_id: empObjs[0].id },  // Julie (manager)
    { chantier_id: chB.id, employe_id: empObjs[1].id },  // Thomas
    { chantier_id: chB.id, employe_id: empObjs[2].id },  // Antoine
    { chantier_id: chC.id, employe_id: empObjs[1].id },  // Thomas (responsable)
  ]});

  // ── Tâches CH_A (toiture)
  const tA1 = await prisma.tache.create({ data: { chantier_id: chA.id, nom: 'Installation échafaudage', ordre: 1, statut: 'TERMINE', description: 'Échafaudage périmétrique posé côté rue et jardin' }});
  const tA2 = await prisma.tache.create({ data: { chantier_id: chA.id, nom: 'Dépose ancienne toiture', ordre: 2, statut: 'TERMINE', description: 'Dépose tuiles + lattis existants, bâche provisoire posée' }});
  const tA3 = await prisma.tache.create({ data: { chantier_id: chA.id, nom: 'Reprise charpente', ordre: 3, statut: 'EN_COURS', description: 'Remplacement chevrons abîmés, renfort des faitages', ouvrage_id: o(11).id, quantite_prevue: 10, unite: 'ML' }});
  const tA4 = await prisma.tache.create({ data: { chantier_id: chA.id, nom: 'Pose nouvelle couverture', ordre: 4, statut: 'A_FAIRE', description: 'Tuiles canal ton vieilli + zinguerie (gouttières, noues)', ouvrage_id: o(12).id, quantite_prevue: 180, unite: 'M²' }});
  const tA5 = await prisma.tache.create({ data: { chantier_id: chA.id, nom: 'Nettoyage et réception', ordre: 5, statut: 'A_FAIRE', description: 'Évacuation déchets, dépose échafaudage, réception client' }});

  // ── Tâches CH_B (résidence, badgeage par tâche activé)
  const tB1 = await prisma.tache.create({ data: { chantier_id: chB.id, nom: 'Dépose revêtements existants', ordre: 1, statut: 'TERMINE', description: 'Dépose carrelage et faïence — 12 logements niveaux 1-3' }});
  const tB2 = await prisma.tache.create({ data: { chantier_id: chB.id, nom: 'Travaux de maçonnerie', ordre: 2, statut: 'EN_COURS', description: 'Reprise cloisons + enduits niveaux 1 à 4', ouvrage_id: o(15).id, quantite_prevue: 200, unite: 'M²' }});
  const tB3 = await prisma.tache.create({ data: { chantier_id: chB.id, nom: 'Plomberie — colonnes montantes', ordre: 3, statut: 'EN_COURS', description: 'Remplacement colonnes montantes + distribution appartements', ouvrage_id: o(16).id, quantite_prevue: 80, unite: 'ML' }});
  const tB4 = await prisma.tache.create({ data: { chantier_id: chB.id, nom: 'Carrelage et faïence', ordre: 4, statut: 'A_FAIRE', description: 'Pose nouveau carrelage — cuisines + salles de bain', ouvrage_id: o(17).id, quantite_prevue: 120, unite: 'M²' }});
  const tB5 = await prisma.tache.create({ data: { chantier_id: chB.id, nom: 'Peinture parties communes', ordre: 5, statut: 'A_FAIRE', description: 'Préparation + peinture 2 couches halls et couloirs' }});
  const tB6 = await prisma.tache.create({ data: { chantier_id: chB.id, nom: 'Réception et levée réserves', ordre: 6, statut: 'A_FAIRE', description: 'Visite avec le syndic, corrections mineures, PV de réception' }});

  // ── Tâches CH_C (planifié — les tâches existent déjà pour préparer)
  await prisma.tache.createMany({ data: [
    { chantier_id: chC.id, nom: 'Dépose ancienne baignoire + faïence', ordre: 1, statut: 'A_FAIRE', description: 'Dépose complète, évacuation, protection sol' },
    { chantier_id: chC.id, nom: 'Plomberie — modification arrivées', ordre: 2, statut: 'A_FAIRE', description: 'Déplacement arrivée eau + évacuation douche italienne' },
    { chantier_id: chC.id, nom: 'Carrelage mur et sol', ordre: 3, statut: 'A_FAIRE', description: 'Pose carrelage 60×60 gris anthracite + faïence blanc mat', ouvrage_id: o(20).id, quantite_prevue: 8, unite: 'M²' },
    { chantier_id: chC.id, nom: 'Pose douche italienne + équipements', ordre: 4, statut: 'A_FAIRE', description: 'Receveur extra-plat, paroi verre trempé, robinetterie' },
  ]});

  // ── Assigner tâches aux employés (pour le planning)
  await prisma.tacheEmploye.createMany({ data: [
    { tache_id: tA3.id, employe_id: empObjs[2].id },  // Antoine → reprise charpente
    { tache_id: tA4.id, employe_id: empObjs[2].id },  // Antoine → couverture
    { tache_id: tB2.id, employe_id: empObjs[1].id },  // Thomas → maçonnerie
    { tache_id: tB3.id, employe_id: empObjs[0].id },  // Julie → plomberie
    { tache_id: tB4.id, employe_id: empObjs[1].id },  // Thomas → carrelage
    { tache_id: tB4.id, employe_id: empObjs[2].id },  // Antoine → carrelage aussi
  ]});

  console.log('✅ 4 chantiers créés (planifié/en cours×2/terminé) + tâches\n');

  // ── Badgeages (10 jours sur CH_B, 5 jours sur CH_A) ─────────────────────
  const badgeagesData = [];
  const empBadge = [empObjs[0], empObjs[1], empObjs[2]]; // Julie, Thomas, Antoine
  for (let day = 10; day >= 1; day--) {
    const d = new Date(); d.setDate(d.getDate() - day);
    const dow = d.getDay();
    if (dow === 0) continue; // pas le dimanche

    // CH_B : tous les jours ouvrés, 3 employés
    for (const emp of empBadge) {
      const arr = new Date(d); arr.setHours(7, 30, 0, 0);
      const dep1 = new Date(d); dep1.setHours(12, 0, 0, 0);
      const rep = new Date(d); rep.setHours(13, 0, 0, 0);
      const dep2 = new Date(d); dep2.setHours(17, 30, 0, 0);
      const tacheId = emp.id === empObjs[1].id ? tB2.id : emp.id === empObjs[0].id ? tB3.id : tB2.id;
      badgeagesData.push(
        { tenant_id: tenantId, chantier_id: chB.id, employe_id: emp.id, tache_id: tacheId, type: 'ARRIVEE', methode: 'GPS', timestamp: arr, latitude: 45.7731, longitude: 4.8421, precision_metres: 8, synced: true },
        { tenant_id: tenantId, chantier_id: chB.id, employe_id: emp.id, tache_id: tacheId, type: 'DEPART', methode: 'GPS', timestamp: dep1, latitude: 45.7731, longitude: 4.8421, precision_metres: 10, synced: true },
        { tenant_id: tenantId, chantier_id: chB.id, employe_id: emp.id, tache_id: tacheId, type: 'ARRIVEE', methode: 'GPS', timestamp: rep, latitude: 45.7731, longitude: 4.8421, precision_metres: 7, synced: true },
        { tenant_id: tenantId, chantier_id: chB.id, employe_id: emp.id, tache_id: tacheId, type: 'DEPART', methode: 'GPS', timestamp: dep2, latitude: 45.7731, longitude: 4.8421, precision_metres: 9, synced: true },
      );
    }
    // CH_A : 5 derniers jours, Antoine seulement
    if (day <= 5) {
      const arr = new Date(d); arr.setHours(7, 45, 0, 0);
      const dep = new Date(d); dep.setHours(17, 0, 0, 0);
      badgeagesData.push(
        { tenant_id: tenantId, chantier_id: chA.id, employe_id: empObjs[2].id, type: 'ARRIVEE', methode: 'GPS', timestamp: arr, latitude: 45.7587, longitude: 4.8339, precision_metres: 12, synced: true },
        { tenant_id: tenantId, chantier_id: chA.id, employe_id: empObjs[2].id, type: 'DEPART', methode: 'GPS', timestamp: dep, latitude: 45.7587, longitude: 4.8339, precision_metres: 8, synced: true },
      );
    }
  }
  await prisma.badgeage.createMany({ data: badgeagesData });

  // ── Messages chantier ─────────────────────────────────────────────────────
  await prisma.chantierMessage.createMany({ data: [
    { tenant_id: tenantId, chantier_id: chB.id, user_id: adminUser.id, message: 'Bonjour à tous. Réunion lundi 8h confirmée. Apportez les plans niveau 3.', created_at: dAgo(12) },
    { tenant_id: tenantId, chantier_id: chB.id, user_id: empObjs[0].user.id, message: 'Reçu. Je préviens les gars. On est en avance sur la maço niveau 1.', created_at: dAgo(11) },
    { tenant_id: tenantId, chantier_id: chB.id, user_id: empObjs[1].user.id, message: 'Les colonnes montantes niveau 2 sont terminées. On attaque niveau 3 demain matin.', created_at: dAgo(3) },
    { tenant_id: tenantId, chantier_id: chB.id, user_id: adminUser.id, message: 'Excellent ! Le syndic confirme l\'accès aux appartements 301 à 306 jeudi.', created_at: dAgo(2) },
    { tenant_id: tenantId, chantier_id: chA.id, user_id: empObjs[2].user.id, message: 'La charpente est terminée côté nord. Quelques chevrons supplémentaires côté sud à prévoir — je fais un chiffrage.', created_at: dAgo(5) },
    { tenant_id: tenantId, chantier_id: chA.id, user_id: adminUser.id, message: 'OK note les quantités, on en parle ce soir. La livraison tuiles est confirmée vendredi.', created_at: dAgo(4) },
  ]});

  // ── Documents (metadata, URL factice) ────────────────────────────────────
  await prisma.document.createMany({ data: [
    { tenant_id: tenantId, chantier_id: chB.id, nom: 'Plans_Residence_Les_Lilas_RDC.pdf', type: 'application/pdf', url: '/uploads/documents/demo-plans-rdc.pdf', taille_bytes: 2450000, titre: 'Plans RDC', description: 'Plans architecte niveau rez-de-chaussée', uploaded_by: adminUser.id, created_at: dAgo(13) },
    { tenant_id: tenantId, chantier_id: chB.id, nom: 'PV_Reunions_Chantier.pdf', type: 'application/pdf', url: '/uploads/documents/demo-pv-reunions.pdf', taille_bytes: 890000, titre: 'PV réunions de chantier', description: 'Compte-rendu semaines 1 et 2', uploaded_by: empObjs[0].user.id, created_at: dAgo(7) },
    { tenant_id: tenantId, chantier_id: chA.id, nom: 'Photo_Charpente_Avant.jpg', type: 'image/jpeg', url: '/uploads/documents/demo-photo-charpente.jpg', taille_bytes: 3200000, titre: 'État charpente — diagnostic', description: 'Photos avant intervention — chevrons dégradés identifiés', uploaded_by: empObjs[2].user.id, created_at: dAgo(9) },
  ]});

  console.log('✅ Badgeages, messages et documents créés\n');

  // ── 8. CHANTIERS HISTORIQUES + DEVIS + FACTURES (pour analytics pilotage) ─
  console.log('📊 Création de l\'historique (6 mois)...');

  const histData = [
    { label: 'H1', client: cPlatanes, moisDébut: 7, moisFin: 5, montantHT: 18500,  num: '0008' },
    { label: 'H2', client: cBernard,  moisDébut: 5, moisFin: 4, montantHT: 32000,  num: '0009' },
    { label: 'H3', client: cDupuis,   moisDébut: 4, moisFin: 3, montantHT: 11200,  num: '0010' },
    { label: 'H4', client: cMoreau,   moisDébut: 3, moisFin: 2, montantHT: 24800,  num: '0011' },
    { label: 'H5', client: cHorizon,  moisDébut: 2, moisFin: 1, montantHT: 41000,  num: '0012' },
  ];

  let facNumCounter = 1;
  for (const h of histData) {
    const debM = mAgo(h.moisDébut);
    const finM = mAgo(h.moisFin);
    const htH = h.montantHT;
    const tvaH = r2(htH * 0.2);
    const ttcH = r2(htH * tvaH);

    // Devis accepté — quantités fixes (évite division par zéro si prix = 0)
    const lH = [{ ouvrage: o(5), qte: 15 }, { ouvrage: o(6), qte: 10 }];
    const mH = mkMontants(lH.map(l => ({ qte: l.qte, prix: l.ouvrage.prix_unitaire_ht })));
    const dH = await prisma.devis.create({ data: {
      tenant_id: tenantId, numero_devis: `DEV-${year}-${h.num}`, client_id: h.client.id,
      objet: `Travaux ${h.label} — ${h.client.nom}`,
      conditions_paiement: '30% commande, 70% réception',
      delai_realisation: '4 semaines',
      montant_ht: mH.ht, montant_tva: mH.tva, montant_ttc: mH.ttc,
      date_validite: new Date(debM.getTime() + 30 * 86400000),
      date_envoi: new Date(debM.getTime() - 10 * 86400000),
      date_acceptation: new Date(debM.getTime() - 5 * 86400000),
      statut: 'ACCEPTE',
      lignes: { create: mkLignesDevis(tenantId, lH.map((l, i) => ({ ouvrage: l.ouvrage, qte: l.qte, prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))) },
    }});

    // Chantier terminé
    const chH = await prisma.chantier.create({ data: {
      tenant_id: tenantId, client_id: h.client.id, devis_id: dH.id,
      nom: `Travaux ${h.label} — ${h.client.nom}`,
      adresse: h.client.adresse || '1 rue de Lyon', code_postal: h.client.code_postal || '69000', ville: h.client.ville || 'Lyon',
      latitude: 45.75 + Math.random() * 0.05, longitude: 4.83 + Math.random() * 0.05,
      date_debut: debM, date_fin_prevue: finM, date_fin_reelle: new Date(finM.getTime() - 2 * 86400000),
      statut: 'TERMINE',
    }});

    // Facture soldée
    const dateEmission = new Date(finM.getTime() - 5 * 86400000);
    const datePaiement = new Date(finM.getTime() + 20 * 86400000);
    await prisma.facture.create({ data: {
      tenant_id: tenantId,
      numero_facture: `FAC-${year}-00${facNumCounter++}`,
      chantier_id: chH.id, devis_id: dH.id, client_id: h.client.id,
      entreprise_nom: 'Martin BTP', entreprise_siret: '11111111111111',
      entreprise_adresse: '42 rue des Bâtisseurs, 69007 Lyon',
      entreprise_tel: '04 72 33 44 55', entreprise_email: DEMO_EMAIL,
      client_nom: h.client.nom,
      client_adresse: `${h.client.adresse || ''}, ${h.client.code_postal || ''} ${h.client.ville || ''}`,
      client_siret: h.client.siret || '', client_tel: h.client.telephone || '', client_email: h.client.email || '',
      montant_ht: mH.ht, montant_tva: mH.tva, montant_ttc: mH.ttc,
      acompte_demande: mH.ttc, acompte_recu: mH.ttc, reste_a_payer: 0,
      statut_paiement: 'PAYE', statut_facture: 'ENVOYEE',
      objet: `Solde travaux — ${h.client.nom}`,
      date_emission: dateEmission, date_echeance: new Date(dateEmission.getTime() + 30 * 86400000),
      date_envoi: dateEmission, date_paiement_complet: datePaiement,
      lignes: { create: mkLignesDevis(tenantId, lH.map((l, i) => ({ ouvrage: l.ouvrage, qte: l.qte, prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))).map(l => ({
        description: l.description, quantite: l.quantite, unite: l.unite,
        prix_unitaire_ht: l.prix_unitaire_ht, montant_ht: l.montant_ht,
        tva_pourcent: l.tva_pourcent, montant_ttc: l.montant_ttc, ordre: l.ordre,
      })) },
      paiements: { create: [{ tenant_id: tenantId, montant: mH.ttc, date_paiement: datePaiement, moyen_paiement: 'VIREMENT', reference: `VIR-${year}-0${10 + facNumCounter}`, type: 'SOLDE', valide: true }] },
    }});
  }
  console.log(`✅ ${histData.length} chantiers historiques + factures soldées\n`);

  // ── 9. FACTURES COURANTES ─────────────────────────────────────────────────
  console.log('💶 Création des factures courantes...');

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const snapEntreprise = {
    entreprise_nom: tenant.nom, entreprise_siret: tenant.siret,
    entreprise_adresse: `${tenant.adresse}, ${tenant.code_postal} ${tenant.ville}`,
    entreprise_tel: tenant.telephone, entreprise_email: tenant.email,
  };
  const snapClient = (c) => ({
    client_nom: c.nom, client_adresse: `${c.adresse || ''}, ${c.code_postal || ''} ${c.ville || ''}`,
    client_siret: c.siret || '', client_tel: c.telephone || '', client_email: c.email || '',
  });
  const mkLignesFac = (lignes) => ({
    create: mkLignesDevis(tenantId, lignes).map(l => ({
      description: l.description, quantite: l.quantite, unite: l.unite,
      prix_unitaire_ht: l.prix_unitaire_ht, montant_ht: l.montant_ht,
      tva_pourcent: l.tva_pourcent, montant_ttc: l.montant_ttc, ordre: l.ordre,
    })),
  });

  // F_BROUILLON — CH_A, pas encore envoyée
  const fBHT = r2(m4.ht * 0.3);
  await prisma.facture.create({ data: {
    tenant_id: tenantId, numero_facture: `FAC-${year}-00${facNumCounter++}`,
    chantier_id: chA.id, devis_id: devis4.id, client_id: cBernard.id,
    ...snapEntreprise, ...snapClient(cBernard),
    montant_ht: fBHT, montant_tva: r2(fBHT * 0.2), montant_ttc: r2(fBHT * 1.2),
    acompte_demande: r2(fBHT * 1.2), acompte_recu: 0, reste_a_payer: r2(fBHT * 1.2),
    statut_paiement: 'EN_ATTENTE', statut_facture: 'BROUILLON',
    objet: 'Réfection toiture Bernard — acompte 30% (brouillon)',
    date_emission: dAgo(2), date_echeance: dFut(28),
    lignes: mkLignesFac(l4.slice(0, 2).map((l, i) => ({ ouvrage: l.ouvrage, qte: r2(l.qte * 0.3), prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))),
  }});

  // F_EN_ATTENTE — CH_B, acompte 30% envoyé
  const fAtHT = r2(m5.ht * 0.3);
  await prisma.facture.create({ data: {
    tenant_id: tenantId, numero_facture: `FAC-${year}-00${facNumCounter++}`,
    chantier_id: chB.id, devis_id: devis5.id, client_id: cHorizon.id,
    ...snapEntreprise, ...snapClient(cHorizon),
    montant_ht: fAtHT, montant_tva: r2(fAtHT * 0.2), montant_ttc: r2(fAtHT * 1.2),
    acompte_demande: r2(fAtHT * 1.2), acompte_recu: 0, reste_a_payer: r2(fAtHT * 1.2),
    statut_paiement: 'EN_ATTENTE', statut_facture: 'ENVOYEE',
    objet: 'Réhabilitation résidence Les Lilas — acompte 30%',
    date_emission: dAgo(12), date_echeance: dFut(18), date_envoi: dAgo(12),
    lignes: mkLignesFac(l5.slice(0, 2).map((l, i) => ({ ouvrage: l.ouvrage, qte: r2(l.qte * 0.3), prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))),
  }});

  // F_EN_RETARD — CH_D (terminé), facture pas encore réglée, échéance dépassée
  const fRetHT = r2(m5.ht * 0.2); // petite facture intermédiaire
  await prisma.facture.create({ data: {
    tenant_id: tenantId, numero_facture: `FAC-${year}-00${facNumCounter++}`,
    chantier_id: chD.id, client_id: cPlatanes.id,
    ...snapEntreprise, ...snapClient(cPlatanes),
    montant_ht: fRetHT, montant_tva: r2(fRetHT * 0.2), montant_ttc: r2(fRetHT * 1.2),
    acompte_demande: r2(fRetHT * 1.2), acompte_recu: 0, reste_a_payer: r2(fRetHT * 1.2),
    statut_paiement: 'EN_ATTENTE', statut_facture: 'ENVOYEE',
    objet: 'Isolation combles — solde (en retard)',
    date_emission: dAgo(40), date_echeance: dAgo(10), date_envoi: dAgo(40),
    notes: 'Relance envoyée le ' + dAgo(5).toLocaleDateString('fr-FR') + '. Client ne répond pas.',
    lignes: mkLignesFac(l3b.slice(0, 2).map((l, i) => ({ ouvrage: l.ouvrage, qte: r2(l.qte * 0.15), prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))),
  }});

  // F_PARTIEL — CH_B 2ème appel de fonds, partiellement payé
  const fPHT = r2(m5.ht * 0.25);
  const fPTTC = r2(fPHT * 1.2);
  const fPRecu = r2(fPTTC * 0.5);
  const facPartiel = await prisma.facture.create({ data: {
    tenant_id: tenantId, numero_facture: `FAC-${year}-00${facNumCounter++}`,
    chantier_id: chB.id, devis_id: devis5.id, client_id: cHorizon.id,
    ...snapEntreprise, ...snapClient(cHorizon),
    montant_ht: fPHT, montant_tva: r2(fPHT * 0.2), montant_ttc: fPTTC,
    acompte_demande: fPTTC, acompte_recu: fPRecu, reste_a_payer: r2(fPTTC - fPRecu),
    statut_paiement: 'PARTIEL', statut_facture: 'ENVOYEE',
    objet: 'Réhabilitation résidence Les Lilas — 2ème appel de fonds 25%',
    date_emission: dAgo(20), date_echeance: dFut(10), date_envoi: dAgo(20),
    notes: 'Virement partiel reçu le ' + dAgo(8).toLocaleDateString('fr-FR') + '. Solde attendu.',
    lignes: mkLignesFac(l5.slice(2, 4).map((l, i) => ({ ouvrage: l.ouvrage, qte: r2(l.qte * 0.25), prix: l.ouvrage.prix_unitaire_ht, ordre: i + 1 }))),
    paiements: { create: [{ tenant_id: tenantId, montant: fPRecu, date_paiement: dAgo(8), moyen_paiement: 'VIREMENT', reference: `VIR-${year}-0234`, type: 'ACOMPTE', valide: true }] },
  }});

  console.log(`✅ 4 factures courantes (brouillon / en attente / en retard / partielle)\n`);

  // ── Résumé ────────────────────────────────────────────────────────────────
  const [nbCl, nbDev, nbCh, nbFac, nbBadge, nbMsgs, nbDocs] = await Promise.all([
    prisma.client.count({ where: { tenant_id: tenantId } }),
    prisma.devis.count({ where: { tenant_id: tenantId } }),
    prisma.chantier.count({ where: { tenant_id: tenantId } }),
    prisma.facture.count({ where: { tenant_id: tenantId } }),
    prisma.badgeage.count({ where: { chantier: { tenant_id: tenantId } } }),
    prisma.chantierMessage.count({ where: { tenant_id: tenantId } }),
    prisma.document.count({ where: { tenant_id: tenantId } }),
  ]);

  console.log('══════════════════════════════════════════════════');
  console.log('🎉  SEED DÉMO TERMINÉ — Toutes les fonctions OK !');
  console.log('══════════════════════════════════════════════════');
  console.log(`👷 Employés    : 3 + 1 gérant`);
  console.log(`👥 Clients     : ${nbCl} (3 entreprises + 3 particuliers)`);
  console.log(`📄 Devis       : ${nbDev} (1 brouillon+sections / 2 envoyés / 3 acceptés / 1 refusé + 5 hist.)`);
  console.log(`🏗️  Chantiers  : ${nbCh} (planifié / en cours×2 / terminé×1 + 5 hist.)`);
  console.log(`💶 Factures    : ${nbFac} (brouillon / attente / retard / partiel + 5 soldées hist.)`);
  console.log(`📍 Badgeages   : ${nbBadge}`);
  console.log(`💬 Messages    : ${nbMsgs}`);
  console.log(`📎 Documents   : ${nbDocs}`);
  console.log(`📈 Auto-learning: 10 ouvrages avec historique prix`);
  console.log('──────────────────────────────────────────────────');
  console.log(`🔑 ${DEMO_EMAIL} / Demo@Autobat2026!`);
  console.log('══════════════════════════════════════════════════\n');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('❌ SEED DEMO FAILED:', e.message); console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
