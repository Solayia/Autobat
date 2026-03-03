import api from './api';

const chantierService = {
  // Lister les chantiers
  getChantiers: async (params = {}) => {
    const response = await api.get('/chantiers', { params });
    return response.data;
  },

  // Récupérer un chantier par ID
  getChantierById: async (id) => {
    const response = await api.get(`/chantiers/${id}`);
    return response.data;
  },

  // Créer un chantier depuis un devis
  createChantier: async (chantierData) => {
    const response = await api.post('/chantiers', chantierData);
    return response.data;
  },

  // Mettre à jour un chantier
  updateChantier: async (id, chantierData) => {
    const response = await api.patch(`/chantiers/${id}`, chantierData);
    return response.data;
  },

  // Démarrer un chantier
  startChantier: async (id) => {
    const response = await api.post(`/chantiers/${id}/start`);
    return response.data;
  },

  // Terminer un chantier
  completeChantier: async (id) => {
    const response = await api.post(`/chantiers/${id}/complete`);
    return response.data;
  },

  // Annuler un chantier
  cancelChantier: async (id) => {
    const response = await api.post(`/chantiers/${id}/cancel`);
    return response.data;
  },

  // Assigner des employés
  assignEmployees: async (chantierId, employeeIds) => {
    const response = await api.post(`/chantiers/${chantierId}/assign`, { employee_ids: employeeIds });
    return response.data;
  }
};

export default chantierService;
