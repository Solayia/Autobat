import api from './api';

const factureService = {
  /**
   * Récupérer toutes les factures
   */
  getFactures: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.statut_facture) params.append('statut_facture', filters.statut_facture);
    if (filters.statut_paiement) params.append('statut_paiement', filters.statut_paiement);

    const response = await api.get(`/factures?${params.toString()}`);
    return response.data;
  },

  /**
   * Récupérer une facture par son ID
   */
  getFactureById: async (id) => {
    const response = await api.get(`/factures/${id}`);
    return response.data;
  },

  /**
   * Créer une nouvelle facture
   */
  createFacture: async (data) => {
    const response = await api.post('/factures', data);
    return response.data;
  },

  /**
   * Modifier une facture (BROUILLON uniquement)
   */
  updateFacture: async (id, data) => {
    const response = await api.patch(`/factures/${id}`, data);
    return response.data;
  },

  /**
   * Envoyer une facture
   */
  envoyerFacture: async (id) => {
    const response = await api.post(`/factures/${id}/envoyer`);
    return response.data;
  },

  /**
   * Enregistrer un paiement
   */
  enregistrerPaiement: async (id, data) => {
    const response = await api.post(`/factures/${id}/paiement`, data);
    return response.data;
  },

  /**
   * Supprimer une facture (BROUILLON uniquement)
   */
  deleteFacture: async (id) => {
    const response = await api.delete(`/factures/${id}`);
    return response.data;
  },

  /**
   * Télécharger le PDF d'une facture
   */
  downloadPDF: async (id) => {
    const response = await api.get(`/factures/${id}/pdf`, {
      responseType: 'blob',
      timeout: 60000 // 60s for Puppeteer PDF generation
    });
    return response.data;
  },

  /**
   * Envoyer un rappel de paiement par email
   */
  envoyerRappel: async (id) => {
    const response = await api.post(`/factures/${id}/rappel`);
    return response.data;
  }
};

export default factureService;
