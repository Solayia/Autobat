import api from './api';

const fournisseurService = {
  // Fournisseurs
  getFournisseurs: async () => {
    const response = await api.get('/factures-fournisseurs/fournisseurs');
    return response.data;
  },
  createFournisseur: async (data) => {
    const response = await api.post('/factures-fournisseurs/fournisseurs', data);
    return response.data;
  },
  updateFournisseur: async (id, data) => {
    const response = await api.patch(`/factures-fournisseurs/fournisseurs/${id}`, data);
    return response.data;
  },
  deleteFournisseur: async (id) => {
    const response = await api.delete(`/factures-fournisseurs/fournisseurs/${id}`);
    return response.data;
  },

  // Factures fournisseurs
  getFactures: async (filters = {}) => {
    const response = await api.get('/factures-fournisseurs', { params: filters });
    return response.data;
  },
  getFacture: async (id) => {
    const response = await api.get(`/factures-fournisseurs/${id}`);
    return response.data;
  },
  createFacture: async (data) => {
    const response = await api.post('/factures-fournisseurs', data);
    return response.data;
  },
  updateFacture: async (id, data) => {
    const response = await api.patch(`/factures-fournisseurs/${id}`, data);
    return response.data;
  },
  deleteFacture: async (id) => {
    const response = await api.delete(`/factures-fournisseurs/${id}`);
    return response.data;
  },
  marquerPayee: async (id, date_paiement) => {
    const response = await api.post(`/factures-fournisseurs/${id}/payer`, { date_paiement });
    return response.data;
  }
};

export default fournisseurService;
