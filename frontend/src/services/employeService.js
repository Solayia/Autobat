import api from './api';

const employeService = {
  // Lister les employés
  getEmployes: async () => {
    const response = await api.get('/employes');
    return response.data;
  },

  // Créer un employé
  createEmploye: async (employeData) => {
    const response = await api.post('/employes', employeData);
    return response.data;
  },

  // Modifier un employé
  updateEmploye: async (employeId, employeData) => {
    const response = await api.patch(`/employes/${employeId}`, employeData);
    return response.data;
  },

  // Supprimer un employé
  deleteEmploye: async (employeId) => {
    const response = await api.delete(`/employes/${employeId}`);
    return response.data;
  },

  // Réinitialiser le mot de passe d'un employé
  resetPassword: async (employeId, new_password) => {
    const response = await api.patch(`/employes/${employeId}/reset-password`, { new_password });
    return response.data;
  },

  // Exporter les heures en CSV
  exportHeures: async (mois, annee) => {
    const response = await api.get('/employes/export-heures', {
      params: { mois, annee },
      responseType: 'blob'
    });
    return response.data;
  }
};

export default employeService;
