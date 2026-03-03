import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Génère le HTML d'une facture
 */
function generateFactureHTML(facture) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(montant);
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${facture.numero_facture}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #10B981;
    }
    .company-info {
      flex: 1;
    }
    .company-name {
      font-size: 20pt;
      font-weight: bold;
      color: #10B981;
      margin-bottom: 8px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-number {
      font-size: 24pt;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .party {
      flex: 1;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .party + .party {
      margin-left: 20px;
    }
    .party-title {
      font-weight: bold;
      color: #10B981;
      margin-bottom: 8px;
      font-size: 12pt;
    }
    .party-name {
      font-weight: bold;
      font-size: 12pt;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    th {
      background: #10B981;
      color: white;
      padding: 12px 8px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .totals-table {
      margin-left: auto;
      width: 300px;
    }
    .totals-table td {
      border: none;
      padding: 8px;
    }
    .total-row {
      font-size: 14pt;
      font-weight: bold;
      border-top: 2px solid #10B981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
    }
    .mentions {
      margin-top: 20px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      font-size: 9pt;
      color: #6b7280;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: bold;
      margin-left: 10px;
    }
    .status-partiel {
      background: #fef3c7;
      color: #92400e;
    }
    .status-paye {
      background: #d1fae5;
      color: #065f46;
    }
    .status-en-attente {
      background: #fee2e2;
      color: #991b1b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      ${facture.logo_url ? `<img src="file://${path.join(__dirname, '../..', facture.logo_url)}" alt="${facture.entreprise_nom}" style="max-width:150px;max-height:60px;object-fit:contain;display:block;margin-bottom:8px;" />` : ''}
      <div class="company-name">${facture.entreprise_nom}</div>
      <div>SIRET: ${facture.entreprise_siret}</div>
      <div>${facture.entreprise_adresse}</div>
      <div>Tél: ${facture.entreprise_tel}</div>
      <div>Email: ${facture.entreprise_email}</div>
    </div>
    <div class="invoice-info">
      <div class="invoice-number">FACTURE</div>
      <div class="invoice-number">${facture.numero_facture}</div>
      <div>Date: ${formatDate(facture.date_emission)}</div>
      <div>Échéance: ${formatDate(facture.date_echeance)}</div>
      ${facture.statut_paiement === 'PAYE' ? '<span class="status-badge status-paye">PAYÉE</span>' : ''}
      ${facture.statut_paiement === 'PARTIEL' ? '<span class="status-badge status-partiel">PARTIELLEMENT PAYÉE</span>' : ''}
      ${facture.statut_paiement === 'EN_ATTENTE' ? '<span class="status-badge status-en-attente">EN ATTENTE</span>' : ''}
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-title">CLIENT</div>
      <div class="party-name">${facture.client_nom}</div>
      ${facture.client_siret ? `<div>SIRET: ${facture.client_siret}</div>` : ''}
      <div>${facture.client_adresse}</div>
      <div>Tél: ${facture.client_tel}</div>
      <div>Email: ${facture.client_email}</div>
    </div>
    ${facture.chantier ? `
    <div class="party">
      <div class="party-title">CHANTIER</div>
      <div class="party-name">${facture.chantier.nom}</div>
      <div>${facture.chantier.adresse || ''}</div>
    </div>
    ` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>DESCRIPTION</th>
        <th class="text-right">QUANTITÉ</th>
        <th class="text-right">PRIX UNIT. HT</th>
        <th class="text-right">MONTANT HT</th>
      </tr>
    </thead>
    <tbody>
      ${facture.lignes.map(ligne => `
        <tr>
          <td>${ligne.description}</td>
          <td class="text-right">${ligne.quantite} ${ligne.unite}</td>
          <td class="text-right">${formatMontant(ligne.prix_unitaire_ht)}</td>
          <td class="text-right">${formatMontant(ligne.montant_ht)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td>Total HT</td>
        <td class="text-right">${formatMontant(facture.montant_ht)}</td>
      </tr>
      <tr>
        <td>TVA (20%)</td>
        <td class="text-right">${formatMontant(facture.montant_tva)}</td>
      </tr>
      <tr class="total-row">
        <td>Total TTC</td>
        <td class="text-right">${formatMontant(facture.montant_ttc)}</td>
      </tr>
      ${facture.acompte_recu > 0 ? `
      <tr>
        <td>Acompte reçu</td>
        <td class="text-right">- ${formatMontant(facture.acompte_recu)}</td>
      </tr>
      <tr class="total-row">
        <td>Reste à payer</td>
        <td class="text-right">${formatMontant(facture.reste_a_payer)}</td>
      </tr>
      ` : ''}
    </table>
  </div>

  ${facture.notes ? `
  <div style="margin-top: 30px;">
    <strong>Notes:</strong><br>
    ${facture.notes}
  </div>
  ` : ''}

  <div class="mentions">
    <strong>Mentions obligatoires:</strong><br>
    En cas de retard de paiement, seront exigibles, conformément à l'article L 441-6 du code de commerce,
    une indemnité calculée sur la base de trois fois le taux de l'intérêt légal en vigueur ainsi qu'une
    indemnité forfaitaire pour frais de recouvrement de 40 euros.<br>
    Escompte pour paiement anticipé : néant.<br>
    TVA non applicable - Article 293 B du CGI (si micro-entreprise) ou TVA ${facture.montant_tva > 0 ? 'applicable' : 'non applicable'}.
  </div>

  <div class="footer">
    <div style="text-align: center;">
      ${facture.entreprise_nom} - SIRET: ${facture.entreprise_siret}<br>
      ${facture.entreprise_adresse} - ${facture.entreprise_tel} - ${facture.entreprise_email}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Génère un PDF à partir d'une facture
 */
export async function generateFacturePDF(facture) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const html = generateFactureHTML(facture);

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true
    });

    return pdf;
  } finally {
    await browser.close();
  }
}
