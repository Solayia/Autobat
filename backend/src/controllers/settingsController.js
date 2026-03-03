import prisma from '../config/database.js';
import logger from '../config/logger.js';
import multer from 'multer';
import { testSmtpConnection } from '../services/emailService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de multer pour l'upload de logo
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/logos');
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const tenantId = req.tenantId;
    const ext = path.extname(file.originalname);
    cb(null, `logo-${tenantId}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image (JPEG, PNG, GIF) sont autorisés'));
    }
  }
});

export const uploadLogo = upload.single('logo');

/**
 * GET /api/settings - Récupérer les paramètres du tenant
 */
export const getSettings = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        nom: true,
        siret: true,
        adresse: true,
        code_postal: true,
        ville: true,
        telephone: true,
        email: true,
        logo_url: true,
        rib: true,
        capital: true,
        rcs: true,
        tva_intra: true,
        couleur_primaire: true,
        plan: true,
        statut: true,
        badgeage_par_tache_defaut: true,
        onboarding_completed: true,
        onboarding_step: true,
        objectif_ca_annuel: true,
        objectif_ca_mensuel: true,
        objectif_taux_acceptation: true,
        objectif_taux_encaissement: true,
        objectif_nb_chantiers_mois: true,
        objectif_delai_paiement: true,
        smtp_configured: true
      }
    });

    if (!tenant) {
      return res.status(404).json({
        code: 'TENANT_NOT_FOUND',
        message: 'Entreprise introuvable'
      });
    }

    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/settings - Mettre à jour les paramètres du tenant
 */
export const updateSettings = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const {
      nom,
      siret,
      adresse,
      code_postal,
      ville,
      telephone,
      email,
      logo_url,
      rib,
      capital,
      rcs,
      tva_intra,
      couleur_primaire,
      badgeage_par_tache_defaut
    } = req.body;

    // Validation de la couleur (format hex)
    if (couleur_primaire && !/^#[0-9A-F]{6}$/i.test(couleur_primaire)) {
      return res.status(400).json({
        code: 'INVALID_COLOR',
        message: 'La couleur doit être au format hexadécimal (#RRGGBB)'
      });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(nom && { nom }),
        ...(siret && { siret }),
        ...(adresse && { adresse }),
        ...(code_postal && { code_postal }),
        ...(ville && { ville }),
        ...(telephone && { telephone }),
        ...(email && { email }),
        ...(logo_url !== undefined && { logo_url }),
        ...(rib !== undefined && { rib }),
        ...(capital !== undefined && { capital }),
        ...(rcs !== undefined && { rcs }),
        ...(tva_intra !== undefined && { tva_intra }),
        ...(couleur_primaire && { couleur_primaire }),
        ...(badgeage_par_tache_defaut !== undefined && { badgeage_par_tache_defaut })
      },
      select: {
        id: true,
        nom: true,
        siret: true,
        adresse: true,
        code_postal: true,
        ville: true,
        telephone: true,
        email: true,
        logo_url: true,
        rib: true,
        capital: true,
        rcs: true,
        tva_intra: true,
        couleur_primaire: true,
        plan: true,
        statut: true,
        badgeage_par_tache_defaut: true
      }
    });

    logger.info('Paramètres mis à jour', {
      service: 'autobat-api',
      tenant_id: tenantId,
      user_id: req.userId
    });

    res.json(updatedTenant);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/settings/logo - Upload du logo de l'entreprise
 */
export const handleUploadLogo = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    if (!req.file) {
      return res.status(400).json({
        code: 'NO_FILE',
        message: 'Aucun fichier fourni'
      });
    }

    // Récupérer l'ancien logo pour le supprimer
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { logo_url: true }
    });

    // Supprimer l'ancien fichier si il existe
    if (tenant && tenant.logo_url) {
      const oldFilePath = path.join(__dirname, '../..', tenant.logo_url);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Générer l'URL du nouveau logo
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Mettre à jour le tenant avec le nouveau logo
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { logo_url: logoUrl },
      select: {
        id: true,
        nom: true,
        logo_url: true
      }
    });

    logger.info('Logo uploadé', {
      service: 'autobat-api',
      tenant_id: tenantId,
      user_id: req.userId,
      logo_url: logoUrl
    });

    res.json(updatedTenant);
  } catch (error) {
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

/**
 * PATCH /api/settings/subscription - Mettre à jour l'abonnement (nombre d'employés max)
 */
export const updateSubscription = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { employes_max } = req.body;

    // Validation
    if (!employes_max || typeof employes_max !== 'number' || employes_max < 1) {
      return res.status(400).json({
        code: 'INVALID_EMPLOYES_MAX',
        message: 'Le nombre d\'employés doit être un nombre positif'
      });
    }

    if (employes_max > 100) {
      return res.status(400).json({
        code: 'EMPLOYES_MAX_EXCEEDED',
        message: 'Le nombre maximum d\'employés autorisé est 100'
      });
    }

    // Récupérer le tenant actuel
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { employes_max: true }
    });

    // Empêcher la réduction du nombre d'employés
    if (employes_max < currentTenant.employes_max) {
      return res.status(400).json({
        code: 'CANNOT_DECREASE_EMPLOYES',
        message: 'Vous ne pouvez pas réduire le nombre d\'employés. Contactez le support.'
      });
    }

    // Mettre à jour l'abonnement
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { employes_max },
      select: {
        id: true,
        nom: true,
        employes_max: true,
        plan: true,
        statut: true
      }
    });

    logger.info('Abonnement mis à jour', {
      service: 'autobat-api',
      tenant_id: tenantId,
      user_id: req.userId,
      employes_max
    });

    res.json(updatedTenant);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/settings/objectifs - Mettre à jour les objectifs de pilotage
 */
export const updateObjectifs = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const {
      objectif_ca_annuel,
      objectif_ca_mensuel,
      objectif_taux_acceptation,
      objectif_taux_encaissement,
      objectif_nb_chantiers_mois,
      objectif_delai_paiement
    } = req.body;

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(objectif_ca_annuel !== undefined && { objectif_ca_annuel: objectif_ca_annuel === '' ? null : parseFloat(objectif_ca_annuel) }),
        ...(objectif_ca_mensuel !== undefined && { objectif_ca_mensuel: objectif_ca_mensuel === '' ? null : parseFloat(objectif_ca_mensuel) }),
        ...(objectif_taux_acceptation !== undefined && { objectif_taux_acceptation: objectif_taux_acceptation === '' ? null : parseFloat(objectif_taux_acceptation) }),
        ...(objectif_taux_encaissement !== undefined && { objectif_taux_encaissement: objectif_taux_encaissement === '' ? null : parseFloat(objectif_taux_encaissement) }),
        ...(objectif_nb_chantiers_mois !== undefined && { objectif_nb_chantiers_mois: objectif_nb_chantiers_mois === '' ? null : parseInt(objectif_nb_chantiers_mois) }),
        ...(objectif_delai_paiement !== undefined && { objectif_delai_paiement: objectif_delai_paiement === '' ? null : parseInt(objectif_delai_paiement) }),
      },
      select: {
        objectif_ca_annuel: true,
        objectif_ca_mensuel: true,
        objectif_taux_acceptation: true,
        objectif_taux_encaissement: true,
        objectif_nb_chantiers_mois: true,
        objectif_delai_paiement: true
      }
    });

    logger.info('Objectifs mis à jour', {
      service: 'autobat-api',
      tenant_id: tenantId,
      user_id: req.userId
    });

    res.json(updatedTenant);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/settings/onboarding - Mettre à jour la progression de l'onboarding
 */
export const updateOnboarding = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { step, completed } = req.body;

    const data = {};
    if (typeof step === 'number') data.onboarding_step = step;
    if (typeof completed === 'boolean') data.onboarding_completed = completed;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'Aucune donnée fournie' });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: {
        id: true,
        onboarding_completed: true,
        onboarding_step: true
      }
    });

    res.json(updatedTenant);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer la config SMTP du tenant (sans le mot de passe)
 * @route   GET /api/settings/smtp
 */
export const getSmtpSettings = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        smtp_host: true,
        smtp_port: true,
        smtp_secure: true,
        smtp_user: true,
        smtp_from: true,
        smtp_configured: true
        // smtp_password volontairement exclu (sécurité)
      }
    });
    res.json(tenant || {});
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Sauvegarder la config SMTP du tenant
 * @route   PUT /api/settings/smtp
 */
export const updateSmtpSettings = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, smtp_from, smtp_configured } = req.body;

    const data = {
      smtp_host: smtp_host || null,
      smtp_port: smtp_port ? parseInt(smtp_port) : null,
      smtp_secure: Boolean(smtp_secure),
      smtp_user: smtp_user || null,
      smtp_from: smtp_from || null,
      smtp_configured: Boolean(smtp_configured)
    };

    // Ne mettre à jour le mot de passe que s'il est fourni (non vide)
    if (smtp_password && smtp_password.trim()) {
      data.smtp_password = smtp_password.trim();
    }

    await prisma.tenant.update({ where: { id: tenantId }, data });

    logger.info(`[SMTP] Config mise à jour pour tenant ${tenantId}`);
    res.json({ message: 'Configuration email sauvegardée' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tester la connexion SMTP
 * @route   POST /api/settings/smtp/test
 */
export const testSmtp = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password } = req.body;

    // Si pas de mot de passe fourni, utiliser celui stocké en DB
    let password = smtp_password?.trim();
    if (!password) {
      const stored = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { smtp_password: true }
      });
      password = stored?.smtp_password;
    }

    const result = await testSmtpConnection({
      smtp_host,
      smtp_port: smtp_port ? parseInt(smtp_port) : 587,
      smtp_secure: Boolean(smtp_secure),
      smtp_user,
      smtp_password: password
    });

    if (result.ok) {
      res.json({ ok: true, message: 'Connexion SMTP réussie ✓' });
    } else {
      res.status(400).json({ ok: false, message: result.error || 'Connexion échouée' });
    }
  } catch (error) {
    next(error);
  }
};
