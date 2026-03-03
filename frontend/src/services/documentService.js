import api from './api';

const documentService = {
  // Lister les documents d'un chantier
  getDocumentsByChantier: async (chantierId, dossier = null) => {
    const params = dossier !== null ? { dossier } : {};
    const response = await api.get(`/chantiers/${chantierId}/documents`, { params });
    return response.data;
  },

  // Upload un document
  uploadDocument: async (chantierId, file, dossier = null, description = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (dossier) formData.append('dossier', dossier);
    if (description) formData.append('description', description);

    const response = await api.post(`/chantiers/${chantierId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Supprimer un document
  deleteDocument: async (chantierId, documentId) => {
    const response = await api.delete(`/chantiers/${chantierId}/documents/${documentId}`);
    return response.data;
  },

  // Créer un dossier
  createFolder: async (chantierId, nom) => {
    const response = await api.post(`/chantiers/${chantierId}/documents/folders`, { nom });
    return response.data;
  }
};

export default documentService;
