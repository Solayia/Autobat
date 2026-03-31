import puppeteer from 'puppeteer';
import { getPuppeteerConfig } from './puppeteerLaunch.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Génère le HTML d'une facture
 */
function generateFactureHTML(facture, logoDataUrl = null) {
  const accentColor = '#444444';
  const borderColor = '#cccccc';
  const lightGray = '#f7f7f7';

  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR');

  const formatMontant = (montant) => new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(montant);

  const statusLabel = facture.statut_paiement === 'PAYE' ? 'PAYÉE'
    : facture.statut_paiement === 'PARTIEL' ? 'PARTIELLEMENT PAYÉE'
    : 'EN ATTENTE';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${facture.numero_facture}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #333; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid ${accentColor}; }
    .company-name { font-size: 16pt; font-weight: bold; color: ${accentColor}; margin-bottom: 6px; }
    .company-info-text { font-size: 9pt; color: #555; line-height: 1.6; }
    .invoice-block { text-align: right; }
    .invoice-label { font-size: 22pt; font-weight: bold; color: ${accentColor}; letter-spacing: 2px; }
    .invoice-number { font-size: 13pt; font-weight: bold; color: #333; margin-top: 4px; }
    .invoice-meta { font-size: 9pt; color: #555; margin-top: 8px; line-height: 1.7; }
    .status-tag { display: inline-block; margin-top: 8px; padding: 3px 10px; border: 1px solid ${accentColor}; font-size: 8pt; font-weight: bold; letter-spacing: 1px; color: ${accentColor}; }
    .parties { display: flex; gap: 20px; margin-bottom: 28px; }
    .party { flex: 1; padding: 12px 14px; background: ${lightGray}; border-left: 3px solid ${borderColor}; }
    .party-title { font-size: 8pt; font-weight: bold; letter-spacing: 1px; color: #888; text-transform: uppercase; margin-bottom: 6px; }
    .party-name { font-size: 11pt; font-weight: bold; color: #222; margin-bottom: 4px; }
    .party-info { font-size: 9pt; color: #555; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    thead tr { background: ${lightGray}; border-top: 2px solid ${accentColor}; border-bottom: 1px solid ${borderColor}; }
    th { padding: 9px 8px; text-align: left; font-size: 8pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; color: ${accentColor}; }
    td { padding: 9px 8px; font-size: 9.5pt; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .totals-wrap { display: flex; justify-content: flex-end; margin-top: 8px; }
    .totals-table { width: 280px; border-collapse: collapse; }
    .totals-table td { padding: 6px 8px; font-size: 9.5pt; border: none; }
    .totals-table tr.total-final td { border-top: 2px solid ${accentColor}; font-weight: bold; font-size: 11pt; padding-top: 10px; }
    .notes { margin-top: 24px; padding: 12px 14px; background: ${lightGray}; font-size: 9pt; color: #555; }
    .notes-title { font-weight: bold; color: ${accentColor}; margin-bottom: 4px; font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; }
    .mentions { margin-top: 16px; padding: 10px 14px; border: 1px solid ${borderColor}; font-size: 8pt; color: #777; line-height: 1.6; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid ${borderColor}; font-size: 8pt; color: #999; text-align: center; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${logoDataUrl ? `<img src="${logoDataUrl}" alt="${facture.entreprise_nom}" style="max-width:140px;max-height:55px;object-fit:contain;display:block;margin-bottom:8px;" />` : ''}
      <div class="company-name">${facture.entreprise_nom}</div>
      <div class="company-info-text">
        SIRET : ${facture.entreprise_siret}<br>
        ${facture.entreprise_adresse}<br>
        ${facture.entreprise_tel} — ${facture.entreprise_email}
      </div>
    </div>
    <div class="invoice-block">
      <div class="invoice-label">FACTURE</div>
      <div class="invoice-number">${facture.numero_facture}</div>
      <div class="invoice-meta">
        ${facture.objet ? `<strong>${facture.objet}</strong><br>` : ''}
        Date d'émission : ${formatDate(facture.date_emission)}<br>
        Date d'échéance : ${formatDate(facture.date_echeance)}
      </div>
      <div class="status-tag">${statusLabel}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-title">Client</div>
      <div class="party-name">${facture.client_nom}</div>
      <div class="party-info">
        ${facture.client_siret ? `SIRET : ${facture.client_siret}<br>` : ''}
        ${facture.client_adresse}<br>
        ${facture.client_tel} — ${facture.client_email}
      </div>
    </div>
    ${facture.chantier ? `
    <div class="party">
      <div class="party-title">Chantier</div>
      <div class="party-name">${facture.chantier.nom}</div>
      <div class="party-info">${facture.chantier.adresse || ''}</div>
    </div>
    ` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qté</th>
        <th class="text-right">Prix unit. HT</th>
        <th class="text-right">TVA</th>
        <th class="text-right">Montant HT</th>
      </tr>
    </thead>
    <tbody>
      ${facture.lignes.map(ligne => `
        <tr>
          <td>${ligne.description}</td>
          <td class="text-right">${ligne.quantite} ${ligne.unite}</td>
          <td class="text-right">${formatMontant(ligne.prix_unitaire_ht)}</td>
          <td class="text-right">${ligne.tva_pourcent !== undefined ? ligne.tva_pourcent : 20}%</td>
          <td class="text-right">${formatMontant(ligne.montant_ht)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals-wrap">
    <table class="totals-table">
      <tr>
        <td>Total HT</td>
        <td class="text-right">${formatMontant(facture.montant_ht)}</td>
      </tr>
      <tr>
        <td>TVA</td>
        <td class="text-right">${formatMontant(facture.montant_tva)}</td>
      </tr>
      <tr class="total-final">
        <td>Total TTC</td>
        <td class="text-right">${formatMontant(facture.montant_ttc)}</td>
      </tr>
      ${facture.acompte_recu > 0 ? `
      <tr>
        <td>Acompte reçu</td>
        <td class="text-right">− ${formatMontant(facture.acompte_recu)}</td>
      </tr>
      <tr class="total-final">
        <td>Reste à payer</td>
        <td class="text-right">${formatMontant(facture.reste_a_payer)}</td>
      </tr>
      ` : ''}
    </table>
  </div>

  ${facture.notes ? `
  <div class="notes">
    <div class="notes-title">Notes</div>
    ${facture.notes}
  </div>
  ` : ''}

  ${facture.mentions_legales ? `
  <div class="mentions">
    ${facture.mentions_legales.replace(/\n/g, '<br>')}
  </div>
  ` : ''}

  <div class="footer">
    ${facture.entreprise_nom} — SIRET : ${facture.entreprise_siret}<br>
    ${facture.entreprise_adresse} — ${facture.entreprise_tel} — ${facture.entreprise_email}
  </div>
</body>
</html>
  `;
}

/**
 * Génère un PDF à partir d'une facture
 */
export async function generateFacturePDF(facture) {
  // Convertir le logo en base64 pour l'embarquer dans le PDF
  let logoDataUrl = null;
  if (facture.logo_url) {
    try {
      const logoPath = path.join(__dirname, '../..', facture.logo_url);
      const logoBuffer = fs.readFileSync(logoPath);
      const ext = path.extname(facture.logo_url).slice(1).toLowerCase().replace('jpg', 'jpeg');
      logoDataUrl = `data:image/${ext};base64,${logoBuffer.toString('base64')}`;
    } catch (e) { /* logo file not found, skip */ }
  }

  const browser = await puppeteer.launch(getPuppeteerConfig());

  try {
    const page = await browser.newPage();
    const html = generateFactureHTML(facture, logoDataUrl);

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
