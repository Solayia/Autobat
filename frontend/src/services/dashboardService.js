import api from './api';

const dashboardService = {
  /**
   * Récupérer les KPIs du dashboard
   * @param {string} periode - MOIS | TRIMESTRE | ANNEE
   */
  getDashboard: async (periode = 'MOIS') => {
    const response = await api.get('/dashboard', {
      params: { periode }
    });
    return response.data;
  }
};

export default dashboardService;
