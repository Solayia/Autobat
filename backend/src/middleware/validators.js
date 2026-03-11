/**
 * Middlewares de validation et sanitization des inputs
 * Niveau BANCAIRE - Protection contre XSS, injection, données malformées
 */

import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware pour gérer les erreurs de validation
 * À utiliser en dernier dans la chaîne de validation
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Données invalides',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }

  next();
};

// ============================================
// VALIDATORS RÉUTILISABLES
// ============================================

/**
 * Validation d'email
 */
export const validateEmail = () =>
  body('email')
    .trim()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email trop long');

/**
 * Validation de téléphone français
 */
export const validatePhone = (field = 'telephone', required = true) => {
  const validator = body(field)
    .trim()
    .matches(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)
    .withMessage('Numéro de téléphone français invalide')
    .customSanitizer(value => value.replace(/[\s.-]/g, ''));

  return required ? validator : validator.optional({ checkFalsy: true });
};

/**
 * Validation SIRET (14 chiffres)
 */
export const validateSIRET = () =>
  body('entreprise_siret')
    .trim()
    .isLength({ min: 14, max: 14 }).withMessage('Le SIRET doit contenir 14 chiffres')
    .isNumeric().withMessage('Le SIRET ne doit contenir que des chiffres')
    .customSanitizer(value => value.replace(/\s/g, ''));

/**
 * Validation de nom (prénom, nom, raison sociale)
 */
export const validateName = (field, minLength = 1, maxLength = 100) =>
  body(field)
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${field} doit contenir entre ${minLength} et ${maxLength} caractères`)
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage(`${field} contient des caractères invalides`)
    .escape(); // Prévention XSS

/**
 * Validation de texte libre (descriptions, notes)
 */
export const validateText = (field, maxLength = 5000, required = false) => {
  const validator = body(field)
    .trim()
    .isLength({ max: maxLength }).withMessage(`${field} ne peut pas dépasser ${maxLength} caractères`)
    .escape(); // Prévention XSS

  return required ? validator.notEmpty().withMessage(`${field} est requis`) : validator.optional();
};

/**
 * Validation d'adresse
 */
export const validateAddress = () => [
  body('adresse')
    .trim()
    .isLength({ min: 5, max: 255 }).withMessage('Adresse invalide (5-255 caractères)')
    .escape(),

  body('code_postal')
    .trim()
    .matches(/^\d{5}$/).withMessage('Code postal français invalide (5 chiffres)')
    .isLength({ min: 5, max: 5 }),

  body('ville')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Ville invalide')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Ville contient des caractères invalides')
    .escape()
];

/**
 * Validation de montant (prix, montant facture)
 */
export const validateAmount = (field) =>
  body(field)
    .isFloat({ min: 0, max: 999999999.99 })
    .withMessage(`${field} doit être un nombre positif valide`)
    .toFloat();

/**
 * Validation de quantité
 */
export const validateQuantity = (field = 'quantite') =>
  body(field)
    .isInt({ min: 0, max: 999999 })
    .withMessage(`${field} doit être un entier positif`)
    .toInt();

/**
 * Validation d'ID (CUID ou UUID)
 * Les IDs Prisma sont des CUIDs (ex: clr...) et non des UUIDs
 */
export const validateUUID = (paramName = 'id') =>
  param(paramName)
    .isString()
    .notEmpty()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('ID invalide');

/**
 * Validation de date
 */
export const validateDate = (field) =>
  body(field)
    .isISO8601().withMessage(`${field} doit être une date valide (ISO 8601)`)
    .toDate();

/**
 * Validation d'enum
 */
export const validateEnum = (field, allowedValues) =>
  body(field)
    .isIn(allowedValues)
    .withMessage(`${field} doit être l'une des valeurs: ${allowedValues.join(', ')}`);

/**
 * Validation de pagination
 */
export const validatePagination = () => [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('Page invalide')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limite invalide (max 100)')
    .toInt()
];

/**
 * Validation de recherche (texte libre avec protection XSS)
 */
export const validateSearch = () =>
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Recherche limitée à 100 caractères')
    .escape();

// ============================================
// VALIDATORS SPÉCIFIQUES PAR ENTITÉ
// ============================================

/**
 * Validation création client
 */
export const validateCreateClient = [
  validateName('nom', 1, 100),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Email invalide').normalizeEmail().isLength({ max: 255 }),
  validatePhone('telephone', false),
  validateEnum('type', ['PARTICULIER', 'ENTREPRISE']),
  body('siret').optional({ checkFalsy: true }).trim().isLength({ min: 14, max: 14 }).withMessage('SIRET invalide (14 chiffres)').isNumeric(),
  // Adresse optionnelle (peut être renseignée plus tard)
  body('adresse').optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 255 }).withMessage('Adresse invalide').escape(),
  body('code_postal').optional({ checkFalsy: true }).trim().matches(/^\d{5}$/).withMessage('Code postal français invalide (5 chiffres)'),
  body('ville').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }).withMessage('Ville invalide').escape(),
  validateText('notes', 2000, false),
  handleValidationErrors
];

/**
 * Validation création devis
 */
export const validateCreateDevis = [
  validateUUID('client_id'),
  validateText('objet', 255, false),
  validateAmount('montant_ht'),
  validateAmount('montant_tva'),
  validateAmount('montant_ttc'),
  validateDate('date_validite'),
  validateText('conditions_paiement', 1000, false),
  validateText('delai_realisation', 255, false),
  validateText('notes', 2000, false),
  handleValidationErrors
];

/**
 * Validation création chantier
 */
export const validateCreateChantier = [
  validateName('nom', 1, 255),
  validateUUID('client_id').optional({ nullable: true }),
  validateUUID('devis_id').optional({ nullable: true }),
  ...validateAddress(),
  validateDate('date_debut'),
  validateDate('date_fin_prevue').optional({ nullable: true }),
  validateEnum('statut', ['PLANIFIE', 'EN_COURS', 'SUSPENDU', 'TERMINE', 'ANNULE']),
  validateText('description', 2000, false),
  handleValidationErrors
];

/**
 * Validation upload fichier
 */
export const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'Aucun fichier fourni'
    });
  }

  // Vérifier le type MIME (déjà fait par multer, mais double vérification)
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];

  if (!allowedMimes.includes(req.file.mimetype)) {
    return res.status(400).json({
      error: 'Type de fichier non autorisé',
      allowed: allowedMimes
    });
  }

  // Vérifier la taille (déjà fait par multer, mais double vérification)
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (req.file.size > maxSize) {
    return res.status(400).json({
      error: 'Fichier trop volumineux',
      maxSize: '5MB'
    });
  }

  next();
};

/**
 * Sanitization générale pour prévenir XSS
 * À appliquer sur TOUS les endpoints qui reçoivent du texte libre
 */
export const sanitizeInputs = (req, res, next) => {
  // Sanitizer récursivement tous les strings dans req.body
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Supprimer les balises HTML
        obj[key] = obj[key].replace(/<[^>]*>/g, '');
        // Supprimer les scripts
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // Trim
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitize(req.body);
  }

  next();
};
