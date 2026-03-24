import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';

export default function FaqTab() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  const [allItems, setAllItems] = useState([]);

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        const res = await api.get('/support/faq');
        setAllItems(res.data);
      } catch {
        // silencieux
      } finally {
        setLoading(false);
      }
    };
    fetchFaq();
  }, []);

  // Filtrage client-side (insensible à la casse, FAQ ~16 items)
  useEffect(() => {
    if (!search.trim()) {
      setItems(allItems);
    } else {
      const q = search.toLowerCase();
      setItems(allItems.filter(i =>
        i.question.toLowerCase().includes(q) ||
        i.reponse.toLowerCase().includes(q) ||
        i.categorie.toLowerCase().includes(q)
      ));
    }
  }, [search, allItems]);

  // Grouper par catégorie
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.categorie]) acc[item.categorie] = [];
    acc[item.categorie].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher dans l'aide…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aucun résultat pour « {search} »
          </div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
              <div className="space-y-1">
                {catItems.map(item => (
                  <div key={item.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenId(openId === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      <span>{item.question}</span>
                      {openId === item.id
                        ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                      }
                    </button>
                    {openId === item.id && (
                      <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50">
                        {item.reponse}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
