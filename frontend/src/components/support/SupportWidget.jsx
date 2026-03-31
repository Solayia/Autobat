import { useState, useEffect } from 'react';
import { X, HelpCircle, MessageSquare, Lightbulb, MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import FaqTab from './FaqTab';
import FeedbackTab from './FeedbackTab';
import FeaturesTab from './FeaturesTab';
import useAuthStore from '../../stores/authStore';

const TABS = [
  { key: 'aide',       label: 'Aide',            Icon: HelpCircle },
  { key: 'feedback',   label: 'Feedback',         Icon: MessageSquare },
  { key: 'features',   label: 'Roadmap',           Icon: Lightbulb },
];

// Extraire le contexte page courante
function usePageContext() {
  const location = useLocation();
  const pathname = location.pathname;

  return {
    url: pathname,
    entity: null
  };
}

export default function SupportWidget() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const pageContext = usePageContext();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('aide');

  // Fermer le widget au changement de page
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Ne pas afficher si non connecté ou sur super-admin
  if (!isAuthenticated || location.pathname.startsWith('/super-admin')) return null;

  return (
    <>
      {/* Modal widget */}
      {open && (
        <div className="fixed bottom-20 right-4 z-[9998] w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: '560px', maxHeight: 'calc(100vh - 100px)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-primary-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-400 flex items-center justify-center text-primary-700">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">Support Autobat</p>
                <p className="text-xs text-primary-200">Aide & Feedback</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-primary-200 hover:text-white transition-colors p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === key
                    ? 'text-primary-600 border-b-2 border-secondary-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-hidden p-4">
            {activeTab === 'aide'     && <FaqTab />}
            {activeTab === 'feedback' && <FeedbackTab pageContext={pageContext} />}
            {activeTab === 'features' && <FeaturesTab />}
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-4 right-4 z-[9999] w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 ${
          open
            ? 'bg-primary-700 text-white scale-95'
            : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-105'
        }`}
        title="Support & Aide"
      >
        {open ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
      </button>
    </>
  );
}
