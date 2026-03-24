import { useState, useEffect } from 'react';
import { ThumbsUp, Plus, X, CheckCircle, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const STATUT_CONFIG = {
  PENDING:        { label: 'En attente', icon: Clock,        color: 'text-gray-400 bg-gray-100' },
  VALIDATED:      { label: 'Vote ouvert', icon: ThumbsUp,    color: 'text-blue-600 bg-blue-50' },
  IN_DEVELOPMENT: { label: 'En développement', icon: Zap,    color: 'text-secondary-600 bg-secondary-50' },
  SHIPPED:        { label: 'Disponible', icon: CheckCircle,  color: 'text-green-600 bg-green-50' },
  REJECTED:       { label: 'Refusé', icon: X,                color: 'text-red-400 bg-red-50' },
};

export default function FeaturesTab() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/support/features');
      setFeatures(res.data);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleVote = async (feature) => {
    if (!['VALIDATED', 'IN_DEVELOPMENT'].includes(feature.statut)) return;
    // Optimistic update
    setFeatures(prev => prev.map(f =>
      f.id === feature.id
        ? { ...f, has_voted: !f.has_voted, nb_votes: f.has_voted ? f.nb_votes - 1 : f.nb_votes + 1 }
        : f
    ));
    try {
      await api.post(`/support/features/${feature.id}/vote`);
    } catch {
      toast.error('Erreur vote');
      load(); // rollback
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titre.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/support/features', { titre: titre.trim(), description: description.trim() });
      toast.success('Demande envoyée ! Elle sera visible après validation.');
      setTitre('');
      setDescription('');
      setShowForm(false);
      load();
    } catch {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Proposez des fonctionnalités et votez pour vos préférées.</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Proposer
        </button>
      </div>

      {/* Formulaire nouvelle demande */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-primary-200 bg-primary-50 rounded-xl p-3 space-y-2">
          <input
            type="text"
            value={titre}
            onChange={e => setTitre(e.target.value)}
            placeholder="Titre de la fonctionnalité *"
            required
            className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Décrivez votre besoin en détail…"
            required
            rows={3}
            className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              {submitting ? 'Envoi…' : 'Envoyer la demande'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : features.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aucune demande pour l'instant. Soyez le premier !
          </div>
        ) : (
          features.map(feature => {
            const cfg = STATUT_CONFIG[feature.statut] || STATUT_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            const canVote = ['VALIDATED', 'IN_DEVELOPMENT'].includes(feature.statut);
            const isExpanded = expandedId === feature.id;

            return (
              <div key={feature.id} className="border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Bouton vote */}
                  <button
                    onClick={() => canVote && handleVote(feature)}
                    disabled={!canVote}
                    className={`flex flex-col items-center gap-0.5 min-w-[40px] pt-0.5 transition-all ${
                      canVote
                        ? feature.has_voted
                          ? 'text-secondary-500 hover:text-secondary-600'
                          : 'text-gray-300 hover:text-secondary-400'
                        : 'text-gray-200 cursor-default'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${feature.has_voted ? 'fill-current' : ''}`} />
                    <span className="text-xs font-semibold">{feature.nb_votes}</span>
                  </button>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 leading-tight">{feature.titre}</p>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Description expandable */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : feature.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-1 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? 'Réduire' : 'Voir plus'}
                    </button>

                    {isExpanded && (
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{feature.description}</p>
                    )}

                    <p className="text-xs text-gray-300 mt-1">
                      par {feature.user.prenom} {feature.user.nom}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
