import { create } from 'zustand';
import authService from '../services/authService';

/**
 * Store Zustand pour l'authentification
 */
const useAuthStore = create((set) => ({
  user: authService.getUser(),
  tenant: authService.getTenant(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,
  error: null,

  /**
   * Login
   */
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(email, password);
      set({
        user: data.user,
        tenant: data.tenant,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur de connexion';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Register
   */
  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await authService.register(data);
      set({
        user: result.user,
        tenant: result.tenant,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur inscription';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Logout
   */
  logout: async () => {
    set({ loading: true });
    try {
      await authService.logout();
      set({
        user: null,
        tenant: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({
        user: null,
        tenant: null,
        isAuthenticated: false,
        loading: false
      });
    }
  },

  /**
   * Refresh user info
   */
  refreshUser: async () => {
    try {
      const data = await authService.me();
      set({
        user: data.user,
        tenant: data.tenant,
        isAuthenticated: true
      });
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Set tenant (pour mettre à jour les infos du tenant)
   */
  setTenant: (tenant) => set({ tenant }),

  /**
   * Set user (pour mettre à jour les infos du profil)
   */
  setUser: (user) => set({ user })
}));

export default useAuthStore;
