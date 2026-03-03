import api from './api';

/**
 * Service pour la gestion des paramètres du tenant
 */
const settingsService = {
  /**
   * Récupérer les paramètres du tenant
   */
  async getSettings() {
    const response = await api.get('/settings');
    return response.data;
  },

  /**
   * Mettre à jour les paramètres du tenant
   */
  async updateSettings(data) {
    const response = await api.patch('/settings', data);
    return response.data;
  },

  /**
   * Upload du logo de l'entreprise
   */
  async uploadLogo(file) {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Mettre à jour l'abonnement (nombre d'employés max)
   */
  async updateSubscription(employes_max) {
    const response = await api.patch('/settings/subscription', { employes_max });
    return response.data;
  },

  /**
   * Mettre à jour les objectifs de pilotage
   */
  async updateObjectifs(data) {
    const response = await api.patch('/settings/objectifs', data);
    return response.data;
  },

  /**
   * Créer une session de paiement Stripe pour augmenter le nombre d'employés
   */
  async createCheckoutSession(new_employes_max) {
    const response = await api.post('/stripe/create-checkout-session', { new_employes_max });
    return response.data;
  },

  /**
   * Mettre à jour la progression de l'onboarding
   */
  async updateOnboarding(data) {
    const response = await api.patch('/settings/onboarding', data);
    return response.data;
  },

  /**
   * Récupérer la config SMTP (sans mot de passe)
   */
  async getSmtpSettings() {
    const response = await api.get('/settings/smtp');
    return response.data;
  },

  /**
   * Sauvegarder la config SMTP
   */
  async updateSmtpSettings(data) {
    const response = await api.put('/settings/smtp', data);
    return response.data;
  },

  /**
   * Tester la connexion SMTP
   */
  async testSmtp(config) {
    const response = await api.post('/settings/smtp/test', config);
    return response.data;
  },

  // ─── Gmail OAuth2 ─────────────────────────────────────────────────────────

  /**
   * Récupère l'URL Google OAuth2 pour connecter Gmail
   * Redirige ensuite l'utilisateur vers cette URL
   */
  async getGmailAuthUrl() {
    const response = await api.get('/settings/gmail/auth-url');
    return response.data; // { url }
  },

  /**
   * Statut de la connexion Gmail
   */
  async getGmailStatus() {
    const response = await api.get('/settings/gmail/status');
    return response.data; // { connected, email }
  },

  /**
   * Déconnecter Gmail
   */
  async disconnectGmail() {
    const response = await api.delete('/settings/gmail');
    return response.data;
  }
};

export default settingsService;
