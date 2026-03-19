import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Calendar, Euro, Check, X, Clock, Receipt } from 'lucide-react';
import factureService from '../../services/factureService';

export default function Factures() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [factures, setFactures] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    statut_facture: '',
    statut_paiement: ''
  });

  useEffect(() => {
    loadFactures();
  }, [filters]);

  const loadFactures = async () => {
    try {
      setLoading(true);
      const data = await factureService.getFactures(filters);
      setFactures(data.data || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutFactureBadge = (statut) => {
    const badges = {
      BROUILLON: { color: 'bg-gray-100 text-gray-700', label: 'Brouillon' },
      ENVOYEE: { color: 'bg-blue-100 text-blue-700', label: 'Envoyée' }
    };
    return badges[statut] || badges.BROUILLON;
  };

  const getStatutPaiementBadge = (statut) => {
    const badges = {
      EN_ATTENTE: { color: 'bg-yellow-100 text-yellow-700', label: 'En attente', icon: Clock },
      PARTIEL: { color: 'bg-orange-100 text-orange-700', label: 'Partiel', icon: Clock },
      PAYE: { color: 'bg-green-100 text-green-700', label: 'Payé', icon: Check },
      ANNULE: { color: 'bg-red-100 text-red-700', label: 'Annulé', icon: X }
    };
    return badges[statut] || badges.EN_ATTENTE;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading && factures.length === 0) {
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
                <Receipt className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">Factures</h1>
                <p className="text-blue-100 mt-1 hidden sm:block">
                  {pagination.total || 0} facture{pagination.total > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/factures/new')}
              className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-white text-primary-600 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" /><span className="hidden sm:inline">Nouvelle facture</span>
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-2 sm:gap-4">
          {/* Ligne 1 : Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro ou client..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, page: 1, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          {/* Ligne 2 : Filtres statuts + compteur */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-1 w-full">
              <select
                value={filters.statut_facture}
                onChange={(e) => setFilters({ ...filters, page: 1, statut_facture: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="ENVOYEE">Envoyée</option>
              </select>
              <select
                value={filters.statut_paiement}
                onChange={(e) => setFilters({ ...filters, page: 1, statut_paiement: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="">Tous les paiements</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="PARTIEL">Partiel</option>
                <option value="PAYE">Payé</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
            {pagination.total > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 flex-shrink-0">
                <Receipt className="w-4 h-4" />
                <span className="font-semibold text-gray-900">{pagination.total}</span>
                facture{pagination.total > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Factures list */}
      {factures.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune facture</h3>
          <p className="text-gray-500 mb-6">Commencez par créer une nouvelle facture</p>
          <button
            onClick={() => navigate('/factures/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle facture
          </button>
        </div>
      ) : (
        <div>
          {/* Vue cartes — mobile */}
          <div className="sm:hidden space-y-3">
            {factures.map((facture) => {
              const badgeFacture = getStatutFactureBadge(facture.statut_facture);
              const badgePaiement = getStatutPaiementBadge(facture.statut_paiement);
              const IconPaiement = badgePaiement.icon;
              return (
                <div
                  key={facture.id}
                  onClick={() => navigate(`/factures/${facture.id}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer active:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-900 truncate">{facture.numero_facture}</span>
                      </div>
                      {facture.objet && (
                        <span className="text-sm text-gray-700 truncate mt-0.5 ml-6">{facture.objet}</span>
                      )}
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${badgeFacture.color}`}>
                      {badgeFacture.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-1">{facture.client_nom}</p>
                  {facture.chantier?.nom && (
                    <p className="text-xs text-gray-500 mb-2 truncate">{facture.chantier.nom}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(facture.date_emission)}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(facture.montant_ttc)}</p>
                      {facture.reste_a_payer > 0 && (
                        <p className="text-xs text-orange-600">Reste: {formatCurrency(facture.reste_a_payer)}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgePaiement.color}`}>
                      {IconPaiement && <IconPaiement className="w-3 h-3" />}
                      {badgePaiement.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vue tableau — desktop */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chantier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Montant TTC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {factures.map((facture) => {
                    const badgeFacture = getStatutFactureBadge(facture.statut_facture);
                    const badgePaiement = getStatutPaiementBadge(facture.statut_paiement);
                    const IconPaiement = badgePaiement.icon;
                    return (
                      <tr
                        key={facture.id}
                        onClick={() => navigate(`/factures/${facture.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{facture.numero_facture}</span>
                          </div>
                          {facture.objet && (
                            <div className="text-xs text-gray-500 mt-0.5 ml-6 truncate max-w-[180px]">{facture.objet}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[130px]">
                          <div className="text-sm text-gray-900 truncate">{facture.client_nom}</div>
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <div className="text-sm text-gray-900 truncate">{facture.chantier?.nom || '-'}</div>
                          {facture.chantier?.reference && (
                            <div className="text-xs text-gray-500 truncate">{facture.chantier.reference}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {formatDate(facture.date_emission)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Euro className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(facture.montant_ttc)}</span>
                          </div>
                          {facture.reste_a_payer > 0 && (
                            <div className="text-xs text-orange-600 mt-0.5">Reste: {formatCurrency(facture.reste_a_payer)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeFacture.color}`}>
                            {badgeFacture.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badgePaiement.color}`}>
                            {IconPaiement && <IconPaiement className="w-3 h-3" />}
                            {badgePaiement.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
