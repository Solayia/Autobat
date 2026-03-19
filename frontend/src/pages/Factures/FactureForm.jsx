import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Info } from 'lucide-react';
import factureService from '../../services/factureService';
import chantierService from '../../services/chantierService';

export default function FactureForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [chantiersTermines, setChantiersTermines] = useState([]);
  const [chantierSelected, setChantierSelected] = useState(null);
  const [acompteFromDevis, setAcompteFromDevis] = useState(null);
  const MENTIONS_DEFAUT = `En cas de retard de paiement, seront exigibles, conformément à l'article L 441-6 du code de commerce, une indemnité calculée sur la base de trois fois le taux de l'intérêt légal en vigueur ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 euros.\nEscompte pour paiement anticipé : néant.`;

  const [formData, setFormData] = useState({
    chantier_id: '',
    devis_id: '',
    acompte_demande: 0,
    date_echeance: '',
    notes: '',
    mentions_legales: MENTIONS_DEFAUT
  });
  const [lignes, setLignes] = useState([
    { description: '', quantite: 1, unite: 'unité', prix_unitaire_ht: 0 }
  ]);

  useEffect(() => {
    loadChantiersTermines();
  }, []);

  useEffect(() => {
    if (formData.chantier_id) {
      loadChantier(formData.chantier_id);
    }
  }, [formData.chantier_id]);

  const loadChantiersTermines = async () => {
    try {
      const data = await chantierService.getChantiers({ statut: 'TERMINE', limit: 100 });
      setChantiersTermines(data.data || []);
    } catch (error) {
      console.error('Erreur chargement chantiers terminés:', error);
    }
  };

  const loadChantier = async (id) => {
    try {
      const chantier = await chantierService.getChantierById(id);
      setChantierSelected(chantier);

      // Pré-remplir avec le devis si disponible
      if (chantier.devis) {
        const acompte = chantier.devis.acompte_verse > 0 ? chantier.devis.acompte_verse : null;
        setAcompteFromDevis(acompte);
        setFormData(prev => ({
          ...prev,
          devis_id: chantier.devis.id,
          acompte_demande: acompte ?? 0
        }));

        // Charger les lignes du devis
        if (chantier.devis.lignes && chantier.devis.lignes.length > 0) {
          setLignes(chantier.devis.lignes.map(ligne => ({
            description: ligne.description,
            quantite: ligne.quantite,
            unite: ligne.unite || 'unité',
            prix_unitaire_ht: ligne.prix_unitaire_ht
          })));
        }
      } else {
        setAcompteFromDevis(null);
      }
    } catch (error) {
      console.error('Erreur chargement chantier:', error);
    }
  };

  const handleAddLigne = () => {
    setLignes([...lignes, { description: '', quantite: 1, unite: 'unité', prix_unitaire_ht: 0 }]);
  };

  const handleRemoveLigne = (index) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const handleLigneChange = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index] = {
      ...newLignes[index],
      [field]: field === 'quantite' || field === 'prix_unitaire_ht' ? parseFloat(value) || 0 : value
    };
    setLignes(newLignes);
  };

  const calculateMontants = () => {
    const montant_ht = lignes.reduce((sum, ligne) => {
      return sum + (ligne.quantite * ligne.prix_unitaire_ht);
    }, 0);
    const montant_tva = montant_ht * 0.20;
    const montant_ttc = montant_ht + montant_tva;

    return { montant_ht, montant_tva, montant_ttc };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.chantier_id) {
      toast.error('Veuillez sélectionner un chantier');
      return;
    }

    if (lignes.length === 0 || lignes.some(l => !l.description)) {
      toast.error('Veuillez remplir toutes les lignes de facture');
      return;
    }

    try {
      setLoading(true);

      // Calculer la date d'échéance par défaut (30 jours)
      const date_echeance = formData.date_echeance ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const facture = await factureService.createFacture({
        ...formData,
        date_echeance,
        acompte_demande: parseFloat(formData.acompte_demande) || 0,
        lignes
      });

      toast.success('Facture créée avec succès !');
      navigate(`/factures/${facture.id}`);
    } catch (error) {
      console.error('Erreur création facture:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la facture');
    } finally {
      setLoading(false);
    }
  };

  const { montant_ht, montant_tva, montant_ttc } = calculateMontants();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/factures')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle facture</h1>
          <p className="text-gray-600 mt-1">Créer une facture depuis un chantier terminé</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sélection chantier */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chantier</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chantier terminé *
              </label>
              <select
                value={formData.chantier_id}
                onChange={(e) => setFormData({ ...formData, chantier_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un chantier</option>
                {chantiersTermines.map((chantier) => (
                  <option key={chantier.id} value={chantier.id}>
                    {chantier.reference ? `${chantier.reference} - ` : ''}{chantier.nom} ({chantier.client?.nom})
                  </option>
                ))}
              </select>
            </div>

            {chantierSelected && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Informations du chantier</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Client:</strong> {chantierSelected.client?.nom}</p>
                  <p><strong>Adresse:</strong> {chantierSelected.adresse}</p>
                  {chantierSelected.devis && (
                    <p><strong>Devis source:</strong> {chantierSelected.devis.numero_devis}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lignes de facture */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lignes de facture</h2>
            <button
              type="button"
              onClick={handleAddLigne}
              className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une ligne
            </button>
          </div>

          <div className="space-y-3">
            {lignes.map((ligne, index) => (
              <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={ligne.description}
                      onChange={(e) => handleLigneChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Quantité"
                      value={ligne.quantite}
                      onChange={(e) => handleLigneChange(index, 'quantite', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Unité"
                      value={ligne.unite}
                      onChange={(e) => handleLigneChange(index, 'unite', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Prix HT"
                      value={ligne.prix_unitaire_ht}
                      onChange={(e) => handleLigneChange(index, 'prix_unitaire_ht', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div className="text-right min-w-[100px] pt-2">
                  <div className="font-medium text-gray-900">
                    {(ligne.quantite * ligne.prix_unitaire_ht).toFixed(2)} €
                  </div>
                </div>
                {lignes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLigne(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Récapitulatif montants */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total HT:</span>
                  <span className="font-medium">{montant_ht.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA (20%):</span>
                  <span className="font-medium">{montant_tva.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total TTC:</span>
                  <span className="text-green-600">{montant_ttc.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations complémentaires</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acompte déjà versé par le client (€)
              </label>
              {acompteFromDevis !== null && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Acompte issu du devis : <strong>{acompteFromDevis.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong> — pré-rempli automatiquement, modifiable si besoin.
                  </p>
                </div>
              )}
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.acompte_demande}
                onChange={(e) => setFormData({ ...formData, acompte_demande: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Sera déduit automatiquement du solde restant à payer.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'échéance
              </label>
              <input
                type="date"
                value={formData.date_echeance}
                onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Si non spécifié, échéance à 30 jours</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Notes ou conditions particulières..."
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Mentions légales (bas de facture)
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mentions_legales: '' })}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
            <textarea
              value={formData.mentions_legales}
              onChange={(e) => setFormData({ ...formData, mentions_legales: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Laissez vide pour ne pas afficher de mentions sur la facture..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Pré-rempli avec les mentions légales standard BTP. Modifiez ou supprimez selon votre situation.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/factures')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Création...' : 'Créer la facture'}
          </button>
        </div>
      </form>
    </div>
  );
}
