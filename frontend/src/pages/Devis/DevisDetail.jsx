import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Copy,
  Trash2,
  AlertCircle,
  Package,
  ChevronRight
} from 'lucide-react';
import devisService from '../../services/devisService';
import settingsService from '../../services/settingsService';

export default function DevisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [devis, setDevis] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [raisonRefus, setRaisonRefus] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acompteVerse, setAcompteVerse] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devisData, settingsData] = await Promise.all([
        devisService.getDevisById(id),
        settingsService.getSettings()
      ]);
      setDevis(devisData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
      navigate('/devis');
    } finally {
      setLoading(false);
    }
  };

  const loadDevis = async () => {
    try {
      const data = await devisService.getDevisById(id);
      setDevis(data);
    } catch (error) {
      console.error('Erreur chargement devis:', error);
      toast.error('Erreur lors du chargement du devis');
    }
  };


  const handleMarkAsSent = async () => {
    try {
      setActionLoading(true);
      // Envoyer avec skip_email=true pour juste changer le statut
      await devisService.sendDevis(id, { skip_email: true });
      toast.success('Devis marqué comme remis au client');
      await loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = () => {
    setAcompteVerse('');
    setShowAcceptModal(true);
  };

  const handleConfirmAccept = async () => {
    try {
      setActionLoading(true);
      setShowAcceptModal(false);
      await devisService.acceptDevis(id, parseFloat(acompteVerse) || 0);
      toast.success('Devis marqué comme accepté');
      loadDevis();
    } catch (error) {
      console.error('Erreur acceptation devis:', error);
      toast.error('Erreur lors de l\'acceptation du devis');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuse = () => {
    setShowRefuseModal(true);
  };

  const handleConfirmRefuse = async () => {
    try {
      setActionLoading(true);
      setShowRefuseModal(false);
      await devisService.refuseDevis(id, raisonRefus || null);
      toast.success('Devis marqué comme refusé');
      setRaisonRefus('');
      loadDevis();
    } catch (error) {
      console.error('Erreur refus devis:', error);
      toast.error('Erreur lors du refus du devis');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setActionLoading(true);
      const blob = await devisService.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${devis.numero_devis}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      toast.error('Erreur lors du téléchargement du PDF');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!confirm('Dupliquer ce devis ?')) return;

    try {
      setActionLoading(true);
      const newDevis = await devisService.duplicateDevis(id);
      toast.success('Devis dupliqué avec succès');
      navigate(`/devis/${newDevis.id}`);
    } catch (error) {
      console.error('Erreur duplication devis:', error);
      toast.error('Erreur lors de la duplication du devis');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce devis ? Cette action est irréversible.')) return;

    try {
      setActionLoading(true);
      await devisService.deleteDevis(id);
      toast.success('Devis supprimé avec succès');
      navigate('/devis');
    } catch (error) {
      console.error('Erreur suppression devis:', error);
      toast.error('Erreur lors de la suppression du devis');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      BROUILLON: 'bg-gray-100 text-gray-800 border-gray-300',
      ENVOYE: 'bg-blue-100 text-blue-800 border-blue-300',
      ACCEPTE: 'bg-green-100 text-green-800 border-green-300',
      REFUSE: 'bg-red-100 text-red-800 border-red-300',
      EXPIRE: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      BROUILLON: <Clock className="w-4 h-4" />,
      ENVOYE: <Send className="w-4 h-4" />,
      ACCEPTE: <CheckCircle className="w-4 h-4" />,
      REFUSE: <XCircle className="w-4 h-4" />,
      EXPIRE: <Calendar className="w-4 h-4" />
    };
    return icons[status];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!devis) return null;

  const client = devis.client;
  const isParticulier = client?.type === 'PARTICULIER';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="px-8 py-6">
            {/* Bouton retour + Titre */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate('/devis')}
                className="flex items-center gap-2 text-white hover:text-green-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Retour aux devis</span>
              </button>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${getStatusColor(devis.statut)}`}>
                {getStatusIcon(devis.statut)}
                <span className="font-semibold">{devis.statut}</span>
              </div>
            </div>

            {/* Infos principales */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/30 backdrop-blur-sm">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">{devis.numero_devis}</h1>
                  <p className="text-green-100 text-lg">{devis.objet || 'Sans objet'}</p>
                </div>
              </div>

              {/* Actions principales */}
              <div className="flex items-center gap-3">
                {devis.statut === 'BROUILLON' && (
                  <>
                    <button
                      onClick={() => navigate(`/devis/${id}/edit`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-xl font-medium hover:bg-green-50 transition-all duration-200 shadow-lg"
                      disabled={actionLoading}
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={handleMarkAsSent}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all duration-200 shadow-lg"
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Remis au client
                    </button>
                  </>
                )}

                {devis.statut === 'ENVOYE' && (
                  <>
                    <button
                      onClick={handleAccept}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all duration-200 shadow-lg"
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accepter
                    </button>
                    <button
                      onClick={handleRefuse}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all duration-200 shadow-lg"
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4" />
                      Refuser
                    </button>
                  </>
                )}

                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
                  disabled={actionLoading}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Infos client & dates */}
          <div className="space-y-6">
            {/* Client */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className={`px-6 py-4 ${isParticulier ? 'bg-gradient-to-r from-purple-600 to-purple-800' : 'bg-gradient-to-r from-blue-600 to-blue-800'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isParticulier ? 'bg-purple-500/30' : 'bg-blue-500/30'} backdrop-blur-sm`}>
                    {isParticulier ? <User className="w-5 h-5 text-white" /> : <Building2 className="w-5 h-5 text-white" />}
                  </div>
                  <h2 className="text-lg font-bold text-white">Client</h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nom</p>
                  <p className="font-semibold text-gray-900">{client.nom}</p>
                </div>

                {client.email && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{client.email}</span>
                  </div>
                )}

                {client.telephone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{client.telephone}</span>
                  </div>
                )}

                {client.adresse && (
                  <div className="flex items-start gap-3 text-gray-600">
                    <MapPin className="w-4 h-4 mt-1" />
                    <div className="text-sm">
                      <div>{client.adresse}</div>
                      {client.code_postal && client.ville && (
                        <div>{client.code_postal} {client.ville}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dates & Infos */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informations</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Date création</p>
                    <p className="font-semibold text-gray-900">{formatDate(devis.date_creation)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500">Valide jusqu'au</p>
                    <p className="font-semibold text-gray-900">{formatDate(devis.date_validite)}</p>
                  </div>
                </div>

                {devis.delai_realisation && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Délai réalisation</p>
                      <p className="font-semibold text-gray-900">{devis.delai_realisation}</p>
                    </div>
                  </div>
                )}

                {devis.conditions_paiement && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Conditions paiement</p>
                    <p className="text-sm text-gray-700">{devis.conditions_paiement}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions secondaires */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>

              <button
                onClick={handleDuplicate}
                className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
                disabled={actionLoading}
              >
                <Copy className="w-5 h-5" />
                <span className="font-medium">Dupliquer ce devis</span>
              </button>

              {devis.statut === 'BROUILLON' && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                  disabled={actionLoading}
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium">Supprimer ce devis</span>
                </button>
              )}
            </div>
          </div>

          {/* Colonne droite - Lignes & Totaux */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lignes du devis */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-800">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Ouvrages ({devis.lignes?.length || 0})</h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">
                        N°
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Dénomination
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">
                        U.
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">
                        Q.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                        PU
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">
                        TVA
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                        Total HT
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {(() => {
                      if (!devis.lignes || devis.lignes.length === 0) return null;

                      // Utiliser l'ordre défini par l'utilisateur (champ ordre)
                      // devis.lignes est déjà trié par ordre ASC depuis le backend
                      const organizedLines = devis.lignes.map((ligne, index) => ({
                        ligne,
                        originalIndex: index
                      }));

                      let sectionNumber = 0;
                      let currentSectionNumber = 0;
                      let itemInSectionNumber = 0;

                      const brandColor = settings?.couleur_primaire || '#FF9F43';

                      return organizedLines.map(({ ligne }) => {
                        const isSection = ligne.type === 'SECTION';
                        const isOuvrage = ligne.type === 'OUVRAGE' || !ligne.type;
                        const isMateriau = ligne.type === 'MATERIAU';
                        const isMainOeuvre = ligne.type === 'MAIN_OEUVRE';

                        let numero = '';
                        if (isSection) {
                          sectionNumber++;
                          currentSectionNumber = sectionNumber;
                          itemInSectionNumber = 0;
                          numero = sectionNumber.toString();
                        } else if (isOuvrage || isMateriau || isMainOeuvre) {
                          itemInSectionNumber++;
                          numero = currentSectionNumber > 0
                            ? `${currentSectionNumber}.${itemInSectionNumber}`
                            : itemInSectionNumber.toString();
                        }

                        if (isSection) {
                          return (
                            <tr
                              key={`section-${ligne.id}`}
                              style={{
                                backgroundColor: `${brandColor}15`,
                                borderLeft: `4px solid ${brandColor}`
                              }}
                            >
                              <td className="px-4 py-3 font-bold" style={{ color: brandColor }}>
                                {numero}
                              </td>
                              <td className="px-6 py-3 font-bold uppercase text-base" colSpan="5" style={{ color: brandColor }}>
                                {ligne.description}
                              </td>
                              <td className="px-4 py-3"></td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={`ligne-${ligne.id}`} className={`border-b border-gray-100 ${isMateriau ? 'bg-blue-50/20' : isMainOeuvre ? 'bg-purple-50/20' : ''}`}>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {numero}
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {isMateriau && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                        Matériau
                                      </span>
                                    )}
                                    {isMainOeuvre && (
                                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                        Main d'œuvre
                                      </span>
                                    )}
                                    <div className="font-medium text-gray-900 text-sm">
                                      {ligne.description || ligne.ouvrage?.denomination || 'Ouvrage supprimé'}
                                    </div>
                                  </div>
                                  {isOuvrage && ligne.ouvrage?.code && (
                                    <div className="text-xs text-gray-400 mt-1">{ligne.ouvrage.code}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {ligne.unite}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                              {ligne.quantite}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                              {formatCurrency(ligne.prix_unitaire_ht)}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {ligne.tva_pourcent ?? 20}%
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                              {formatCurrency(ligne.montant_ht)}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {(!devis.lignes || devis.lignes.length === 0) && (
                <div className="px-6 py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun ouvrage dans ce devis</p>
                </div>
              )}
            </div>

            {/* Totaux */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Total HT</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(devis.montant_ht)}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">TVA</span>
                  <span className="text-lg font-semibold text-gray-900">{formatCurrency(devis.montant_tva)}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-bold text-gray-900">Total TTC</span>
                  <span className="text-3xl font-bold text-green-600">{formatCurrency(devis.montant_ttc)}</span>
                </div>

                {devis.statut === 'ACCEPTE' && devis.acompte_verse > 0 && (
                  <div className="flex justify-between items-center pt-3 mt-2 border-t border-green-200 bg-green-50 -mx-6 px-6 pb-2 rounded-b-xl">
                    <span className="text-green-700 font-medium">Acompte versé</span>
                    <span className="text-lg font-bold text-green-600">- {formatCurrency(devis.acompte_verse)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Refus */}
      {showRefuseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Refuser le devis
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du refus (optionnel)
              </label>
              <textarea
                value={raisonRefus}
                onChange={(e) => setRaisonRefus(e.target.value)}
                rows="4"
                placeholder="Expliquez pourquoi ce devis est refusé..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRefuseModal(false);
                  setRaisonRefus('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRefuse}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Acceptation */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Accepter le devis
            </h2>

            <p className="text-gray-600 text-center mb-5">
              Confirmez l'acceptation du devis par le client.
            </p>

            {/* Acompte versé */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
              <label className="block text-sm font-semibold text-green-800 mb-1">
                Acompte versé à la commande
              </label>
              <p className="text-xs text-green-600 mb-2">
                Montant déjà réglé par le client (sera automatiquement créédité sur la facture)
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={devis?.montant_ttc}
                  value={acompteVerse}
                  onChange={(e) => setAcompteVerse(e.target.value)}
                  placeholder="0,00"
                  className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                />
                <span className="text-green-700 font-medium">€</span>
              </div>
              {acompteVerse > 0 && devis?.montant_ttc > 0 && (
                <p className="text-xs text-green-700 mt-1">
                  Soit {((parseFloat(acompteVerse) / devis.montant_ttc) * 100).toFixed(1)}% du total TTC ({formatCurrency(devis.montant_ttc)})
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAccept}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmer l'acceptation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
