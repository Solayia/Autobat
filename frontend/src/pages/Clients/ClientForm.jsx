import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Building2, Mail, Phone, FileText, MapPin, Hash, Save, X, CheckCircle2, User, Users } from 'lucide-react';
import clientService from '../../services/clientService';

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ENTREPRISE', // ENTREPRISE ou PARTICULIER
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    ville: '',
    siret: '',
    notes: '',
    actif: true
  });

  useEffect(() => {
    if (isEditing) {
      loadClient();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClientById(id);
      setFormData({
        type: data.client.type || 'ENTREPRISE',
        prenom: data.client.prenom || '',
        nom: data.client.nom,
        email: data.client.email,
        telephone: data.client.telephone,
        adresse: data.client.adresse || '',
        code_postal: data.client.code_postal || '',
        ville: data.client.ville || '',
        siret: data.client.siret || '',
        notes: data.client.notes || '',
        actif: data.client.actif
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement du client');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      // Réinitialiser les champs spécifiques si on change de type
      ...(newType === 'PARTICULIER' ? { siret: '' } : {}),
      ...(newType === 'ENTREPRISE' ? { prenom: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation selon le type
    if (formData.type === 'ENTREPRISE') {
      if (!formData.nom || !formData.email || !formData.telephone) {
        toast.error('Les champs nom d\'entreprise, email et téléphone sont obligatoires');
        return;
      }
    } else {
      if (!formData.prenom || !formData.nom || !formData.email || !formData.telephone) {
        toast.error('Les champs prénom, nom, email et téléphone sont obligatoires');
        return;
      }
    }

    try {
      setLoading(true);

      // Ne pas envoyer le SIRET pour les particuliers
      const dataToSend = { ...formData };
      if (formData.type === 'PARTICULIER') {
        delete dataToSend.siret;
      }

      if (isEditing) {
        await clientService.updateClient(id, dataToSend);
        toast.success('Client modifié avec succès');
      } else {
        await clientService.createClient(dataToSend);
        toast.success('Client créé avec succès');
      }

      navigate('/clients');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const isEntreprise = formData.type === 'ENTREPRISE';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header avec badge */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/clients')}
          className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-2 transition-colors"
        >
          <X className="w-4 h-4" />
          Fermer
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            {isEntreprise ? (
              <Building2 className="w-6 h-6 text-white" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Modifier le client' : 'Nouveau client'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditing ? 'Mettez à jour les informations du client' : 'Ajoutez un nouveau client à votre portefeuille'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggle Type de client */}
        {!isEditing && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de client
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTypeChange('ENTREPRISE')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  isEntreprise
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Entreprise</div>
                  <div className="text-xs opacity-90">Professionnel</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('PARTICULIER')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  !isEntreprise
                    ? 'border-purple-600 bg-purple-600 text-white shadow-lg'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                }`}
              >
                <User className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Particulier</div>
                  <div className="text-xs opacity-90">Individu</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Informations principales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isEntreprise ? 'bg-blue-100' : 'bg-purple-100'
            }`}>
              {isEntreprise ? (
                <Building2 className="w-5 h-5 text-blue-600" />
              ) : (
                <User className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Informations principales</h2>
          </div>

          <div className="space-y-5">
            {/* Formulaire ENTREPRISE */}
            {isEntreprise ? (
              <>
                {/* Nom entreprise */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    Nom de l'entreprise
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ex: SARL Dupont Construction"
                  />
                </div>

                {/* SIRET */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    SIRET
                  </label>
                  <input
                    type="text"
                    name="siret"
                    value={formData.siret}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="12345678901234"
                    maxLength="14"
                  />
                  <p className="mt-1 text-sm text-gray-500">Numéro à 14 chiffres (optionnel)</p>
                </div>
              </>
            ) : (
              /* Formulaire PARTICULIER */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Prénom */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Prénom
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Jean"
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Nom
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Dupont"
                  />
                </div>
              </div>
            )}

            {/* Email & Téléphone (commun aux deux types) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  Email
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    isEntreprise ? 'focus:ring-blue-500' : 'focus:ring-purple-500'
                  }`}
                  placeholder={isEntreprise ? 'contact@entreprise.fr' : 'jean.dupont@email.fr'}
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Téléphone
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    isEntreprise ? 'focus:ring-blue-500' : 'focus:ring-purple-500'
                  }`}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Localisation</h2>
          </div>

          <div className="space-y-5">
            {/* Adresse */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Adresse complète
              </label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="12 rue de la République"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Code postal */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Code postal
                </label>
                <input
                  type="text"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="75001"
                  maxLength="5"
                />
              </div>

              {/* Ville */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Paris"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Notes internes</h2>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Notes & commentaires
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
              placeholder="Ajoutez des notes privées sur ce client (préférences, historique, informations importantes...)"
            />
            <p className="mt-1 text-sm text-gray-500">Ces notes sont visibles uniquement par votre équipe</p>
          </div>
        </div>

        {/* Statut (uniquement en édition) */}
        {isEditing && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Statut du client</h2>
            </div>

            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                name="actif"
                checked={formData.actif}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Client actif</span>
                <p className="text-xs text-gray-500 mt-1">
                  Les clients inactifs n'apparaissent plus dans les sélections et recherches
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            disabled={loading}
          >
            <X className="w-4 h-4" />
            Annuler
          </button>
          <button
            type="submit"
            className={`px-6 py-3 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isEntreprise
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? 'Enregistrer les modifications' : 'Créer le client'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
