import logger from '../config/logger.js';

/**
 * Middleware de gestion des erreurs globales
 * À placer en dernier dans app.use()
 */
export const errorHandler = (err, req, res, next) => {
  logger.error('Erreur capturée:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user_id: req.user?.id,
    tenant_id: req.tenantId
  });

  // Erreurs Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflit: cet élément existe déjà',
      field: err.meta?.target
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Ressource introuvable'
    });
  }

  // Erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.details
    });
  }

  // Erreur par défaut
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur serveur interne'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware pour routes non trouvées (404)
 */
export const notFound = (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path
  });
};
