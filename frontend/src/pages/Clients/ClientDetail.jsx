import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, User, FileText,
  Briefcase, Receipt, Calendar, Edit, User2, Hash, Home
} from 'lucide-react';
import clientService from '../../services/clientService';

export default function ClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClientById(id);
      setClient(data.client);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement du client');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const isParticulier = client.type === 'PARTICULIER';
  const themeColor = isParticulier ? 'purple' : 'blue';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Premium avec dégradé */}
      <div className={`bg-gradient-to-r ${isParticulier ? 'from-purple-600 to-purple-800' : 'from-blue-600 to-blue-800'} text-white shadow-xl`}>
        <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Ligne 1 : retour + modifier */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={() => navigate('/clients')}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>
            <button
              onClick={() => navigate(`/clients/${id}/edit`)}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-6 sm:py-3 bg-white ${isParticulier ? 'text-purple-600' : 'text-blue-600'} hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 shadow-lg text-sm`}
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Modifier</span>
            </button>
          </div>
          {/* Ligne 2 : avatar + nom + badges + date */}
          <div className="flex items-center gap-3">
            <div className={`p-2 sm:p-3 rounded-xl ${isParticulier ? 'bg-purple-500/30' : 'bg-blue-500/30'} backdrop-blur-sm flex-shrink-0`}>
              {isParticulier ? (
                <User2 className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : (
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold truncate">
                {isParticulier && client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isParticulier ? 'bg-purple-500/30' : 'bg-blue-500/30'} backdrop-blur-sm`}>
                  {isParticulier ? 'Particulier' : 'Entreprise'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${client.actif ? 'bg-green-500/30' : 'bg-red-500/30'} backdrop-blur-sm`}>
                  {client.actif ? 'Actif' : 'Inactif'}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/70">
                  <Calendar className="w-3 h-3" />
                  Depuis le {formatDate(client.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Informations de contact */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
              <div className={`bg-gradient-to-r ${isParticulier ? 'from-purple-500 to-purple-600' : 'from-blue-500 to-blue-600'} px-4 py-3 sm:px-6 sm:py-4`}>
                <h2 className="text-base sm:text-xl font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations de contact
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  {/* Prénom et Nom pour particuliers */}
                  {isParticulier && client.prenom && (
                    <>
                      <div className="group">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                            <User2 className="w-4 h-4 text-purple-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-500">Prénom</p>
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 ml-8">{client.prenom}</p>
                      </div>
                      <div className="group">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-500">Nom</p>
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 ml-8">{client.nom}</p>
                      </div>
                    </>
                  )}

                  {/* Nom entreprise */}
                  {!isParticulier && (
                    <div className="md:col-span-2 group">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Nom de l'entreprise</p>
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 ml-8">{client.nom}</p>
                    </div>
                  )}

                  {/* Email */}
                  <div className="group">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-2 ${isParticulier ? 'bg-purple-100' : 'bg-blue-100'} rounded-lg group-hover:${isParticulier ? 'bg-purple-200' : 'bg-blue-200'} transition-colors`}>
                        <Mail className={`w-4 h-4 ${isParticulier ? 'text-purple-600' : 'text-blue-600'}`} />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                    </div>
                    <a
                      href={`mailto:${client.email}`}
                      className={`text-lg font-semibold ${isParticulier ? 'text-purple-600 hover:text-purple-800' : 'text-blue-600 hover:text-blue-800'} ml-10 hover:underline transition-colors`}
                    >
                      {client.email}
                    </a>
                  </div>

                  {/* Téléphone */}
                  <div className="group">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-2 ${isParticulier ? 'bg-purple-100' : 'bg-blue-100'} rounded-lg group-hover:${isParticulier ? 'bg-purple-200' : 'bg-blue-200'} transition-colors`}>
                        <Phone className={`w-4 h-4 ${isParticulier ? 'text-purple-600' : 'text-blue-600'}`} />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Téléphone</p>
                    </div>
                    <a
                      href={`tel:${client.telephone}`}
                      className={`text-lg font-semibold ${isParticulier ? 'text-purple-600 hover:text-purple-800' : 'text-blue-600 hover:text-blue-800'} ml-10 hover:underline transition-colors`}
                    >
                      {client.telephone}
                    </a>
                  </div>

                  {/* SIRET pour entreprises */}
                  {!isParticulier && client.siret && (
                    <div className="group">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <Hash className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">SIRET</p>
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 ml-8">{client.siret}</p>
                    </div>
                  )}

                  {/* Adresse */}
                  {(client.adresse || client.ville) && (
                    <div className="md:col-span-2 group">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-2 ${isParticulier ? 'bg-purple-100' : 'bg-blue-100'} rounded-lg group-hover:${isParticulier ? 'bg-purple-200' : 'bg-blue-200'} transition-colors`}>
                          <MapPin className={`w-4 h-4 ${isParticulier ? 'text-purple-600' : 'text-blue-600'}`} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Adresse</p>
                      </div>
                      <div className="ml-8 text-gray-900">
                        {client.adresse && <p className="text-sm sm:text-base font-semibold">{client.adresse}</p>}
                        {client.ville && (
                          <p className="text-sm text-gray-600 mt-0.5">
                            {client.code_postal && `${client.code_postal} `}{client.ville}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {client.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-2 ${isParticulier ? 'bg-purple-100' : 'bg-blue-100'} rounded-lg`}>
                        <FileText className={`w-4 h-4 ${isParticulier ? 'text-purple-600' : 'text-blue-600'}`} />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Notes internes</p>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap ml-10 bg-gray-50 p-4 rounded-xl">{client.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Devis récents */}
            {client.devis && client.devis.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
                  <h2 className="text-base sm:text-xl font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Devis récents ({client._count.devis})
                  </h2>
                  <Link to="/devis" className="text-sm text-white/90 hover:text-white hover:underline">
                    Voir tous
                  </Link>
                </div>
                <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                  {client.devis.map((devis) => (
                    <div key={devis.id} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all duration-200">
                      <div>
                        <p className="font-semibold text-gray-900">{devis.numero_devis}</p>
                        <p className="text-sm text-gray-500">{formatDate(devis.date_creation)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(devis.montant_ttc)}</p>
                        <span className={`inline-block mt-1 text-xs px-3 py-1 rounded-full font-medium ${
                          devis.statut === 'ACCEPTE' ? 'bg-green-100 text-green-800' :
                          devis.statut === 'REFUSE' ? 'bg-red-100 text-red-800' :
                          devis.statut === 'ENVOYE' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {devis.statut}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chantiers récents */}
            {client.chantiers && client.chantiers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
                  <h2 className="text-base sm:text-xl font-semibold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Chantiers récents ({client._count.chantiers})
                  </h2>
                  <Link to="/chantiers" className="text-sm text-white/90 hover:text-white hover:underline">
                    Voir tous
                  </Link>
                </div>
                <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                  {client.chantiers.map((chantier) => (
                    <div key={chantier.id} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl hover:from-green-50 hover:to-green-100 transition-all duration-200">
                      <div>
                        <p className="font-semibold text-gray-900">{chantier.nom}</p>
                        <p className="text-sm text-gray-500">
                          Début: {formatDate(chantier.date_debut)}
                          {chantier.date_fin_prevue && ` - Fin prévue: ${formatDate(chantier.date_fin_prevue)}`}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        chantier.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-800' :
                        chantier.statut === 'TERMINE' ? 'bg-green-100 text-green-800' :
                        chantier.statut === 'EN_PAUSE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {chantier.statut}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Factures récentes */}
            {client.factures && client.factures.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
                  <h2 className="text-base sm:text-xl font-semibold text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Factures récentes ({client._count.factures})
                  </h2>
                  <Link to="/factures" className="text-sm text-white/90 hover:text-white hover:underline">
                    Voir toutes
                  </Link>
                </div>
                <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                  {client.factures.map((facture) => (
                    <div key={facture.id} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-yellow-50 rounded-xl hover:from-yellow-50 hover:to-yellow-100 transition-all duration-200">
                      <div>
                        <p className="font-semibold text-gray-900">{facture.numero_facture}</p>
                        <p className="text-sm text-gray-500">{formatDate(facture.date_emission)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(facture.montant_ttc)}</p>
                        <span className={`inline-block mt-1 text-xs px-3 py-1 rounded-full font-medium ${
                          facture.statut_paiement === 'PAYE' ? 'bg-green-100 text-green-800' :
                          facture.statut_paiement === 'PARTIEL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {facture.statut_paiement}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne latérale - Statistiques et actions */}
          <div className="space-y-4 sm:space-y-6">
            {/* Statistiques */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
              <div className={`bg-gradient-to-r ${isParticulier ? 'from-purple-500 to-purple-600' : 'from-blue-500 to-blue-600'} px-4 py-3 sm:px-6 sm:py-4`}>
                <h2 className="text-base sm:text-xl font-semibold text-white">Statistiques</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Devis</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-700 mt-1">{client._count.devis}</p>
                    </div>
                    <div className="p-3 bg-blue-600 rounded-xl">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Chantiers</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-700 mt-1">{client._count.chantiers}</p>
                    </div>
                    <div className="p-3 bg-green-600 rounded-xl">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Factures</p>
                      <p className="text-2xl sm:text-3xl font-bold text-yellow-700 mt-1">{client._count.factures}</p>
                    </div>
                    <div className="p-3 bg-yellow-600 rounded-xl">
                      <Receipt className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
              <div className={`bg-gradient-to-r ${isParticulier ? 'from-purple-500 to-purple-600' : 'from-blue-500 to-blue-600'} px-4 py-3 sm:px-6 sm:py-4`}>
                <h2 className="text-base sm:text-xl font-semibold text-white">Actions rapides</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                <button className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${isParticulier ? 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' : 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'} text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200`}>
                  <FileText className="w-5 h-5" />
                  Créer un devis
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
                  <Briefcase className="w-5 h-5" />
                  Créer un chantier
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
                  <Receipt className="w-5 h-5" />
                  Créer une facture
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
