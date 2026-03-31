import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Briefcase, FileText, TrendingUp, DollarSign, Clock,
  Calendar, AlertCircle, CheckCircle, Activity, Plus, ArrowRight,
  Building, Euro, Receipt, Wallet, Flag, Send, Target
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import dashboardService from '../services/dashboardService';
import DashboardEmploye from './DashboardEmploye';
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, tenant } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [periode, setPeriode] = useState('MOIS');

  useEffect(() => {
    if (user?.role !== 'EMPLOYEE') {
      loadDashboard();
    }
  }, [periode, user?.role]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getDashboard(periode);
      setData(result);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  };

  // Employés → dashboard personnalisé (après les hooks)
  if (user?.role === 'EMPLOYEE') {
    return <DashboardEmploye />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const factures_recentes = data?.factures_recentes || [];
  const chantiers_actifs = data?.chantiers_actifs || [];

  return (
    <div>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-xl py-4 sm:py-5">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Activity className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Bienvenue, {user?.prenom} ! 👋
                </h1>
                <p className="text-blue-100 mt-1">
                  Voici un aperçu de votre activité
                </p>
              </div>
            </div>
            {/* Période selector */}
            <div className="flex gap-2 flex-wrap">
              {[['JOUR', 'Jour'], ['SEMAINE', 'Semaine'], ['MOIS', 'Mois'], ['ANNEE', 'Année']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setPeriode(val)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    periode === val
                      ? 'bg-white text-primary-600'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
        {/* Chantiers actifs */}
        <div
          onClick={() => navigate('/chantiers')}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 cursor-pointer hover:shadow-xl transition-all hover:scale-105"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Briefcase className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              En cours
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Chantiers actifs</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{kpis.nb_chantiers_actifs || 0}</p>
          <p className="text-xs text-gray-400 mt-1">chantiers en cours d'exécution</p>
        </div>

        {/* Taux d'encaissement */}
        <div
          onClick={() => navigate('/factures')}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 cursor-pointer hover:shadow-xl transition-all hover:scale-105"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Target className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {periode}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Taux d'encaissement</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">
            {kpis.ca_facture_ttc > 0
              ? Math.round((kpis.ca_encaisse / kpis.ca_facture_ttc) * 100)
              : 0} %
          </p>
          <p className="text-xs text-gray-400 mt-1">du CA facturé effectivement encaissé</p>
        </div>

        {/* CA encaissé */}
        <div
          onClick={() => navigate('/factures')}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 cursor-pointer hover:shadow-xl transition-all hover:scale-105"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Wallet className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              {periode}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">CA encaissé</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{formatMontant(kpis.ca_encaisse)}</p>
          <p className="text-xs text-gray-400 mt-1">argent réellement reçu sur la période</p>
        </div>

        {/* CA TTC */}
        <div
          onClick={() => navigate('/factures')}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 cursor-pointer hover:shadow-xl transition-all hover:scale-105"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-white bg-white/20 px-2 py-1 rounded-full">
              {periode}
            </span>
          </div>
          <p className="text-sm text-green-100 mb-1">Chiffre d'affaires TTC</p>
          <p className="text-xl sm:text-3xl font-bold text-white">{formatMontant(kpis.ca_facture_ttc)}</p>
          <p className="text-xs text-green-200 mt-1">total facturé sur la période (TVA incluse)</p>
        </div>
      </div>

      {/* Stats détaillées - 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
        {/* Heures badgées */}
        <div
          onClick={() => navigate('/chantiers')}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-3 mb-3 sm:mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Heures équipe</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(kpis.heures_totales || 0).toFixed(1)} <span className="text-lg text-gray-500 font-normal">h</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">présence badgée sur la période</p>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Chantiers en cours</span>
              <span className="font-semibold text-gray-900">{kpis.nb_chantiers_actifs || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Chantiers terminés</span>
              <span className="font-semibold text-gray-900">{kpis.nb_chantiers_termines || 0}</span>
            </div>
          </div>
        </div>

        {/* Factures stats */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-3 sm:mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Factures</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Payées</span>
                  <p className="text-xs text-gray-400">montant encaissé</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-600">
                {formatMontant(kpis.montant_paye || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <div>
                  <span className="text-sm font-medium text-gray-700">En attente</span>
                  <p className="text-xs text-gray-400">facturé, non encore encaissé</p>
                </div>
              </div>
              <span className="text-sm font-bold text-orange-600">
                {formatMontant(kpis.montant_en_attente || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <div>
                  <span className="text-sm font-medium text-gray-700">En retard</span>
                  <p className="text-xs text-gray-400">échéance dépassée, non payé</p>
                </div>
              </div>
              <span className="text-sm font-bold text-red-600">
                {formatMontant(kpis.montant_retard || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Factures récentes */}
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Factures récentes</h3>
            </div>
            <button
              onClick={() => navigate('/factures')}
              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {factures_recentes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune facture récente</p>
            ) : (
              factures_recentes.slice(0, 5).map((facture) => (
                <div
                  key={facture.id}
                  onClick={() => navigate(`/factures/${facture.id}`)}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Euro className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{facture.numero_facture}</p>
                      <p className="text-sm text-gray-600">{facture.client_nom}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatMontant(facture.montant_ttc)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {facture.statut_paiement === 'PAYE' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Payée
                        </span>
                      )}
                      {facture.statut_paiement === 'PARTIEL' && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                          Partiel
                        </span>
                      )}
                      {facture.statut_paiement === 'EN_ATTENTE' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          En attente
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{formatDate(facture.date_echeance)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chantiers actifs */}
      {chantiers_actifs.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Chantiers en cours</h3>
            </div>
            <button
              onClick={() => navigate('/chantiers')}
              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chantiers_actifs.slice(0, 6).map((chantier) => (
              <div
                key={chantier.id}
                onClick={() => navigate(`/chantiers/${chantier.id}`)}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">{chantier.nom}</p>
                    <p className="text-sm text-gray-600">{chantier.client?.nom}</p>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                    {{ PLANIFIE: 'Planifié', EN_COURS: 'En cours', TERMINE: 'Terminé', ANNULE: 'Annulé' }[chantier.statut] || chantier.statut}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Début: {formatDate(chantier.date_debut)}
                  {chantier.date_fin_prevue && ` • Fin prévue: ${formatDate(chantier.date_fin_prevue)}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/clients/new')}
            className="group p-3 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all text-left"
          >
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-gray-900 mb-1">Nouveau client</p>
            <p className="text-sm text-gray-600">Ajouter une fiche client</p>
          </button>

          <button
            onClick={() => navigate('/devis/new')}
            className="group p-3 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all text-left"
          >
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-gray-900 mb-1">Créer un devis</p>
            <p className="text-sm text-gray-600">Nouveau devis client</p>
          </button>

          <button
            onClick={() => navigate('/chantiers/new')}
            className="group p-3 sm:p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all text-left"
          >
            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-gray-900 mb-1">Nouveau chantier</p>
            <p className="text-sm text-gray-600">Démarrer un chantier</p>
          </button>

          <button
            onClick={() => navigate('/catalogue')}
            className="group p-3 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all text-left"
          >
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-gray-900 mb-1">Catalogue</p>
            <p className="text-sm text-gray-600">Gérer les ouvrages</p>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
