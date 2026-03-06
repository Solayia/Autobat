import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

/**
 * Composant pour protéger les routes nécessitant l'authentification et/ou un rôle.
 * @param {string[]} roles - Rôles autorisés (optionnel). Si omis, tout utilisateur authentifié peut accéder.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, tenant } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Compte en attente de paiement → forcer la finalisation de l'abonnement
  if (tenant?.statut === 'PENDING') {
    return <Navigate to="/register" replace />;
  }

  // SUPER_ADMIN → renvoyé vers /super-admin sauf s'il y est déjà ou en impersonation
  if (
    user?.role === 'SUPER_ADMIN' &&
    !sessionStorage.getItem('sa_backup_token') &&
    !location.pathname.startsWith('/super-admin')
  ) {
    return <Navigate to="/super-admin" replace />;
  }

  if (roles && user?.role && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
