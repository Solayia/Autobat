import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin, Clock, Wifi, WifiOff, RefreshCw, AlertCircle,
  Navigation, CheckCircle2, LogIn, LogOut, ChevronDown, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import badgeageService from '../../services/badgeageService';

// ─── Utilitaires ───────────────────────────────────────────────────────────────

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isWithinBadgingHours() {
  const now = new Date();
  const day = now.getDay(); // 0=dim, 1=lun … 6=sam
  const hour = now.getHours();
  return day >= 1 && day <= 6 && hour >= 7 && hour < 19;
}

function formatDistance(meters) {
  if (meters == null) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatHeure(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ─── Composant distance pill ───────────────────────────────────────────────────

function DistancePill({ distance, rayon }) {
  if (distance == null)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
        <Navigation className="w-3 h-3" /> GPS requis
      </span>
    );

  const within = distance <= rayon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        within
          ? 'bg-green-100 text-green-700'
          : distance <= rayon * 3
          ? 'bg-orange-100 text-orange-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      <Navigation className="w-3 h-3" />
      {formatDistance(distance)}
      {within && ' · Zone OK'}
    </span>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function Badgeage() {
  const [chantiers, setChantiers] = useState([]);
  const [position, setPosition] = useState(null);
  const [positionError, setPositionError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [badging, setBadging] = useState({});
  const [selectedTache, setSelectedTache] = useState({});
  const [withinHours, setWithinHours] = useState(isWithinBadgingHours());
  const intervalRef = useRef(null);

  // ── Chargement des chantiers ─────────────────────────────────────────────

  const loadChantiers = useCallback(async () => {
    try {
      const data = await badgeageService.getMesChantiers();
      // Accepte { chantiers: [...] } ou tableau direct
      setChantiers(Array.isArray(data) ? data : data.chantiers || []);
    } catch {
      toast.error('Impossible de charger les chantiers');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── GPS ─────────────────────────────────────────────────────────────────

  const updatePosition = useCallback(() => {
    if (!navigator.geolocation) {
      setPositionError('Géolocalisation non supportée par ce navigateur');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          precision: Math.round(pos.coords.accuracy)
        });
        setPositionError(null);
      },
      () => setPositionError('Position GPS indisponible'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  // ── Badges en attente ────────────────────────────────────────────────────

  const updatePendingCount = useCallback(async () => {
    const count = await badgeageService.getPendingCount();
    setPendingCount(count);
  }, []);

  // ── Synchronisation ──────────────────────────────────────────────────────

  const handleSync = useCallback(async () => {
    if (!isOnline || pendingCount === 0 || syncing) return;
    setSyncing(true);
    try {
      const result = await badgeageService.syncOfflineBadges();
      if (result.synced > 0) {
        toast.success(`${result.synced} badge(s) synchronisé(s)`);
        await loadChantiers();
      }
      await updatePendingCount();
    } catch {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  }, [isOnline, pendingCount, syncing, loadChantiers, updatePendingCount]);

  // ── Badgeage ─────────────────────────────────────────────────────────────

  const handleBadge = useCallback(
    async (chantier) => {
      if (!withinHours) {
        toast.error('Badgeage autorisé uniquement du lundi au samedi, 7h-19h');
        return;
      }

      const isEnCours = chantier.badge_actuel === 'PRESENCE_DEBUT';
      const type = isEnCours ? 'PRESENCE_FIN' : 'PRESENCE_DEBUT';
      const tache_id = chantier.badgeage_par_tache
        ? selectedTache[chantier.id]
        : undefined;

      if (chantier.badgeage_par_tache && !tache_id) {
        toast.error('Sélectionnez une tâche avant de badger');
        return;
      }

      const badgeData = {
        chantier_id: chantier.id,
        type,
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
        precision_metres: position?.precision ?? null,
        timestamp: new Date().toISOString(),
        ...(tache_id ? { tache_id } : {})
      };

      setBadging((prev) => ({ ...prev, [chantier.id]: true }));

      try {
        if (isOnline) {
          await badgeageService.badgerGPS(chantier.id, badgeData);
          toast.success(
            type === 'PRESENCE_DEBUT'
              ? '✅ Arrivée enregistrée'
              : '✅ Départ enregistré'
          );
        } else {
          await badgeageService.saveBadgeOffline(badgeData);
          toast('Badge sauvegardé hors ligne — sera sync à la reconnexion', {
            icon: '📲'
          });
          await updatePendingCount();
        }
        await loadChantiers();
      } catch {
        toast.error('Erreur lors du badgeage');
      } finally {
        setBadging((prev) => ({ ...prev, [chantier.id]: false }));
      }
    },
    [withinHours, isOnline, position, selectedTache, loadChantiers, updatePendingCount]
  );

  // ── Effets ───────────────────────────────────────────────────────────────

  useEffect(() => {
    loadChantiers();
    updatePosition();
    updatePendingCount();

    // Rafraîchir GPS + vérifier heure toutes les 60s
    intervalRef.current = setInterval(() => {
      updatePosition();
      setWithinHours(isWithinBadgingHours());
    }, 60000);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connexion rétablie');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast('Mode hors ligne activé', { icon: '📵' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync quand la connexion revient
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-5 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Badgeage GPS</h1>
            <p className="text-blue-200 text-sm">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>

          {/* Statut online/offline */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              isOnline ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
        </div>

        {/* GPS + horaires */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-blue-200">
            <MapPin className="w-4 h-4" />
            {positionError ? (
              <span className="text-orange-300">{positionError}</span>
            ) : position ? (
              <span>
                {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
                <span className="text-blue-300 ml-1">(±{position.precision}m)</span>
              </span>
            ) : (
              <span>Localisation en cours…</span>
            )}
          </div>

          <div
            className={`flex items-center gap-1.5 ml-auto ${
              withinHours ? 'text-green-300' : 'text-orange-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            {withinHours ? 'Horaires OK' : 'Hors horaires'}
          </div>
        </div>
      </div>

      {/* Bannière hors horaires */}
      {!withinHours && (
        <div className="mx-4 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-800">Badgeage hors horaires</p>
            <p className="text-xs text-orange-600 mt-0.5">
              Le badgeage GPS est disponible du lundi au samedi, de 7h à 19h.
            </p>
          </div>
        </div>
      )}

      {/* Badges en attente de sync */}
      {pendingCount > 0 && (
        <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{pendingCount}</span>
            </div>
            <p className="text-sm text-blue-800 font-medium">
              {pendingCount} badge{pendingCount > 1 ? 's' : ''} en attente de sync
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={!isOnline || syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sync…' : 'Sync'}
          </button>
        </div>
      )}

      {/* Chantiers */}
      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Chargement des chantiers…</p>
          </div>
        ) : chantiers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucun chantier assigné</p>
            <p className="text-gray-400 text-sm mt-1">
              Aucun chantier en cours ne vous est attribué.
            </p>
          </div>
        ) : (
          chantiers.map((chantier) => {
            const distance =
              position && chantier.latitude && chantier.longitude
                ? haversineDistance(
                    position.latitude,
                    position.longitude,
                    chantier.latitude,
                    chantier.longitude
                  )
                : null;

            const isEnCours = chantier.badge_actuel === 'PRESENCE_DEBUT';
            const isBadging = badging[chantier.id];
            const rayon = chantier.rayon_gps_metres || 100;

            return (
              <div
                key={chantier.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* En-tête chantier */}
                <div
                  className={`px-4 py-3 border-b ${
                    isEnCours
                      ? 'bg-green-50 border-green-100'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 truncate">
                        {chantier.nom}
                      </h2>
                      {chantier.adresse && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {chantier.adresse}
                        </p>
                      )}
                    </div>
                    {isEnCours && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        En cours
                      </span>
                    )}
                  </div>
                </div>

                {/* Infos + badge */}
                <div className="px-4 py-4">
                  {/* Distance + heure début */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <DistancePill distance={distance} rayon={rayon} />
                    {isEnCours && chantier.heure_debut_badge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                        <Clock className="w-3 h-3" />
                        Arrivée à {formatHeure(chantier.heure_debut_badge)}
                      </span>
                    )}
                  </div>

                  {/* Sélection tâche (si badgeage_par_tache) */}
                  {chantier.badgeage_par_tache && chantier.taches?.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tâche en cours
                      </label>
                      <div className="relative">
                        <select
                          value={selectedTache[chantier.id] || ''}
                          onChange={(e) =>
                            setSelectedTache((prev) => ({
                              ...prev,
                              [chantier.id]: e.target.value
                            }))
                          }
                          className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Sélectionner une tâche —</option>
                          {chantier.taches.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nom}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* Bouton badge */}
                  <button
                    onClick={() => handleBadge(chantier)}
                    disabled={isBadging || !withinHours}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 ${
                      isEnCours
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {isBadging ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isEnCours ? (
                      <LogOut className="w-5 h-5" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    {isBadging
                      ? 'Enregistrement…'
                      : isEnCours
                      ? 'Pointer la sortie'
                      : 'Pointer l\'arrivée'}
                  </button>

                  {/* Avertissement hors ligne */}
                  {!isOnline && (
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Mode hors ligne — badge sauvegardé localement
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bouton refresh manuel */}
      <div className="px-4 pb-8">
        <button
          onClick={() => {
            updatePosition();
            loadChantiers();
            toast('Données actualisées', { icon: '🔄' });
          }}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>
    </div>
  );
}
