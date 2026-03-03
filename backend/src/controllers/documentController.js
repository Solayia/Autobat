import prisma from '../config/database.js';
import logger from '../config/logger.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration multer pour l'upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

/**
 * @desc    Upload un document pour un chantier
 * @route   POST /api/chantiers/:chantierId/documents
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
export const uploadDocument = async (req, res, next) => {
  try {
    const { chantierId } = req.params;
    const { dossier, description } = req.body;
    const tenantId = req.tenantId;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        code: 'NO_FILE',
        message: 'Aucun fichier fourni'
      });
    }

    // Vérifier que le chantier appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Déterminer le type de fichier
    let type = 'AUTRE';
    if (req.file.mimetype.startsWith('image/')) {
      type = 'PHOTO';
    } else if (req.file.mimetype === 'application/pdf') {
      type = 'PDF';
    } else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('document')) {
      type = 'DOCUMENT';
    }

    // Créer le document
    const document = await prisma.document.create({
      data: {
        tenant_id: tenantId,
        chantier_id: chantierId,
        nom: req.file.originalname,
        type,
        url: `/uploads/documents/${req.file.filename}`,
        taille_bytes: req.file.size,
        titre: dossier || null, // On utilise "titre" pour stocker le dossier
        description: description || null,
        uploaded_by: userId
      }
    });

    logger.info(`Document uploadé: ${document.nom} (${document.id}) pour chantier ${chantierId}`);
    res.status(201).json(document);
  } catch (error) {
    logger.error('Erreur upload document:', error);
    next(error);
  }
};

/**
 * @desc    Lister les documents d'un chantier
 * @route   GET /api/chantiers/:chantierId/documents
 * @access  EMPLOYEE, MANAGER, COMPANY_ADMIN
 */
export const getDocumentsByChantier = async (req, res, next) => {
  try {
    const { chantierId } = req.params;
    const { dossier } = req.query;
    const tenantId = req.tenantId;

    // Vérifier que le chantier appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    const where = {
      chantier_id: chantierId,
      type: { not: 'DOSSIER' } // Exclure les marqueurs de dossier
    };

    // Filtrer par dossier si spécifié
    if (dossier !== undefined) {
      if (dossier === '') {
        // Racine (pas de dossier)
        where.titre = null;
      } else {
        where.titre = dossier;
      }
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    // Obtenir la liste des dossiers (documents de type DOSSIER)
    const dossiers = await prisma.document.findMany({
      where: {
        chantier_id: chantierId,
        type: 'DOSSIER'
      },
      select: {
        id: true,
        nom: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      documents,
      dossiers
    });
  } catch (error) {
    logger.error('Erreur récupération documents:', error);
    next(error);
  }
};

/**
 * @desc    Supprimer un document
 * @route   DELETE /api/chantiers/:chantierId/documents/:id
 * @access  MANAGER, COMPANY_ADMIN
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const { chantierId, id } = req.params;
    const tenantId = req.tenantId;

    // Vérifier que le chantier appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Vérifier que le document existe
    const document = await prisma.document.findFirst({
      where: {
        id,
        chantier_id: chantierId
      }
    });

    if (!document) {
      return res.status(404).json({
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document introuvable'
      });
    }

    // Si c'est un dossier, vérifier qu'il est vide
    if (document.type === 'DOSSIER') {
      const filesInFolder = await prisma.document.findFirst({
        where: {
          chantier_id: chantierId,
          titre: document.nom,
          type: { not: 'DOSSIER' }
        }
      });

      if (filesInFolder) {
        return res.status(400).json({
          code: 'FOLDER_NOT_EMPTY',
          message: 'Le dossier n\'est pas vide. Supprimez d\'abord les fichiers qu\'il contient.'
        });
      }
    }

    // Supprimer le fichier physique (sauf pour les dossiers)
    if (document.type !== 'DOSSIER' && document.url) {
      try {
        const filePath = path.join(process.cwd(), document.url.replace(/^\//, ''));
        await fs.unlink(filePath);
      } catch (error) {
        logger.warn(`Impossible de supprimer le fichier physique: ${error.message}`);
      }
    }

    // Supprimer de la base de données
    await prisma.document.delete({
      where: { id }
    });

    const type = document.type === 'DOSSIER' ? 'Dossier' : 'Document';
    logger.info(`${type} supprimé: ${document.nom} (${document.id})`);
    res.json({ message: `${type} supprimé avec succès` });
  } catch (error) {
    logger.error('Erreur suppression document:', error);
    next(error);
  }
};

/**
 * @desc    Créer un dossier (virtuel, juste un nom)
 * @route   POST /api/chantiers/:chantierId/documents/folders
 * @access  MANAGER, COMPANY_ADMIN
 */
export const createFolder = async (req, res, next) => {
  try {
    const { chantierId } = req.params;
    const { nom } = req.body;
    const tenantId = req.tenantId;

    if (!nom) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Le nom du dossier est obligatoire'
      });
    }

    // Vérifier que le chantier appartient au tenant
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        tenant_id: tenantId
      }
    });

    if (!chantier) {
      return res.status(404).json({
        code: 'CHANTIER_NOT_FOUND',
        message: 'Chantier introuvable'
      });
    }

    // Vérifier que le dossier n'existe pas déjà
    const existingFolder = await prisma.document.findFirst({
      where: {
        chantier_id: chantierId,
        type: 'DOSSIER',
        nom: nom
      }
    });

    if (existingFolder) {
      return res.status(400).json({
        code: 'FOLDER_EXISTS',
        message: 'Un dossier avec ce nom existe déjà'
      });
    }

    // Créer un document "marqueur" de type DOSSIER
    const folder = await prisma.document.create({
      data: {
        tenant_id: tenantId,
        chantier_id: chantierId,
        nom: nom,
        type: 'DOSSIER',
        url: '', // Pas d'URL pour un dossier
        taille_bytes: 0,
        titre: null, // Le dossier lui-même n'est pas dans un dossier parent
        description: null,
        uploaded_by: req.user.id
      }
    });

    logger.info(`Dossier créé: ${nom} pour chantier ${chantierId}`);
    res.status(201).json({ id: folder.id, nom, message: 'Dossier créé avec succès' });
  } catch (error) {
    logger.error('Erreur création dossier:', error);
    next(error);
  }
};
