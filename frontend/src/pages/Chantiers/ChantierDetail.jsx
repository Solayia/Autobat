import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Play,
  Edit2,
  Folder,
  Activity,
  Info,
  Plus,
  ListChecks,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import chantierService from '../../services/chantierService';
import TachesTab from './TachesTab';
import DocumentsTab from './DocumentsTab';
import BadgeagesTab from './BadgeagesTab';
import DiscussionTab from './DiscussionTab';
import useAuthStore from '../../stores/authStore';

export default function ChantierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEmployee = user?.role === 'EMPLOYEE';
  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('taches'); // taches, badgeages, documents, infos
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  useEffect(() => {
    loadChantier();
  }, [id]);

  const loadChantier = async () => {
    try {
      setLoading(true);
      const data = await chantierService.getChantierById(id);
      setChantier(data);
    } catch (error) {
      console.error('Erreur chargement chantier:', error);
      toast.error('Erreur lors du chargement du chantier');
      navigate('/chantiers');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChantier = () => {
    setShowStartModal(true);
  };

  const handleConfirmStart = async () => {
    try {
      setActionLoading(true);
      setShowStartModal(false);
      await chantierService.startChantier(id);
      await loadChantier();
      toast.success('Chantier démarré avec succès');
    } catch (error) {
      console.error('Erreur démarrage chantier:', error);
      toast.error('Erreur lors du démarrage du chantier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteChantier = () => {
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    try {
      setActionLoading(true);
      setShowCompleteModal(false);
      await chantierService.completeChantier(id);
      await loadChantier();
      toast.success('Chantier terminé avec succès');
    } catch (error) {
      console.error('Erreur terminaison chantier:', error);
      toast.error('Erreur lors de la terminaison du chantier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelChantier = () => {
    setShowCancelModal(true);
  };

  const handleReopenChantier = () => {
    setShowReopenModal(true);
  };

  const handleConfirmReopen = async () => {
    try {
      setActionLoading(true);
      setShowReopenModal(false);
      await chantierService.reopenChantier(id);
      await loadChantier();
      toast.success('Chantier rouvert avec succès');
    } catch (error) {
      console.error('Erreur réouverture chantier:', error);
      toast.error('Erreur lors de la réouverture du chantier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    try {
      setActionLoading(true);
      setShowCancelModal(false);
      await chantierService.cancelChantier(id);
      await loadChantier();
      toast.error('Chantier annulé');
    } catch (error) {
      console.error('Erreur annulation chantier:', error);
      toast.error('Erreur lors de l\'annulation du chantier');
    } finally {
      setActionLoading(false);
    }
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

  const getStatutBadge = (statut) => {
    const badges = {
      PLANIFIE: { color: 'bg-blue-100 text-blue-700', label: 'Planifié' },
      EN_COURS: { color: 'bg-green-100 text-green-700', label: 'En cours' },
      TERMINE: { color: 'bg-gray-100 text-gray-700', label: 'Terminé' },
      ANNULE: { color: 'bg-red-100 text-red-700', label: 'Annulé' }
    };
    return badges[statut] || badges.PLANIFIE;
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

  const calculateDaysRemaining = () => {
    if (!chantier?.date_fin_prevue) return null;
    const today = new Date();
    const endDate = new Date(chantier.date_fin_prevue);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateDaysElapsed = () => {
    if (!chantier?.date_debut) return null;
    const today = new Date();
    const startDate = new Date(chantier.date_debut);
    const diffTime = today - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Chantier introuvable</h2>
          <button
            onClick={() => navigate('/chantiers')}
            className="mt-4 text-green-600 hover:text-green-700"
          >
            Retour aux chantiers
          </button>
        </div>
      </div>
    );
  }

  const badge = getStatutBadge(chantier.statut);
  const daysRemaining = calculateDaysRemaining();
  const daysElapsed = calculateDaysElapsed();

  return (
    <div>
      {/* Header Banner */}
      <div className={`bg-gradient-to-r ${getStatutHeaderColors(chantier.statut)} text-white shadow-xl py-4 sm:py-5`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate('/chantiers')}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold line-clamp-1">{chantier.nom}</h1>
                {chantier.client && (
                  <p className="text-white/70 text-sm mt-0.5">Client : {chantier.client.nom}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {chantier.statut === 'PLANIFIE' && (
                <button
                  onClick={handleStartChantier}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-green-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Démarrer</span>
                </button>
              )}
              {chantier.statut === 'EN_COURS' && (
                <button
                  onClick={handleCompleteChantier}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-green-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Terminer</span>
                </button>
              )}
              {(chantier.statut === 'PLANIFIE' || chantier.statut === 'EN_COURS') && (
                <>
                  <button
                    onClick={handleCancelChantier}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 text-white border border-white/30 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Annuler</span>
                  </button>
                  <button
                    onClick={() => navigate(`/chantiers/${id}/edit`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 text-white border border-white/30 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Modifier</span>
                  </button>
                </>
              )}
              {chantier.statut === 'TERMINE' && (
                <button
                  onClick={handleReopenChantier}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 text-white border border-white/30 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Rouvrir</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* Statut Card */}
          <div className="bg-white rounded-lg shadow p-2 sm:p-6">
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
            {chantier.statut === 'EN_COURS' && daysElapsed !== null && (
              <p className="text-gray-600 text-xs mt-1 hidden sm:block">Depuis {daysElapsed} j.</p>
            )}
          </div>

          {/* Days Remaining Card */}
          <div className="bg-white rounded-lg shadow p-2 sm:p-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0 text-blue-600 hidden sm:block" />
              <div>
                {daysRemaining !== null ? (
                  <>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{daysRemaining}j</p>
                    <p className="text-gray-600 text-xs hidden sm:block">{daysRemaining >= 0 ? 'restants' : 'retard'}</p>
                  </>
                ) : (
                  <p className="text-gray-500 text-xs">-</p>
                )}
              </div>
            </div>
          </div>

          {/* Budget Card — masqué pour les employés */}
          {!isEmployee && (
            <div className="bg-white rounded-lg shadow p-2 sm:p-6">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 flex-shrink-0 text-green-600 hidden sm:block" />
                <div>
                  {chantier.devis ? (
                    <>
                      <p className="text-xs sm:text-xl font-bold text-gray-900">
                        {formatCurrency(chantier.devis.montant_ht || 0)}
                      </p>
                      <p className="text-gray-600 text-xs hidden sm:block">Budget HT</p>
                    </>
                  ) : (
                    <p className="text-gray-500 text-xs">Pas de devis</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { key: 'taches', label: 'Tâches', Icon: ListChecks },
                { key: 'badgeages', label: 'Badgeages', Icon: Activity },
                { key: 'documents', label: 'Documents', Icon: Folder },
                { key: 'discussion', label: 'Discussion', Icon: MessageSquare },
                { key: 'infos', label: 'Infos', Icon: Info },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-3 sm:p-6">
            {activeTab === 'taches' && <TachesTab chantierId={id} chantier={chantier} />}

            {activeTab === 'badgeages' && <BadgeagesTab chantierId={id} chantier={chantier} />}

            {activeTab === 'documents' && <DocumentsTab chantierId={id} />}

            {activeTab === 'discussion' && <DiscussionTab chantierId={id} />}

            {activeTab === 'infos' && (
              <div>
                <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Informations du chantier</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Informations générales */}
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Informations générales</h3>

                    <div className="space-y-4">
                      {/* Client */}
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Client</div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 font-medium">
                            {chantier.client?.nom || 'Client inconnu'}
                          </span>
                        </div>
                      </div>

                      {/* Adresse */}
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Adresse</div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                          <div className="text-gray-900">
                            <div>{chantier.adresse}</div>
                            {chantier.ville && chantier.code_postal && (
                              <div className="text-sm text-gray-600 mt-1">
                                {chantier.code_postal} {chantier.ville}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">Date début</div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{formatDate(chantier.date_debut)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">Date fin prévue</div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{formatDate(chantier.date_fin_prevue)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Date fin réelle si terminé */}
                      {chantier.date_fin_reelle && (
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">Date fin réelle</div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-gray-900">{formatDate(chantier.date_fin_reelle)}</span>
                          </div>
                        </div>
                      )}

                      {/* Mode badgeage */}
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Mode de badgeage</div>
                        <div className="text-gray-900">
                          {chantier.badgeage_par_tache ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                              Détaillé (GPS + par tâche)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                              Simple (GPS uniquement)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {chantier.notes && (
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">Notes</div>
                          <div className="text-gray-900 bg-white rounded-lg p-3 border border-gray-200">
                            {chantier.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Colonne droite */}
                  <div className="space-y-6">
                    {/* Devis source */}
                    {chantier.devis && (
                      <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Devis source</h3>

                        <div
                          onClick={() => navigate(`/devis/${chantier.devis.id}`)}
                          className="p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-900">{chantier.devis.numero_devis}</span>
                          </div>
                          {!isEmployee && (
                            <div className="text-sm text-blue-700 mb-2">
                              Montant: {formatCurrency(chantier.devis.montant_ht || 0)} HT
                            </div>
                          )}
                          <div className="text-sm text-blue-600 font-medium">→ Voir le devis</div>
                        </div>
                      </div>
                    )}

                    {/* Facturation */}
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Facturation</h3>
                      {chantier.statut === 'TERMINE' ? (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">Ce chantier est terminé. Vous pouvez créer une facture.</p>
                          <button
                            onClick={() => navigate('/factures/new')}
                            className="flex items-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium justify-center"
                          >
                            <Plus className="w-4 h-4" />
                            Créer une facture
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-800">
                            La facturation est disponible uniquement une fois le chantier <strong>terminé</strong>.
                            Cliquez sur "Terminer" dans l'en-tête pour clôturer le chantier.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Localisation GPS */}
                    {chantier.latitude && chantier.longitude && (
                      <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Zone GPS</h3>

                        <div className="space-y-3">
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>Latitude: {chantier.latitude}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>Longitude: {chantier.longitude}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-gray-400" />
                              <span>Rayon GPS: {chantier.rayon_gps_metres || 100}m</span>
                            </div>
                          </div>

                          <a
                            href={`https://www.google.com/maps?q=${chantier.latitude},${chantier.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Voir sur Google Maps
                          </a>

                          <div className="text-xs text-gray-500 mt-2">
                            Les employés seront badgés automatiquement quand ils entrent/sortent de cette zone
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Employés assignés */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Employés assignés</h3>

                      {chantier.employes_assignes && chantier.employes_assignes.length > 0 ? (
                        <div className="space-y-3">
                          {chantier.employes_assignes.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                            >
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {assignment.employe?.user?.prenom} {assignment.employe?.user?.nom}
                                </div>
                                <div className="text-sm text-gray-500">{assignment.employe?.user?.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm">Aucun employé assigné</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Confirmation Démarrage */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Démarrer le chantier
            </h2>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir démarrer ce chantier ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStartModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmStart}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Démarrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Terminaison */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Terminer le chantier
            </h2>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir terminer ce chantier ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmComplete}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Annulation */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Annuler le chantier
            </h2>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir annuler ce chantier ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Non
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Annuler le chantier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Réouverture */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Rouvrir le chantier
            </h2>
            <p className="text-gray-600 mb-6">
              Ce chantier sera remis en statut "En cours". Vous pourrez continuer à y travailler et à créer de nouvelles factures.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReopenModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReopen}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Rouvrir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
