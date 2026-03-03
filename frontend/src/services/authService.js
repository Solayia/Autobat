import api from './api';

/**
 * Service d'authentification
 */
const authService = {
  /**
   * Inscription d'une nouvelle entreprise
   */
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
    }
    return response.data;
  },

  /**
   * Connexion
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
    }
    return response.data;
  },

  /**
   * Déconnexion
   */
  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
    }
  },

  /**
   * Récupérer les infos du user connecté
   */
  me: async () => {
    const response = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
    return response.data;
  },

  /**
   * Vérifier si user est connecté
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Récupérer le user depuis localStorage
   */
  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Récupérer le tenant depuis localStorage
   */
  getTenant: () => {
    const tenantStr = localStorage.getItem('tenant');
    return tenantStr ? JSON.parse(tenantStr) : null;
  },

  /**
   * Changer le mot de passe
   */
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.patch('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  }
};

export default authService;
