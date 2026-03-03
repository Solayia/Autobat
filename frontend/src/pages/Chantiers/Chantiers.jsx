import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MapPin, Calendar, Users, Clock, Building, ChevronRight } from 'lucide-react';
import chantierService from '../../services/chantierService';
import useAuthStore from '../../stores/authStore';

export default function Chantiers() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canCreate = user?.role !== 'EMPLOYEE';
  const [loading, setLoading] = useState(true);
  const [chantiers, setChantiers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    statut: ''
  });

  useEffect(() => {
    loadChantiers();
  }, [filters]);

  const loadChantiers = async () => {
    try {
      setLoading(true);
      const data = await chantierService.getChantiers(filters);
      setChantiers(data.data || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Erreur chargement chantiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    const badges = {
      PLANIFIE: { color: 'bg-blue-100 text-blue-700', label: 'Planifié' },
      EN_COURS: { color: 'bg-green-100 text-green-700', label: 'En cours' },
      TERMINE: { color: 'bg-gray-100 text-gray-700', label: 'Terminé' },
      ANNULE: { color: 'bg-red-100 text-red-700', label: 'Annulé' }
    };
    return badges[statut] || badges.PLANIFIE;
  };

  const getStatutHeaderColors = (statut) => {
    const colors = {
      PLANIFIE: 'from-blue-600 to-blue-800',
      EN_COURS: 'from-green-600 to-green-800',
      TERMINE: 'from-gray-600 to-gray-800',
      ANNULE: 'from-red-600 to-red-800'
    };
    return colors[statut] || colors.PLANIFIE;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading && chantiers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-xl py-4 sm:py-5 flex items-center">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Building className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">Chantiers</h1>
                <p className="text-blue-100 mt-1 hidden sm:block">
                  {pagination.total || 0} chantier{pagination.total > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {canCreate && (
              <button
                onClick={() => navigate('/chantiers/new')}
                className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-white text-primary-600 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" /><span className="hidden sm:inline">Nouveau chantier</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou référence..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, page: 1, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Statut filter */}
            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, page: 1, statut: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
          {pagination.total > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Building className="w-4 h-4" />
              <span className="font-semibold text-gray-900">{pagination.total}</span>
              chantier{pagination.total > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Chantiers grid */}
      {chantiers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun chantier</h3>
          <p className="text-gray-500 mb-6">Commencez par créer un nouveau chantier</p>
          <button
            onClick={() => navigate('/chantiers/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau chantier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {chantiers.map((chantier) => {
            const badge = getStatutBadge(chantier.statut);

            return (
              <div
                key={chantier.id}
                onClick={() => navigate(`/chantiers/${chantier.id}`)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden border border-gray-100"
              >
                {/* Header avec statut */}
                <div className={`px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r ${getStatutHeaderColors(chantier.statut)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base sm:text-lg line-clamp-2">
                        {chantier.nom}
                      </h3>
                      <p className="text-green-100 text-sm mt-0.5">{chantier.reference}</p>
                    </div>
                    <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${badge.color} bg-white/20 text-white border border-white/30`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-2 sm:space-y-3">
                  {/* Client */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{chantier.client?.nom || 'Client inconnu'}</span>
                  </div>

                  {/* Adresse */}
                  {chantier.adresse && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="line-clamp-2">{chantier.adresse}</span>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {formatDate(chantier.date_debut)} - {formatDate(chantier.date_fin_prevue)}
                    </span>
                  </div>

                  {/* Employés assignés */}
                  {chantier.employes && chantier.employes.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{chantier.employes.length} employé{chantier.employes.length > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Durée */}
                  {chantier.duree_estimee_heures && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{chantier.duree_estimee_heures}h estimées</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    {chantier.montant_ht ? (
                      <>
                        <span className="text-sm text-gray-500">Montant HT</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(chantier.montant_ht)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-primary-600 font-medium ml-auto flex items-center gap-1">
                        Voir le détail <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 sm:mt-8 bg-white rounded-2xl shadow-lg px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} sur {pagination.pages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
