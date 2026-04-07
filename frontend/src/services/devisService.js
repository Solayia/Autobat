import api from './api';

const devisService = {
  // Lister les devis avec filtres et pagination
  getDevis: async (params = {}) => {
    const response = await api.get('/devis', { params });
    return response.data;
  },

  // Suggérer un numéro de devis
  suggestNumero: async () => {
    const response = await api.get('/devis/suggest-numero');
    return response.data;
  },

  // Vérifier la disponibilité d'un numéro
  checkNumero: async (numero, excludeId = null) => {
    const response = await api.get('/devis/check-numero', {
      params: { numero, ...(excludeId ? { exclude_id: excludeId } : {}) }
    });
    return response.data;
  },

  // Récupérer un devis par ID
  getDevisById: async (id) => {
    const response = await api.get(`/devis/${id}`);
    return response.data;
  },

  // Créer un nouveau devis
  createDevis: async (devisData) => {
    const response = await api.post('/devis', devisData);
    return response.data;
  },

  // Mettre à jour un devis (seulement si BROUILLON)
  updateDevis: async (id, devisData) => {
    const response = await api.patch(`/devis/${id}`, devisData);
    return response.data;
  },

  // Envoyer un devis par email
  sendDevis: async (id, emailData = {}) => {
    const response = await api.post(`/devis/${id}/send`, emailData);
    return response.data;
  },

  // Marquer comme accepté
  acceptDevis: async (id, acompte_verse = 0) => {
    const response = await api.post(`/devis/${id}/accept`, { acompte_verse });
    return response.data;
  },

  // Marquer comme refusé
  refuseDevis: async (id, raison = null) => {
    const response = await api.post(`/devis/${id}/refuse`, { raison });
    return response.data;
  },

  // Télécharger le PDF
  downloadPDF: async (id) => {
    const response = await api.get(`/devis/${id}/pdf`, {
      responseType: 'blob',
      timeout: 60000 // 60s pour la génération PDF Puppeteer
    });
    return response.data;
  },

  // Dupliquer un devis
  duplicateDevis: async (id) => {
    const response = await api.post(`/devis/${id}/duplicate`);
    return response.data;
  },

  // Supprimer un devis (seulement si BROUILLON)
  deleteDevis: async (id) => {
    const response = await api.delete(`/devis/${id}`);
    return response.data;
  }
};

export default devisService;
