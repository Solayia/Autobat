import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Building2,
  FileText,
  Package,
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import devisService from '../../services/devisService';
import clientService from '../../services/clientService';
import catalogueService from '../../services/catalogueService';

export default function DevisForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // État du formulaire
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Données du formulaire
  const [formData, setFormData] = useState({
    client_id: '',
    objet: '',
    conditions_paiement: '30% à la commande, 70% à la livraison',
    delai_realisation: '2 semaines',
    date_validite: ''
  });

  // Lignes du devis
  const [lignes, setLignes] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null); // Section cible pour les nouveaux ouvrages
  const [draggedIndex, setDraggedIndex] = useState(null); // Index de la ligne en cours de déplacement

  // Modal section
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [newSection, setNewSection] = useState({
    type: 'SECTION',
    description: ''
  });

  // Modal matériau
  const [showMateriauxModal, setShowMateriauxModal] = useState(false);
  const [newMateriau, setNewMateriau] = useState({
    type: 'MATERIAU',
    description: '',
    quantite: 1,
    unite: 'u',
    prix_unitaire_ht: 0,
    parent_ligne_id: null
  });

  // Modal ouvrage
  const [showOuvrageModal, setShowOuvrageModal] = useState(false);

  // Modal main d'oeuvre
  const [showMainOeuvreModal, setShowMainOeuvreModal] = useState(false);
  const [newMainOeuvre, setNewMainOeuvre] = useState({
    type: 'MAIN_OEUVRE',
    description: '',
    quantite: 1,
    unite: 'h',
    prix_unitaire_ht: 0,
    parent_ligne_id: null
  });

  // Recherche clients
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    type: 'ENTREPRISE',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    ville: '',
    siret: ''
  });

  // Recherche ouvrages
  const [ouvrageSearch, setOuvrageSearch] = useState('');
  const [ouvrages, setOuvrages] = useState([]);
  const [showOuvrageDropdown, setShowOuvrageDropdown] = useState(false);
  const [categorieFilter, setCategorieFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // Chargement initial
  useEffect(() => {
    if (isEditMode) {
      loadDevis();
    } else {
      // Date de validité par défaut : 30 jours
      const dateValidite = new Date();
      dateValidite.setDate(dateValidite.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        date_validite: dateValidite.toISOString().split('T')[0]
      }));
    }
  }, [id]);

  // Charger les ouvrages automatiquement quand la modale s'ouvre
  useEffect(() => {
    if (showOuvrageModal) {
      searchOuvrages('');
    }
  }, [showOuvrageModal, categorieFilter]);

  const loadDevis = async () => {
    try {
      setLoading(true);
      const data = await devisService.getDevisById(id);

      setFormData({
        client_id: data.client.id,
        objet: data.objet || '',
        conditions_paiement: data.conditions_paiement || '30% à la commande, 70% à la livraison',
        delai_realisation: data.delai_realisation || '2 semaines',
        date_validite: data.date_validite ? new Date(data.date_validite).toISOString().split('T')[0] : ''
      });

      setSelectedClient(data.client);

      // Charger toutes les lignes avec leur structure hiérarchique
      // Les lignes sont déjà triées par ordre ASC depuis le backend
      const loadedLignes = (data.lignes || []).map(ligne => ({
        id: ligne.id, // ID réel de la ligne (nécessaire pour parent_ligne_id)
        type: ligne.type,
        ouvrage_id: ligne.ouvrage_id,
        ouvrage: ligne.ouvrage,
        description: ligne.description,
        unite: ligne.unite,
        quantite: ligne.quantite,
        prix_unitaire_ht: ligne.prix_unitaire_ht,
        taux_tva: ligne.tva_pourcent ?? 20,
        parent_ligne_id: ligne.parent_ligne_id
      }));

      setLignes(loadedLignes);
    } catch (error) {
      console.error('Erreur chargement devis:', error);
      toast.error('Erreur lors du chargement du devis');
      navigate('/devis');
    } finally {
      setLoading(false);
    }
  };

  // Recherche clients
  const searchClients = async (query = '') => {
    try {
      const data = await clientService.getClients({ search: query, limit: query ? 10 : 20 });
      setClients(data.clients || []);
      setShowClientDropdown(true);
    } catch (error) {
      console.error('Erreur recherche clients:', error);
      setClients([]);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setClientSearch(client.nom);
    setShowClientDropdown(false);
  };

  const handleCreateClient = async () => {
    try {
      // Validation basique
      if (!newClientData.nom || !newClientData.email || !newClientData.telephone) {
        toast.error('Veuillez remplir les champs obligatoires (nom, email, téléphone)');
        return;
      }

      if (newClientData.type === 'PARTICULIER' && !newClientData.prenom) {
        toast.error('Le prénom est obligatoire pour un particulier');
        return;
      }

      const createdClient = await clientService.createClient(newClientData);

      // Sélectionner automatiquement le client créé
      handleClientSelect(createdClient.client);

      // Réinitialiser le formulaire et fermer le modal
      setNewClientData({
        type: 'ENTREPRISE',
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        code_postal: '',
        ville: '',
        siret: ''
      });
      setShowClientModal(false);

      toast.success('Client créé avec succès');
    } catch (error) {
      console.error('Erreur création client:', error);
      toast.error('Erreur lors de la création du client');
    }
  };

  // Recherche ouvrages
  const searchOuvrages = async (query = '') => {
    try {
      const params = {
        search: query || undefined,
        categorie: categorieFilter || undefined,
        limit: 20
      };
      const data = await catalogueService.getOuvrages(params);
      setOuvrages(data.data || []);
      setCategories(data.categories || []);
      setShowOuvrageDropdown(true);
    } catch (error) {
      console.error('Erreur recherche ouvrages:', error);
    }
  };

  const handleAddOuvrage = (ouvrage) => {
    // Vérifier si l'ouvrage n'est pas déjà dans la même section
    const exists = lignes.find(l =>
      l.type === 'OUVRAGE' &&
      l.ouvrage_id === ouvrage.id &&
      l.parent_ligne_id === selectedSection
    );
    if (exists) {
      toast.error('Cet ouvrage est déjà dans cette section');
      return;
    }

    const nouvelleLigne = {
      id: Date.now().toString(), // ID temporaire pour lier les matériaux
      type: 'OUVRAGE',
      ouvrage_id: ouvrage.id,
      ouvrage: ouvrage,
      description: ouvrage.denomination,
      unite: ouvrage.unite,
      quantite: 1,
      prix_unitaire_ht: ouvrage.prix_unitaire_ht,
      taux_tva: 20,
      parent_ligne_id: selectedSection // Lier à la section sélectionnée
    };

    setLignes([...lignes, nouvelleLigne]);
    setOuvrageSearch('');
    setShowOuvrageDropdown(false);
  };

  const handleAddSection = () => {
    // Validation
    if (!newSection.description) {
      toast.error('Veuillez saisir le nom de la section');
      return;
    }

    const nouvelleLigne = {
      id: Date.now().toString(),
      type: 'SECTION',
      ouvrage_id: null,
      description: newSection.description,
      unite: '',
      quantite: 0,
      prix_unitaire_ht: 0,
      parent_ligne_id: null
    };

    setLignes([...lignes, nouvelleLigne]);

    // Réinitialiser le formulaire
    setNewSection({
      type: 'SECTION',
      description: ''
    });
    setShowSectionModal(false);
  };

  const handleAddMateriau = () => {
    // Validation
    if (!newMateriau.description || !newMateriau.unite || newMateriau.prix_unitaire_ht <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires du matériau');
      return;
    }

    const nouvelleLigne = {
      id: Date.now().toString(),
      type: 'MATERIAU',
      ouvrage_id: null,
      description: newMateriau.description,
      unite: newMateriau.unite,
      quantite: newMateriau.quantite,
      prix_unitaire_ht: newMateriau.prix_unitaire_ht,
      taux_tva: 20,
      parent_ligne_id: newMateriau.parent_ligne_id
    };

    setLignes([...lignes, nouvelleLigne]);

    // Réinitialiser le formulaire
    setNewMateriau({
      type: 'MATERIAU',
      description: '',
      quantite: 1,
      unite: 'u',
      prix_unitaire_ht: 0,
      parent_ligne_id: null
    });
    setShowMateriauxModal(false);
  };

  const handleAddMainOeuvre = () => {
    // Validation
    if (!newMainOeuvre.description || newMainOeuvre.prix_unitaire_ht <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires de la main d\'œuvre');
      return;
    }

    const nouvelleLigne = {
      id: Date.now().toString(),
      type: 'MAIN_OEUVRE',
      ouvrage_id: null,
      description: newMainOeuvre.description,
      unite: newMainOeuvre.unite,
      quantite: newMainOeuvre.quantite,
      prix_unitaire_ht: newMainOeuvre.prix_unitaire_ht,
      taux_tva: 20,
      parent_ligne_id: selectedSection
    };

    setLignes([...lignes, nouvelleLigne]);

    // Réinitialiser le formulaire
    setNewMainOeuvre({
      type: 'MAIN_OEUVRE',
      description: '',
      quantite: 1,
      unite: 'h',
      prix_unitaire_ht: 0,
      parent_ligne_id: null
    });
    setShowMainOeuvreModal(false);
  };

  const handleUpdateLigne = (index, field, value) => {
    const numericFields = ['quantite', 'prix_unitaire_ht', 'taux_tva'];
    const newLignes = [...lignes];
    newLignes[index][field] = numericFields.includes(field) ? (parseFloat(value) || 0) : value;
    setLignes(newLignes);
  };

  const handleRemoveLigne = (index) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const handleAddLigneLibre = () => {
    const nouvelleLigne = {
      id: Date.now().toString(),
      type: 'OUVRAGE',
      ouvrage_id: null,
      ouvrage: null,
      description: '',
      unite: 'u',
      quantite: 1,
      prix_unitaire_ht: 0,
      taux_tva: 20,
      parent_ligne_id: selectedSection
    };
    setLignes([...lignes, nouvelleLigne]);
  };

  // Gestion du drag and drop pour réorganiser les lignes
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    // Réorganiser les lignes
    const newLignes = [...lignes];
    const draggedItem = newLignes[draggedIndex];

    // Retirer l'élément de sa position actuelle
    newLignes.splice(draggedIndex, 1);

    // Insérer à la nouvelle position
    newLignes.splice(index, 0, draggedItem);

    setLignes(newLignes);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Calculs
  const calculateTotals = () => {
    let montant_ht = 0;
    let montant_tva = 0;
    lignes.forEach(ligne => {
      if (ligne.type === 'SECTION') return;
      const ht = (ligne.quantite || 0) * (ligne.prix_unitaire_ht || 0);
      montant_ht += ht;
      montant_tva += ht * ((ligne.taux_tva ?? 20) / 100);
    });
    const montant_ttc = montant_ht + montant_tva;
    return { montant_ht, montant_tva, montant_ttc };
  };

  const totals = calculateTotals();

  // Navigation entre étapes
  const goToStep = (step) => {
    if (step === 2 && !formData.client_id) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    if (step === 3 && lignes.length === 0) {
      toast.error('Veuillez ajouter au moins un ouvrage');
      return;
    }
    setCurrentStep(step);
  };

  // Soumission
  const handleSubmit = async () => {
    if (!formData.client_id || lignes.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        client_id: formData.client_id,
        objet: formData.objet,
        conditions_paiement: formData.conditions_paiement,
        date_validite: formData.date_validite,
        lignes: lignes.map(ligne => ({
          id: ligne.id, // Temporary ID for sections (needed for parent mapping)
          type: ligne.type,
          ouvrage_id: ligne.ouvrage_id || null,
          description: ligne.description,
          unite: ligne.unite,
          quantite: ligne.quantite,
          prix_unitaire_ht: ligne.prix_unitaire_ht,
          taux_tva: ligne.taux_tva ?? 20,
          parent_ligne_id: ligne.parent_ligne_id || null
        }))
      };

      if (isEditMode) {
        await devisService.updateDevis(id, payload);
        toast.success('Devis modifié avec succès');
        navigate(`/devis/${id}`);
      } else {
        const newDevis = await devisService.createDevis(payload);
        toast.success('Devis créé avec succès');
        navigate(`/devis/${newDevis.id}`);
      }
    } catch (error) {
      console.error('Erreur sauvegarde devis:', error);
      toast.error('Erreur lors de la sauvegarde du devis');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
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
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="px-8 py-6">
            <button
              onClick={() => navigate('/devis')}
              className="flex items-center gap-2 text-white hover:text-green-100 transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour aux devis</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/30 backdrop-blur-sm">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {isEditMode ? 'Modifier le devis' : 'Nouveau devis'}
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
                      {currentStep > step ? <Check className="w-5 h-5" /> : step}
                    </div>
                    <div className="text-xs text-white mt-2 font-medium">
                      {step === 1 && 'Informations'}
                      {step === 2 && 'Ouvrages'}
                      {step === 3 && 'Récapitulatif'}
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

            {/* Recherche client */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Client <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Créer un client
                </button>
              </div>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={selectedClient ? selectedClient.nom : clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      searchClients(e.target.value);
                      if (selectedClient) setSelectedClient(null);
                    }}
                    onFocus={() => {
                      searchClients(clientSearch || '');
                      setShowClientDropdown(true);
                    }}
                    placeholder="Rechercher un client..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {selectedClient && (
                    <button
                      onClick={() => {
                        setSelectedClient(null);
                        setFormData(prev => ({ ...prev, client_id: '' }));
                        setClientSearch('');
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Dropdown clients */}
                {showClientDropdown && clients.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className={`p-2 rounded-lg ${client.type === 'PARTICULIER' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                          {client.type === 'PARTICULIER' ? (
                            <User className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Building2 className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{client.nom}</div>
                          <div className="text-sm text-gray-500">
                            {client.email || client.telephone || '-'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedClient && (
                <div className={`mt-3 p-4 rounded-xl ${selectedClient.type === 'PARTICULIER' ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedClient.type === 'PARTICULIER' ? 'bg-purple-200' : 'bg-blue-200'}`}>
                      {selectedClient.type === 'PARTICULIER' ? (
                        <User className="w-5 h-5 text-purple-700" />
                      ) : (
                        <Building2 className="w-5 h-5 text-blue-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{selectedClient.nom}</div>
                      <div className="text-sm text-gray-600">
                        {selectedClient.email} • {selectedClient.telephone}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Objet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objet du devis
              </label>
              <input
                type="text"
                value={formData.objet}
                onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                placeholder="Ex: Rénovation salle de bain"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Date validité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de validité
              </label>
              <input
                type="date"
                value={formData.date_validite}
                onChange={(e) => setFormData({ ...formData, date_validite: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Conditions paiement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conditions de paiement
              </label>
              <textarea
                value={formData.conditions_paiement}
                onChange={(e) => setFormData({ ...formData, conditions_paiement: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                onClick={() => navigate('/devis')}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => goToStep(2)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                Suivant
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Ouvrages */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Boutons d'ajout */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Composer le devis</h2>

              {/* Sélecteur de section */}
              {lignes.some(l => l.type === 'SECTION') && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ajouter les éléments dans la section :
                  </label>
                  <select
                    value={selectedSection || ''}
                    onChange={(e) => setSelectedSection(e.target.value || null)}
                    className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    <option value="">Sans section (élément indépendant)</option>
                    {lignes
                      .filter(l => l.type === 'SECTION')
                      .map((section, idx) => (
                        <option key={section.id} value={section.id}>
                          {section.description}
                        </option>
                      ))
                    }
                  </select>
                  <p className="text-xs text-gray-600 mt-2">
                    Les éléments ajoutés seront automatiquement liés à cette section
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter une section
                </button>
                <button
                  type="button"
                  onClick={() => setShowOuvrageModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter une prestation du catalogue
                </button>
                <button
                  type="button"
                  onClick={handleAddLigneLibre}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un ouvrage libre
                </button>
                <button
                  type="button"
                  onClick={() => setShowMainOeuvreModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter main d'œuvre
                </button>
                <button
                  type="button"
                  onClick={() => setShowMateriauxModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un matériau
                </button>
              </div>
            </div>

            {/* Lignes du devis */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-800">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">
                    Ouvrages du devis ({lignes.length})
                  </h3>
                </div>
              </div>

              {lignes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {(() => {
                        let sectionNumber = 0;
                        let currentSectionNumber = 0;
                        let itemInSectionNumber = 0;

                        return lignes.map((ligne, index) => {
                          const isSection = ligne.type === 'SECTION';
                          const isOuvrage = ligne.type === 'OUVRAGE';
                          const isMateriau = ligne.type === 'MATERIAU';
                          const isMainOeuvre = ligne.type === 'MAIN_OEUVRE';

                          // Calculer la numérotation
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

                          // Rendu SECTION
                          if (isSection) {
                            return (
                              <tr
                                key={index}
                                draggable={true}
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`bg-orange-50 border-l-4 border-orange-500 cursor-move transition-opacity ${
                                  draggedIndex === index ? 'opacity-50' : 'opacity-100'
                                }`}
                              >
                                <td className="px-4 py-3 font-bold text-orange-900">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-orange-400" />
                                    {numero}
                                  </div>
                                </td>
                                <td className="px-6 py-3" colSpan="5">
                                  <div className="font-bold text-orange-900 uppercase text-base">
                                    {ligne.description}
                                  </div>
                                </td>
                                <td className="px-4 py-3"></td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleRemoveLigne(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          }

                          // Rendu OUVRAGE ou MATERIAU
                          return (
                            <tr
                              key={index}
                              draggable={true}
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                              className={`hover:bg-gray-50 border-b border-gray-100 cursor-move transition-opacity ${
                                isMateriau ? 'bg-blue-50/20' : isMainOeuvre ? 'bg-purple-50/20' : ''
                              } ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
                            >
                              <td className="px-4 py-3 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                  {numero}
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <div className={`flex items-start gap-2 ${isMateriau || isMainOeuvre ? 'pl-6' : ''}`}>
                                  {(isMateriau || isMainOeuvre) && (
                                    <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                  )}
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
                                      {isOuvrage && !ligne.ouvrage_id ? (
                                        <input
                                          type="text"
                                          value={ligne.description}
                                          onChange={(e) => handleUpdateLigne(index, 'description', e.target.value)}
                                          placeholder="Description de la prestation"
                                          className="font-medium text-gray-900 text-sm border-b border-gray-300 focus:border-green-500 focus:outline-none bg-transparent w-full"
                                        />
                                      ) : (
                                        <div className="font-medium text-gray-900 text-sm">{ligne.description}</div>
                                      )}
                                    </div>
                                    {isOuvrage && ligne.ouvrage && (
                                      <div className="text-xs text-gray-500 mt-1">{ligne.ouvrage.code}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-600">
                                {ligne.unite}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={ligne.quantite}
                                  onChange={(e) => handleUpdateLigne(index, 'quantite', e.target.value)}
                                  className="w-20 px-2 py-1.5 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={ligne.prix_unitaire_ht}
                                  onChange={(e) => handleUpdateLigne(index, 'prix_unitaire_ht', e.target.value)}
                                  className="w-28 px-2 py-1.5 border border-gray-300 rounded text-right text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <select
                                  value={ligne.taux_tva ?? 20}
                                  onChange={(e) => handleUpdateLigne(index, 'taux_tva', e.target.value)}
                                  className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                  <option value="2.1">2,1%</option>
                                  <option value="5.5">5,5%</option>
                                  <option value="8.5">8,5%</option>
                                  <option value="10">10%</option>
                                  <option value="20">20%</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">
                                {formatCurrency(ligne.quantite * ligne.prix_unitaire_ht)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleRemoveLigne(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun ouvrage ajouté</p>
                  <p className="text-sm text-gray-400 mt-1">Recherchez et ajoutez des ouvrages ci-dessus</p>
                </div>
              )}

              {/* Totaux */}
              {lignes.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="max-w-md ml-auto space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Total HT</span>
                      <span className="font-semibold">{formatCurrency(totals.montant_ht)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>TVA</span>
                      <span className="font-semibold">{formatCurrency(totals.montant_tva)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                      <span>Total TTC</span>
                      <span className="text-green-600">{formatCurrency(totals.montant_ttc)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Précédent
                </button>
                <button
                  onClick={() => goToStep(3)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  Suivant
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Récapitulatif */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Récapitulatif</h2>

              {/* Client */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-2">Client</div>
                <div className="font-semibold text-gray-900">{selectedClient?.nom}</div>
                <div className="text-sm text-gray-600">{selectedClient?.email}</div>
              </div>

              {/* Infos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Objet</div>
                  <div className="text-gray-900">{formData.objet || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Date validité</div>
                  <div className="text-gray-900">
                    {formData.date_validite ? new Date(formData.date_validite).toLocaleDateString('fr-FR') : '-'}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-gray-500 mb-1">Conditions paiement</div>
                  <div className="text-gray-900">{formData.conditions_paiement}</div>
                </div>
              </div>

              {/* Lignes */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-500 mb-3">Ouvrages ({lignes.length})</div>
                <div className="space-y-2">
                  {lignes.map((ligne, index) => {
                    const isSection = ligne.type === 'SECTION';

                    return (
                      <div
                        key={index}
                        className={`flex justify-between items-start p-3 rounded-lg ${
                          isSection ? 'bg-orange-50 border-l-4 border-orange-500' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className={`font-medium ${isSection ? 'text-orange-900 uppercase font-bold' : 'text-gray-900'}`}>
                            {ligne.description || ligne.ouvrage?.denomination || 'Sans nom'}
                          </div>
                          {!isSection && (
                            <div className="text-sm text-gray-500">
                              {ligne.quantite} × {formatCurrency(ligne.prix_unitaire_ht)}
                            </div>
                          )}
                        </div>
                        {!isSection && (
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(ligne.quantite * ligne.prix_unitaire_ht)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totaux */}
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Total HT</span>
                    <span className="font-semibold">{formatCurrency(totals.montant_ht)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>TVA</span>
                    <span className="font-semibold">{formatCurrency(totals.montant_tva)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-green-300">
                    <span>Total TTC</span>
                    <span className="text-green-600">{formatCurrency(totals.montant_ttc)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions finales */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Précédent
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {isEditMode ? 'Modifier le devis' : 'Créer le devis'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal création client */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Créer un nouveau client</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type de client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setNewClientData({ ...newClientData, type: 'ENTREPRISE' })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                      newClientData.type === 'ENTREPRISE'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Building2 className="w-5 h-5 mx-auto mb-1" />
                    Entreprise
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewClientData({ ...newClientData, type: 'PARTICULIER' })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                      newClientData.type === 'PARTICULIER'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <User className="w-5 h-5 mx-auto mb-1" />
                    Particulier
                  </button>
                </div>
              </div>

              {/* Prénom (si particulier) */}
              {newClientData.type === 'PARTICULIER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newClientData.prenom}
                    onChange={(e) => setNewClientData({ ...newClientData, prenom: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newClientData.type === 'PARTICULIER' ? 'Nom' : 'Raison sociale'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClientData.nom}
                  onChange={(e) => setNewClientData({ ...newClientData, nom: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newClientData.telephone}
                  onChange={(e) => setNewClientData({ ...newClientData, telephone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={newClientData.adresse}
                  onChange={(e) => setNewClientData({ ...newClientData, adresse: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Code postal et Ville */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                  <input
                    type="text"
                    value={newClientData.code_postal}
                    onChange={(e) => setNewClientData({ ...newClientData, code_postal: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                  <input
                    type="text"
                    value={newClientData.ville}
                    onChange={(e) => setNewClientData({ ...newClientData, ville: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* SIRET (si entreprise) */}
              {newClientData.type === 'ENTREPRISE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SIRET</label>
                  <input
                    type="text"
                    value={newClientData.siret}
                    onChange={(e) => setNewClientData({ ...newClientData, siret: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="14 chiffres"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateClient}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Créer le client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal création section */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Ajouter une section</h3>
              <button
                onClick={() => setShowSectionModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la section <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSection.description}
                  onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                  placeholder="Ex: GROS ŒUVRE, ÉLECTRICITÉ, PLOMBERIE..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2">
                  Les sections permettent d'organiser votre devis par lots ou catégories de travaux
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal création matériau */}
      {showMateriauxModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Ajouter un matériau</h3>
              <button
                onClick={() => setShowMateriauxModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMateriau.description}
                  onChange={(e) => setNewMateriau({ ...newMateriau, description: e.target.value })}
                  placeholder="Ex: Carrelage 30x30, Peinture blanche..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Quantité et Unité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMateriau.quantite}
                    onChange={(e) => setNewMateriau({ ...newMateriau, quantite: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unité <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newMateriau.unite}
                    onChange={(e) => setNewMateriau({ ...newMateriau, unite: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="u">Unité (u)</option>
                    <option value="m²">Mètre carré (m²)</option>
                    <option value="m³">Mètre cube (m³)</option>
                    <option value="ml">Mètre linéaire (ml)</option>
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="L">Litre (L)</option>
                    <option value="lot">Lot</option>
                  </select>
                </div>
              </div>

              {/* Prix unitaire HT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix unitaire HT <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMateriau.prix_unitaire_ht}
                  onChange={(e) => setNewMateriau({ ...newMateriau, prix_unitaire_ht: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Lier à un ouvrage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lier à un ouvrage (optionnel)
                </label>
                <select
                  value={newMateriau.parent_ligne_id || ''}
                  onChange={(e) => setNewMateriau({ ...newMateriau, parent_ligne_id: e.target.value || null })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Matériau indépendant</option>
                  {lignes.filter(l => l.type === 'OUVRAGE').map((ouvrage) => (
                    <option key={ouvrage.id} value={ouvrage.id}>
                      {ouvrage.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Si vous liez ce matériau à un ouvrage, il sera affiché comme sous-élément de cet ouvrage
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMateriauxModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddMateriau}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Ajouter le matériau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout ouvrage */}
      {showOuvrageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Ajouter une prestation du catalogue</h3>
              <button
                onClick={() => {
                  setShowOuvrageModal(false);
                  setOuvrageSearch('');
                  setShowOuvrageDropdown(false);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {/* Filtres */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={ouvrageSearch}
                    onChange={(e) => {
                      setOuvrageSearch(e.target.value);
                      searchOuvrages(e.target.value);
                    }}
                    onFocus={() => searchOuvrages(ouvrageSearch)}
                    placeholder="Rechercher un ouvrage..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={categorieFilter}
                  onChange={(e) => {
                    setCategorieFilter(e.target.value);
                    searchOuvrages(ouvrageSearch);
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat.nom} value={cat.nom}>
                      {cat.nom} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Liste ouvrages */}
              {ouvrages.length > 0 ? (
                <div className="space-y-2">
                  {ouvrages.map((ouvrage) => (
                    <button
                      key={ouvrage.id}
                      onClick={() => {
                        handleAddOuvrage(ouvrage);
                        setShowOuvrageModal(false);
                        setOuvrageSearch('');
                      }}
                      className="w-full p-4 bg-white rounded-xl hover:bg-green-50 hover:border-green-300 border border-gray-200 transition-all duration-200 text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {ouvrage.code}
                            </span>
                            <span className="text-sm text-gray-500">{ouvrage.categorie}</span>
                          </div>
                          <div className="font-medium text-gray-900 mb-1">{ouvrage.denomination}</div>
                          {ouvrage.notes && (
                            <div className="text-sm text-gray-500">{ouvrage.notes}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(ouvrage.prix_unitaire_ht)}
                          </div>
                          <div className="text-sm text-gray-500">par {ouvrage.unite}</div>
                          {ouvrage.badge && (
                            <div className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${
                              ouvrage.badge === 'OPTIMISE' ? 'bg-green-100 text-green-700' :
                              ouvrage.badge === 'EN_APPRENTISSAGE' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {ouvrage.badge === 'OPTIMISE' ? '✓ Optimisé' :
                               ouvrage.badge === 'EN_APPRENTISSAGE' ? '⏳ En apprentissage' :
                               'Non testé'}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun ouvrage trouvé</p>
                  <p className="text-sm text-gray-400 mt-1">Modifiez vos critères de recherche</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout main d'œuvre */}
      {showMainOeuvreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Ajouter de la main d'œuvre</h3>
              <button
                onClick={() => setShowMainOeuvreModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMainOeuvre.description}
                  onChange={(e) => setNewMainOeuvre({ ...newMainOeuvre, description: e.target.value })}
                  placeholder="Ex: Installation électrique, Pose carrelage..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Quantité et Unité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMainOeuvre.quantite}
                    onChange={(e) => setNewMainOeuvre({ ...newMainOeuvre, quantite: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unité <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newMainOeuvre.unite}
                    onChange={(e) => setNewMainOeuvre({ ...newMainOeuvre, unite: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="h">Heure (h)</option>
                    <option value="j">Jour (j)</option>
                    <option value="f">Forfait (f)</option>
                  </select>
                </div>
              </div>

              {/* Prix unitaire HT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix unitaire HT <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMainOeuvre.prix_unitaire_ht}
                  onChange={(e) => setNewMainOeuvre({ ...newMainOeuvre, prix_unitaire_ht: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMainOeuvreModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddMainOeuvre}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
                >
                  Ajouter la main d'œuvre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
