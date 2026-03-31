import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Building, User, Check, Clock, X, Download } from 'lucide-react';
import factureService from '../../services/factureService';

export default function FactureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [facture, setFacture] = useState(null);

  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementData, setPaiementData] = useState({
    montant: '',
    mode_paiement: 'VIREMENT',
    date_paiement: new Date().toISOString().split('T')[0],
    reference: ''
  });

  useEffect(() => {
    loadFacture();
  }, [id]);

  const loadFacture = async () => {
    try {
      setLoading(true);
      const data = await factureService.getFactureById(id);
      setFacture(data);
    } catch (error) {
      console.error('Erreur chargement facture:', error);
      toast.error('Facture introuvable');
      navigate('/factures');
    } finally {
      setLoading(false);
    }
  };


  const handleDownloadPDF = async () => {
    try {
      const blob = await factureService.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${facture.numero_facture}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  const handleEnregistrerPaiement = async (e) => {
    e.preventDefault();

    if (!paiementData.montant || parseFloat(paiementData.montant) <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }

    const montantStr = paiementData.montant.toString().replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(montantStr)) {
      toast.error('Le montant ne peut pas avoir plus de 2 décimales');
      return;
    }

    try {
      await factureService.enregistrerPaiement(id, {
        ...paiementData,
        montant: parseFloat(paiementData.montant)
      });
      toast.success('Paiement enregistré avec succès !');
      setShowPaiementModal(false);
      setPaiementData({
        montant: '',
        mode_paiement: 'VIREMENT',
        date_paiement: new Date().toISOString().split('T')[0],
        reference: ''
      });
      loadFacture();
    } catch (error) {
      console.error('Erreur enregistrement paiement:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement');
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!facture) {
    return null;
  }

  const badgeFacture = getStatutFactureBadge(facture.statut_facture);
  const badgePaiement = getStatutPaiementBadge(facture.statut_paiement);
  const IconPaiement = badgePaiement.icon;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        {/* Row 1 : retour + actions */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/factures')}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Retour</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger PDF</span>
            </button>
            {facture.statut_paiement !== 'PAYE' && facture.statut_paiement !== 'ANNULE' && (
              <>
                <button
                  onClick={() => setShowPaiementModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Ajouter un paiement</span>
                </button>
              </>
            )}
          </div>
        </div>
        {/* Row 2 : numéro + badges + date */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">{facture.numero_facture}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeFacture.color}`}>
              {badgeFacture.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgePaiement.color}`}>
              {IconPaiement && <IconPaiement className="w-3 h-3" />}
              {badgePaiement.label}
            </span>
          </div>
          {facture.objet && (
            <p className="text-base sm:text-lg font-medium text-gray-800 mb-1">{facture.objet}</p>
          )}
          <p className="text-sm sm:text-base text-gray-600">
            Émise le {formatDate(facture.date_emission)} • Échéance le {formatDate(facture.date_echeance)}
          </p>
        </div>
      </div>

      {/* Informations entreprise et client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Entreprise */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Émetteur</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-gray-900">{facture.entreprise_nom}</p>
            <p className="text-gray-600">SIRET: {facture.entreprise_siret}</p>
            <p className="text-gray-600">{facture.entreprise_adresse}</p>
            <p className="text-gray-600">{facture.entreprise_tel}</p>
            <p className="text-gray-600">{facture.entreprise_email}</p>
          </div>
        </div>

        {/* Client */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Client</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-gray-900">{facture.client_nom}</p>
            {facture.client_siret && <p className="text-gray-600">SIRET: {facture.client_siret}</p>}
            <p className="text-gray-600">{facture.client_adresse}</p>
            <p className="text-gray-600">{facture.client_tel}</p>
            <p className="text-gray-600">{facture.client_email}</p>
          </div>
        </div>
      </div>

      {/* Chantier lié */}
      {facture.chantier && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-blue-700">Chantier lié</p>
              <p className="font-medium text-blue-900 truncate">{facture.chantier.nom}</p>
              <p className="text-sm text-blue-700">{facture.chantier.reference}</p>
            </div>
            <button
              onClick={() => navigate(`/chantiers/${facture.chantier.id}`)}
              className="flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voir
            </button>
          </div>
        </div>
      )}

      {/* Lignes de facture */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4 sm:mb-6">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Détail de la facture</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qté</th>
                <th className="hidden sm:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix unit. HT</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {facture.lignes.map((ligne) => {
                const isSection = !ligne.quantite && !ligne.montant_ht && !ligne.prix_unitaire_ht;
                if (isSection) {
                  return (
                    <tr key={ligne.id} className="bg-gray-50">
                      <td colSpan="4" className="px-3 sm:px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-l-4 border-primary-500">
                        {ligne.description}
                      </td>
                    </tr>
                  );
                }
                return (
                <tr key={ligne.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{ligne.description}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 text-right whitespace-nowrap">
                    {ligne.quantite} {ligne.unite}
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                    {formatCurrency(ligne.prix_unitaire_ht)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                    {formatCurrency(ligne.montant_ht)}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-56 sm:w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HT:</span>
                <span className="font-medium">{formatCurrency(facture.montant_ht)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA (20%):</span>
                <span className="font-medium">{formatCurrency(facture.montant_tva)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total TTC:</span>
                <span className="text-green-600">{formatCurrency(facture.montant_ttc)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paiements */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Paiements</h2>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-700">Montant TTC</p>
            <p className="text-base sm:text-2xl font-bold text-blue-900">{formatCurrency(facture.montant_ttc)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-700">Payé</p>
            <p className="text-base sm:text-2xl font-bold text-green-900">{formatCurrency(facture.acompte_recu)}</p>
          </div>
          <div className={`rounded-lg p-3 sm:p-4 ${facture.reste_a_payer > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
            <p className={`text-xs sm:text-sm ${facture.reste_a_payer > 0 ? 'text-orange-700' : 'text-gray-700'}`}>
              Reste
            </p>
            <p className={`text-base sm:text-2xl font-bold ${facture.reste_a_payer > 0 ? 'text-orange-900' : 'text-gray-900'}`}>
              {formatCurrency(facture.reste_a_payer)}
            </p>
          </div>
        </div>

        {facture.paiements && facture.paiements.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Historique des paiements</h3>
            <div className="space-y-2">
              {facture.paiements.map((paiement) => (
                <div key={paiement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(paiement.date_paiement)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {paiement.mode_paiement}
                        {paiement.reference && ` - Réf: ${paiement.reference}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(paiement.montant)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {facture.notes && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{facture.notes}</p>
        </div>
      )}

      {/* Modal paiement */}
      {showPaiementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Enregistrer un paiement</h2>

            <form onSubmit={handleEnregistrerPaiement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paiementData.montant}
                  onChange={(e) => setPaiementData({ ...paiementData, montant: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                  max={Math.floor(facture.reste_a_payer * 100) / 100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Reste à payer: {formatCurrency(facture.reste_a_payer)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement
                </label>
                <select
                  value={paiementData.mode_paiement}
                  onChange={(e) => setPaiementData({ ...paiementData, mode_paiement: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="VIREMENT">Virement</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="ESPECES">Espèces</option>
                  <option value="CB">Carte bancaire</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date du paiement
                </label>
                <input
                  type="date"
                  value={paiementData.date_paiement}
                  onChange={(e) => setPaiementData({ ...paiementData, date_paiement: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence (optionnel)
                </label>
                <input
                  type="text"
                  value={paiementData.reference}
                  onChange={(e) => setPaiementData({ ...paiementData, reference: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="N° de chèque, transaction..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPaiementModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
