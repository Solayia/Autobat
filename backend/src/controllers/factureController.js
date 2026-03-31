import prisma from '../config/database.js';
import logger from '../config/logger.js';
import { generateFacturePDF } from '../utils/pdfGenerator.js';
import { sendFactureEmail, sendRappelImpayeEmail } from '../services/emailService.js';

/**
 * @desc    Lister toutes les factures du tenant
 * @route   GET /api/factures
 * @access  MANAGER, COMPANY_ADMIN
 */
export const getFactures = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { page = 1, limit = 20, search = '', statut_facture = '', statut_paiement = '' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      tenant_id: tenantId,
      ...(search && {
        OR: [
          { numero_facture: { contains: search } },
          { client_nom: { contains: search } }
        ]
      }),
      ...(statut_facture && { statut_facture }),
      ...(statut_paiement && { statut_paiement })
    };

    const [factures, total] = await Promise.all([
      prisma.facture.findMany({
        where,
        include: {
          chantier: {
            select: {
              id: true,
              nom: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.facture.count({ where })
    ]);

    res.json({
      data: factures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Erreur récupération factures:', error);
    next(error);
  }
};

/**
 * @desc    Récupérer une facture par son ID
 * @route   GET /api/factures/:id
 * @access  MANAGER, COMPANY_ADMIN
 */
export const getFactureById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const facture = await prisma.facture.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: {
        chantier: {
          select: {
            id: true,
            nom: true,
            adresse: true
          }
        },
        lignes: {
          orderBy: { ordre: 'asc' }
        },
        paiements: {
          orderBy: { date_paiement: 'desc' }
        }
      }
    });

    if (!facture) {
      return res.status(404).json({
        code: 'FACTURE_NOT_FOUND',
        message: 'Facture introuvable'
      });
    }

    res.json(facture);
  } catch (error) {
    logger.error('Erreur récupération facture:', error);
    next(error);
  }
};

/**
 * @desc    Créer une facture depuis un chantier TERMINÉ
 * @route   POST /api/factures
 * @access  MANAGER, COMPANY_ADMIN
 */
export const createFacture = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const {
      chantier_id,
      client_id: client_id_direct,
      devis_id,
      lignes,
      acompte_demande = 0,
      date_echeance,
      objet,
      notes,
      mentions_legales
    } = req.body;

    // Chantier OU client direct requis
    if (!chantier_id && !client_id_direct) {
      return res.status(400).json({
        code: 'CLIENT_REQUIRED',
        message: 'Sélectionnez un chantier ou un client'
      });
    }

    let chantier = null;
    let client = null;

    if (chantier_id) {
      chantier = await prisma.chantier.findFirst({
        where: { id: chantier_id, tenant_id: tenantId },
        include: { client: true, devis: true }
      });
      if (!chantier) {
        return res.status(404).json({
          code: 'CHANTIER_NOT_FOUND',
          message: 'Chantier introuvable'
        });
      }
      client = chantier.client;
    } else {
      client = await prisma.client.findFirst({
        where: { id: client_id_direct, tenant_id: tenantId }
      });
      if (!client) {
        return res.status(404).json({
          code: 'CLIENT_NOT_FOUND',
          message: 'Client introuvable'
        });
      }
    }

    // Récupérer les infos de l'entreprise (snapshots)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    // Générer le numéro de facture (FAC-YYYY-NNNN)
    const year = new Date().getFullYear();
    const lastFacture = await prisma.facture.findFirst({
      where: {
        tenant_id: tenantId,
        numero_facture: { startsWith: `FAC-${year}-` }
      },
      orderBy: { numero_facture: 'desc' }
    });

    let nextNumber = 1;
    if (lastFacture) {
      const lastNumber = parseInt(lastFacture.numero_facture.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    const numero_facture = `FAC-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Calculer les montants (TVA par ligne)
    const montant_ht = lignes.reduce((sum, ligne) => sum + (ligne.quantite * ligne.prix_unitaire_ht), 0);
    const montant_tva = lignes.reduce((sum, ligne) => {
      const tva = ligne.tva_pourcent != null ? parseFloat(ligne.tva_pourcent) : 20;
      return sum + (ligne.quantite * ligne.prix_unitaire_ht * tva / 100);
    }, 0);
    const montant_ttc = montant_ht + montant_tva;

    // Récupérer l'acompte versé depuis le devis associé (s'il existe)
    let acompte_verse_devis = 0;
    if (devis_id) {
      const devisAssocie = await prisma.devis.findFirst({ where: { id: devis_id } });
      if (devisAssocie?.acompte_verse > 0) {
        acompte_verse_devis = devisAssocie.acompte_verse;
      }
    }

    // Initialiser les montants de paiement
    const acompte_recu = Math.round(acompte_verse_devis * 100) / 100;
    const reste_a_payer = Math.round((montant_ttc - acompte_recu) * 100) / 100;
    const statut_paiement = acompte_recu >= montant_ttc ? 'PAYE' : acompte_recu > 0 ? 'PARTIEL' : 'EN_ATTENTE';

    // Créer la facture avec snapshots
    const facture = await prisma.facture.create({
      data: {
        tenant_id: tenantId,
        numero_facture,
        chantier_id: chantier_id || null,
        devis_id: devis_id || null,
        client_id: client.id,
        // Snapshots entreprise
        entreprise_nom: tenant.nom || '',
        entreprise_siret: tenant.siret || '',
        entreprise_adresse: tenant.adresse ? `${tenant.adresse}, ${tenant.code_postal || ''} ${tenant.ville || ''}`.trim() : '',
        entreprise_tel: tenant.telephone || '',
        entreprise_email: tenant.email || '',
        // Snapshots client
        client_nom: client.nom,
        client_adresse: client.adresse || '',
        client_siret: client.siret || null,
        client_tel: client.telephone || '',
        client_email: client.email || '',
        // Montants
        montant_ht,
        montant_tva,
        montant_ttc,
        acompte_demande,
        acompte_recu,
        reste_a_payer,
        // Dates
        date_emission: new Date(),
        date_echeance: date_echeance ? new Date(date_echeance) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        objet: objet || null,
        notes,
        mentions_legales: mentions_legales ?? null,
        statut_facture: 'BROUILLON',
        statut_paiement,
        ...(statut_paiement === 'PAYE' && { date_paiement_complet: new Date() }),
        // Lignes
        lignes: {
          create: lignes.map((ligne, index) => {
            const tva = ligne.tva_pourcent != null ? parseFloat(ligne.tva_pourcent) : 20;
            const ligne_montant_ht = ligne.quantite * ligne.prix_unitaire_ht;
            const ligne_montant_ttc = ligne_montant_ht * (1 + tva / 100);
            return {
              description: ligne.description,
              quantite: ligne.quantite,
              unite: ligne.unite || 'unité',
              prix_unitaire_ht: ligne.prix_unitaire_ht,
              montant_ht: ligne_montant_ht,
              tva_pourcent: tva,
              montant_ttc: ligne_montant_ttc,
              ordre: index + 1
            };
          })
        }
      },
      include: {
        lignes: true,
        chantier: {
          select: { nom: true }
        }
      }
    });

    // Si un acompte a déjà été versé, créer l'entrée de paiement correspondante
    if (acompte_verse_devis > 0) {
      await prisma.paiementFacture.create({
        data: {
          tenant_id: tenantId,
          facture_id: facture.id,
          montant: acompte_verse_devis,
          moyen_paiement: 'VIREMENT',
          type: 'ACOMPTE',
          date_paiement: new Date(),
          reference: 'Acompte versé à la commande'
        }
      });
    }

    logger.info(`Facture créée: ${numero_facture}`);
    res.status(201).json(facture);
  } catch (error) {
    logger.error('Erreur création facture:', error);
    next(error);
  }
};

/**
 * @desc    Modifier une facture (BROUILLON uniquement)
 * @route   PATCH /api/factures/:id
 * @access  MANAGER, COMPANY_ADMIN
 */
export const updateFacture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { lignes, date_echeance, objet, notes, acompte_demande } = req.body;

    // Vérifier que la facture existe et est en BROUILLON
    const facture = await prisma.facture.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!facture) {
      return res.status(404).json({
        code: 'FACTURE_NOT_FOUND',
        message: 'Facture introuvable'
      });
    }

    if (facture.statut_facture !== 'BROUILLON') {
      return res.status(400).json({
        code: 'FACTURE_NOT_EDITABLE',
        message: 'Seules les factures en brouillon peuvent être modifiées'
      });
    }

    let updateData = {
      ...(date_echeance && { date_echeance: new Date(date_echeance) }),
      ...(objet !== undefined && { objet: objet || null }),
      ...(notes !== undefined && { notes }),
      updated_at: new Date()
    };

    // Si modification des lignes
    if (lignes) {
      // Supprimer les anciennes lignes
      await prisma.ligneFacture.deleteMany({
        where: { facture_id: id }
      });

      // Recalculer les montants (TVA par ligne, arrondi centimes)
      const montant_ht = Math.round(lignes.reduce((sum, ligne) => sum + (ligne.quantite * ligne.prix_unitaire_ht), 0) * 100) / 100;
      const montant_tva = Math.round(lignes.reduce((sum, ligne) => {
        const tva = parseFloat(ligne.tva_pourcent) || 20;
        return sum + (ligne.quantite * ligne.prix_unitaire_ht * tva / 100);
      }, 0) * 100) / 100;
      const montant_ttc = Math.round((montant_ht + montant_tva) * 100) / 100;
      const reste_a_payer = Math.round((montant_ttc - facture.acompte_recu) * 100) / 100; // Basé sur ce qui a été réellement reçu

      updateData = {
        ...updateData,
        montant_ht,
        montant_tva,
        montant_ttc,
        reste_a_payer,
        ...(acompte_demande !== undefined && { acompte_demande })
      };
    }

    // Mettre à jour la facture
    const updatedFacture = await prisma.facture.update({
      where: { id },
      data: {
        ...updateData,
        ...(lignes && {
          lignes: {
            create: lignes.map((ligne, index) => {
              const tva = parseFloat(ligne.tva_pourcent) || 20;
              const ligne_montant_ht = ligne.quantite * ligne.prix_unitaire_ht;
              const ligne_montant_ttc = ligne_montant_ht * (1 + tva / 100);
              return {
                description: ligne.description,
                quantite: ligne.quantite,
                unite: ligne.unite || 'unité',
                prix_unitaire_ht: ligne.prix_unitaire_ht,
                montant_ht: ligne_montant_ht,
                tva_pourcent: tva,
                montant_ttc: ligne_montant_ttc,
                ordre: index + 1
              };
            })
          }
        })
      },
      include: {
        lignes: true
      }
    });

    logger.info(`Facture modifiée: ${facture.numero_facture}`);
    res.json(updatedFacture);
  } catch (error) {
    logger.error('Erreur modification facture:', error);
    next(error);
  }
};

/**
 * @desc    Envoyer une facture (passe en ENVOYEE)
 * @route   POST /api/factures/:id/envoyer
 * @access  MANAGER, COMPANY_ADMIN
 */
export const envoyerFacture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const facture = await prisma.facture.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!facture) {
      return res.status(404).json({
        code: 'FACTURE_NOT_FOUND',
        message: 'Facture introuvable'
      });
    }

    if (facture.statut_facture === 'ENVOYEE') {
      return res.status(400).json({
        code: 'FACTURE_ALREADY_SENT',
        message: 'La facture a déjà été envoyée'
      });
    }

    const updatedFacture = await prisma.facture.update({
      where: { id },
      data: {
        statut_facture: 'ENVOYEE',
        date_envoi: new Date()
      }
    });

    // Envoyer l'email au client
    const tenant = await prisma.tenant.findUnique({
      where: { id: facture.tenant_id },
      select: { rib: true }
    });
    sendFactureEmail({
      tenantId: facture.tenant_id,
      facture: { ...facture, ...updatedFacture },
      tenant,
      pdfUrl: facture.pdf_url
    }).catch(() => {}); // Silencieux si SMTP absent

    logger.info(`Facture envoyée: ${facture.numero_facture}`);
    res.json(updatedFacture);
  } catch (error) {
    logger.error('Erreur envoi facture:', error);
    next(error);
  }
};

/**
 * @desc    Enregistrer un paiement
 * @route   POST /api/factures/:id/paiement
 * @access  MANAGER, COMPANY_ADMIN
 */
export const enregistrerPaiement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { montant, mode_paiement, date_paiement, reference } = req.body;

    if (!montant || montant <= 0) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Le montant doit être supérieur à 0'
      });
    }

    const facture = await prisma.facture.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: {
        paiements: true
      }
    });

    if (!facture) {
      return res.status(404).json({
        code: 'FACTURE_NOT_FOUND',
        message: 'Facture introuvable'
      });
    }

    // Calculer le total déjà payé (arrondi centimes pour éviter les flottants)
    const totalPaye = Math.round(facture.paiements.reduce((sum, p) => sum + p.montant, 0) * 100) / 100;
    const nouveauTotal = Math.round((totalPaye + montant) * 100) / 100;

    if (nouveauTotal > facture.montant_ttc) {
      return res.status(400).json({
        code: 'MONTANT_TROP_ELEVE',
        message: 'Le montant total des paiements dépasse le montant de la facture'
      });
    }

    // Créer le paiement
    const paiement = await prisma.paiementFacture.create({
      data: {
        tenant_id: tenantId,
        facture_id: id,
        montant,
        moyen_paiement: mode_paiement || 'VIREMENT',
        type: 'PAIEMENT',
        date_paiement: date_paiement ? new Date(date_paiement) : new Date(),
        reference: reference || null
      }
    });

    // Mettre à jour la facture
    const nouveauReste = Math.round((facture.montant_ttc - nouveauTotal) * 100) / 100;
    const estPayeComplet = nouveauReste <= 0;

    const updatedFacture = await prisma.facture.update({
      where: { id },
      data: {
        acompte_recu: nouveauTotal,
        reste_a_payer: nouveauReste,
        statut_paiement: estPayeComplet ? 'PAYE' : nouveauTotal > 0 ? 'PARTIEL' : 'EN_ATTENTE',
        ...(estPayeComplet && { date_paiement_complet: new Date() })
      },
      include: {
        paiements: true
      }
    });

    logger.info(`Paiement enregistré: ${montant}€ pour facture ${facture.numero_facture}`);
    res.json({
      paiement,
      facture: updatedFacture
    });
  } catch (error) {
    logger.error('Erreur enregistrement paiement:', error);
    next(error);
  }
};

/**
 * @desc    Supprimer une facture (BROUILLON uniquement)
 * @route   DELETE /api/factures/:id
 * @access  COMPANY_ADMIN
 */
export const deleteFacture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const facture = await prisma.facture.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!facture) {
      return res.status(404).json({
        code: 'FACTURE_NOT_FOUND',
        message: 'Facture introuvable'
      });
    }

    if (facture.statut_facture !== 'BROUILLON') {
      return res.status(400).json({
        code: 'FACTURE_NOT_DELETABLE',
        message: 'Seules les factures en brouillon peuvent être supprimées'
      });
    }

    // Supprimer les lignes et paiements associés
    await prisma.ligneFacture.deleteMany({
      where: { facture_id: id }
    });

    await prisma.paiementFacture.deleteMany({
      where: { facture_id: id }
    });

    // Supprimer la facture
    await prisma.facture.delete({
      where: { id }
    });

    logger.info(`Facture supprimée: ${facture.numero_facture}`);
    res.json({ message: 'Facture supprimée avec succès' });
  } catch (error) {
    logger.error('Erreur suppression facture:', error);
    next(error);
  }
};

/**
 * @desc    Envoyer un rappel de paiement par email
 * @route   POST /api/factures/:id/rappel
 * @access  MANAGER, COMPANY_ADMIN
 */
export const envoyerRappelImpaye = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const facture = await prisma.facture.findFirst({
      where: { id, tenant_id: tenantId }
    });

    if (!facture) {
      return res.status(404).json({ message: 'Facture introuvable' });
    }

    if (facture.statut_paiement === 'SOLDE') {
      return res.status(400).json({ message: 'Cette facture est déjà soldée' });
    }

    const joursRetard = facture.date_echeance
      ? Math.floor((Date.now() - new Date(facture.date_echeance).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { rib: true }
    });

    const sent = await sendRappelImpayeEmail({ tenantId, facture, tenant, joursRetard });

    if (sent) {
      logger.info(`Rappel impayé envoyé pour facture ${facture.numero_facture}`);
      res.json({ message: 'Rappel envoyé avec succès', email: facture.client_email });
    } else {
      res.status(503).json({ message: 'Email non configuré. Configurez votre SMTP dans Paramètres > Email.' });
    }
  } catch (error) {
    logger.error('Erreur envoi rappel:', error);
    next(error);
  }
};

/**
 * @desc    Générer le PDF d'une facture
 * @route   GET /api/factures/:id/pdf
 * @access  MANAGER, COMPANY_ADMIN
 */
export const genererPDFFacture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    // Récupérer la facture avec toutes les données
    const facture = await prisma.facture.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: {
        chantier: {
          select: {
            nom: true,
            adresse: true
          }
        },
        lignes: {
          orderBy: { ordre: 'asc' }
        }
      }
    });

    if (!facture) {
      return res.status(404).json({
        code: 'FACTURE_NOT_FOUND',
        message: 'Facture introuvable'
      });
    }

    // Récupérer logo du tenant
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { logo_url: true, couleur_primaire: true } });

    // Générer le PDF
    const pdfBuffer = await generateFacturePDF({ ...facture, logo_url: tenant?.logo_url || null, couleur_primaire: tenant?.couleur_primaire || null });

    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${facture.numero_facture}.pdf"`);
    res.send(pdfBuffer);

    logger.info(`PDF généré pour facture: ${facture.numero_facture}`);
  } catch (error) {
    logger.error('Erreur génération PDF facture:', error);
    next(error);
  }
};

