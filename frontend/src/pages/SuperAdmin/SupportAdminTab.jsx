import { useState, useEffect } from 'react';
import {
  Bug, MessageSquare, HelpCircle, Lightbulb, CheckCircle, Clock,
  Zap, X, ChevronDown, ChevronUp, ExternalLink, ThumbsUp, Plus, Trash2, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─── Configs ──────────────────────────────────────────────────────────────────

const TICKET_STATUTS = ['OUVERT', 'EN_COURS', 'RESOLU', 'FERME'];
const TICKET_TYPES   = ['BUG', 'FEEDBACK', 'QUESTION'];
const TICKET_PRIOS   = ['HIGH', 'MEDIUM', 'LOW'];

const STATUT_TICKET_COLOR = {
  OUVERT:   'bg-red-900/30 text-red-400',
  EN_COURS: 'bg-yellow-900/30 text-yellow-400',
  RESOLU:   'bg-green-900/30 text-green-400',
  FERME:    'bg-gray-800 text-gray-500',
};
const TYPE_LABEL = { BUG: '🐛 Bug', FEEDBACK: '💬 Feedback', QUESTION: '❓ Question' };
const PRIO_COLOR = { HIGH: 'text-red-400', MEDIUM: 'text-yellow-400', LOW: 'text-green-400' };

const FEATURE_STATUTS = ['PENDING', 'VALIDATED', 'IN_DEVELOPMENT', 'SHIPPED', 'REJECTED'];
const FEATURE_STATUT_CONFIG = {
  PENDING:        { label: 'En attente',       color: 'bg-gray-800 text-gray-400' },
  VALIDATED:      { label: 'Vote ouvert',       color: 'bg-blue-900/30 text-blue-400' },
  IN_DEVELOPMENT: { label: 'En développement', color: 'bg-yellow-900/30 text-yellow-400' },
  SHIPPED:        { label: 'Disponible',        color: 'bg-green-900/30 text-green-400' },
  REJECTED:       { label: 'Refusé',            color: 'bg-red-900/30 text-red-400' },
};

// ─── Tickets ─────────────────────────────────────────────────────────────────

function TicketsSection() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatut) params.statut = filterStatut;
      if (filterType)   params.type   = filterType;
      const res = await api.get('/super-admin/support/tickets', { params });
      setTickets(res.data.tickets);
      setTotal(res.data.total);
    } catch {
      toast.error('Erreur chargement tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatut, filterType]);

  const updateTicket = async (id, data) => {
    try {
      const res = await api.patch(`/super-admin/support/tickets/${id}`, data);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...res.data } : t));
      toast.success('Ticket mis à jour');
    } catch {
      toast.error('Erreur mise à jour');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
        >
          <option value="">Tous les statuts</option>
          {TICKET_STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
        >
          <option value="">Tous les types</option>
          {TICKET_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        <span className="text-sm text-gray-500 self-center">{total} ticket{total > 1 ? 's' : ''}</span>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">Aucun ticket</div>
      ) : (
        <div className="space-y-2">
          {tickets.map(ticket => {
            const isExpanded = expandedId === ticket.id;
            return (
              <div key={ticket.id} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                >
                  <span className="text-lg">{TYPE_LABEL[ticket.type]?.split(' ')[0]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white truncate">{ticket.titre}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_TICKET_COLOR[ticket.statut]}`}>
                        {ticket.statut}
                      </span>
                      <span className={`text-xs font-semibold ${PRIO_COLOR[ticket.priorite]}`}>
                        {ticket.priorite}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {ticket.user?.prenom} {ticket.user?.nom} · {ticket.page_url || '—'} · {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-700 px-4 py-4 space-y-3">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{ticket.message}</p>
                    {ticket.entity_name && (
                      <p className="text-xs text-gray-500">Contexte: {ticket.entity_name}</p>
                    )}
                    {ticket.screenshot_url && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Screenshot :</p>
                        <a href={ticket.screenshot_url} target="_blank" rel="noopener noreferrer">
                          <img src={ticket.screenshot_url} alt="screenshot" className="max-h-40 rounded border border-gray-700 object-cover hover:opacity-90 transition-opacity" />
                        </a>
                      </div>
                    )}
                    {ticket.attachments && (() => {
                      try {
                        const urls = JSON.parse(ticket.attachments);
                        return urls.length > 0 ? (
                          <div className="flex gap-2 flex-wrap">
                            {urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 bg-gray-800 px-2 py-1 rounded">
                                <ExternalLink className="w-3 h-3" /> Pièce jointe {i + 1}
                              </a>
                            ))}
                          </div>
                        ) : null;
                      } catch { return null; }
                    })()}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      <select
                        value={ticket.statut}
                        onChange={e => updateTicket(ticket.id, { statut: e.target.value })}
                        className="bg-gray-700 border border-gray-600 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none"
                      >
                        {TICKET_STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select
                        value={ticket.priorite}
                        onChange={e => updateTicket(ticket.id, { priorite: e.target.value })}
                        className="bg-gray-700 border border-gray-600 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none"
                      >
                        {TICKET_PRIOS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Feature Requests ─────────────────────────────────────────────────────────

function FeaturesSection() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = filterStatut ? { statut: filterStatut } : {};
      const res = await api.get('/super-admin/support/features', { params });
      setFeatures(res.data);
    } catch {
      toast.error('Erreur chargement features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatut]);

  const updateStatut = async (id, statut) => {
    try {
      const res = await api.patch(`/super-admin/support/features/${id}`, { statut });
      setFeatures(prev => prev.map(f => f.id === id ? { ...f, ...res.data } : f));
      toast.success('Statut mis à jour');
    } catch {
      toast.error('Erreur mise à jour');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
        >
          <option value="">Tous les statuts</option>
          {FEATURE_STATUTS.map(s => <option key={s} value={s}>{FEATURE_STATUT_CONFIG[s].label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : features.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">Aucune demande</div>
      ) : (
        <div className="space-y-2">
          {features.map(feature => {
            const cfg = FEATURE_STATUT_CONFIG[feature.statut];
            return (
              <div key={feature.id} className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-0.5 min-w-[40px] pt-0.5 text-purple-400">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs font-bold">{feature.nb_votes}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{feature.titre}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{feature.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      par {feature.user?.prenom} {feature.user?.nom} · {new Date(feature.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <select
                    value={feature.statut}
                    onChange={e => updateStatut(feature.id, e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none flex-shrink-0"
                  >
                    {FEATURE_STATUTS.map(s => <option key={s} value={s}>{FEATURE_STATUT_CONFIG[s].label}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categorie: '', question: '', reponse: '', ordre: 0 });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/super-admin/support/faq');
      setItems(res.data);
    } catch {
      toast.error('Erreur FAQ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/super-admin/support/faq', form);
      toast.success('Item FAQ créé');
      setShowForm(false);
      setForm({ categorie: '', question: '', reponse: '', ordre: 0 });
      load();
    } catch {
      toast.error('Erreur création');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActif = async (item) => {
    try {
      await api.patch(`/super-admin/support/faq/${item.id}`, { actif: !item.actif });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, actif: !i.actif } : i));
    } catch {
      toast.error('Erreur');
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/super-admin/support/faq/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Supprimé');
    } catch {
      toast.error('Erreur suppression');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouvel item
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.categorie}
              onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}
              placeholder="Catégorie *"
              required
              className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            />
            <input
              type="number"
              value={form.ordre}
              onChange={e => setForm(p => ({ ...p, ordre: parseInt(e.target.value) || 0 }))}
              placeholder="Ordre"
              className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            />
          </div>
          <input
            value={form.question}
            onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
            placeholder="Question *"
            required
            className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
          />
          <textarea
            value={form.reponse}
            onChange={e => setForm(p => ({ ...p, reponse: e.target.value }))}
            placeholder="Réponse *"
            required
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-purple-500"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              <Save className="w-3.5 h-3.5" /> {submitting ? 'Création…' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-600 text-gray-400 text-sm rounded-lg hover:bg-gray-800 transition-colors">
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map(item => (
            <div key={item.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${item.actif ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-900 border-gray-800 opacity-50'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-400 font-medium">{item.categorie}</p>
                <p className="text-sm text-white mt-0.5">{item.question}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.reponse}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActif(item)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${item.actif ? 'border-green-700 text-green-400 hover:bg-green-900/20' : 'border-gray-700 text-gray-500 hover:bg-gray-800'}`}>
                  {item.actif ? 'Actif' : 'Inactif'}
                </button>
                <button onClick={() => deleteItem(item.id)}
                  className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SUB_TABS = [
  { key: 'tickets',  label: 'Tickets',          Icon: Bug },
  { key: 'features', label: 'Fonctionnalités',   Icon: Lightbulb },
  { key: 'faq',      label: 'FAQ',               Icon: HelpCircle },
];

export default function SupportAdminTab() {
  const [activeTab, setActiveTab] = useState('tickets');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Support & Auto Bat Man</h2>
        <p className="text-sm text-gray-500 mt-1">Gestion des tickets, feature requests et FAQ</p>
      </div>

      {/* Sous-onglets */}
      <div className="flex gap-1 bg-gray-800/50 p-1 rounded-xl w-fit">
        {SUB_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === key
                ? 'bg-purple-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'tickets'  && <TicketsSection />}
      {activeTab === 'features' && <FeaturesSection />}
      {activeTab === 'faq'      && <FaqSection />}
    </div>
  );
}
