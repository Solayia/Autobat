import { useState, useEffect } from 'react';
import { Plus, Search, Truck, Euro, Check, Clock, AlertTriangle, Edit2, Trash2, X, ChevronDown, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import fournisseurService from '../../services/fournisseurService';
import chantierService from '../../services/chantierService';

const CATEGORIES = [
  { value: 'MATERIAUX', label: 'Matériaux' },
  { value: 'MATERIEL', label: 'Matériel' },
  { value: 'SOUS_TRAITANCE', label: 'Sous-traitance' },
  { value: 'AUTRE', label: 'Autre' },
];

const STATUTS = [
  { value: 'A_PAYER', label: 'À payer', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  { value: 'PAYEE', label: 'Payée', color: 'bg-green-100 text-green-700', icon: Check },
  { value: 'EN_LITIGE', label: 'En litige', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
];

function fmt(n) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

const EMPTY_FORM = {
  fournisseur_id: '',
  fournisseur_nom: '',
  chantier_id: '',
  date_facture: new Date().toISOString().split('T')[0],
  date_echeance: '',
  categorie: 'MATERIAUX',
  description: '',
  montant_ht: '',
  taux_tva: '20',
  notes: '',
};

export default function FacturesFournisseurs() {
  const [factures, setFactures] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isNewFournisseur, setIsNewFournisseur] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showPayerModal, setShowPayerModal] = useState(false);
  const [payerTarget, setPayerTarget] = useState(null);
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [facturesData, fournisseursData, chantiersData] = await Promise.all([
        fournisseurService.getFactures(),
        fournisseurService.getFournisseurs(),
        chantierService.getChantiers({ limit: 200, page: 1 }),
      ]);
      setFactures(facturesData);
      setFournisseurs(fournisseursData);
      setChantiers(chantiersData.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const filtered = factures.filter(f => {
    if (filterStatut && f.statut !== filterStatut) return false;
    if (filterCategorie && f.categorie !== filterCategorie) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!f.fournisseur?.nom.toLowerCase().includes(q) &&
          !f.numero.toLowerCase().includes(q) &&
          !(f.description || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalAPayer = factures.filter(f => f.statut === 'A_PAYER').reduce((s, f) => s + f.montant_ttc, 0);
  const totalPayeeMois = factures.filter(f => {
    if (f.statut !== 'PAYEE') return false;
    const d = new Date(f.date_paiement || f.updated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, f) => s + f.montant_ttc, 0);

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsNewFournisseur(false);
    setShowModal(true);
  };

  const openEdit = (f) => {
    setEditingId(f.id);
    setFormData({
      fournisseur_id: f.fournisseur_id,
      fournisseur_nom: '',
      chantier_id: f.chantier_id || '',
      date_facture: f.date_facture ? f.date_facture.split('T')[0] : '',
      date_echeance: f.date_echeance ? f.date_echeance.split('T')[0] : '',
      categorie: f.categorie,
      description: f.description || '',
      montant_ht: String(f.montant_ht),
      taux_tva: String(f.taux_tva),
      notes: f.notes || '',
    });
    setIsNewFournisseur(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        fournisseur_id: isNewFournisseur ? undefined : (formData.fournisseur_id || undefined),
        fournisseur_nom: isNewFournisseur ? formData.fournisseur_nom : undefined,
        chantier_id: formData.chantier_id || undefined,
        date_echeance: formData.date_echeance || undefined,
      };

      if (editingId) {
        await fournisseurService.updateFacture(editingId, payload);
        toast.success('Facture mise à jour');
      } else {
        await fournisseurService.createFacture(payload);
        toast.success('Facture créée');
      }
      setShowModal(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fournisseurService.deleteFacture(deletingId);
      toast.success('Facture supprimée');
      setShowDeleteModal(false);
      loadAll();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const handlePayer = async () => {
    try {
      await fournisseurService.marquerPayee(payerTarget, datePaiement);
      toast.success('Facture marquée comme payée');
      setShowPayerModal(false);
      loadAll();
    } catch {
      toast.error('Erreur');
    }
  };

  const montantTtcPreview = (() => {
    const ht = parseFloat(formData.montant_ht) || 0;
    const tva = parseFloat(formData.taux_tva) || 0;
    return ht + (ht * tva / 100);
  })();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white shadow-xl">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/15 rounded-xl ring-1 ring-white/20">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Factures fournisseurs</h1>
                <p className="text-orange-100 text-sm mt-0.5 hidden sm:block">Matériaux, matériel, sous-traitance</p>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-orange-700 rounded-xl font-semibold hover:bg-orange-50 transition-colors shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle facture
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{fmt(totalAPayer)} €</p>
              <p className="text-xs text-gray-500">À payer (TTC)</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{fmt(totalPayeeMois)} €</p>
              <p className="text-xs text-gray-500">Payé ce mois</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{fournisseurs.length}</p>
              <p className="text-xs text-gray-500">Fournisseurs</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Tous statuts</option>
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            value={filterCategorie}
            onChange={e => setFilterCategorie(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune facture fournisseur</h3>
            <p className="text-sm text-gray-500 mb-4">Enregistrez vos factures de matériaux, matériel et sous-traitance</p>
            <button onClick={openCreate} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700">
              Ajouter une facture
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fournisseur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chantier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant TTC</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(f => {
                    const statut = STATUTS.find(s => s.value === f.statut) || STATUTS[0];
                    const categorie = CATEGORIES.find(c => c.value === f.categorie);
                    const Icon = statut.icon;
                    return (
                      <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">{f.numero}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{f.fournisseur?.nom}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                            {categorie?.label || f.categorie}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{f.chantier?.nom || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(f.date_facture)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{fmt(f.montant_ttc)} €</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                            <Icon className="w-3 h-3" />
                            {statut.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {f.statut === 'A_PAYER' && (
                              <button
                                onClick={() => { setPayerTarget(f.id); setDatePaiement(new Date().toISOString().split('T')[0]); setShowPayerModal(true); }}
                                className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                                title="Marquer payée"
                              >
                                Payer
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(f)}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setDeletingId(f.id); setShowDeleteModal(true); }}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Créer/Modifier */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Modifier la facture' : 'Nouvelle facture fournisseur'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Fournisseur */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Fournisseur *</label>
                  <button
                    type="button"
                    onClick={() => setIsNewFournisseur(!isNewFournisseur)}
                    className="text-xs text-orange-600 hover:underline"
                  >
                    {isNewFournisseur ? 'Choisir existant' : '+ Nouveau fournisseur'}
                  </button>
                </div>
                {isNewFournisseur ? (
                  <input
                    type="text"
                    placeholder="Nom du fournisseur"
                    value={formData.fournisseur_nom}
                    onChange={e => setFormData(f => ({ ...f, fournisseur_nom: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                  />
                ) : (
                  <select
                    value={formData.fournisseur_id}
                    onChange={e => setFormData(f => ({ ...f, fournisseur_id: e.target.value }))}
                    required={!isNewFournisseur}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Catégorie + Chantier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Catégorie</label>
                  <select
                    value={formData.categorie}
                    onChange={e => setFormData(f => ({ ...f, categorie: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Chantier (optionnel)</label>
                  <select
                    value={formData.chantier_id}
                    onChange={e => setFormData(f => ({ ...f, chantier_id: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Aucun</option>
                    {chantiers.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="Ex: Fourniture carrelage salle de bain"
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Date facture *</label>
                  <input
                    type="date"
                    value={formData.date_facture}
                    onChange={e => setFormData(f => ({ ...f, date_facture: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Date échéance</label>
                  <input
                    type="date"
                    value={formData.date_echeance}
                    onChange={e => setFormData(f => ({ ...f, date_echeance: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Montants */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Montant HT (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.montant_ht}
                    onChange={e => setFormData(f => ({ ...f, montant_ht: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">TVA (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.taux_tva}
                    onChange={e => setFormData(f => ({ ...f, taux_tva: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Total TTC preview */}
              {formData.montant_ht && (
                <div className="bg-orange-50 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-orange-700">Total TTC</span>
                  <span className="text-lg font-bold text-orange-800">{fmt(montantTtcPreview)} €</span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement…' : editingId ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Marquer payée */}
      {showPayerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Marquer comme payée</h2>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date de paiement</label>
              <input
                type="date"
                value={datePaiement}
                onChange={e => setDatePaiement(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPayerModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl">
                Annuler
              </button>
              <button onClick={handlePayer} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Supprimer la facture ?</h2>
            <p className="text-sm text-gray-600 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl">
                Annuler
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
