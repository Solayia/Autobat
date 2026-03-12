import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FileText, Plus, Search, Filter, Calendar, Euro, Eye, Edit, Trash2,
  Send, CheckCircle, XCircle, Clock, Grid3x3, List, Download, Copy
} from 'lucide-react';
import devisService from '../../services/devisService';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function Devis() {
  const navigate = useNavigate();
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [stats, setStats] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    loadDevis();
  }, [pagination.page, search, statut]);

  const loadDevis = async () => {
    try {
      setLoading(true);
      const data = await devisService.getDevis({
        page: pagination.page,
        limit: pagination.limit,
        search,
        statut: statut === 'all' ? undefined : statut
      });
      setDevisList(data.data || []);
      setPagination(data.pagination || pagination);
      setStats(data.stats);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des devis');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDuplicate = (e, id) => {
    e.stopPropagation();
    setConfirmDialog({
      message: `Dupliquer ce devis ? Un nouveau devis BROUILLON sera créé.`,
      confirmLabel: 'Dupliquer',
      danger: false,
      onConfirm: async () => {
        try {
          await devisService.duplicateDevis(id);
          toast.success('Devis dupliqué avec succès');
          loadDevis();
        } catch (error) {
          toast.error(error.response?.data?.message || 'Erreur lors de la duplication');
        }
      }
    });
  };

  const handleDelete = (id, numero) => {
    setConfirmDialog({
      message: `Êtes-vous sûr de vouloir supprimer le devis "${numero}" ?`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        try {
          await devisService.deleteDevis(id);
          toast.success('Devis supprimé avec succès');
          loadDevis();
        } catch (error) {
          toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
        }
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      BROUILLON: 'bg-gray-100 text-gray-800',
      ENVOYE: 'bg-blue-100 text-blue-800',
      ACCEPTE: 'bg-green-100 text-green-800',
      REFUSE: 'bg-red-100 text-red-800',
      EXPIRE: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      BROUILLON: <Clock className="w-4 h-4" />,
      ENVOYE: <Send className="w-4 h-4" />,
      ACCEPTE: <CheckCircle className="w-4 h-4" />,
      REFUSE: <XCircle className="w-4 h-4" />,
      EXPIRE: <Calendar className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-xl py-4 sm:py-5 flex items-center">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">Devis</h1>
                <p className="text-blue-100 mt-1 hidden sm:block">Gérez vos devis et propositions commerciales</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/devis/new')}
              className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-white text-primary-600 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" /><span className="hidden sm:inline">Nouveau devis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <FileText className="w-5 h-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Total ce mois</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_ce_mois || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Acceptés</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_acceptes || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Euro className="w-5 h-5 flex-shrink-0 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Montant HT</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.montant_total_ht || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-600">Taux acceptation</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.taux_acceptation || 0}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:gap-4">
            {/* Ligne 1 : Recherche */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher (numéro, client)..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Ligne 2 : filtre + compteur + toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtre statut */}
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none cursor-pointer text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="BROUILLON">Brouillons</option>
                  <option value="ENVOYE">Envoyés</option>
                  <option value="ACCEPTE">Acceptés</option>
                  <option value="REFUSE">Refusés</option>
                  <option value="EXPIRE">Expirés</option>
                </select>
              </div>

              {/* Compteur */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-xl">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-900 text-sm">{pagination.total} devis</span>
              </div>

              {/* Toggle Vue */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                    viewMode === 'cards'
                      ? 'bg-white text-green-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Vue en cartes"
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Cartes</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                    viewMode === 'table'
                      ? 'bg-white text-green-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Vue en tableau"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Tableau</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des devis */}
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600"></div>
          </div>
        ) : devisList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun devis trouvé</h3>
            <p className="text-gray-500 mb-6">Commencez par créer votre premier devis</p>
            <button
              onClick={() => navigate('/devis/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Créer votre premier devis
            </button>
          </div>
        ) : (
          <>
            {/* Vue en cartes */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {devisList.map((devis) => (
                  <div
                    key={devis.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
                    onClick={() => navigate(`/devis/${devis.id}`)}
                  >
                    {/* Header de la carte */}
                    <div className="p-4 bg-gradient-to-r from-green-500 to-green-600">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-green-100">Devis</p>
                          <h3 className="text-lg font-bold text-white">
                            {devis.numero_devis}
                          </h3>
                          <p className="text-sm text-green-100 mt-1">
                            {devis.client?.nom}
                          </p>
                          {devis.objet && (
                            <p className="text-xs text-green-200 mt-0.5 italic">
                              {devis.objet}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(devis.statut)}`}>
                          {getStatusIcon(devis.statut)}
                          {devis.statut}
                        </span>
                      </div>
                    </div>

                    {/* Contenu de la carte */}
                    <div className="p-4 sm:p-6 space-y-3">
                      {/* Informations */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-500">Date création</p>
                            <p className="text-gray-700 font-medium text-sm">{formatDate(devis.date_creation)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="w-4 h-4 flex-shrink-0 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-500">Montant TTC</p>
                            <p className="text-gray-900 font-bold text-sm sm:text-base">{formatCurrency(devis.montant_ttc)}</p>
                          </div>
                        </div>

                        {devis.date_validite && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 flex-shrink-0 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Valide jusqu'au</p>
                              <p className="text-gray-700 text-sm">{formatDate(devis.date_validite)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Nombre de lignes */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{devis.lignes?.length || 0} ligne(s)</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/devis/${devis.id}`);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </button>
                          {devis.statut === 'BROUILLON' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/devis/${devis.id}/edit`);
                              }}
                              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDuplicate(e, devis.id)}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all duration-200"
                            title="Dupliquer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {devis.statut === 'BROUILLON' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(devis.id, devis.numero_devis);
                              }}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-200"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vue en tableau */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-green-600 to-green-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Numéro
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-white uppercase tracking-wider">
                          Montant HT
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-white uppercase tracking-wider">
                          Montant TTC
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                          Lignes
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {devisList.map((devis) => (
                        <tr
                          key={devis.id}
                          className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                          onClick={() => navigate(`/devis/${devis.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{devis.numero_devis}</div>
                            {devis.objet && <div className="text-xs text-gray-500 italic">{devis.objet}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{devis.client?.nom}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{formatDate(devis.date_creation)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(devis.montant_ht)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-bold text-gray-900">{formatCurrency(devis.montant_ttc)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(devis.statut)}`}>
                              {getStatusIcon(devis.statut)}
                              {devis.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-700">{devis.lignes?.length || 0}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/devis/${devis.id}`);
                                }}
                                className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-all duration-200"
                                title="Voir"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {devis.statut === 'BROUILLON' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/devis/${devis.id}/edit`);
                                  }}
                                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
                                  title="Modifier"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {devis.statut === 'BROUILLON' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(devis.id, devis.numero_devis);
                                  }}
                                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-200"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page <span className="font-semibold">{pagination.page}</span> sur{' '}
                    <span className="font-semibold">{pagination.pages}</span>
                    {' '}(<span className="font-semibold">{pagination.total}</span> résultats)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:hover:shadow-md"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:hover:shadow-md"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog confirm={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
}
