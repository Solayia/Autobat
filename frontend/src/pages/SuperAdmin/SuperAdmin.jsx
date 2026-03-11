import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Users, Building, TrendingUp, Search, CheckCircle, XCircle,
  Eye, RefreshCw, Euro, Trash2, LogIn, FileText, Activity,
  BarChart2, Terminal, AlertTriangle, ChevronRight, MapPin, HardHat, Clock, Zap,
  Tag, Percent, Save, Plus, ToggleLeft, ToggleRight, Calculator,
  Target, PhoneCall, X, Edit2, ChevronDown, LogOut, Globe, Play, FlaskConical
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import MapTab from './MapTab';
import ConfirmDialog from '../../components/ConfirmDialog';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'clients', label: 'Clients', icon: Building },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'ventes', label: 'Ventes', icon: Target },
  { id: 'pricing', label: 'Tarification', icon: Euro },
  { id: 'logs', label: 'Logs système', icon: Terminal },
  { id: 'tests', label: 'Tests', icon: FlaskConical },
  { id: 'carte', label: 'Carte', icon: Globe },
];

const STATUTS_LEAD = ['PROSPECT', 'CONTACTE', 'DEMO', 'ESSAI', 'CONVERTI', 'PERDU'];
const STATUT_LABEL = { PROSPECT: 'Prospect', CONTACTE: 'Contacté', DEMO: 'Démo', ESSAI: 'Essai', CONVERTI: 'Converti', PERDU: 'Perdu' };
const STATUT_COLOR = {
  PROSPECT: 'bg-gray-700 text-gray-300',
  CONTACTE: 'bg-blue-900/50 text-blue-300',
  DEMO: 'bg-purple-900/50 text-purple-300',
  ESSAI: 'bg-orange-900/50 text-orange-300',
  CONVERTI: 'bg-green-900/50 text-green-300',
  PERDU: 'bg-red-900/50 text-red-400'
};
const SOURCES = ['MANUEL', 'LINKEDIN', 'EMAIL', 'COLD_CALL', 'SITE_WEB', 'BOUCHE_A_OREILLE', 'PARTENAIRE'];

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { setUser, setTenant, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [tenantsTotal, setTenantsTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [logs, setLogs] = useState([]);
  const [logsType, setLogsType] = useState('combined');
  const [search, setSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Pricing
  const [pricing, setPricing] = useState({ prix_base: 100, prix_par_compte: 20, exemples: [] });
  const [pricingEdit, setPricingEdit] = useState({ prix_base: 100, prix_par_compte: 20 });
  const [promoCodes, setPromoCodes] = useState([]);
  const [newPromo, setNewPromo] = useState({ code: '', description: '', type: 'PERCENT', valeur: '', max_uses: '', expires_at: '' });
  const [showPromoForm, setShowPromoForm] = useState(false);

  // Tests
  const [testResults, setTestResults] = useState(null);
  const [testRunning, setTestRunning] = useState(false);

  // Ventes / CRM
  const [salesStats, setSalesStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [salesFilter, setSalesFilter] = useState('TOUS');
  const [salesSearch, setSalesSearch] = useState('');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [objectifEdit, setObjectifEdit] = useState(false);
  const [newObjectif, setNewObjectif] = useState('');
  const LEAD_EMPTY = { nom: '', email: '', telephone: '', entreprise: '', poste: '', source: 'MANUEL', statut: 'PROSPECT', nb_employes_estimes: '', mrr_estime: '', notes: '', next_action: '', next_action_date: '' };
  const [leadForm, setLeadForm] = useState(LEAD_EMPTY);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadTenants(); }, [search, statutFilter]);
  useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab, userSearch]);
  useEffect(() => { if (activeTab === 'logs') loadLogs(); }, [activeTab, logsType]);
  useEffect(() => { if (activeTab === 'pricing') { loadPricing(); loadPromoCodes(); } }, [activeTab]);
  useEffect(() => { if (activeTab === 'ventes') { loadSalesStats(); loadLeads(); } }, [activeTab]);
  useEffect(() => { if (activeTab === 'ventes') loadLeads(); }, [salesFilter, salesSearch]);

  const loadStats = async () => {
    try {
      const res = await api.get('/super-admin/stats');
      setStats(res.data);
    } catch { toast.error('Erreur stats'); }
  };

  const loadTenants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statutFilter) params.statut = statutFilter;
      const res = await api.get('/super-admin/tenants', { params });
      setTenants(res.data.tenants);
      setTenantsTotal(res.data.pagination.total);
    } catch { toast.error('Erreur chargement clients'); }
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const params = {};
      if (userSearch) params.email = userSearch;
      const res = await api.get('/super-admin/users', { params });
      setUsers(res.data.users);
      setUsersTotal(res.data.pagination.total);
    } catch { toast.error('Erreur utilisateurs'); }
  };

  const loadLogs = async () => {
    try {
      const res = await api.get('/super-admin/logs', { params: { type: logsType, lines: 200 } });
      setLogs(res.data.logs);
    } catch { toast.error('Erreur logs'); }
  };

  const loadTenantDetail = async (id) => {
    try {
      const res = await api.get(`/super-admin/tenants/${id}`);
      setSelectedTenant(res.data);
    } catch { toast.error('Erreur détail tenant'); }
  };

  const toggleStatut = (tenant) => {
    const newStatut = tenant.statut === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    setConfirmDialog({
      message: `${newStatut === 'SUSPENDU' ? 'Suspendre' : 'Réactiver'} "${tenant.nom}" ?`,
      confirmLabel: newStatut === 'SUSPENDU' ? 'Suspendre' : 'Réactiver',
      danger: newStatut === 'SUSPENDU',
      onConfirm: async () => {
        try {
          await api.patch(`/super-admin/tenants/${tenant.id}/statut`, { statut: newStatut });
          toast.success(`Compte ${newStatut === 'ACTIF' ? 'réactivé' : 'suspendu'}`);
          loadTenants();
          if (selectedTenant?.id === tenant.id) setSelectedTenant(t => ({ ...t, statut: newStatut }));
        } catch { toast.error('Erreur'); }
      }
    });
  };

  const handleDelete = (tenant) => {
    setConfirmDialog({
      title: 'Suppression définitive',
      message: `⚠️ Supprimer définitivement "${tenant.nom}" ? Toutes les données seront perdues. Action IRRÉVERSIBLE.`,
      confirmLabel: 'Supprimer définitivement',
      danger: true,
      requireText: tenant.nom,
      onConfirm: async () => {
        try {
          await api.delete(`/super-admin/tenants/${tenant.id}`);
          toast.success('Compte supprimé');
          setSelectedTenant(null);
          loadTenants(); loadStats();
        } catch { toast.error('Erreur suppression'); }
      }
    });
  };

  const handleImpersonate = async (tenant) => {
    try {
      const res = await api.post(`/super-admin/tenants/${tenant.id}/impersonate`);
      const { access_token, user, tenant: impTenant } = res.data;

      // Sauvegarder session SA
      sessionStorage.setItem('sa_backup_token', localStorage.getItem('access_token'));
      sessionStorage.setItem('sa_backup_user', localStorage.getItem('user'));
      sessionStorage.setItem('sa_backup_tenant', localStorage.getItem('tenant'));

      // Activer impersonation
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('tenant', JSON.stringify(impTenant));
      localStorage.removeItem('refresh_token');

      setUser(user);
      setTenant(impTenant);
      toast.success(`Connecté en tant que ${impTenant.nom}`);
      navigate('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur d'impersonation");
    }
  };

  const clearLogs = () => {
    setConfirmDialog({
      message: 'Vider les logs système ?',
      confirmLabel: 'Vider',
      danger: false,
      onConfirm: async () => {
        try {
          await api.delete('/super-admin/logs', { params: { type: logsType } });
          toast.success('Logs vidés'); setLogs([]);
        } catch { toast.error('Erreur'); }
      }
    });
  };

  const runTestSuite = async () => {
    setTestRunning(true);
    setTestResults(null);
    try {
      const res = await api.post('/super-admin/run-tests', {}, { timeout: 120000 });
      setTestResults(res.data);
    } catch (e) {
      toast.error('Erreur lors de l\'exécution des tests');
      setTestResults({ error: e.response?.data?.error || e.message });
    } finally {
      setTestRunning(false);
    }
  };

  const loadPricing = async () => {
    try {
      const res = await api.get('/super-admin/pricing');
      setPricing(res.data);
      setPricingEdit({ prix_base: res.data.prix_base, prix_par_compte: res.data.prix_par_compte });
    } catch { toast.error('Erreur chargement tarification'); }
  };

  const savePricing = async () => {
    try {
      const res = await api.patch('/super-admin/pricing', {
        prix_base: parseFloat(pricingEdit.prix_base),
        prix_par_compte: parseFloat(pricingEdit.prix_par_compte)
      });
      setPricing(prev => ({ ...prev, ...res.data }));
      toast.success('Tarification mise à jour');
      loadPricing();
    } catch { toast.error('Erreur sauvegarde'); }
  };

  const loadPromoCodes = async () => {
    try {
      const res = await api.get('/super-admin/promo-codes');
      setPromoCodes(res.data);
    } catch { toast.error('Erreur codes promo'); }
  };

  const createPromoCode = async () => {
    if (!newPromo.code || !newPromo.valeur) { toast.error('Code et valeur requis'); return; }
    try {
      await api.post('/super-admin/promo-codes', {
        code: newPromo.code,
        description: newPromo.description || undefined,
        type: newPromo.type,
        valeur: parseFloat(newPromo.valeur),
        max_uses: newPromo.max_uses ? parseInt(newPromo.max_uses) : undefined,
        expires_at: newPromo.expires_at || undefined
      });
      toast.success(`Code ${newPromo.code.toUpperCase()} créé`);
      setNewPromo({ code: '', description: '', type: 'PERCENT', valeur: '', max_uses: '', expires_at: '' });
      setShowPromoForm(false);
      loadPromoCodes();
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur création'); }
  };

  const togglePromoCode = async (id) => {
    try {
      const res = await api.patch(`/super-admin/promo-codes/${id}/toggle`);
      setPromoCodes(prev => prev.map(c => c.id === id ? res.data : c));
    } catch { toast.error('Erreur'); }
  };

  const deletePromoCode = (id, code) => {
    setConfirmDialog({
      message: `Supprimer le code promo "${code}" ?`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/super-admin/promo-codes/${id}`);
          toast.success('Code supprimé');
          setPromoCodes(prev => prev.filter(c => c.id !== id));
        } catch { toast.error('Erreur'); }
      }
    });
  };

  // ─── Ventes / CRM ───────────────────────────────────────────
  const loadSalesStats = async () => {
    try {
      const res = await api.get('/super-admin/sales/stats');
      setSalesStats(res.data);
      setNewObjectif(res.data.objectif_mrr);
    } catch { toast.error('Erreur stats ventes'); }
  };

  const loadLeads = async () => {
    try {
      const params = {};
      if (salesFilter !== 'TOUS') params.statut = salesFilter;
      if (salesSearch) params.search = salesSearch;
      const res = await api.get('/super-admin/sales/leads', { params });
      setLeads(res.data);
    } catch { toast.error('Erreur chargement leads'); }
  };

  const saveLead = async () => {
    if (!leadForm.nom) { toast.error('Le nom est requis'); return; }
    try {
      const payload = {
        ...leadForm,
        nb_employes_estimes: leadForm.nb_employes_estimes ? parseInt(leadForm.nb_employes_estimes) : undefined,
        mrr_estime: leadForm.mrr_estime ? parseFloat(leadForm.mrr_estime) : undefined,
        next_action_date: leadForm.next_action_date || undefined
      };
      if (editingLead) {
        await api.patch(`/super-admin/sales/leads/${editingLead.id}`, payload);
        toast.success('Lead mis à jour');
      } else {
        await api.post('/super-admin/sales/leads', payload);
        toast.success('Lead créé');
      }
      setShowLeadForm(false);
      setEditingLead(null);
      setLeadForm(LEAD_EMPTY);
      loadLeads(); loadSalesStats();
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  const changeLeadStatut = async (id, statut) => {
    try {
      await api.patch(`/super-admin/sales/leads/${id}`, { statut });
      loadLeads(); loadSalesStats();
    } catch { toast.error('Erreur'); }
  };

  const deleteLead = (id, nom) => {
    setConfirmDialog({
      message: `Supprimer le lead "${nom}" ?`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/super-admin/sales/leads/${id}`);
          toast.success('Lead supprimé');
          loadLeads(); loadSalesStats();
        } catch { toast.error('Erreur'); }
      }
    });
  };

  const openEditLead = (lead) => {
    setEditingLead(lead);
    setLeadForm({
      nom: lead.nom || '', email: lead.email || '', telephone: lead.telephone || '',
      entreprise: lead.entreprise || '', poste: lead.poste || '', source: lead.source || 'MANUEL',
      statut: lead.statut || 'PROSPECT', nb_employes_estimes: lead.nb_employes_estimes || '',
      mrr_estime: lead.mrr_estime || '', notes: lead.notes || '',
      next_action: lead.next_action || '',
      next_action_date: lead.next_action_date ? lead.next_action_date.split('T')[0] : ''
    });
    setShowLeadForm(true);
  };

  const saveObjectif = async () => {
    const val = parseFloat(newObjectif);
    if (!val || val <= 0) { toast.error('Objectif invalide'); return; }
    try {
      await api.patch('/super-admin/sales/objectif', { objectif_mrr: val });
      toast.success('Objectif MRR mis à jour');
      setObjectifEdit(false);
      loadSalesStats();
    } catch { toast.error('Erreur'); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '–';
  const fmtDT = (d) => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–';
  const fmtM = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(m || 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-600 rounded-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Autobat Admin</div>
              <div className="text-xs text-gray-500">Back-office plateforme</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800 space-y-1">
          <button
            onClick={() => { loadStats(); loadTenants(); if (activeTab === 'logs') loadLogs(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Rafraîchir tout
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" /> App client
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-6 py-3.5">
          <h1 className="text-sm font-semibold text-white">{TABS.find(t => t.id === activeTab)?.label}</h1>
        </div>

        <div className="p-6">

          {/* ═══ DASHBOARD ═══ */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-5">

              {/* KPIs principaux */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-400">MRR estimé</p>
                    <Euro className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">{fmtM(stats.business.mrr_estime)}</p>
                  <p className="text-xs text-gray-500 mt-1">ARR : {fmtM(stats.business.arr_estime)}</p>
                  {stats.tenants.croissance_pourcent != null && (
                    <p className={`text-xs mt-1 font-medium ${stats.tenants.croissance_pourcent > 0 ? 'text-green-400' : stats.tenants.croissance_pourcent < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      {stats.tenants.croissance_pourcent > 0 ? '+' : ''}{stats.tenants.croissance_pourcent}% vs mois dernier
                    </p>
                  )}
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-400">Clients actifs</p>
                    <Building className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.tenants.actifs}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.tenants.suspendus} suspendus · {stats.tenants.total} total</p>
                  <p className="text-xs mt-1 font-medium text-green-400">+{stats.tenants.nouveaux_7j} cette semaine</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-400">Engagement utilisateurs</p>
                    <Activity className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.users.taux_engagement}%</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.users.actifs_30j} actifs / {stats.users.total} inscrits (30j)</p>
                  <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats.users.taux_engagement}%` }} />
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-400">CA total facturé</p>
                    <FileText className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">{fmtM(stats.business.ca_total_facture)}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.business.factures} factures émises</p>
                </div>
              </div>

              {/* Alertes + Derniers inscrits */}
              <div className="grid grid-cols-2 gap-4">

                {/* Clients à risque */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-gray-300">Clients à risque</h3>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-400 font-medium">
                      {stats.alertes.clients_a_risque.length} inactifs
                    </span>
                  </div>
                  {stats.tenants.onboarding_incomplet > 0 && (
                    <div className="mb-3 flex items-center gap-2 text-xs bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-3 py-2">
                      <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-300">{stats.tenants.onboarding_incomplet} client(s) n'ont pas terminé l'onboarding</span>
                    </div>
                  )}
                  {stats.alertes.clients_a_risque.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 rounded-lg px-3 py-3">
                      <CheckCircle className="w-3.5 h-3.5" /> Tous les clients sont actifs
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stats.alertes.clients_a_risque.map((c) => (
                        <div key={c.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-xs font-medium text-white">{c.nom}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-orange-400">
                              {c.last_login ? `Inactif ${Math.round((Date.now() - new Date(c.last_login)) / 86400000)}j` : 'Jamais connecté'}
                            </p>
                            <p className="text-xs text-gray-600">inscrit {fmt(c.date_inscription)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dernières inscriptions */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-gray-300">Dernières inscriptions</h3>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-400 font-medium">
                      +{stats.tenants.nouveaux_ce_mois} ce mois
                    </span>
                  </div>
                  {stats.derniers_inscrits?.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">Aucune inscription</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.derniers_inscrits?.map((t) => (
                        <div key={t.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-xs font-medium text-white">{t.nom}</p>
                            <p className="text-xs text-gray-500">{t.admin?.email || '–'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">{fmt(t.date_inscription)}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${t.onboarding_completed ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                              {t.onboarding_completed ? 'Setup OK' : 'Setup...'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Graphe croissance + Métriques activité */}
              <div className="grid grid-cols-3 gap-4">
                {/* Graphe */}
                <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Nouveaux clients — 6 derniers mois</h3>
                  <div className="flex items-end gap-3 h-28">
                    {Object.entries(stats.croissance_mensuelle).map(([mois, count]) => {
                      const max = Math.max(...Object.values(stats.croissance_mensuelle), 1);
                      const pct = (count / max) * 100;
                      const [y, m] = mois.split('-');
                      const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('fr-FR', { month: 'short' });
                      return (
                        <div key={mois} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-400">{count}</span>
                          <div className="w-full bg-gray-800 rounded-sm relative" style={{ height: '80px' }}>
                            <div className="absolute bottom-0 w-full bg-purple-500 rounded-sm transition-all" style={{ height: `${Math.max(pct, 4)}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Activité plateforme */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300">Activité plateforme</h3>
                  {[
                    { label: 'Badgeages aujourd\'hui', value: stats.business.badgeages_aujourd_hui, icon: MapPin, color: 'text-cyan-400' },
                    { label: 'Badgeages (30j)', value: stats.business.badgeages_30j, icon: Clock, color: 'text-blue-400' },
                    { label: 'Chantiers actifs', value: stats.business.chantiers_actifs, icon: HardHat, color: 'text-orange-400' },
                    { label: 'Devis ce mois', value: stats.business.devis_ce_mois, icon: FileText, color: 'text-green-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                        <span className="text-xs text-gray-400">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-800 space-y-2">
                    {[
                      { label: 'Devis total', value: stats.business.devis },
                      { label: 'Chantiers total', value: stats.business.chantiers },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{item.label}</span>
                        <span className="text-xs font-medium text-gray-300">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ CLIENTS ═══ */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, SIRET, email..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">Tous les statuts</option>
                  <option value="ACTIF">Actifs</option>
                  <option value="SUSPENDU">Suspendus</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">{tenantsTotal} client(s) trouvé(s)</p>

              <div className={selectedTenant ? 'grid grid-cols-2 gap-4' : ''}>
                {/* Liste */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Entreprise</th>
                        <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">MRR</th>
                        <th className="text-center px-4 py-3 text-xs text-gray-400 font-medium">Users</th>
                        <th className="text-center px-4 py-3 text-xs text-gray-400 font-medium">Statut</th>
                        <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={5} className="py-8 text-center text-gray-500 text-sm">Chargement...</td></tr>
                      ) : tenants.length === 0 ? (
                        <tr><td colSpan={5} className="py-8 text-center text-gray-500 text-sm">Aucun client</td></tr>
                      ) : tenants.map((t) => (
                        <tr key={t.id} onClick={() => loadTenantDetail(t.id)}
                          className={`border-b border-gray-800/50 cursor-pointer transition-colors ${selectedTenant?.id === t.id ? 'bg-purple-900/20' : 'hover:bg-gray-800/40'}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-white text-sm">{t.nom}</div>
                            <div className="text-xs text-gray-500">{t.email}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-medium text-purple-400">{fmtM(t._count?.users > 0 ? 100 + Math.max(0, (t._count.users - 1)) * 20 : 0)}</td>
                          <td className="px-4 py-3 text-center text-gray-300 text-sm">{t._count?.users || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${t.statut === 'ACTIF' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                              {t.statut === 'ACTIF' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {t.statut}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={(e) => { e.stopPropagation(); handleImpersonate(t); }}
                                title="Accéder au compte" className="p-1.5 text-gray-500 hover:text-purple-400 transition-colors">
                                <LogIn className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); toggleStatut(t); }}
                                title={t.statut === 'ACTIF' ? 'Suspendre' : 'Réactiver'}
                                className={`p-1.5 transition-colors ${t.statut === 'ACTIF' ? 'text-gray-500 hover:text-orange-400' : 'text-gray-500 hover:text-green-400'}`}>
                                {t.statut === 'ACTIF' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(t); }}
                                title="Supprimer définitivement" className="p-1.5 text-gray-500 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Panneau détail */}
                {selectedTenant && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white">{selectedTenant.nom}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">SIRET: {selectedTenant.siret}</p>
                        <p className="text-xs text-gray-500">Inscrit: {fmt(selectedTenant.date_inscription)}</p>
                        <p className="text-xs text-gray-500">CGU acceptées: {selectedTenant.cgu_accepted_at ? fmt(selectedTenant.cgu_accepted_at) : <span className="text-yellow-400">Non enregistrée</span>}</p>
                        <p className="text-xs text-gray-500">CGV acceptées: {selectedTenant.cgv_accepted_at ? fmt(selectedTenant.cgv_accepted_at) : <span className="text-yellow-400">Non enregistrée</span>}</p>
                        {selectedTenant.stripe_customer_id && (
                          <a
                            href={`https://dashboard.stripe.com/customers/${selectedTenant.stripe_customer_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-400 hover:text-purple-300 underline mt-0.5 inline-block"
                          >
                            Stripe: {selectedTenant.stripe_customer_id.slice(0, 20)}…
                          </a>
                        )}
                      </div>
                      <button onClick={() => handleImpersonate(selectedTenant)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors">
                        <LogIn className="w-3.5 h-3.5" /> Accéder au compte
                      </button>
                    </div>

                    {selectedTenant.financier && (
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Financier</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div><p className="text-xs text-gray-500">Devis acceptés</p><p className="text-sm font-bold text-green-400">{fmtM(selectedTenant.financier.devis_ca_accepte)}</p></div>
                          <div><p className="text-xs text-gray-500">Facturé</p><p className="text-sm font-bold text-white">{fmtM(selectedTenant.financier.factures_total)}</p></div>
                          <div><p className="text-xs text-gray-500">Encaissé</p><p className="text-sm font-bold text-blue-400">{fmtM(selectedTenant.financier.encaisse)}</p></div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { l: 'Clients', v: selectedTenant._count?.clients },
                        { l: 'Chantiers', v: selectedTenant._count?.chantiers },
                        { l: 'Devis', v: selectedTenant._count?.devis },
                        { l: 'Factures', v: selectedTenant._count?.factures },
                        { l: 'Catalogue', v: selectedTenant._count?.catalogue },
                        { l: 'Employés', v: selectedTenant._count?.employes },
                      ].map((item) => (
                        <div key={item.l} className="bg-gray-800 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500">{item.l}</p>
                          <p className="text-base font-bold text-white">{item.v || 0}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-2">Utilisateurs ({selectedTenant.users?.length || 0})</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {selectedTenant.users?.map((u) => (
                          <div key={u.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-xs font-medium text-white">{u.prenom} {u.nom}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${u.role === 'COMPANY_ADMIN' ? 'bg-orange-900/50 text-orange-400' : u.role === 'MANAGER' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>{u.role}</span>
                              <p className="text-xs text-gray-600 mt-0.5">{u.last_login ? `Vu ${fmt(u.last_login)}` : 'Jamais'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-800">
                      <button onClick={() => toggleStatut(selectedTenant)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${selectedTenant.statut === 'ACTIF' ? 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'}`}>
                        {selectedTenant.statut === 'ACTIF' ? 'Suspendre' : 'Réactiver'}
                      </button>
                      <button onClick={() => handleDelete(selectedTenant)}
                        className="flex-1 py-2 text-xs font-semibold rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors flex items-center justify-center gap-1">
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ USERS ═══ */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Rechercher par email..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <p className="text-xs text-gray-500">{usersTotal} utilisateur(s)</p>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Utilisateur</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Entreprise</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Rôle</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Dernière connexion</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Inscrit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-500 text-sm">Aucun utilisateur</td></tr>
                    ) : users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-4 py-3"><p className="font-medium text-white text-sm">{u.prenom} {u.nom}</p><p className="text-xs text-gray-500">{u.email}</p></td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.tenant?.statut === 'ACTIF' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{u.tenant?.nom}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs px-1.5 py-0.5 rounded ${u.role === 'COMPANY_ADMIN' ? 'bg-orange-900/50 text-orange-400' : u.role === 'MANAGER' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>{u.role}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{fmtDT(u.last_login)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{fmt(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ TARIFICATION ═══ */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">

              {/* Grille tarifaire */}
              <div className="grid grid-cols-2 gap-5">

                {/* Édition des prix */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-gray-300">Grille tarifaire</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">1er compte (gérant) — €/mois</label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="number" min="0" step="1"
                          value={pricingEdit.prix_base}
                          onChange={e => setPricingEdit(p => ({ ...p, prix_base: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Compte supplémentaire (employé) — €/mois</label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="number" min="0" step="1"
                          value={pricingEdit.prix_par_compte}
                          onChange={e => setPricingEdit(p => ({ ...p, prix_par_compte: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <button onClick={savePricing}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors">
                      <Save className="w-4 h-4" /> Enregistrer les tarifs
                    </button>
                  </div>
                </div>

                {/* Simulateur */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Simulation des prix</h3>
                  <div className="space-y-2">
                    {[1, 2, 3, 5, 8, 10, 15].map(n => {
                      const p = parseFloat(pricingEdit.prix_base || 0) + Math.max(0, n - 1) * parseFloat(pricingEdit.prix_par_compte || 0);
                      return (
                        <div key={n} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                          <span className="text-xs text-gray-400">
                            {n === 1 ? '1 compte (solo)' : `${n} comptes`}
                          </span>
                          <span className="text-sm font-bold text-white">{fmtM(p)}<span className="text-xs font-normal text-gray-500">/mois</span></span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-3 bg-purple-900/20 border border-purple-800/30 rounded-lg">
                    <p className="text-xs text-purple-300">Cible MRR avec 10 clients (moy. 5 users) : <span className="font-bold">{fmtM(10 * (parseFloat(pricingEdit.prix_base || 0) + 4 * parseFloat(pricingEdit.prix_par_compte || 0)))}</span></p>
                  </div>
                </div>
              </div>

              {/* Codes promo */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-400" />
                    <h3 className="text-sm font-semibold text-gray-300">Codes promotionnels</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{promoCodes.length} code(s)</span>
                  </div>
                  <button onClick={() => setShowPromoForm(!showPromoForm)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Nouveau code
                  </button>
                </div>

                {/* Formulaire création */}
                {showPromoForm && (
                  <div className="mb-4 p-4 bg-gray-800 rounded-xl border border-gray-700 space-y-3">
                    <p className="text-xs font-semibold text-gray-300 mb-2">Créer un code promo</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Code *</label>
                        <input value={newPromo.code} onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                          placeholder="EX: LANCEMENT25"
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Type *</label>
                        <select value={newPromo.type} onChange={e => setNewPromo(p => ({ ...p, type: e.target.value }))}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="PERCENT">Pourcentage (%)</option>
                          <option value="FIXED">Montant fixe (€)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Valeur * {newPromo.type === 'PERCENT' ? '(%)' : '(€)'}</label>
                        <input type="number" min="1" max={newPromo.type === 'PERCENT' ? 100 : undefined}
                          value={newPromo.valeur} onChange={e => setNewPromo(p => ({ ...p, valeur: e.target.value }))}
                          placeholder={newPromo.type === 'PERCENT' ? 'ex: 20' : 'ex: 50'}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Utilisations max (vide = illimité)</label>
                        <input type="number" min="1" value={newPromo.max_uses} onChange={e => setNewPromo(p => ({ ...p, max_uses: e.target.value }))}
                          placeholder="ex: 50"
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Expiration (optionnel)</label>
                        <input type="date" value={newPromo.expires_at} onChange={e => setNewPromo(p => ({ ...p, expires_at: e.target.value }))}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Description (optionnel)</label>
                        <input value={newPromo.description} onChange={e => setNewPromo(p => ({ ...p, description: e.target.value }))}
                          placeholder="ex: Offre de lancement"
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={createPromoCode}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors">
                        Créer le code
                      </button>
                      <button onClick={() => setShowPromoForm(false)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste codes */}
                {promoCodes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">Aucun code promo créé</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-2 text-xs text-gray-400 font-medium">Code</th>
                        <th className="text-left py-2 text-xs text-gray-400 font-medium">Réduction</th>
                        <th className="text-left py-2 text-xs text-gray-400 font-medium">Utilisations</th>
                        <th className="text-left py-2 text-xs text-gray-400 font-medium">Expiration</th>
                        <th className="text-left py-2 text-xs text-gray-400 font-medium">Statut</th>
                        <th className="py-2 text-right text-xs text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoCodes.map((c) => {
                        const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                        const isExhausted = c.max_uses !== null && c.uses_count >= c.max_uses;
                        return (
                          <tr key={c.id} className="border-b border-gray-800/50">
                            <td className="py-3 pr-4">
                              <p className="font-mono font-bold text-white text-sm">{c.code}</p>
                              {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${c.type === 'PERCENT' ? 'bg-blue-900/40 text-blue-300' : 'bg-green-900/40 text-green-300'}`}>
                                {c.type === 'PERCENT' ? <Percent className="w-3 h-3" /> : <Euro className="w-3 h-3" />}
                                {c.valeur}{c.type === 'PERCENT' ? '%' : '€'}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-xs text-gray-400">
                              {c.uses_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ' / ∞'}
                            </td>
                            <td className="py-3 pr-4 text-xs text-gray-400">
                              {c.expires_at ? (
                                <span className={isExpired ? 'text-red-400' : 'text-gray-400'}>{fmt(c.expires_at)}</span>
                              ) : '–'}
                            </td>
                            <td className="py-3 pr-4">
                              {isExpired || isExhausted ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">
                                  {isExpired ? 'Expiré' : 'Épuisé'}
                                </span>
                              ) : (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${c.actif ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                  {c.actif ? 'Actif' : 'Désactivé'}
                                </span>
                              )}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2 justify-end">
                                <button onClick={() => togglePromoCode(c.id)} title={c.actif ? 'Désactiver' : 'Activer'}
                                  className="text-gray-500 hover:text-purple-400 transition-colors">
                                  {c.actif ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                                </button>
                                <button onClick={() => deletePromoCode(c.id, c.code)}
                                  className="text-gray-500 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ═══ VENTES ═══ */}
          {activeTab === 'ventes' && (
            <div className="space-y-5">

              {/* KPI + Objectif MRR */}
              {salesStats && (
                <div className="grid grid-cols-4 gap-4">
                  {/* MRR vs Objectif */}
                  <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-400">MRR Actuel vs Objectif</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{fmtM(salesStats.mrr_actuel)}</p>
                      </div>
                      <div className="text-right">
                        {objectifEdit ? (
                          <div className="flex items-center gap-2">
                            <input type="number" value={newObjectif} onChange={e => setNewObjectif(e.target.value)}
                              className="w-28 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white text-right" />
                            <button onClick={saveObjectif} className="p-1.5 bg-green-700 rounded-lg hover:bg-green-600"><Save className="w-3.5 h-3.5 text-white" /></button>
                            <button onClick={() => setObjectifEdit(false)} className="p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600"><X className="w-3.5 h-3.5 text-gray-400" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setObjectifEdit(true)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                            <Target className="w-3.5 h-3.5" />
                            Objectif: {fmtM(salesStats.objectif_mrr)}/mois
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
                      <div className="h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(salesStats.progression_pct, 100)}%`, background: salesStats.progression_pct >= 100 ? '#22c55e' : salesStats.progression_pct >= 70 ? '#f97316' : '#8b5cf6' }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{salesStats.progression_pct}% de l'objectif</span>
                      <span>Manque: {fmtM(Math.max(0, salesStats.objectif_mrr - salesStats.mrr_actuel))}</span>
                    </div>
                  </div>

                  {/* Pipeline MRR */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <p className="text-xs text-gray-400 mb-1">MRR en pipeline</p>
                    <p className="text-2xl font-bold text-purple-400">{fmtM(salesStats.mrr_pipeline)}</p>
                    <p className="text-xs text-gray-500 mt-1">{salesStats.leads_actifs} lead(s) actif(s)</p>
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <p className="text-xs text-gray-400">Potentiel total</p>
                      <p className="text-sm font-semibold text-white">{fmtM(salesStats.mrr_actuel + salesStats.mrr_pipeline)}</p>
                    </div>
                  </div>

                  {/* Conversion */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <p className="text-xs text-gray-400 mb-1">Taux conversion (mois)</p>
                    <p className="text-2xl font-bold text-green-400">{salesStats.taux_conversion_mois}%</p>
                    <p className="text-xs text-gray-500 mt-1">{salesStats.convertis_ce_mois} converti(s) ce mois</p>
                    {salesStats.actions_urgentes?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <p className="text-xs text-orange-400 font-medium">{salesStats.actions_urgentes.length} action(s) en retard</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pipeline visuel */}
              {salesStats?.pipeline && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Pipeline commercial</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {STATUTS_LEAD.map((s) => {
                      const d = salesStats.pipeline[s] || { count: 0, mrr: 0 };
                      const isActive = !['CONVERTI', 'PERDU'].includes(s);
                      return (
                        <button key={s} onClick={() => setSalesFilter(salesFilter === s ? 'TOUS' : s)}
                          className={`rounded-xl p-3 text-center border transition-all ${salesFilter === s ? 'border-purple-500 bg-purple-900/30' : 'border-gray-800 hover:border-gray-600'} ${isActive ? '' : 'opacity-70'}`}>
                          <div className={`text-2xl font-bold ${s === 'CONVERTI' ? 'text-green-400' : s === 'PERDU' ? 'text-red-400' : 'text-white'}`}>{d.count}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{STATUT_LABEL[s]}</div>
                          {d.mrr > 0 && <div className="text-xs text-purple-400 mt-1 font-medium">{fmtM(d.mrr)}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions urgentes */}
              {salesStats?.actions_urgentes?.length > 0 && (
                <div className="bg-orange-900/10 border border-orange-800/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-orange-300">Actions en retard</h3>
                  </div>
                  <div className="space-y-2">
                    {salesStats.actions_urgentes.map(lead => (
                      <div key={lead.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-white font-medium">{lead.nom}</span>
                          {lead.entreprise && <span className="text-gray-400 ml-2">— {lead.entreprise}</span>}
                          {lead.next_action && <span className="text-gray-300 ml-2 text-xs">→ {lead.next_action}</span>}
                        </div>
                        <span className="text-orange-400 text-xs">{fmt(lead.next_action_date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste leads */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl">
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-300">Leads & Contacts</h3>
                    <div className="flex gap-1">
                      {['TOUS', ...STATUTS_LEAD].map(s => (
                        <button key={s} onClick={() => setSalesFilter(s)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${salesFilter === s ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                          {s === 'TOUS' ? 'Tous' : STATUT_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input value={salesSearch} onChange={e => setSalesSearch(e.target.value)} placeholder="Chercher..."
                        className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white w-40 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                    </div>
                    <button onClick={() => { setEditingLead(null); setLeadForm(LEAD_EMPTY); setShowLeadForm(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Ajouter
                    </button>
                  </div>
                </div>

                {leads.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-sm">
                    <PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Aucun lead {salesFilter !== 'TOUS' ? `en statut "${STATUT_LABEL[salesFilter]}"` : ''}
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-5 text-xs text-gray-400 font-medium">Nom / Entreprise</th>
                        <th className="text-left py-3 px-3 text-xs text-gray-400 font-medium">Contact</th>
                        <th className="text-left py-3 px-3 text-xs text-gray-400 font-medium">Statut</th>
                        <th className="text-left py-3 px-3 text-xs text-gray-400 font-medium">MRR est.</th>
                        <th className="text-left py-3 px-3 text-xs text-gray-400 font-medium">Prochaine action</th>
                        <th className="py-3 px-5 text-right text-xs text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {leads.map(lead => (
                        <tr key={lead.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-5">
                            <div className="font-medium text-white">{lead.nom}</div>
                            {lead.entreprise && <div className="text-xs text-gray-400">{lead.entreprise}</div>}
                            {lead.source !== 'MANUEL' && <div className="text-xs text-purple-400">{lead.source}</div>}
                          </td>
                          <td className="py-3 px-3">
                            {lead.email && <div className="text-xs text-gray-300">{lead.email}</div>}
                            {lead.telephone && <div className="text-xs text-gray-400">{lead.telephone}</div>}
                          </td>
                          <td className="py-3 px-3">
                            <select value={lead.statut}
                              onChange={e => changeLeadStatut(lead.id, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer focus:outline-none ${STATUT_COLOR[lead.statut]}`}>
                              {STATUTS_LEAD.map(s => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
                            </select>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-sm font-medium text-white">{lead.mrr_estime ? fmtM(lead.mrr_estime) : '–'}</div>
                            {lead.nb_employes_estimes && <div className="text-xs text-gray-500">{lead.nb_employes_estimes} compte(s)</div>}
                          </td>
                          <td className="py-3 px-3">
                            {lead.next_action ? (
                              <div>
                                <div className="text-xs text-gray-300">{lead.next_action}</div>
                                {lead.next_action_date && (
                                  <div className={`text-xs mt-0.5 ${new Date(lead.next_action_date) < new Date() ? 'text-red-400' : 'text-gray-500'}`}>
                                    {fmt(lead.next_action_date)}
                                  </div>
                                )}
                              </div>
                            ) : <span className="text-gray-600 text-xs">–</span>}
                          </td>
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={() => openEditLead(lead)} className="text-gray-500 hover:text-purple-400 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteLead(lead.id, lead.nom)} className="text-gray-500 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal ajout/édition lead */}
              {showLeadForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-5 border-b border-gray-800">
                      <h3 className="text-sm font-semibold text-white">{editingLead ? 'Modifier le lead' : 'Nouveau lead'}</h3>
                      <button onClick={() => { setShowLeadForm(false); setEditingLead(null); setLeadForm(LEAD_EMPTY); }}
                        className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Nom / Prénom *</label>
                          <input value={leadForm.nom} onChange={e => setLeadForm(p => ({ ...p, nom: e.target.value }))}
                            placeholder="Jean Dupont" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Entreprise</label>
                          <input value={leadForm.entreprise} onChange={e => setLeadForm(p => ({ ...p, entreprise: e.target.value }))}
                            placeholder="BTP Dupont SARL" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Email</label>
                          <input type="email" value={leadForm.email} onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="jean@btp-dupont.fr" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Téléphone</label>
                          <input value={leadForm.telephone} onChange={e => setLeadForm(p => ({ ...p, telephone: e.target.value }))}
                            placeholder="06 XX XX XX XX" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Source</label>
                          <select value={leadForm.source} onChange={e => setLeadForm(p => ({ ...p, source: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Statut</label>
                          <select value={leadForm.statut} onChange={e => setLeadForm(p => ({ ...p, statut: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                            {STATUTS_LEAD.map(s => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Nb comptes estimés</label>
                          <input type="number" min="1" value={leadForm.nb_employes_estimes}
                            onChange={e => {
                              const nb = e.target.value;
                              const mrr = nb ? 100 + Math.max(0, parseInt(nb) - 1) * 20 : '';
                              setLeadForm(p => ({ ...p, nb_employes_estimes: nb, mrr_estime: mrr }));
                            }}
                            placeholder="5" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">MRR estimé (€/mois)</label>
                          <input type="number" min="0" value={leadForm.mrr_estime}
                            onChange={e => setLeadForm(p => ({ ...p, mrr_estime: e.target.value }))}
                            placeholder="auto-calculé" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Prochaine action</label>
                          <input value={leadForm.next_action} onChange={e => setLeadForm(p => ({ ...p, next_action: e.target.value }))}
                            placeholder="ex: Envoyer démo" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Date action</label>
                          <input type="date" value={leadForm.next_action_date}
                            onChange={e => setLeadForm(p => ({ ...p, next_action_date: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                        <textarea value={leadForm.notes} onChange={e => setLeadForm(p => ({ ...p, notes: e.target.value }))}
                          rows={3} placeholder="Contexte, besoins, historique..."
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                      </div>
                    </div>
                    <div className="flex gap-3 p-5 pt-0">
                      <button onClick={saveLead}
                        className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors">
                        {editingLead ? 'Enregistrer' : 'Créer le lead'}
                      </button>
                      <button onClick={() => { setShowLeadForm(false); setEditingLead(null); setLeadForm(LEAD_EMPTY); }}
                        className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors">
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ LOGS ═══ */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <select value={logsType} onChange={(e) => setLogsType(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="combined">Tous les logs (combined.log)</option>
                  <option value="error">Erreurs seulement (error.log)</option>
                </select>
                <button onClick={loadLogs} className="px-3 py-2 text-xs text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                </button>
                <button onClick={clearLogs} className="px-3 py-2 text-xs text-red-400 border border-red-800 rounded-lg hover:bg-red-900/20 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Vider les logs
                </button>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  {logs.length} entrée(s) — {logsType === 'error' ? 'logs/error.log' : 'logs/combined.log'}
                </div>
                <div className="max-h-[60vh] overflow-y-auto font-mono text-xs">
                  {logs.length === 0 ? (
                    <p className="py-8 text-center text-gray-500">Aucun log</p>
                  ) : logs.map((log, i) => (
                    <div key={i} className={`px-4 py-2 border-b border-gray-800/30 flex items-start gap-3 ${log.level === 'error' ? 'bg-red-900/10' : log.level === 'warn' ? 'bg-orange-900/10' : ''}`}>
                      <span className={`flex-shrink-0 w-10 text-center px-1 py-0.5 rounded text-xs font-bold ${log.level === 'error' ? 'bg-red-900/50 text-red-400' : log.level === 'warn' ? 'bg-orange-900/50 text-orange-400' : 'bg-gray-800 text-gray-400'}`}>
                        {(log.level || 'info').toUpperCase().slice(0, 4)}
                      </span>
                      <span className="text-gray-500 flex-shrink-0 w-36">{log.timestamp}</span>
                      <span className="text-gray-200 break-all">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Tests automatiques</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Suite Vitest — Auth, Multi-Tenant, Numérotation</p>
                </div>
                <button
                  onClick={runTestSuite}
                  disabled={testRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {testRunning ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Tests en cours...</>
                  ) : (
                    <><Play className="w-4 h-4" /> Lancer les tests</>
                  )}
                </button>
              </div>

              {testRunning && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                  <RefreshCw className="w-8 h-8 text-green-400 animate-spin mx-auto mb-3" />
                  <p className="text-gray-300 text-sm">Exécution des tests en cours (~15s)...</p>
                </div>
              )}

              {testResults?.error && (
                <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                  <p className="text-red-400 text-sm font-medium">Erreur : {testResults.error}</p>
                  {testResults.logs && <pre className="mt-2 text-xs text-red-300 overflow-auto max-h-48">{testResults.logs}</pre>}
                </div>
              )}

              {testResults?.results && (() => {
                const r = testResults.results;
                const passed = r.numPassedTests ?? 0;
                const failed = r.numFailedTests ?? 0;
                const total = r.numTotalTests ?? 0;
                const allPassed = failed === 0;
                const duration = testResults.duration ? `${(testResults.duration / 1000).toFixed(1)}s` : '';
                return (
                  <div className="space-y-3">
                    <div className={`rounded-xl p-4 border flex items-center gap-4 ${allPassed ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                      {allPassed
                        ? <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                        : <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                      }
                      <div className="flex-1">
                        <p className={`font-semibold ${allPassed ? 'text-green-300' : 'text-red-300'}`}>
                          {allPassed ? 'Tous les tests passent ✓' : `${failed} test(s) échoué(s)`}
                        </p>
                        <p className="text-sm text-gray-400">{passed}/{total} tests réussis {duration && `• ${duration}`}</p>
                      </div>
                    </div>

                    {(r.testResults || []).map((suite, si) => {
                      const suiteName = suite.testFilePath?.split('/').pop()?.replace('.test.js', '') || `Suite ${si + 1}`;
                      const suiteFailed = suite.status === 'failed';
                      return (
                        <div key={si} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                          <div className={`px-4 py-2.5 flex items-center gap-2 border-b border-gray-800 ${suiteFailed ? 'bg-red-900/10' : 'bg-green-900/10'}`}>
                            {suiteFailed ? <XCircle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                            <span className="text-sm font-medium text-white">{suiteName}</span>
                            <span className="ml-auto text-xs text-gray-500">{(suite.assertionResults || []).filter(t => t.status === 'passed').length}/{(suite.assertionResults || []).length}</span>
                          </div>
                          <div className="divide-y divide-gray-800/40">
                            {(suite.assertionResults || []).map((test, ti) => (
                              <div key={ti} className="px-4 py-2 flex items-center gap-3">
                                {test.status === 'passed'
                                  ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                  : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                }
                                <span className={`text-xs ${test.status === 'passed' ? 'text-gray-300' : 'text-red-300'}`}>
                                  {[...(test.ancestorTitles || []).slice(1), test.title].join(' › ')}
                                </span>
                                {test.duration != null && <span className="ml-auto text-xs text-gray-600">{test.duration}ms</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'carte' && <MapTab />}

        </div>
      </div>

      <ConfirmDialog confirm={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
}
