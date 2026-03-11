import prisma from '../config/database.js';
import logger from '../config/logger.js';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

/**
 * GET /api/catalogue - Lister les ouvrages du catalogue
 */
export const getOuvrages = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const {
      page = 1,
      limit = 50,
      search = '',
      categorie = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construire les filtres
    const where = {
      tenant_id: tenantId
    };

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { denomination: { contains: search } },
        { notes: { contains: search } }
      ];
    }

    if (categorie) {
      where.categorie = categorie;
    }

    // Compter le total
    const total = await prisma.ouvrage.count({ where });

    // Récupérer les ouvrages
    const ouvrages = await prisma.ouvrage.findMany({
      where,
      skip,
      take,
      orderBy: [
        { categorie: 'asc' },
        { code: 'asc' }
      ]
    });

    // Ajouter le badge selon l'état d'apprentissage
    const ouvragesWithBadge = ouvrages.map(ouvrage => ({
      ...ouvrage,
      badge: getBadge(ouvrage)
    }));

    // Récupérer les catégories avec compteurs
    const categories = await prisma.ouvrage.groupBy({
      by: ['categorie'],
      where: { tenant_id: tenantId },
      _count: {
        categorie: true
      }
    });

    const categoriesFormatted = categories.map(cat => ({
      nom: cat.categorie,
      count: cat._count.categorie
    }));

    res.json({
      data: ouvragesWithBadge,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / take)
      },
      categories: categoriesFormatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/catalogue/:id - Récupérer un ouvrage par ID
 */
