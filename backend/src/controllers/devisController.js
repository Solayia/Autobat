import prisma from '../config/database.js';
import logger from '../config/logger.js';
import puppeteer from 'puppeteer';
import { getPuppeteerConfig } from '../utils/puppeteerLaunch.js';
import { sendDevisEmail } from '../services/emailService.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * POST /api/devis - Créer un nouveau devis
 */
export const createDevis = async (req, res, next) => {
  try {
    const { client_id, objet, conditions_paiement, delai_realisation, date_validite, lignes } = req.body;
    const tenantId = req.tenantId;

    // Validation
    if (!client_id || !lignes || lignes.length === 0) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Le client et au moins un ouvrage sont obligatoires'
      });
    }

    // Vérifier que le client appartient au tenant
    const client = await prisma.client.findFirst({
      where: {
        id: client_id,
        tenant_id: tenantId
      }
    });

    if (!client) {
      return res.status(404).json({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client introuvable'
      });
    }

    // Calculer les totaux et récupérer les infos des ouvrages/matériaux
    let montant_ht = 0;
    const lignesData = [];

    for (let index = 0; index < lignes.length; index++) {
      const ligne = lignes[index];
      const type = ligne.type || 'OUVRAGE';
      let description, unite, ouvrage_id;

      if (type === 'SECTION') {
        // Pour une section: c'est juste un header de regroupement
        if (!ligne.description) {
          return res.status(400).json({
            code: 'VALIDATION_ERROR',
            message: 'description est obligatoire pour une ligne de type SECTION'
          });
        }

        description = ligne.description;
        unite = ''; // Les sections n'ont pas d'unité
        ouvrage_id = null;
        // Les sections ont quantite = 0 et prix = 0, donc ne contribuent pas au total
      } else if (type === 'OUVRAGE') {
        // Pour un ouvrage: récupérer les infos depuis le catalogue
        if (!ligne.ouvrage_id) {
          return res.status(400).json({
            code: 'VALIDATION_ERROR',
            message: 'ouvrage_id est obligatoire pour une ligne de type OUVRAGE'
          });
        }

        const ouvrage = await prisma.ouvrage.findUnique({
          where: { id: ligne.ouvrage_id }
        });

        if (!ouvrage) {
          return res.status(404).json({
            code: 'OUVRAGE_NOT_FOUND',
            message: `Ouvrage ${ligne.ouvrage_id} introuvable`
          });
        }

        description = ouvrage.denomination;
        unite = ouvrage.unite;
        ouvrage_id = ligne.ouvrage_id;
      } else {
        // Pour un matériau: utiliser les données fournies
        if (!ligne.description || !ligne.unite || ligne.prix_unitaire_ht === undefined) {
          return res.status(400).json({
            code: 'VALIDATION_ERROR',
            message: 'description, unite et prix_unitaire_ht sont obligatoires pour une ligne de type MATERIAU'
          });
        }

        description = ligne.description;
        unite = ligne.unite;
        ouvrage_id = ligne.ouvrage_id || null; // Optionnel pour les matériaux
      }

      const taux_tva = type === 'SECTION' ? 0 : (parseFloat(ligne.taux_tva) || 20);
      const montant_ligne_ht = ligne.quantite * ligne.prix_unitaire_ht;
      const montant_ligne_tva = montant_ligne_ht * (taux_tva / 100);
      const montant_ligne_ttc = montant_ligne_ht + montant_ligne_tva;
      montant_ht += montant_ligne_ht;

      lignesData.push({
        type,
        ouvrage_id,
        parent_ligne_id: ligne.parent_ligne_id || null,
        description,
        quantite: ligne.quantite,
        unite,
        prix_unitaire_ht: ligne.prix_unitaire_ht,
        montant_ht: montant_ligne_ht,
        tva_pourcent: taux_tva,
        montant_ttc: montant_ligne_ttc,
        ordre: index + 1
      });
    }

    const montant_tva = lignesData.reduce((sum, l) => sum + (l.montant_ttc - l.montant_ht), 0);
    const montant_ttc = montant_ht + montant_tva;

    // Générer le numéro de devis (DEV-YYYY-NNNN)
    const currentYear = new Date().getFullYear();
    const lastDevis = await prisma.devis.findFirst({
      where: {
        tenant_id: tenantId,
        numero_devis: {
          startsWith: `DEV-${currentYear}-`
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastDevis) {
      const lastNumber = parseInt(lastDevis.numero_devis.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    const numero_devis = `DEV-${currentYear}-${String(nextNumber).padStart(4, '0')}`;

    // Créer le devis sans les lignes d'abord
    const devis = await prisma.devis.create({
      data: {
        tenant_id: tenantId,
        client_id,
        numero_devis,
        objet,
        conditions_paiement: conditions_paiement || '30% à la commande, 70% à la livraison',
        delai_realisation: delai_realisation || '2 semaines',
        date_validite: date_validite ? new Date(date_validite) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
        montant_ht,
        montant_tva,
        montant_ttc,
        statut: 'BROUILLON'
      }
    });

    // Créer les lignes séquentiellement pour gérer la hiérarchie
    // Map pour convertir les IDs temporaires (frontend) en IDs réels (DB)
    const tempIdToRealId = {};

    // Trier les lignes pour créer les parents (sections) avant les enfants
    // Créer un tableau d'indices triés selon les dépendances
    const sortedIndices = [];
    const processed = new Set();

    // Fonction récursive pour ajouter une ligne et ses dépendances
    const addLineWithDependencies = (index) => {
      if (processed.has(index)) return;

      const ligne = lignes[index];

      // Si cette ligne a un parent, s'assurer que le parent est traité en premier
      if (ligne.parent_ligne_id) {
        const parentIndex = lignes.findIndex(l => l.id === ligne.parent_ligne_id);
        if (parentIndex !== -1 && !processed.has(parentIndex)) {
          addLineWithDependencies(parentIndex);
        }
      }

      sortedIndices.push(index);
      processed.add(index);
    };

    // Traiter toutes les lignes
    for (let i = 0; i < lignes.length; i++) {
      addLineWithDependencies(i);
    }

    // Créer les lignes dans l'ordre trié
    for (const i of sortedIndices) {
      const ligneData = lignesData[i];

      // Si cette ligne a un parent_ligne_id qui est un ID temporaire, le remplacer par l'ID réel
      let realParentId = ligneData.parent_ligne_id;
      if (realParentId && tempIdToRealId[realParentId]) {
        realParentId = tempIdToRealId[realParentId];
      }

      const createdLigne = await prisma.ligneDevis.create({
        data: {
          ...ligneData,
          parent_ligne_id: realParentId,
          devis_id: devis.id
        }
      });

      // Si cette ligne avait un ID temporaire (c'est une section), stocker le mapping
      if (lignes[i].id) {
        tempIdToRealId[lignes[i].id] = createdLigne.id;
      }
    }

    // Récupérer le devis complet avec toutes les relations
    const devisComplet = await prisma.devis.findUnique({
      where: { id: devis.id },
      include: {
        client: true,
        lignes: {
          include: {
            ouvrage: true,
            materiaux: {
              include: {
                ouvrage: true
              }
            }
          },
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    logger.info('Nouveau devis créé', {
      service: 'autobat-api',
      devis_id: devisComplet.id,
      tenant_id: tenantId,
      numero_devis: devisComplet.numero_devis
    });

    res.status(201).json(devisComplet);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/devis - Lister les devis avec pagination et filtres
 */
export const getDevis = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const {
      page = 1,
      limit = 20,
      search = '',
      statut = '',
      client_id = '',
      sans_chantier = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construire les filtres
    const where = {
      tenant_id: tenantId
    };

    if (search) {
      where.OR = [
        { numero_devis: { contains: search } },
        { objet: { contains: search } },
        { client: { nom: { contains: search } } }
      ];
    }

    if (statut) {
      where.statut = statut;
    }

    if (client_id) {
      where.client_id = client_id;
    }

    // Filtrer les devis sans chantier si demandé
    if (sans_chantier === 'true') {
      where.chantiers = { none: {} };
    }

    // Compter le total
    const total = await prisma.devis.count({ where });

    // Récupérer les devis
    const devis = await prisma.devis.findMany({
      where,
      skip,
      take,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        client: true,
        lignes: {
          include: {
            ouvrage: true,
            materiaux: {
              include: {
                ouvrage: true
              }
            }
          },
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    res.json({
      data: devis,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/devis/:id - Récupérer un devis par ID
 */
export const getDevisById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const devis = await prisma.devis.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: {
        client: true,
        lignes: {
          include: {
            ouvrage: true,
            materiaux: {
              include: {
                ouvrage: true
              }
            }
          },
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    if (!devis) {
      return res.status(404).json({
        code: 'DEVIS_NOT_FOUND',
        message: 'Devis introuvable'
      });
    }

    res.json(devis);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/devis/:id - Mettre à jour un devis (seulement si BROUILLON)
 */
export const updateDevis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { client_id, objet, conditions_paiement, delai_realisation, date_validite, lignes } = req.body;
    const tenantId = req.tenantId;

    // Vérifier que le devis existe et appartient au tenant
    const existingDevis = await prisma.devis.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!existingDevis) {
      return res.status(404).json({
        code: 'DEVIS_NOT_FOUND',
        message: 'Devis introuvable'
      });
    }

    // Vérifier que le devis est en BROUILLON
    if (existingDevis.statut !== 'BROUILLON') {
      return res.status(400).json({
        code: 'DEVIS_NOT_EDITABLE',
        message: 'Seuls les devis en brouillon peuvent être modifiés'
      });
    }

    // Calculer les nouveaux totaux si des lignes sont fournies
    let montant_ht = existingDevis.montant_ht;
    let montant_tva = existingDevis.montant_tva;
    let montant_ttc = existingDevis.montant_ttc;

    if (lignes) {
      montant_ht = 0;
      const lignesData = [];

      for (let index = 0; index < lignes.length; index++) {
        const ligne = lignes[index];
        const type = ligne.type || 'OUVRAGE';
        const ouvrage_id = ligne.ouvrage_id || null;
        const description = ligne.description || ligne.ouvrage?.description || '';
        const unite = ligne.unite || ligne.ouvrage?.unite || 'u';

        const taux_tva = type === 'SECTION' ? 0 : (parseFloat(ligne.taux_tva) || 20);
        const montant_ligne_ht = ligne.quantite * ligne.prix_unitaire_ht;
        const montant_ligne_tva = montant_ligne_ht * (taux_tva / 100);
        const montant_ligne_ttc = montant_ligne_ht + montant_ligne_tva;

        // Ajouter au total HT seulement si ce n'est pas une section
        if (type !== 'SECTION') {
          montant_ht += montant_ligne_ht;
        }

        lignesData.push({
          type,
          ouvrage_id,
          parent_ligne_id: ligne.parent_ligne_id || null,
          description,
          quantite: ligne.quantite,
          unite,
          prix_unitaire_ht: ligne.prix_unitaire_ht,
          montant_ht: montant_ligne_ht,
          tva_pourcent: taux_tva,
          montant_ttc: montant_ligne_ttc,
          ordre: index + 1
        });
      }

      montant_tva = lignesData.reduce((sum, l) => sum + (l.montant_ttc - l.montant_ht), 0);
      montant_ttc = montant_ht + montant_tva;

      // Supprimer les anciennes lignes et créer les nouvelles
      await prisma.ligneDevis.deleteMany({
        where: { devis_id: id }
      });

      // Créer les nouvelles lignes séquentiellement pour gérer la hiérarchie
      const tempIdToRealId = {};
      const sortedIndices = [];
      const processed = new Set();

      const addLineWithDependencies = (index) => {
        if (processed.has(index)) return;
        const ligne = lignes[index];

        if (ligne.parent_ligne_id) {
          const parentIndex = lignes.findIndex(l => l.id === ligne.parent_ligne_id);
          if (parentIndex !== -1 && !processed.has(parentIndex)) {
            addLineWithDependencies(parentIndex);
          }
        }

        sortedIndices.push(index);
        processed.add(index);
      };

      for (let i = 0; i < lignes.length; i++) {
        addLineWithDependencies(i);
      }

      for (const i of sortedIndices) {
        const ligneData = lignesData[i];

        let realParentId = ligneData.parent_ligne_id;
        if (realParentId && tempIdToRealId[realParentId]) {
          realParentId = tempIdToRealId[realParentId];
        }

        const createdLigne = await prisma.ligneDevis.create({
          data: {
            ...ligneData,
            parent_ligne_id: realParentId,
            devis_id: id
          }
        });

        if (lignes[i].id) {
          tempIdToRealId[lignes[i].id] = createdLigne.id;
        }
      }
    }

    // Mettre à jour le devis
    const updatedDevis = await prisma.devis.update({
      where: { id },
      data: {
        ...(client_id && { client_id }),
        ...(objet !== undefined && { objet }),
        ...(conditions_paiement && { conditions_paiement }),
        ...(delai_realisation && { delai_realisation }),
        ...(date_validite && { date_validite: new Date(date_validite) }),
        montant_ht,
        montant_tva,
        montant_ttc
      },
      include: {
        client: true,
        lignes: {
          include: {
            ouvrage: true,
            materiaux: {
              include: {
                ouvrage: true
              }
            }
          },
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    logger.info('Devis modifié', {
      service: 'autobat-api',
      devis_id: id,
      tenant_id: tenantId
    });

    res.json(updatedDevis);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/devis/:id/send - Envoyer un devis par email
 */
export const sendDevis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const devis = await prisma.devis.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!devis) {
      return res.status(404).json({
        code: 'DEVIS_NOT_FOUND',
        message: 'Devis introuvable'
      });
    }

    // Mettre à jour le statut
    const updatedDevis = await prisma.devis.update({
      where: { id },
      data: {
        statut: 'ENVOYE',
        date_envoi: new Date()
      },
      include: {
        client: true,
        lignes: {
          include: {
            ouvrage: true,
            materiaux: {
              include: {
                ouvrage: true
              }
            }
          },
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    // Envoyer l'email au client
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nom: true, telephone: true, email: true, rib: true }
    });
    sendDevisEmail({
      tenantId,
      devis: updatedDevis,
      tenant,
      pdfUrl: updatedDevis.pdf_url
    }).catch(() => {}); // Silencieux si SMTP absent

    logger.info('Devis envoyé', {
      service: 'autobat-api',
      devis_id: id,
      tenant_id: tenantId
    });

    res.json(updatedDevis);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/devis/:id/accept - Marquer un devis comme accepté
 */
export const acceptDevis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { acompte_verse = 0 } = req.body;

    const devis = await prisma.devis.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!devis) {
      return res.status(404).json({
        code: 'DEVIS_NOT_FOUND',
        message: 'Devis introuvable'
      });
    }

    const updatedDevis = await prisma.devis.update({
      where: { id },
      data: {
        statut: 'ACCEPTE',
        date_acceptation: new Date(),
        acompte_verse: parseFloat(acompte_verse) || 0
      },
      include: {
        client: true,
        lignes: {
          include: {
            ouvrage: true,
            materiaux: {
              include: {
                ouvrage: true
              }
            }
          },
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    logger.info('Devis accepté', {
      service: 'autobat-api',
      devis_id: id,
      tenant_id: tenantId
    });

    res.json(updatedDevis);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/devis/:id/refuse - Marquer un devis comme refusé
 */
export const refuseDevis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;
    const tenantId = req.tenantId;

    const devis = await prisma.devis.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!devis) {
      return res.status(404).json({
        code: 'DEVIS_NOT_FOUND',
        message: 'Devis introuvable'
      });
    }

    const updatedDevis = await prisma.devis.update({
      where: { id },
      data: {
        statut: 'REFUSE',
        date_refus: new Date(),
        raison_refus: raison
      },
      include: {
        client: true,
        lignes: {
          include: {
            ouvrage: true,
            materiaux: {
              include: {
                ouvrage: true
              }
            }
          },
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    logger.info('Devis refusé', {
      service: 'autobat-api',
      devis_id: id,
      tenant_id: tenantId,
      raison
    });

    res.json(updatedDevis);
  } catch (error) {
    next(error);
  }
};

/**
 * Génère le HTML pour le PDF du devis
 */
function generateDevisPDFHTML(devis, tenant) {
  const brandColor = tenant.couleur_primaire || '#FF9F43';

  // Utiliser l'ordre défini par l'utilisateur (champ ordre)
  // devis.lignes est déjà trié par ordre ASC
  const organizedLines = devis.lignes.map(ligne => ({
    ligne,
    isSection: ligne.type === 'SECTION',
    isOuvrage: ligne.type === 'OUVRAGE' || !ligne.type,
    isMateriau: ligne.type === 'MATERIAU'
  }));

  // Générer les lignes HTML avec numérotation
  let sectionNumber = 0;
  let currentSectionNumber = 0;
  let itemInSectionNumber = 0;

  const lignesHTML = organizedLines.map(({ ligne, isSection, isOuvrage, isMateriau }) => {
    let numero = '';
    if (isSection) {
      sectionNumber++;
      currentSectionNumber = sectionNumber;
      itemInSectionNumber = 0;
      numero = sectionNumber.toString();

      return `
        <tr style="border-top: 2px solid #F59E0B; border-bottom: 2px solid #F59E0B; background: white;">
          <td colspan="7" style="padding: 8px 12px; font-weight: 700; font-size: 11px; color: #F59E0B; letter-spacing: 0.8px; text-transform: uppercase;">
            <span style="display: inline-block; margin-right: 10px; font-size: 13px; font-weight: 700;">${numero}.</span>${ligne.description}
          </td>
        </tr>
      `;
    } else {
      itemInSectionNumber++;
      numero = currentSectionNumber > 0
        ? `${currentSectionNumber}.${itemInSectionNumber}`
        : itemInSectionNumber.toString();

      const indent = isMateriau ? 'padding-left: 30px;' : '';

      return `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 7px 8px; color: #666; font-size: 10px; text-align: center;">${numero}</td>
          <td style="padding: 7px 12px; ${indent} color: #333; font-size: 10px;">
            ${isMateriau ? '<span style="color: #999; font-style: italic; margin-right: 6px;">›</span>' : ''}
            ${ligne.description}
          </td>
          <td style="padding: 7px 8px; text-align: center; color: #666; font-size: 9px;">${ligne.unite}</td>
          <td style="padding: 7px 8px; text-align: center; color: #333; font-size: 10px; font-weight: 600;">${ligne.quantite}</td>
          <td style="padding: 7px 10px; text-align: right; color: #333; font-size: 10px;">${ligne.prix_unitaire_ht.toFixed(2)} €</td>
          <td style="padding: 7px 8px; text-align: center; color: #666; font-size: 9px;">20%</td>
          <td style="padding: 7px 12px; text-align: right; color: #1a1a1a; font-size: 10px; font-weight: 700;">${ligne.montant_ht.toFixed(2)} €</td>
        </tr>
      `;
    }
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #333; line-height: 1.5; }
        .container { padding: 25px; background: white; }
        .header { display: flex; justify-content: space-between; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #F59E0B; }
        .logo { font-size: 22px; font-weight: 700; color: #F59E0B; }
        .devis-info { text-align: right; color: #666; }
        .devis-number { font-size: 16px; font-weight: 700; color: #F59E0B; margin-bottom: 6px; }
        .section { margin-bottom: 20px; margin-top: 15px; }
        .section-title {
          background: white;
          color: #F59E0B;
          padding: 10px 0;
          font-weight: 700;
          margin-bottom: 0;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-bottom: 2px solid #F59E0B;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          background: white;
          border: 1px solid #ddd;
        }
        th {
          background: #f5f5f5;
          padding: 8px;
          text-align: left;
          font-size: 8px;
          color: #666;
          text-transform: uppercase;
          border-bottom: 1px solid #ddd;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .totals { margin-top: 15px; padding: 10px 0; border-top: 2px solid #F59E0B; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; color: #333; }
        .total-final {
          font-size: 14px;
          font-weight: 700;
          color: #F59E0B;
          padding-top: 8px;
          margin-top: 5px;
          border-top: 2px solid #F59E0B;
        }
        .info-box {
          background: #fafafa;
          padding: 8px 10px;
          margin-bottom: 8px;
          border: 1px solid #e0e0e0;
        }
        .info-row { display: flex; margin-bottom: 3px; font-size: 9px; }
        .info-label { font-weight: 700; min-width: 100px; color: #666; font-size: 9px; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- En-tête -->
        <div class="header">
          <div>
            ${tenant.logo_url ? `
            <div style="margin-bottom: 10px;">
              <img src="file://${path.join(__dirname, '../..', tenant.logo_url)}" alt="${tenant.nom}" style="max-width: 150px; max-height: 60px; object-fit: contain;" />
            </div>
            ` : `
            <div class="logo">${tenant.nom}</div>
            `}
            <div style="margin-top: 10px;">
              ${tenant.adresse || ''}<br>
              ${tenant.code_postal || ''} ${tenant.ville || ''}<br>
              ${tenant.telephone || ''}<br>
              ${tenant.email || ''}<br>
              SIRET: ${tenant.siret || ''}
            </div>
          </div>
          <div class="devis-info">
            <div class="devis-number">DEVIS ${devis.numero_devis}</div>
            <div style="margin-top: 10px;">
              Date: ${new Date(devis.created_at).toLocaleDateString('fr-FR')}<br>
              Validité: ${new Date(devis.date_validite).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>

        <!-- Client -->
        <div class="info-box">
          <div style="font-weight: bold; margin-bottom: 5px; font-size: 9px; color: #F59E0B;">CLIENT</div>
          <div class="info-row">
            <div class="info-label">Nom :</div>
            <div>${devis.client.nom}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Adresse :</div>
            <div>${devis.client.adresse || ''}, ${devis.client.code_postal || ''} ${devis.client.ville || ''}</div>
          </div>
          ${devis.client.telephone ? `
          <div class="info-row">
            <div class="info-label">Téléphone :</div>
            <div>${devis.client.telephone}</div>
          </div>` : ''}
          ${devis.client.email ? `
          <div class="info-row">
            <div class="info-label">Email :</div>
            <div>${devis.client.email}</div>
          </div>` : ''}
        </div>

        <!-- Détails du devis -->
        ${devis.objet ? `
        <div class="info-box">
          <div style="font-weight: bold; margin-bottom: 5px; font-size: 9px; color: #F59E0B;">OBJET</div>
          <div style="font-size: 9px;">${devis.objet}</div>
        </div>` : ''}

        <!-- Ouvrages -->
        <div class="section">
          <div class="section-title">DESCRIPTIF DES TRAVAUX</div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">N°</th>
                <th>Dénomination</th>
                <th style="width: 60px; text-align: center;">U.</th>
                <th style="width: 60px; text-align: center;">Q.</th>
                <th style="width: 100px; text-align: right;">PU</th>
                <th style="width: 60px; text-align: center;">TVA</th>
                <th style="width: 120px; text-align: right;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${lignesHTML}
            </tbody>
          </table>
        </div>

        <!-- Totaux -->
        <div class="totals" style="max-width: 400px; margin-left: auto;">
          <div class="total-row">
            <div>Total HT :</div>
            <div style="font-weight: bold;">${devis.montant_ht.toFixed(2)} €</div>
          </div>
          <div class="total-row">
            <div>TVA (20%) :</div>
            <div style="font-weight: bold;">${devis.montant_tva.toFixed(2)} €</div>
          </div>
          <div class="total-row total-final">
            <div>Total TTC :</div>
            <div>${devis.montant_ttc.toFixed(2)} €</div>
          </div>
        </div>

        <!-- Conditions -->
        <div style="margin-top: 20px; page-break-inside: avoid;">
          <div style="font-weight: bold; margin-bottom: 5px; font-size: 9px; color: #F59E0B;">CONDITIONS</div>
          <div style="font-size: 9px; line-height: 1.5;">
            <div><strong>Conditions de paiement :</strong> ${devis.conditions_paiement || 'N/A'}</div>
            <div><strong>Délai de réalisation :</strong> ${devis.delai_realisation || 'N/A'}</div>
            <div style="margin-top: 6px;"><em>Devis valable jusqu'au ${new Date(devis.date_validite).toLocaleDateString('fr-FR')}</em></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * GET /api/devis/:id/pdf - Télécharger le PDF d'un devis
 */
export const downloadPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const devis = await prisma.devis.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: {
        client: true,
        lignes: {
          include: {
            ouvrage: true,
            materiaux: {
              include: {
                ouvrage: true
              }
            }
          },
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    if (!devis) {
      return res.status(404).json({
        code: 'DEVIS_NOT_FOUND',
        message: 'Devis introuvable'
      });
    }

    // Récupérer les informations du tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    // Générer le HTML du PDF
    const html = generateDevisPDFHTML(devis, tenant);

    // Générer le PDF avec Puppeteer
    const browser = await puppeteer.launch(getPuppeteerConfig());

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      // Retourner le PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=devis-${devis.numero_devis}.pdf`);
      res.send(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/devis/:id/duplicate - Dupliquer un devis
 */
export const duplicateDevis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const originalDevis = await prisma.devis.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: {
        lignes: true
      }
    });

    if (!originalDevis) {
      return res.status(404).json({
        code: 'DEVIS_NOT_FOUND',
        message: 'Devis introuvable'
      });
    }

    // Générer un nouveau numéro
    const currentYear = new Date().getFullYear();
    const lastDevis = await prisma.devis.findFirst({
      where: {
        tenant_id: tenantId,
        numero_devis: {
          startsWith: `DEV-${currentYear}-`
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastDevis) {
      const lastNumber = parseInt(lastDevis.numero_devis.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    const numero_devis = `DEV-${currentYear}-${String(nextNumber).padStart(4, '0')}`;

    // Créer le nouveau devis
    const newDevis = await prisma.devis.create({
      data: {
        tenant_id: tenantId,
        client_id: originalDevis.client_id,
        numero_devis,
        objet: originalDevis.objet,
        conditions_paiement: originalDevis.conditions_paiement,
        delai_realisation: originalDevis.delai_realisation,
        date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        montant_ht: originalDevis.montant_ht,
        montant_tva: originalDevis.montant_tva,
        montant_ttc: originalDevis.montant_ttc,
        statut: 'BROUILLON',
        lignes: {
          create: originalDevis.lignes.map(ligne => ({
            type: ligne.type,
            ouvrage_id: ligne.ouvrage_id,
            parent_ligne_id: null, // Les hiérarchies parent/enfant ne peuvent pas être copiées directement ici
            description: ligne.description,
            quantite: ligne.quantite,
            unite: ligne.unite,
            prix_unitaire_ht: ligne.prix_unitaire_ht,
            montant_ht: ligne.montant_ht,
            tva_pourcent: ligne.tva_pourcent,
            montant_ttc: ligne.montant_ttc,
            ordre: ligne.ordre
          }))
        }
      },
      include: {
        client: true,
        lignes: {
          include: {
            ouvrage: true,
            materiaux: {
              include: {
                ouvrage: true
              }
            }
          },
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    logger.info('Devis dupliqué', {
      service: 'autobat-api',
      original_id: id,
      new_id: newDevis.id,
      tenant_id: tenantId
    });

    res.status(201).json(newDevis);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/devis/:id - Supprimer un devis (seulement si BROUILLON)
 */
export const deleteDevis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const devis = await prisma.devis.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!devis) {
      return res.status(404).json({
        code: 'DEVIS_NOT_FOUND',
        message: 'Devis introuvable'
      });
    }

    // Vérifier que le devis est en BROUILLON
    if (devis.statut !== 'BROUILLON') {
      return res.status(400).json({
        code: 'DEVIS_NOT_DELETABLE',
        message: 'Seuls les devis en brouillon peuvent être supprimés'
      });
    }

    // Supprimer les lignes puis le devis
    await prisma.ligneDevis.deleteMany({
      where: { devis_id: id }
    });

    await prisma.devis.delete({
      where: { id }
    });

    logger.info('Devis supprimé', {
      service: 'autobat-api',
      devis_id: id,
      tenant_id: tenantId
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
