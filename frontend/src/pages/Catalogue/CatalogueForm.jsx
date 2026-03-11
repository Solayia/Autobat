import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Package, Hash, Tag, FileText, DollarSign, Clock, Save, X, TrendingUp, TrendingDown, Activity, Loader2, Trash2, History } from 'lucide-react';
import catalogueService from '../../services/catalogueService';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function CatalogueForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingOuvrage, setLoadingOuvrage] = useState(isEdit);
  const [ouvrageData, setOuvrageData] = useState(null); // données auto-learning
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    categorie: '',
    denomination: '',
    unite: 'M²',
    prix_unitaire_ht: '',
    temps_estime_minutes: '60',
    notes: ''
  });

  const categories = [
    'Charpente', 'Couverture', 'Maçonnerie', 'Ravalement', 'Plomberie',
    'Électricité', 'Menuiserie', 'Isolation', 'Plâtrerie', 'Peinture',
    'Carrelage', 'Autre'
  ];

  const unites = ['M²', 'ML', 'U', 'M³', 'H', 'Forfait'];

  useEffect(() => {
    if (isEdit) {
      loadOuvrage();
    }
  }, [id]);

  const loadOuvrage = async () => {
    try {
      setLoadingOuvrage(true);
      const ouvrage = await catalogueService.getOuvrageById(id);
      setOuvrageData(ouvrage);
      setFormData({
        code: ouvrage.code || '',
        categorie: ouvrage.categorie || '',
        denomination: ouvrage.denomination || '',
        unite: ouvrage.unite || 'M²',
        prix_unitaire_ht: ouvrage.prix_unitaire_ht?.toString() || '',
        temps_estime_minutes: ouvrage.temps_estime_minutes?.toString() || '60',
        notes: ouvrage.notes || ''
      });
    } catch (error) {
      toast.error('Ouvrage introuvable');
      navigate('/catalogue');
    } finally {
      setLoadingOuvrage(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.categorie || !formData.denomination || !formData.unite || !formData.prix_unitaire_ht) {
      toast.error('Les champs code, catégorie, dénomination, unité et prix sont obligatoires');
      return;
    }

    const prixHT = parseFloat(formData.prix_unitaire_ht);
    if (isNaN(prixHT) || prixHT <= 0) {
      toast.error('Le prix HT doit être un nombre positif');
      return;
    }

    try {
      setLoading(true);
      const dataToSend = {
        code: formData.code.trim(),
        categorie: formData.categorie,
        denomination: formData.denomination.trim(),
        unite: formData.unite,
        prix_unitaire_ht: prixHT,
        temps_estime_minutes: formData.temps_estime_minutes ? parseInt(formData.temps_estime_minutes) : 60,
        notes: formData.notes.trim() || undefined
      };

      if (isEdit) {
        await catalogueService.updateOuvrage(id, dataToSend);
        toast.success('Ouvrage mis à jour');
      } else {
        await catalogueService.createOuvrage(dataToSend);
        toast.success('Ouvrage créé avec succès');
      }
      navigate('/catalogue');
    } catch (error) {
      toast.error(error.response?.data?.message || `Erreur lors de la ${isEdit ? 'modification' : 'création'} de l'ouvrage`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmDialog({
      message: 'Supprimer cet ouvrage ? Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        try {
          await catalogueService.deleteOuvrage(id);
          toast.success('Ouvrage supprimé');
          navigate('/catalogue');
        } catch (error) {
          toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
        }
      }
    });
  };

  // Calcul info auto-learning
  const getAutoLearningInfo = () => {
    if (!ouvrageData || !ouvrageData.temps_reel_moyen || ouvrageData.nb_chantiers_realises === 0) return null;
    const estime = ouvrageData.temps_estime_minutes;
    const reel = ouvrageData.temps_reel_moyen;
    if (!estime) return null;
    const ecart = ((reel - estime) / estime) * 100;
    return {
      reel: Math.round(reel),
      estime,
      ecart: ecart.toFixed(1),
      nbChantiers: ouvrageData.nb_chantiers_realises,
      derniereMaj: ouvrageData.derniere_maj_auto
    };
  };

  const alInfo = getAutoLearningInfo();

  if (loadingOuvrage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/catalogue')}
          className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-2 transition-colors"
        >
          <X className="w-4 h-4" />
          Retour au catalogue
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEdit ? 'Modifier l\'ouvrage' : 'Nouvel ouvrage'}
              </h1>
              <p className="text-gray-500 mt-1">
                {isEdit ? `Code : ${ouvrageData?.code}` : 'Ajoutez un nouvel ouvrage à votre catalogue'}
              </p>
            </div>
          </div>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Bloc auto-learning (mode édition uniquement) */}
      {isEdit && ouvrageData && (
        <div className={`rounded-2xl border p-5 mb-6 ${alInfo ? (parseFloat(alInfo.ecart) > 10 ? 'bg-orange-50 border-orange-200' : parseFloat(alInfo.ecart) < -10 ? 'bg-purple-50 border-purple-200' : 'bg-green-50 border-green-200') : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-3">Données auto-learning ({ouvrageData.nb_chantiers_realises} chantier{ouvrageData.nb_chantiers_realises > 1 ? 's' : ''})</h3>
              {alInfo ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Temps estimé</p>
                    <p className="text-lg font-semibold text-gray-800">{alInfo.estime} min/{ouvrageData.unite}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Temps réel moyen</p>
                    <p className="text-lg font-semibold text-gray-800">{alInfo.reel} min/{ouvrageData.unite}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Écart</p>
                    <div className="flex items-center gap-1">
                      {parseFloat(alInfo.ecart) > 0
                        ? <TrendingUp className="w-4 h-4 text-orange-500" />
                        : <TrendingDown className="w-4 h-4 text-purple-500" />
                      }
                      <p className={`text-lg font-semibold ${parseFloat(alInfo.ecart) > 10 ? 'text-orange-600' : parseFloat(alInfo.ecart) < -10 ? 'text-purple-600' : 'text-green-600'}`}>
                        {parseFloat(alInfo.ecart) > 0 ? '+' : ''}{alInfo.ecart}%
                      </p>
                    </div>
                    {Math.abs(parseFloat(alInfo.ecart)) > 10 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {parseFloat(alInfo.ecart) > 10 ? 'Envisagez d\'augmenter le prix' : 'Envisagez de baisser le prix'}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Pas encore de données réelles collectées sur ce chantier.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historique prix (mode édition uniquement, si données) */}
      {isEdit && ouvrageData?.historique_prix?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <History className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Historique des prix</h2>
              <p className="text-sm text-gray-500">{ouvrageData.historique_prix.length} ajustement{ouvrageData.historique_prix.length > 1 ? 's' : ''} auto-learning</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Date</th>
                  <th className="text-right py-2 pr-4 text-gray-500 font-medium">Ancien prix</th>
                  <th className="text-right py-2 pr-4 text-gray-500 font-medium">Nouveau prix</th>
                  <th className="text-right py-2 pr-4 text-gray-500 font-medium">Écart</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Raison</th>
                </tr>
              </thead>
              <tbody>
                {ouvrageData.historique_prix.map((h, idx) => {
                  const ecart = h.ecart_pourcent ?? ((h.nouveau_prix - h.ancien_prix) / h.ancien_prix * 100);
                  const isHausse = ecart > 0;
                  return (
                    <tr key={h.id} className={`border-b border-gray-50 ${idx === 0 ? 'bg-purple-50/40' : ''}`}>
                      <td className="py-2 pr-4 text-gray-600">
                        {new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-600 font-mono">
                        {h.ancien_prix.toFixed(2)} €
                      </td>
                      <td className="py-2 pr-4 text-right font-mono font-semibold text-gray-900">
                        {h.nouveau_prix.toFixed(2)} €
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-semibold ${isHausse ? 'text-orange-600' : 'text-green-600'}`}>
                          {isHausse ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isHausse ? '+' : ''}{ecart.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 text-gray-500 text-xs">{h.raison}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations principales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Informations principales</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 text-gray-400" />
                Code ouvrage <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="Ex: CHARP-001"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Unité <span className="text-red-500">*</span>
                </label>
                <select
                  name="unite"
                  value={formData.unite}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  {unites.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Dénomination <span className="text-red-500">*</span>
              </label>
              <textarea
                name="denomination"
                value={formData.denomination}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                placeholder="Ex: Fourniture et pose de charpente traditionnelle"
              />
            </div>
          </div>
        </div>

        {/* Prix et temps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Tarification</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Prix unitaire HT <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="prix_unitaire_ht"
                  value={formData.prix_unitaire_ht}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="97.75"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">Prix hors taxes par {formData.unite || 'unité'}</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Temps estimé (minutes)
              </label>
              <input
                type="number"
                name="temps_estime_minutes"
                value={formData.temps_estime_minutes}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="60"
              />
              <p className="mt-1 text-sm text-gray-500">Temps de réalisation estimé par {formData.unite || 'unité'}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Notes internes</h2>
          </div>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
            placeholder="Notes sur cet ouvrage (conditions d'application, précisions techniques...)"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            disabled={loading}
          >
            <X className="w-4 h-4" />
            Annuler
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Mettre à jour' : 'Créer l\'ouvrage'}
              </>
            )}
          </button>
        </div>
      </form>

      <ConfirmDialog confirm={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
}
