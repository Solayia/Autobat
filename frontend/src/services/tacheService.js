import api from './api';

const tacheService = {
  // Lister les tâches d'un chantier
  getTachesByChantier: async (chantierId) => {
    const response = await api.get(`/chantiers/${chantierId}/taches`);
    return response.data;
  },

  // Créer une tâche
  createTache: async (chantierId, tacheData) => {
    const response = await api.post(`/chantiers/${chantierId}/taches`, tacheData);
    return response.data;
  },

  // Mettre à jour une tâche
  updateTache: async (chantierId, tacheId, tacheData) => {
    const response = await api.patch(`/chantiers/${chantierId}/taches/${tacheId}`, tacheData);
    return response.data;
  },

  // Supprimer une tâche
  deleteTache: async (chantierId, tacheId) => {
    const response = await api.delete(`/chantiers/${chantierId}/taches/${tacheId}`);
    return response.data;
  },

  // Créer des tâches depuis le devis
  createTachesFromDevis: async (chantierId) => {
    const response = await api.post(`/chantiers/${chantierId}/taches/from-devis`);
    return response.data;
  },

  // Assigner un employé à une tâche (avec créneau optionnel)
  assignEmploye: async (chantierId, tacheId, employeId, scheduleData = {}) => {
    const response = await api.post(`/chantiers/${chantierId}/taches/${tacheId}/assign`, {
      employe_id: employeId,
      ...scheduleData
    });
    return response.data;
  },

  // Retirer l'assignation d'un employé
  unassignEmploye: async (chantierId, tacheId, employeId) => {
    const response = await api.delete(`/chantiers/${chantierId}/taches/${tacheId}/assign/${employeId}`);
    return response.data;
  },

  // Récupérer les créneaux planifiés pour une période
  getPlanning: async (dateDebut, dateFin) => {
    const params = {};
    if (dateDebut) params.date_debut = dateDebut instanceof Date ? dateDebut.toISOString().split('T')[0] : dateDebut;
    if (dateFin) params.date_fin = dateFin instanceof Date ? dateFin.toISOString().split('T')[0] : dateFin;
    const response = await api.get('/planning', { params });
    return response.data;
  }
};

export default tacheService;
