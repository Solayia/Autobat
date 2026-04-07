import { useState, useEffect } from 'react';
import { X, Sparkles, Zap, Wrench, Star } from 'lucide-react';
import useAuthStore from '../stores/authStore';

const CURRENT_VERSION = '1.2.0';

const CHANGELOG = [
  {
    version: '1.2.0',
    date: 'Avril 2026',
    entries: [
      {
        type: 'improve',
        icon: '🔢',
        title: 'Numéro de devis personnalisable',
        desc: 'Le numéro de devis est pré-rempli automatiquement, mais vous pouvez maintenant le modifier librement. Une vérification en temps réel vous alerte si ce numéro est déjà utilisé.',
      },
      {
        type: 'new',
        icon: '🏦',
        title: 'BIC dans les paramètres',
        desc: 'Vous pouvez désormais renseigner votre code BIC à côté de votre RIB/IBAN dans les paramètres généraux.',
      },
    ],
  },
  {
    version: '1.1.0',
    date: 'Avril 2026',
    entries: [
      {
        type: 'new',
        icon: '🧾',
        title: 'Factures fournisseurs',
        desc: 'Gérez les factures de vos fournisseurs directement dans Autobat — suivi, import et historique.',
      },
      {
        type: 'new',
        icon: '📊',
        title: 'Pilotage amélioré',
        desc: 'Nouveau tableau de bord avec pipeline commercial, trésorerie prévisionnelle et analyse des marges.',
      },
      {
        type: 'new',
        icon: '💎',
        title: 'Les bons plans',
        desc: 'Accédez à des offres négociées pour les artisans du BTP — matériaux, outils, assurances.',
      },
      {
        type: 'improve',
        icon: '📄',
        title: 'TVA 2.1 % et 8.5 %',
        desc: 'Les taux de TVA réduits sont maintenant disponibles sur les lignes de devis (DOM-TOM, médicaments…).',
      },
      {
        type: 'improve',
        icon: '💬',
        title: 'Widget support repensé',
        desc: 'Le bouton d\'aide est plus grand et plus visible. Envoyez un bug ou une idée en 30 secondes.',
      },
      {
        type: 'fix',
        icon: '🔧',
        title: 'Corrections diverses',
        desc: 'Affichage du nombre de lignes sur les cartes devis, formulaires clients sans téléphone, et stabilité des PDF.',
      },
    ],
  },
];

const TYPE_LABELS = {
  new:     { label: 'Nouveauté', color: 'bg-blue-100 text-blue-700' },
  improve: { label: 'Amélioration', color: 'bg-green-100 text-green-700' },
  fix:     { label: 'Correction', color: 'bg-orange-100 text-orange-700' },
};

const STORAGE_KEY = 'autobat_last_seen_version';

export default function WhatsNewModal() {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (lastSeen !== CURRENT_VERSION) {
      // Small delay so the app has time to render first
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setOpen(false);
  };

  if (!open) return null;

  const release = CHANGELOG[0];

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-0.5">Mise à jour</p>
                <h2 className="text-xl font-bold leading-tight">Quoi de neuf ?</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full tracking-wide">
                v{release.version} — {release.date}
              </span>
              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="mt-3 text-sm text-blue-100 leading-relaxed">
            Voici les principales nouveautés de cette version. Bonne découverte !
          </p>
        </div>

        {/* Entries */}
        <div className="px-6 py-4 space-y-3 max-h-[56vh] overflow-y-auto">
          {release.entries.map((entry, i) => {
            const badge = TYPE_LABELS[entry.type];
            return (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-lg mt-0.5">
                  {entry.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-semibold text-sm text-gray-900">{entry.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{entry.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Des retours ? Utilisez le bouton <strong>Support</strong> en bas à droite.
          </p>
          <button
            onClick={dismiss}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Star className="w-3.5 h-3.5" />
            Allons-y !
          </button>
        </div>
      </div>
    </div>
  );
}
