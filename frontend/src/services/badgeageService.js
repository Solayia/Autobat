import api from './api';
import db from '../db/badgeageDb';

const badgeageService = {
  // Lister les badgeages d'un chantier
  getBadgeagesByChantier: async (chantierId, params = {}) => {
    const response = await api.get(`/chantiers/${chantierId}/badgeages`, { params });
    return response.data;
  },

  // Créer un badgeage manuel (manager/admin)
  createBadgeage: async (chantierId, badgeageData) => {
    const response = await api.post(`/chantiers/${chantierId}/badgeages`, badgeageData);
    return response.data;
  },

  // Récupérer les chantiers de l'employé connecté
  getMesChantiers: async () => {
    const response = await api.get('/chantiers/mes-chantiers');
    return response.data;
  },

  // Créer un badge GPS (online)
  badgerGPS: async (chantierId, badgeData) => {
    const response = await api.post(`/chantiers/${chantierId}/badgeages`, {
      ...badgeData,
      methode: 'GPS'
    });
    return response.data;
  },

  // Sauvegarder un badge en offline (IndexedDB)
  saveBadgeOffline: async (badgeData) => {
    const local_id = await db.badgeages_pending.add({
      ...badgeData,
      timestamp: badgeData.timestamp || new Date().toISOString()
    });
    return local_id;
  },

  // Compter les badges en attente de sync
  getPendingCount: async () => {
    return await db.badgeages_pending.count();
  },

  // Récupérer les badges en attente
  getPendingBadges: async () => {
    return await db.badgeages_pending.toArray();
  },

  // Synchroniser les badges offline
  syncOfflineBadges: async () => {
    const pending = await db.badgeages_pending.toArray();
    if (pending.length === 0) return { synced: 0, results: [] };

    const response = await api.post('/badgeages/sync', { badges: pending });
    const { synced, results = [] } = response.data;

    // Supprimer les badges synchronisés avec succès
    const syncedLocalIds = results
      .filter(r => r.id)
      .map(r => r.local_id);

    for (const local_id of syncedLocalIds) {
      await db.badgeages_pending.delete(local_id);
    }

    return response.data;
  }
};

export default badgeageService;
