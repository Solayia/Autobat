import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Users, Plus, Search, Filter, Mail, Phone, MapPin, Building2,
  User2, FileText, Briefcase, Receipt, Eye, Edit, Trash2, Hash,
  Grid3x3, List
} from 'lucide-react';
import clientService from '../../services/clientService';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [search, setSearch] = useState('');
  const [actif, setActif] = useState('true');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'table'

  useEffect(() => {
    loadClients();
  }, [pagination.page, search, actif]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClients({
        page: pagination.page,
        limit: pagination.limit,
        search,
        actif
      });
      setClients(data.clients);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${nom}" ?`)) {
      return;
    }

    try {
      const result = await clientService.deleteClient(id);

      if (result.soft_delete) {
        toast.success(result.message);
      } else {
        toast.success('Client supprimé définitivement');
      }

      loadClients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-xl py-4 sm:py-5 flex items-center">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">Clients</h1>
                <p className="text-blue-100 mt-1 hidden sm:block">Gérez vos clients et leurs informations</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/clients/new')}
              className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-white text-primary-600 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" /><span className="hidden sm:inline">Nouveau client</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
          <div className="flex flex-col gap-2 sm:gap-4">
            {/* Recherche — ligne 1 */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher (nom, email, téléphone, ville, SIRET)..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Ligne 2 : filtre + compteur + toggle */}
            <div className="flex items-center gap-2 flex-wrap">
            {/* Filtre statut */}
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={actif}
                onChange={(e) => setActif(e.target.value)}
                className="w-full pl-10 pr-8 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="true">Actifs uniquement</option>
                <option value="false">Inactifs uniquement</option>
              </select>
            </div>

            {/* Compteur */}
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">{pagination.total} clients</span>
            </div>

            {/* Toggle Vue */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Vue en cartes"
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Cartes</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Vue en tableau"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Tableau</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun client trouvé</h3>
            <p className="text-gray-500 mb-6">Commencez par créer votre premier client</p>
            <button
              onClick={() => navigate('/clients/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Créer votre premier client
            </button>
          </div>
        ) : (
          <>
            {/* Vue en cartes */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {clients.map((client) => {
                const isParticulier = client.type === 'PARTICULIER';
                const themeColor = isParticulier ? 'purple' : 'blue';

                return (
                  <div
                    key={client.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    {/* Header de la carte */}
                    <div className={`p-3 sm:p-4 bg-gradient-to-r ${isParticulier ? 'from-purple-500 to-purple-600' : 'from-blue-500 to-blue-600'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isParticulier ? 'bg-purple-400/30' : 'bg-blue-400/30'} backdrop-blur-sm`}>
                            {isParticulier ? (
                              <User2 className="w-6 h-6 text-white" />
                            ) : (
                              <Building2 className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {isParticulier && client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isParticulier ? 'bg-purple-400/40' : 'bg-blue-400/40'} text-white backdrop-blur-sm`}>
                                {isParticulier ? 'Particulier' : 'Entreprise'}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${client.actif ? 'bg-green-400/40' : 'bg-red-400/40'} text-white backdrop-blur-sm`}>
                                {client.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenu de la carte */}
                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      {/* Informations de contact */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className={`w-4 h-4 flex-shrink-0 ${isParticulier ? 'text-purple-500' : 'text-blue-500'}`} />
                          <span className="text-gray-700 truncate flex-1">{client.email}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Phone className={`w-4 h-4 flex-shrink-0 ${isParticulier ? 'text-purple-500' : 'text-blue-500'}`} />
                          <span className="text-gray-700">{client.telephone}</span>
                        </div>

                        {!isParticulier && client.siret && (
                          <div className="flex items-center gap-2 text-sm">
                            <Hash className="w-4 h-4 flex-shrink-0 text-blue-500" />
                            <span className="text-gray-700">{client.siret}</span>
                          </div>
                        )}

                        {client.ville && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className={`w-4 h-4 flex-shrink-0 ${isParticulier ? 'text-purple-500' : 'text-blue-500'}`} />
                            <span className="text-gray-700">
                              {client.code_postal && `${client.code_postal} `}{client.ville}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Statistiques */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <div className="text-center">
                            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 bg-blue-100 rounded-lg">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-xs text-gray-500">Devis</p>
                            <p className="text-sm font-bold text-gray-900">{client._count.devis}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 bg-green-100 rounded-lg">
                              <Briefcase className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="text-xs text-gray-500">Chantiers</p>
                            <p className="text-sm font-bold text-gray-900">{client._count.chantiers}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 bg-yellow-100 rounded-lg">
                              <Receipt className="w-4 h-4 text-yellow-600" />
                            </div>
                            <p className="text-xs text-gray-500">Factures</p>
                            <p className="text-sm font-bold text-gray-900">{client._count.factures}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clients/${client.id}`);
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r ${isParticulier ? 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' : 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'} text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg`}
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clients/${client.id}/edit`);
                            }}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(client.id, isParticulier && client.prenom ? `${client.prenom} ${client.nom}` : client.nom);
                            }}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-200"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}

            {/* Vue en tableau */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Téléphone
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Ville
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          SIRET
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                          Devis
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                          Chantiers
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                          Factures
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.map((client) => {
                        const isParticulier = client.type === 'PARTICULIER';
                        return (
                          <tr
                            key={client.id}
                            className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${isParticulier ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                  {isParticulier ? (
                                    <User2 className={`w-4 h-4 ${isParticulier ? 'text-purple-600' : 'text-blue-600'}`} />
                                  ) : (
                                    <Building2 className={`w-4 h-4 ${isParticulier ? 'text-purple-600' : 'text-blue-600'}`} />
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${isParticulier ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {isParticulier ? 'Particulier' : 'Entreprise'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {isParticulier && client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {client.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {client.telephone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                {client.ville && (
                                  <>
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {client.code_postal && `${client.code_postal} `}{client.ville}
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                {!isParticulier && client.siret && (
                                  <>
                                    <Hash className="w-4 h-4 text-gray-400" />
                                    {client.siret}
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                client.actif
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {client.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex flex-col items-center">
                                <FileText className="w-4 h-4 text-blue-600 mb-1" />
                                <span className="text-sm font-semibold text-gray-900">{client._count.devis}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex flex-col items-center">
                                <Briefcase className="w-4 h-4 text-green-600 mb-1" />
                                <span className="text-sm font-semibold text-gray-900">{client._count.chantiers}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex flex-col items-center">
                                <Receipt className="w-4 h-4 text-yellow-600 mb-1" />
                                <span className="text-sm font-semibold text-gray-900">{client._count.factures}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/clients/${client.id}`);
                                  }}
                                  className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all duration-200"
                                  title="Voir"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/clients/${client.id}/edit`);
                                  }}
                                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
                                  title="Modifier"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(client.id, isParticulier && client.prenom ? `${client.prenom} ${client.nom}` : client.nom);
                                  }}
                                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-200"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:hover:shadow-md"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:hover:shadow-md"
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
    </div>
  );
}
