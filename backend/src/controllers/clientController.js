import prisma from '../config/database.js';
import logger from '../config/logger.js';

/**
 * POST /api/clients - Créer un nouveau client
 * US-CL01
 */
export const createClient = async (req, res, next) => {
  try {
    const { type, prenom, nom, telephone, adresse, code_postal, ville, siret, notes } = req.body;
    const email = req.body.email?.trim() || null;
    const tenantId = req.tenantId;

    // Validation
    if (!nom) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Le champ nom est obligatoire'
      });
    }

    // Validation spécifique pour les particuliers
    if (type === 'PARTICULIER' && !prenom) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Le prénom est obligatoire pour un client particulier'
      });
    }

    // Vérifier email unique pour ce tenant (seulement si email fourni)
    if (email) {
      const existingClient = await prisma.client.findFirst({
        where: {
          tenant_id: tenantId,
          email: email
        }
      });

      if (existingClient) {
        return res.status(409).json({
          code: 'EMAIL_EXISTS',
          message: 'Un client avec cet email existe déjà'
        });
      }
    }

    // Créer le client
    const client = await prisma.client.create({
      data: {
        tenant_id: tenantId,
        type: type || 'ENTREPRISE',
        prenom,
        nom,
        email,
        telephone,
        adresse,
        code_postal,
        ville,
        siret,
        notes,
        actif: true
      }
    });

    logger.info('Nouveau client créé', {
      service: 'autobat-api',
      client_id: client.id,
      tenant_id: tenantId,
      nom: client.nom
    });

    res.status(201).json({
      client,
      message: 'Client créé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clients - Lister les clients avec pagination et recherche
 * US-CL02
 */
export const getClients = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const {
      page = 1,
      limit = 20,
      search = '',
      actif = 'true',
      sort = 'nom',
      order = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construire les filtres
    const where = {
      tenant_id: tenantId,
      ...(actif !== 'all' && { actif: actif === 'true' }),
      ...(search && {
        OR: [
          { nom: { contains: search } },
          { email: { contains: search } },
          { telephone: { contains: search } },
          { ville: { contains: search } },
          { siret: { contains: search } }
        ]
      })
    };

    // Compter le total
    const total = await prisma.client.count({ where });

    // Récupérer les clients
    const clients = await prisma.client.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: order },
      include: {
        _count: {
          select: {
            devis: true,
            chantiers: true,
            factures: true
          }
        }
      }
    });

    res.json({
      clients,
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
 * GET /api/clients/:id - Récupérer un client par ID
 * US-CL03
 */
export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const client = await prisma.client.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: {
        devis: {
          select: {
            id: true,
            numero_devis: true,
            montant_ttc: true,
            statut: true,
            date_creation: true
          },
          orderBy: { date_creation: 'desc' },
          take: 5
        },
        chantiers: {
          select: {
            id: true,
            nom: true,
            statut: true,
            date_debut: true,
            date_fin_prevue: true
          },
          orderBy: { date_debut: 'desc' },
          take: 5
        },
        factures: {
          select: {
            id: true,
            numero_facture: true,
            montant_ttc: true,
            statut_paiement: true,
            date_emission: true
          },
          orderBy: { date_emission: 'desc' },
          take: 5
        },
        _count: {
          select: {
            devis: true,
            chantiers: true,
            factures: true
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client non trouvé'
      });
    }

    res.json({ client });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clients/:id - Mettre à jour un client
 * US-CL04
 */
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { type, prenom, nom, telephone, adresse, code_postal, ville, siret, notes, actif } = req.body;
    const email = req.body.email !== undefined ? (req.body.email?.trim() || null) : undefined;

    // Vérifier que le client existe
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client non trouvé'
      });
    }

    // Si email change, vérifier unicité
    if (email && email !== existingClient.email) {
      const emailExists = await prisma.client.findFirst({
        where: {
          tenant_id: tenantId,
          email: email,
          NOT: { id }
        }
      });

      if (emailExists) {
        return res.status(409).json({
          code: 'EMAIL_EXISTS',
          message: 'Un autre client utilise déjà cet email'
        });
      }
    }

    // Mettre à jour
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(prenom !== undefined && { prenom }),
        ...(nom && { nom }),
        ...(email !== undefined && { email }),
        ...(telephone && { telephone }),
        ...(adresse !== undefined && { adresse }),
        ...(code_postal !== undefined && { code_postal }),
        ...(ville !== undefined && { ville }),
        ...(siret !== undefined && { siret }),
        ...(notes !== undefined && { notes }),
        ...(actif !== undefined && { actif })
      }
    });

    logger.info('Client mis à jour', {
      service: 'autobat-api',
      client_id: client.id,
      tenant_id: tenantId
    });

    res.json({
      client,
      message: 'Client modifié avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/clients/:id - Supprimer un client (soft delete)
 * US-CL05
 */
export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    // Vérifier que le client existe
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        tenant_id: tenantId
      },
      include: {
        _count: {
          select: {
            devis: true,
            chantiers: true,
            factures: true
          }
        }
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client non trouvé'
      });
    }

    // Vérifier si le client a des données liées
    const hasData = existingClient._count.devis > 0 ||
                    existingClient._count.chantiers > 0 ||
                    existingClient._count.factures > 0;

    if (hasData) {
      // Soft delete : désactiver seulement
      const client = await prisma.client.update({
        where: { id },
        data: { actif: false }
      });

      logger.info('Client désactivé (soft delete)', {
        service: 'autobat-api',
        client_id: client.id,
        tenant_id: tenantId
      });

      return res.json({
        client,
        message: 'Client désactivé car il possède des données liées (devis, chantiers, factures)',
        soft_delete: true
      });
    } else {
      // Hard delete : supprimer complètement
      await prisma.client.delete({
        where: { id }
      });

      logger.info('Client supprimé (hard delete)', {
        service: 'autobat-api',
        client_id: id,
        tenant_id: tenantId
      });

      return res.json({
        message: 'Client supprimé définitivement',
        soft_delete: false
      });
    }
  } catch (error) {
    next(error);
  }
};
