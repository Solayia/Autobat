import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Search,
  X,
  Navigation,
  User
} from 'lucide-react';
import chantierService from '../../services/chantierService';
import devisService from '../../services/devisService';
import clientService from '../../services/clientService';
import employeService from '../../services/employeService';
import settingsService from '../../services/settingsService';
import toast from 'react-hot-toast';

export default function ChantierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const devisId = searchParams.get('devis_id');
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Formulaire
  const [formData, setFormData] = useState({
    devis_id: devisId || '',
    client_id: '',
    nom: '',
    adresse: '',
    code_postal: '',
    ville: '',
    date_debut: '',
    date_fin_prevue: '',
    latitude: '',
    longitude: '',
    rayon_metres: 250,
    badgeage_par_tache: false, // Sera chargé depuis les settings
    notes: ''
  });

  // Devis sélectionné
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [devisList, setDevisList] = useState([]);
  const [showDevisModal, setShowDevisModal] = useState(false);
  const [devisSearch, setDevisSearch] = useState('');

  // Client (sans devis)
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientsList, setClientsList] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // Employés
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);

  // Géocodage
  const [searchAddress, setSearchAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      loadChantier();
    } else {
      // En mode création, charger le mode de badgeage par défaut depuis les settings
      loadDefaultBadgeageMode();
      if (devisId) {
        loadDevisData(devisId);
      }
    }
    loadEmployees();
    loadClients();
  }, [id, devisId]);

  const loadDefaultBadgeageMode = async () => {
    try {
      const settings = await settingsService.getSettings();
      setFormData(prev => ({
        ...prev,
        badgeage_par_tache: settings.badgeage_par_tache_defaut || false
      }));
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      // En cas d'erreur, utiliser la valeur par défaut (false)
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientService.getClients({ limit: 200 });
      setClientsList(data.clients || data.data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  // Autocomplete adresse avec debounce
  useEffect(() => {
    if (!searchAddress || searchAddress.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchAddressAutocomplete(searchAddress);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchAddress]);

  const loadChantier = async () => {
    try {
      setLoading(true);
      const data = await chantierService.getChantierById(id);

      setFormData({
        devis_id: data.devis?.id || '',
        nom: data.nom || '',
        adresse: data.adresse || '',
        code_postal: data.code_postal || '',
        ville: data.ville || '',
        date_debut: data.date_debut ? new Date(data.date_debut).toISOString().split('T')[0] : '',
        date_fin_prevue: data.date_fin_prevue ? new Date(data.date_fin_prevue).toISOString().split('T')[0] : '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
        rayon_metres: data.rayon_metres || 250,
        badgeage_par_tache: data.badgeage_par_tache || false,
        notes: data.notes || ''
      });

      if (data.devis) {
        setSelectedDevis(data.devis);
      }

      if (data.employes) {
        setSelectedEmployees(data.employes.map(e => e.id));
      }
    } catch (error) {
      console.error('Erreur chargement chantier:', error);
      toast.error('Erreur lors du chargement du chantier');
      navigate('/chantiers');
    } finally {
      setLoading(false);
    }
  };

  const loadDevisData = async (devisId) => {
    try {
      const data = await devisService.getDevisById(devisId);
      setSelectedDevis(data);

      // Pré-remplir avec l'adresse du client (facturation) - pourra être modifiée ensuite
      setFormData(prev => ({
        ...prev,
        devis_id: data.id,
        nom: `Chantier - ${data.client?.nom || 'Client'}${data.numero ? ` - ${data.numero}` : ''}`,
        adresse: data.client?.adresse || '',
        code_postal: data.client?.code_postal || '',
        ville: data.client?.ville || ''
      }));
    } catch (error) {
      console.error('Erreur chargement devis:', error);
      toast.error('Erreur lors du chargement du devis');
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await employeService.getEmployes();
      setEmployeesList(data);
    } catch (error) {
      console.error('Erreur chargement employés:', error);
      toast.error('Erreur lors du chargement des employés');
    }
  };

  const searchDevis = async (query = '') => {
    try {
      const filters = {
        statut: 'ACCEPTE',
        limit: 20
      };

      // Si recherche vide, afficher uniquement les devis sans chantier
      // Sinon, afficher tous les devis (pour permettre de retrouver ceux déjà liés)
      if (!query || query.trim() === '') {
        filters.sans_chantier = 'true';
      } else {
        filters.search = query;
      }

      const data = await devisService.getDevis(filters);
      setDevisList(data.data || []);
    } catch (error) {
      console.error('Erreur recherche devis:', error);
    }
  };

  const handleSelectDevis = (devis) => {
    setSelectedDevis(devis);
    setFormData(prev => ({
      ...prev,
      devis_id: devis.id,
      nom: `Chantier - ${devis.client?.nom || 'Client'}${devis.numero ? ` - ${devis.numero}` : ''}`,
      adresse: devis.client?.adresse || '',
      code_postal: devis.client?.code_postal || '',
      ville: devis.client?.ville || ''
    }));
    setShowDevisModal(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    toast.loading('Récupération de votre position...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss();
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        toast.success('Position GPS récupérée');
      },
      (error) => {
        toast.dismiss();
        console.error('Erreur géolocalisation:', error);
        toast.error('Impossible de récupérer votre position');
      }
    );
  };

  const searchAddressAutocomplete = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      setGeocoding(true);

      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
      );

      if (!response.ok) {
        throw new Error('Erreur API géocodage');
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        setAddressSuggestions(data.features);
      } else {
        setAddressSuggestions([]);
      }
    } catch (error) {
      console.error('Erreur géocodage:', error);
      setAddressSuggestions([]);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSelectAddressSuggestion = (feature) => {
    const props = feature.properties;

    // Extraire l'adresse (nom de la rue/voie)
    const streetName = props.name || '';
    const houseNumber = props.housenumber || '';
    const fullAddress = houseNumber ? `${houseNumber} ${streetName}` : streetName;

    setFormData(prev => ({
      ...prev,
      adresse: fullAddress || prev.adresse,
      code_postal: props.postcode || prev.code_postal,
      ville: props.city || prev.ville,
      latitude: feature.geometry.coordinates[1].toString(),
      longitude: feature.geometry.coordinates[0].toString()
    }));
    setAddressSuggestions([]);
    toast.success('Adresse et coordonnées GPS récupérées');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.nom || !formData.date_debut || !formData.date_fin_prevue) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!isEditMode && !formData.devis_id && !formData.client_id) {
      toast.error('Veuillez sélectionner un client ou un devis');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      if (!confirm('Aucune position GPS définie. Le badgeage automatique ne sera pas disponible. Continuer ?')) {
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        rayon_metres: parseInt(formData.rayon_metres) || 250
      };

      // Ajouter les employés uniquement s'il y en a
      if (selectedEmployees.length > 0) {
        payload.employee_ids = selectedEmployees;
      }

      if (isEditMode) {
        await chantierService.updateChantier(id, payload);
        toast.success('Chantier modifié avec succès');
        navigate(`/chantiers/${id}`);
      } else {
        const newChantier = await chantierService.createChantier(payload);
        toast.success('Chantier créé avec succès');
        navigate(`/chantiers/${newChantier.id}`);
      }
    } catch (error) {
      console.error('Erreur sauvegarde chantier:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la sauvegarde du chantier';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="px-8 py-6">
            <button
              onClick={() => navigate('/chantiers')}
              className="flex items-center gap-2 text-white hover:text-green-100 transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour aux chantiers</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/30 backdrop-blur-sm">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {isEditMode ? 'Modifier le chantier' : 'Nouveau chantier'}
                </h1>
                <p className="text-green-100">Étape {currentStep} sur 3</p>
              </div>
            </div>

            {/* Stepper */}
            <div className="mt-8 flex items-center justify-between max-w-2xl">
              {[1, 2, 3].map((step, index) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                        currentStep >= step
                          ? 'bg-white text-green-600'
                          : 'bg-green-500/30 text-white'
                      }`}
                    >
                      {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                    </div>
                    <div className="text-xs text-white mt-2 font-medium">
                      {step === 1 && 'Informations'}
                      {step === 2 && 'Adresse'}
                      {step === 3 && 'Employés'}
                    </div>
                  </div>
                  {index < 2 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded transition-all duration-200 ${
                        currentStep > step ? 'bg-white' : 'bg-green-500/30'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 1: Informations générales */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations générales</h2>

            {/* Devis source */}
            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devis source (optionnel)
                </label>
                {selectedDevis ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">{selectedDevis.numero}</span>
                        </div>
                        <div className="text-sm text-blue-700">
                          {selectedDevis.client?.nom}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDevis(null);
                          setFormData(prev => ({ ...prev, devis_id: '' }));
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      searchDevis();
                      setShowDevisModal(true);
                    }}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
                  >
                    Sélectionner un devis accepté
                  </button>
                )}
              </div>
            )}

            {/* Client (si pas de devis) */}
            {!isEditMode && !selectedDevis && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client <span className="text-red-500">*</span>
                </label>
                {selectedClient ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {selectedClient.prenom ? `${selectedClient.prenom} ${selectedClient.nom}` : selectedClient.nom}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedClient(null);
                          setFormData(prev => ({ ...prev, client_id: '' }));
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClientModal(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Sélectionner un client
                  </button>
                )}
              </div>
            )}

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du chantier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Rénovation maison Dupont"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin prévue <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date_fin_prevue}
                  onChange={(e) => setFormData({ ...formData, date_fin_prevue: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Informations complémentaires..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                onClick={() => navigate('/chantiers')}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Adresse et localisation */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Adresse et localisation</h2>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>Badgeage automatique :</strong> La position GPS permet aux employés de badger automatiquement
                lorsqu'ils arrivent sur le chantier (rayon de {formData.rayon_metres}m).
              </p>
            </div>

            {/* Recherche d'adresse pour géocodage */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher une adresse
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Tapez une adresse (min. 3 caractères)..."
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {geocoding && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  </div>
                )}
              </div>

              {/* Suggestions d'adresses (dropdown) */}
              {addressSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {addressSuggestions.map((feature, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleSelectAddressSuggestion(feature);
                          setSearchAddress('');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {feature.properties.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Score: {Math.round(feature.properties.score * 100)}%
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Les suggestions apparaissent automatiquement pendant la saisie
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Bouton géolocalisation */}
            <button
              onClick={handleGetCurrentLocation}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              Utiliser ma position actuelle
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">ou saisir manuellement</span>
              </div>
            </div>

            {/* Adresse affichée */}
            {(formData.adresse || formData.code_postal || formData.ville) && (
              <div className={`p-4 border rounded-xl ${
                formData.latitude && formData.longitude
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-start gap-3">
                  <MapPin className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    formData.latitude && formData.longitude
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }`} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium mb-1 ${
                      formData.latitude && formData.longitude
                        ? 'text-green-900'
                        : 'text-orange-900'
                    }`}>
                      {formData.latitude && formData.longitude
                        ? 'Adresse du chantier'
                        : 'Adresse du client (facturation)'}
                    </div>
                    <div className={`text-sm ${
                      formData.latitude && formData.longitude
                        ? 'text-green-700'
                        : 'text-orange-700'
                    }`}>
                      {formData.adresse && <div>{formData.adresse}</div>}
                      {(formData.code_postal || formData.ville) && (
                        <div>
                          {formData.code_postal} {formData.ville}
                        </div>
                      )}
                    </div>

                    {/* Bouton pour géocoder l'adresse client */}
                    {!formData.latitude && !formData.longitude && (
                      <button
                        onClick={async () => {
                          const addressQuery = `${formData.adresse} ${formData.code_postal} ${formData.ville}`.trim();
                          setSearchAddress(addressQuery);
                          await searchAddressAutocomplete(addressQuery);
                        }}
                        className="mt-3 px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        Utiliser cette adresse pour le chantier
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Coordonnées GPS */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="43.296482"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="5.369780"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Rayon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rayon de badgeage (mètres)
              </label>
              <input
                type="number"
                value={formData.rayon_metres}
                onChange={(e) => setFormData({ ...formData, rayon_metres: e.target.value })}
                min="10"
                max="500"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Distance maximale pour le badgeage automatique (recommandé : 250m)
              </p>
            </div>

            {/* Mode de badgeage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode de badgeage
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Choisissez comment les employés badgeront sur ce chantier
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Mode Simple */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, badgeage_par_tache: false })}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    !formData.badgeage_par_tache
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      !formData.badgeage_par_tache
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {!formData.badgeage_par_tache && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">Simple (GPS uniquement)</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Badgeage automatique arrivée/départ uniquement
                  </p>
                </button>

                {/* Mode Détaillé */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, badgeage_par_tache: true })}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    formData.badgeage_par_tache
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      formData.badgeage_par_tache
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.badgeage_par_tache && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">Détaillé (GPS + Tâches)</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Badgeage GPS + suivi détaillé par tâche
                  </p>
                </button>
              </div>
            </div>

            {/* Aperçu Google Maps */}
            {formData.latitude && formData.longitude && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aperçu de la localisation
                </label>
                <a
                  href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-center"
                >
                  Voir sur Google Maps
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-6 border-t">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Employés */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Assigner des employés</h2>

            {employeesList.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucun employé disponible</p>
                <p className="text-sm text-gray-400">
                  Les employés pourront être assignés ultérieurement
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {employeesList.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, employee.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                        }
                      }}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {employee.user?.prenom} {employee.user?.nom}
                      </div>
                      <div className="text-sm text-gray-500">{employee.user?.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-6 border-t">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {isEditMode ? 'Modifier le chantier' : 'Créer le chantier'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal sélection devis */}
      {showDevisModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Sélectionner un devis</h3>
              <button
                onClick={() => setShowDevisModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {/* Recherche */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={devisSearch}
                  onChange={(e) => {
                    setDevisSearch(e.target.value);
                    searchDevis(e.target.value);
                  }}
                  onFocus={() => searchDevis(devisSearch)}
                  placeholder="Rechercher un devis accepté..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Liste devis */}
              {devisList.length > 0 ? (
                <div className="space-y-2">
                  {devisList.map((devis) => (
                    <button
                      key={devis.id}
                      onClick={() => handleSelectDevis(devis)}
                      className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">{devis.numero}</div>
                          <div className="text-sm text-gray-600">{devis.client?.nom}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(devis.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR'
                            }).format(devis.montant_ht)}
                          </div>
                          <div className="text-xs text-gray-500">HT</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p>Aucun devis accepté trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal sélection client */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Sélectionner un client</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {clientsList
                .filter(c => {
                  const q = clientSearch.toLowerCase();
                  return !q || c.nom?.toLowerCase().includes(q) || c.prenom?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
                })
                .map(client => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client);
                      setFormData(prev => ({ ...prev, client_id: client.id }));
                      setShowClientModal(false);
                    }}
                    className="w-full p-4 mb-2 bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
                        </div>
                        {client.email && <div className="text-sm text-gray-500">{client.email}</div>}
                      </div>
                    </div>
                  </button>
                ))}
              {clientsList.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p>Aucun client trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
