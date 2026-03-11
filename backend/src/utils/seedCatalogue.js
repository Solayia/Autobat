import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYLA_PATH = resolve(__dirname, '../../prisma/data/syla.json');

/**
 * Seed le catalogue Syla pour un tenant nouvellement créé.
 * Appelé après l'inscription d'une nouvelle entreprise.
 */
export async function seedCatalogueForTenant(tenantId) {
  try {
    const raw = readFileSync(SYLA_PATH, 'utf-8');
    const items = JSON.parse(raw);

    // Supprimer tout ouvrage existant pour ce tenant (idempotent)
    await prisma.ouvrage.deleteMany({ where: { tenant_id: tenantId } });

    let created = 0;
    for (const item of items) {
      if (!item.denomination) continue;

      await prisma.ouvrage.create({
        data: {
          tenant_id: tenantId,
          categorie: item.categorie || 'Divers',
          code: item.code || '',
          denomination: item.denomination,
          unite: item.unite || 'F',
          prix_unitaire_ht: parseFloat(item.debourse_ht) || 0,
          temps_estime_minutes: null,
          temps_reel_moyen: null,
          nb_chantiers_realises: 0,
          notes: item.note || null,
        }
      });
      created++;
    }

    logger.info(`Catalogue Syla seedé: ${created} ouvrages pour tenant ${tenantId}`);
    return created;
  } catch (error) {
    // Non bloquant : log l'erreur mais ne fait pas échouer l'inscription
    logger.error(`Erreur seeding catalogue pour tenant ${tenantId}:`, error);
    return 0;
  }
}
