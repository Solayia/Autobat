import api from './api';

/**
 * Service pour la gestion des clients
 */
const clientService = {
  /**
   * Créer un nouveau client
   */
  async createClient(data) {
    const response = await api.post('/clients', data);
    return response.data;
  },

  /**
   * Récupérer la liste des clients avec pagination et recherche
   */
  async getClients({ page = 1, limit = 20, search = '', actif = 'true', sort = 'nom', order = 'asc' } = {}) {
    const response = await api.get('/clients', {
      params: { page, limit, search, actif, sort, order }
    });
    return response.data;
  },

  /**
   * Récupérer un client par ID
   */
  async getClientById(id) {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour un client
   */
  async updateClient(id, data) {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un client
   */
  async deleteClient(id) {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  }
};

export default clientService;