export const getOuvrageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const ouvrage = await prisma.ouvrage.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: {
        historique_prix: {
          orderBy: { created_at: 'desc' },
          take: 30
        }
      }
    });

    if (!ouvrage) {
      return res.status(404).json({
        code: 'OUVRAGE_NOT_FOUND',
        message: 'Ouvrage introuvable'
      });
    }

    res.json({
      ...ouvrage,
      badge: getBadge(ouvrage)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/catalogue - Créer un ouvrage personnalisé
 */
export const createOuvrage = async (req, res, next) => {
  try {
    const { code, categorie, denomination, description, unite, prix_unitaire_ht, temps_estime_minutes } = req.body;
    const tenantId = req.tenantId;

    // Validation
    if (!code || !categorie || !denomination || !unite || prix_unitaire_ht === undefined) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Les champs code, categorie, denomination, unite et prix_unitaire_ht sont obligatoires'
      });
    }

    // Vérifier que le code n'existe pas déjà pour ce tenant
    const existingOuvrage = await prisma.ouvrage.findFirst({
      where: {
        tenant_id: tenantId,
        code: code
      }
    });

    if (existingOuvrage) {
      return res.status(409).json({
        code: 'CODE_EXISTS',
        message: 'Un ouvrage avec ce code existe déjà'
      });
    }

    // Créer l'ouvrage
    const ouvrage = await prisma.ouvrage.create({
      data: {
        tenant_id: tenantId,
        code,
        categorie,
        denomination,
        unite,
        prix_unitaire_ht,
        temps_estime_minutes: temps_estime_minutes || 60,
        temps_reel_moyen: 0,
        nb_chantiers_realises: 0
      }
    });

    logger.info('Ouvrage personnalisé créé', {
      service: 'autobat-api',
      ouvrage_id: ouvrage.id,
      tenant_id: tenantId,
      code: ouvrage.code
    });

    res.status(201).json({
      ...ouvrage,
      badge: getBadge(ouvrage)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/catalogue/:id - Mettre à jour un ouvrage personnalisé
 */
export const updateOuvrage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, categorie, denomination, description, unite, prix_unitaire_ht, temps_estime_minutes } = req.body;
    const tenantId = req.tenantId;

    const ouvrage = await prisma.ouvrage.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!ouvrage) {
      return res.status(404).json({
        code: 'OUVRAGE_NOT_FOUND',
        message: 'Ouvrage introuvable'
      });
    }

    const updatedOuvrage = await prisma.ouvrage.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(categorie && { categorie }),
        ...(denomination && { denomination }),
        ...(unite && { unite }),
        ...(prix_unitaire_ht !== undefined && { prix_unitaire_ht }),
        ...(temps_estime_minutes !== undefined && { temps_estime_minutes })
      }
    });

    logger.info('Ouvrage modifié', {
      service: 'autobat-api',
      ouvrage_id: id,
      tenant_id: tenantId
    });

    res.json({
      ...updatedOuvrage,
      badge: getBadge(updatedOuvrage)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/catalogue/:id - Supprimer un ouvrage personnalisé
 */
export const deleteOuvrage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const ouvrage = await prisma.ouvrage.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!ouvrage) {
      return res.status(404).json({
        code: 'OUVRAGE_NOT_FOUND',
        message: 'Ouvrage introuvable'
      });
    }

    // Seuls les ouvrages personnalisés peuvent être supprimés
    if (!ouvrage.personnalise) {
      return res.status(400).json({
        code: 'OUVRAGE_NOT_DELETABLE',
        message: 'Seuls les ouvrages personnalisés peuvent être supprimés'
      });
    }

    // Vérifier qu'il n'est pas utilisé dans des devis/chantiers
    const usageInDevis = await prisma.ligneDevis.count({
      where: { ouvrage_id: id }
    });

    const usageInChantiers = await prisma.tache.count({
      where: { ouvrage_id: id }
    });

    if (usageInDevis > 0 || usageInChantiers > 0) {
      return res.status(400).json({
        code: 'OUVRAGE_IN_USE',
        message: 'Cet ouvrage est utilisé dans des devis ou chantiers et ne peut être supprimé'
      });
    }

    await prisma.ouvrage.delete({
      where: { id }
    });

    logger.info('Ouvrage supprimé', {
      service: 'autobat-api',
      ouvrage_id: id,
      tenant_id: tenantId
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Fonction helper pour déterminer le badge d'un ouvrage
 */
function getBadge(ouvrage) {
  if (ouvrage.nb_chantiers_realises === 0) {
    return 'NON_TESTE';
  } else if (ouvrage.nb_chantiers_realises < 4) {
    return 'EN_APPRENTISSAGE';
  } else {
    return 'OPTIMISE';
  }
}

/**
 * Collecte les données réelles d'un ouvrage après un chantier terminé.
 * Met à jour temps_reel_moyen et nb_chantiers_realises UNIQUEMENT.
 * Le prix reste inchangé — c'est le gérant qui décide de l'ajuster manuellement.
 */
export const updatePrixAutoLearning = async (ouvrageId, tempsReelMinutes) => {
  try {
    const savedTenant = global.currentTenantId;
    global.currentTenantId = null;

    const ouvrage = await prisma.ouvrage.findUnique({
      where: { id: ouvrageId }
    });

    if (!ouvrage) {
      global.currentTenantId = savedTenant;
      return;
    }

    // Calculer le nouveau temps réel moyen (moyenne glissante)
    const nbChantiers = ouvrage.nb_chantiers_realises + 1;
    const tempsReelPrecedent = ouvrage.temps_reel_moyen || ouvrage.temps_estime_minutes || tempsReelMinutes;
    const nouveauTempsReel = ((tempsReelPrecedent * ouvrage.nb_chantiers_realises) + tempsReelMinutes) / nbChantiers;

    // Calculer l'écart pour information (visible dans le catalogue, pas appliqué auto)
    let ecartPourcent = null;
    if (ouvrage.temps_estime_minutes > 0) {
      const ecart = (nouveauTempsReel - ouvrage.temps_estime_minutes) / ouvrage.temps_estime_minutes;
      ecartPourcent = parseFloat((ecart * 100).toFixed(1));
    }

    // Mise à jour SANS toucher au prix (manuel)
    await prisma.ouvrage.update({
      where: { id: ouvrageId },
      data: {
        temps_reel_moyen: nouveauTempsReel,
        nb_chantiers_realises: nbChantiers,
        derniere_maj_auto: new Date()
      }
    });

    logger.info('Auto-learning: données réelles collectées', {
      service: 'autobat-api',
      ouvrage_id: ouvrageId,
      denomination: ouvrage.denomination,
      temps_estime: ouvrage.temps_estime_minutes,
      temps_reel_moyen: nouveauTempsReel.toFixed(1),
      ecart: ecartPourcent !== null ? ecartPourcent + '%' : 'N/A',
      nb_chantiers: nbChantiers,
      prix_inchange: ouvrage.prix_unitaire_ht
    });

    global.currentTenantId = savedTenant;
  } catch (error) {
    logger.error('Erreur auto-learning', {
      service: 'autobat-api',
      ouvrage_id: ouvrageId,
      error: error.message
    });
  }
};

/**
 * Déclenche l'auto-learning pour tous les ouvrages d'un chantier terminé
 * Calcule le temps réel par ouvrage à partir des badgeages tâche
 */
export const triggerAutoLearningForChantier = async (chantierId) => {
  try {
    const savedTenant = global.currentTenantId;
    global.currentTenantId = null;

    // Récupérer tous les badgeages du chantier liés à des tâches avec ouvrage
    const badgeages = await prisma.badgeage.findMany({
      where: { chantier_id: chantierId },
      include: {
        tache: {
          select: { id: true, ouvrage_id: true, quantite_prevue: true }
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Grouper les badgeages par (employe_id + tache_id) pour calculer les intervalles
    const parEmployeTache = {};
    for (const b of badgeages) {
      if (!b.tache_id || !b.tache?.ouvrage_id) continue;
      const key = `${b.employe_id}_${b.tache_id}`;
      if (!parEmployeTache[key]) {
        parEmployeTache[key] = {
          ouvrage_id: b.tache.ouvrage_id,
          quantite: b.tache.quantite_prevue || 1,
          badgeages: []
        };
      }
      parEmployeTache[key].badgeages.push(b);
    }

    // Accumuler le temps réel par ouvrage (en minutes par unité)
    const tempsParOuvrage = {}; // { ouvrage_id: { totalMinutes, quantite } }

    for (const { ouvrage_id, quantite, badgeages: bList } of Object.values(parEmployeTache)) {
      let minutesTotales = 0;
      let lastDebut = null;

      for (const b of bList) {
        if (b.type === 'TACHE_DEBUT' || b.type === 'TACHE_REPRISE') {
          lastDebut = new Date(b.timestamp);
        } else if ((b.type === 'TACHE_PAUSE' || b.type === 'TACHE_FIN') && lastDebut) {
          minutesTotales += (new Date(b.timestamp) - lastDebut) / 60000;
          lastDebut = null;
        }
      }

      if (minutesTotales > 0) {
        if (!tempsParOuvrage[ouvrage_id]) {
          tempsParOuvrage[ouvrage_id] = { totalMinutes: 0, quantite };
        }
        tempsParOuvrage[ouvrage_id].totalMinutes += minutesTotales;
      }
    }

    global.currentTenantId = savedTenant;

    // Appeler updatePrixAutoLearning pour chaque ouvrage avec un temps réel mesuré
    for (const [ouvrageId, { totalMinutes, quantite }] of Object.entries(tempsParOuvrage)) {
      const tempsParUnite = quantite > 0 ? totalMinutes / quantite : totalMinutes;
      await updatePrixAutoLearning(ouvrageId, tempsParUnite);
    }

    logger.info(`Auto-learning déclenché pour chantier ${chantierId}: ${Object.keys(tempsParOuvrage).length} ouvrages traités`);
  } catch (error) {
    logger.error('Erreur triggerAutoLearningForChantier', {
      service: 'autobat-api',
      chantier_id: chantierId,
      error: error.message
    });
  }
};

/**
 * GET /api/catalogue/export-template - Télécharger un template CSV
 */
export const exportTemplate = async (req, res, next) => {
  try {
    // Template avec quelques exemples
    const template = [
      {
        code: 'CHARP-001',
        categorie: 'Charpente',
        denomination: 'Fourniture et pose de charpente traditionnelle',
        unite: 'M²',
        prix_unitaire_ht: '97.75',
        temps_estime_minutes: '120',
        description: 'Exemple: charpente traditionnelle'
      },
      {
        code: 'MACONN-001',
        categorie: 'Maçonnerie',
        denomination: 'Fourniture et pose de parpaing',
        unite: 'M²',
        prix_unitaire_ht: '45.50',
        temps_estime_minutes: '90',
        description: 'Exemple: maçonnerie parpaing'
      },
      {
        code: '',
        categorie: '',
        denomination: '',
        unite: '',
        prix_unitaire_ht: '',
        temps_estime_minutes: '',
        description: ''
      }
    ];

    const csv = stringify(template, {
      header: true,
      columns: [
        { key: 'code', header: 'Code' },
        { key: 'categorie', header: 'Catégorie' },
        { key: 'denomination', header: 'Dénomination' },
        { key: 'unite', header: 'Unité' },
        { key: 'prix_unitaire_ht', header: 'Prix HT' },
        { key: 'temps_estime_minutes', header: 'Temps estimé (min)' },
        { key: 'description', header: 'Description' }
      ],
      delimiter: ';',
      bom: true // UTF-8 BOM pour Excel
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=catalogue-template.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/catalogue/import-csv - Importer des ouvrages depuis un CSV
 */
export const importCSV = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const csvContent = req.body.csv;

    if (!csvContent) {
      return res.status(400).json({
        code: 'MISSING_CSV',
        message: 'Le contenu CSV est requis'
      });
    }

    // Parser le CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ';',
      bom: true,
      trim: true
    });

    const results = {
      total: records.length,
      created: 0,
      skipped: 0,
      errors: []
    };

    // Créer les ouvrages
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const lineNumber = i + 2; // +2 car ligne 1 = header et index commence à 0

      try {
        // Validation des champs obligatoires
        if (!record['Code'] || !record['Catégorie'] || !record['Dénomination'] || !record['Unité']) {
          results.skipped++;
          results.errors.push({
            line: lineNumber,
            message: 'Champs obligatoires manquants (Code, Catégorie, Dénomination, Unité)'
          });
          continue;
        }

        // Convertir le prix
        const prixHT = parseFloat(record['Prix HT']?.replace(',', '.') || '0');
        if (isNaN(prixHT) || prixHT <= 0) {
          results.skipped++;
          results.errors.push({
            line: lineNumber,
            message: 'Prix HT invalide ou manquant'
          });
          continue;
        }

        // Convertir le temps estimé
        const tempsEstime = parseInt(record['Temps estimé (min)'] || '60');

        // Vérifier si le code existe déjà
        const existingOuvrage = await prisma.ouvrage.findFirst({
          where: {
            tenant_id: tenantId,
            code: record['Code']
          }
        });

        if (existingOuvrage) {
          results.skipped++;
          results.errors.push({
            line: lineNumber,
            message: `Un ouvrage avec le code "${record['Code']}" existe déjà`
          });
          continue;
        }

        // Créer l'ouvrage
        await prisma.ouvrage.create({
          data: {
            tenant_id: tenantId,
            code: record['Code'],
            categorie: record['Catégorie'],
            denomination: record['Dénomination'],
            unite: record['Unité'],
            prix_unitaire_ht: prixHT,
            temps_estime_minutes: tempsEstime,
            notes: record['Description'] || null,
            temps_reel_moyen: 0,
            nb_chantiers_realises: 0,
            personnalise: true
          }
        });

        results.created++;
      } catch (error) {
        results.skipped++;
        results.errors.push({
          line: lineNumber,
          message: error.message
        });
      }
    }

    logger.info('Import CSV catalogue terminé', {
      service: 'autobat-api',
      tenant_id: tenantId,
      total: results.total,
      created: results.created,
      skipped: results.skipped
    });

    res.json(results);
  } catch (error) {
    logger.error('Erreur lors de l\'import CSV', {
      service: 'autobat-api',
      error: error.message
    });
    next(error);
  }
};
