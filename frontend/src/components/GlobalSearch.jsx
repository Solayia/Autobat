import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, FileText, Building, Loader2 } from 'lucide-react';
import api from '../services/api';

// Debounce helper
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const STATUT_COLORS = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  ENVOYE: 'bg-blue-100 text-blue-700',
  ACCEPTE: 'bg-green-100 text-green-700',
  REFUSE: 'bg-red-100 text-red-700',
  EN_COURS: 'bg-blue-100 text-blue-700',
  TERMINE: 'bg-green-100 text-green-700',
  ANNULE: 'bg-red-100 text-red-700',
};

export default function GlobalSearch({ light = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  // Ouvrir avec Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input quand ouvert
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [open]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Recherche
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults(null);
      return;
    }
    const search = async () => {
      setLoading(true);
      try {
        const res = await api.get('/search', { params: { q: debouncedQuery.trim() } });
        setResults(res.data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [debouncedQuery]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const hasResults = results && (results.clients.length + results.devis.length + results.chantiers.length) > 0;

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        onClick={() => setOpen(true)}
        className={`p-2 rounded-lg transition-colors ${
          light
            ? 'text-gray-600 hover:bg-gray-100'
            : 'text-blue-200 hover:bg-blue-700/50'
        }`}
        title="Recherche globale (Ctrl+K)"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[60] flex items-start justify-center pt-20 px-4">
          <div ref={containerRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un client, devis, chantier…"
                className="flex-1 text-base text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              />
              {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Résultats */}
            <div className="max-h-[60vh] overflow-y-auto">
              {!query || query.trim().length < 2 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  Tapez au moins 2 caractères pour rechercher
                  <div className="mt-2 text-xs text-gray-300">Clients · Devis · Chantiers</div>
                </div>
              ) : results && !hasResults ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  Aucun résultat pour « {query} »
                </div>
              ) : hasResults ? (
                <div className="divide-y divide-gray-50">
                  {/* Clients */}
                  {results.clients.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Clients ({results.clients.length})
                        </span>
                      </div>
                      {results.clients.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleNavigate(`/clients/${c.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                            </p>
                            {c.ville && <p className="text-xs text-gray-500">{c.ville}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Devis */}
                  {results.devis.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Devis ({results.devis.length})
                        </span>
                      </div>
                      {results.devis.map(d => (
                        <button
                          key={d.id}
                          onClick={() => handleNavigate(`/devis/${d.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{d.numero_devis}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUT_COLORS[d.statut] || 'bg-gray-100 text-gray-600'}`}>
                                {d.statut}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {d.objet || `Client: ${d.client?.nom}`} — {d.montant_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Chantiers */}
                  {results.chantiers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Chantiers ({results.chantiers.length})
                        </span>
                      </div>
                      {results.chantiers.map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => handleNavigate(`/chantiers/${ch.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Building className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{ch.nom}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${STATUT_COLORS[ch.statut] || 'bg-gray-100 text-gray-600'}`}>
                                {ch.statut}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{ch.ville} · {ch.client?.nom}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
              <span><kbd className="bg-gray-200 text-gray-600 px-1 py-0.5 rounded text-[10px] font-mono">↵</kbd> Sélectionner</span>
              <span><kbd className="bg-gray-200 text-gray-600 px-1 py-0.5 rounded text-[10px] font-mono">Esc</kbd> Fermer</span>
              <span><kbd className="bg-gray-200 text-gray-600 px-1 py-0.5 rounded text-[10px] font-mono">Ctrl</kbd>+<kbd className="bg-gray-200 text-gray-600 px-1 py-0.5 rounded text-[10px] font-mono">K</kbd> Ouvrir</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
