import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SEVERITY_CONFIG = {
  error: {
    icon: AlertTriangle,
    bg: 'bg-red-50',
    border: 'border-red-100',
    iconColor: 'text-red-500',
    dot: 'bg-red-500'
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    iconColor: 'text-orange-500',
    dot: 'bg-orange-500'
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconColor: 'text-blue-500',
    dot: 'bg-blue-400'
  }
};

export default function NotificationBell({ light = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    // Mémoriser les IDs dismissés en sessionStorage
    try {
      return new Set(JSON.parse(sessionStorage.getItem('dismissed_notifs') || '[]'));
    } catch {
      return new Set();
    }
  });
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch {
      // Silencieux si offline ou erreur
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  // Fermer si clic en dehors
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visible = notifications.filter(n => !dismissed.has(n.id));
  const unreadCount = visible.length;

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    sessionStorage.setItem('dismissed_notifs', JSON.stringify([...next]));
  };

  const handleClick = (notif) => {
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => { setOpen(!open); if (!open) load(); }}
        className={`relative p-2 rounded-lg transition-colors ${
        light
          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          : 'text-blue-200 hover:text-white hover:bg-blue-700/50'
      }`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900 text-sm">Alertes</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Liste notifications */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Chargement…</div>
            ) : visible.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucune alerte</p>
                <p className="text-gray-400 text-xs mt-1">Tout est en ordre 👍</p>
              </div>
            ) : (
              visible.map((notif) => {
                const cfg = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`group flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${cfg.bg}`}
                  >
                    <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{notif.message}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      <button
                        onClick={(e) => handleDismiss(e, notif.id)}
                        className="p-0.5 text-gray-300 hover:text-gray-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Ignorer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {visible.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100">
              <button
                onClick={() => {
                  const allIds = notifications.map(n => n.id);
                  const next = new Set([...dismissed, ...allIds]);
                  setDismissed(next);
                  sessionStorage.setItem('dismissed_notifs', JSON.stringify([...next]));
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Tout ignorer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
