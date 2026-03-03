import api from './api';

const catalogueService = {
  // Lister les ouvrages du catalogue
  getOuvrages: async (params = {}) => {
    const response = await api.get('/catalogue', { params });
    return response.data;
  },

  // Récupérer un ouvrage par ID
  getOuvrageById: async (id) => {
    const response = await api.get(`/catalogue/${id}`);
    return response.data;
  },

  // Créer un ouvrage personnalisé
  createOuvrage: async (ouvrageData) => {
    const response = await api.post('/catalogue', ouvrageData);
    return response.data;
  },

  // Mettre à jour un ouvrage personnalisé
  updateOuvrage: async (id, ouvrageData) => {
    const response = await api.patch(`/catalogue/${id}`, ouvrageData);
    return response.data;
  },

  // Supprimer un ouvrage personnalisé
  deleteOuvrage: async (id) => {
    const response = await api.delete(`/catalogue/${id}`);
    return response.data;
  },

  // Télécharger le template CSV
  downloadTemplate: async () => {
    const response = await api.get('/catalogue/export-template', {
      responseType: 'blob'
    });

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'catalogue-template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Importer un CSV
  importCSV: async (file) => {
    const csvContent = await file.text();
    const response = await api.post('/catalogue/import-csv', { csv: csvContent });
    return response.data;
  }
};

export default catalogueService;
