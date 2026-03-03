/**
 * Middleware d'autorisation par rôles
 * Vérifie que l'utilisateur authentifié possède l'un des rôles autorisés
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentification requise'
      });
    }

    // Vérifier que le rôle de l'utilisateur est dans la liste des rôles autorisés
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};
