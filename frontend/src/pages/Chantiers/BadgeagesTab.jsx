import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Activity, MapPin, Clock, User, Plus, Navigation,
  Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2,
  ChevronLeft, Loader2, PauseCircle, StopCircle, X, LogOut
} from 'lucide-react';
import badgeageService from '../../services/badgeageService';
import tacheService from '../../services/tacheService';

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
  const day = now.getDay();
  const hour = now.getHours();
  return day >= 1 && day <= 6 && hour >= 7 && hour < 19;
}

function formatHeure(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function BadgeagesTab({ chantierId, chantier }) {
  // ── État GPS & réseau ──────────────────────────────────────────────────────
  const [position, setPosition] = useState(null);
  const [positionError, setPositionError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [withinHours, setWithinHours] = useState(isWithinBadgingHours());
  const [badgeActuel, setBadgeActuel] = useState(null);
  const [heureDebut, setHeureDebut] = useState(null);

  // ── Historique ────────────────────────────────────────────────────────────
  const [badgeages, setBadgeages] = useState([]);
  const [taches, setTaches] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filters, setFilters] = useState({ type: '', date_debut: '', date_fin: '' });

  // ── Modal badgeage manuel ──────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState('action'); // 'action' | 'tache'
  const [newTacheName, setNewTacheName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Refs pour éviter les stale closures ───────────────────────────────────
  const autobaggingRef = useRef(false);
  const isOnlineRef = useRef(isOnline);
  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);

  // ── Chargement ────────────────────────────────────────────────────────────

  const loadBadgeages = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const data = await badgeageService.getBadgeagesByChantier(chantierId, filters);
      const list = data.badgeages || [];
      setBadgeages(list);
      // Détecter si présence en cours
      const lastPresence = [...list]
        .filter(b => b.type === 'PRESENCE_DEBUT' || b.type === 'PRESENCE_FIN')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      if (lastPresence?.type === 'PRESENCE_DEBUT') {
        setBadgeActuel('PRESENCE_DEBUT');
        setHeureDebut(lastPresence.timestamp);
      } else {
        setBadgeActuel(null);
        setHeureDebut(null);
      }
    } catch {
      toast.error('Erreur lors du chargement des badgeages');
    } finally {
      setLoadingHistory(false);
    }
  }, [chantierId, filters]);

  const loadTaches = useCallback(async () => {
    try {
      const data = await tacheService.getTachesByChantier(chantierId);
      setTaches(data);
    } catch { /* silencieux */ }
  }, [chantierId]);

  const updatePendingCount = useCallback(async () => {
    const count = await badgeageService.getPendingCount();
    setPendingCount(count);
  }, []);

  // ── Auto-géofencing ────────────────────────────────────────────────────────

  const triggerAutoBadge = useCallback(async (type, pos) => {
    if (autobaggingRef.current) return;
    autobaggingRef.current = true;
    try {
      const badgeData = {
        chantier_id: chantierId,
        type,
        latitude: pos?.latitude ?? null,
        longitude: pos?.longitude ?? null,
        precision_metres: pos?.precision ?? null,
        timestamp: new Date().toISOString(),
      };
      if (isOnlineRef.current) {
        await badgeageService.badgerGPS(chantierId, badgeData);
        const label = type === 'PRESENCE_DEBUT'
          ? '📍 Arrivée sur chantier détectée automatiquement'
          : '📍 Départ du chantier détecté automatiquement';
        toast.success(label);
      } else {
        await badgeageService.saveBadgeOffline(badgeData);
        toast('Badge sauvegardé hors ligne', { icon: '📲' });
        await updatePendingCount();
      }
      await loadBadgeages();
    } catch { /* silencieux */ } finally {
      // Cooldown 15s pour éviter les déclenchements répétés
      setTimeout(() => { autobaggingRef.current = false; }, 15000);
    }
  }, [chantierId, loadBadgeages, updatePendingCount]);

  // ── Détection position → auto-badge ──────────────────────────────────────
  const rayon = chantier?.rayon_gps_metres || 100;
  const isEnCours = badgeActuel === 'PRESENCE_DEBUT';

  useEffect(() => {
    if (!position || !chantier?.latitude || !chantier?.longitude) return;
    const dist = haversineDistance(position.latitude, position.longitude, chantier.latitude, chantier.longitude);
    const hours = isWithinBadgingHours();

    if (dist <= rayon && !isEnCours && hours) {
      triggerAutoBadge('PRESENCE_DEBUT', position);
    } else if (dist > rayon * 2 && isEnCours) {
      triggerAutoBadge('PRESENCE_FIN', position);
    }
  }, [position]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Synchronisation offline ──────────────────────────────────────────────

  const handleSync = useCallback(async () => {
    if (!isOnline || pendingCount === 0 || syncing) return;
    setSyncing(true);
    try {
      const result = await badgeageService.syncOfflineBadges();
      if (result.synced > 0) {
        toast.success(`${result.synced} badge(s) synchronisé(s)`);
        await loadBadgeages();
      }
      await updatePendingCount();
    } catch {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  }, [isOnline, pendingCount, syncing, loadBadgeages, updatePendingCount]);

  // ── Effets ────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadBadgeages();
    loadTaches();
    updatePendingCount();

    // Horloge horaires
    const hourInterval = setInterval(() => setWithinHours(isWithinBadgingHours()), 60000);

    // Géolocalisation continue (watchPosition pour l'auto-badge)
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            precision: Math.round(pos.coords.accuracy)
          });
          setPositionError(null);
        },
        () => setPositionError('Position GPS indisponible'),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    } else {
      setPositionError('Géolocalisation non supportée');
    }

    const handleOnline = () => { setIsOnline(true); toast.success('Connexion rétablie'); };
    const handleOffline = () => { setIsOnline(false); toast('Mode hors ligne activé', { icon: '📵' }); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(hourInterval);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [chantierId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOnline && pendingCount > 0) handleSync();
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Présence & tâche actives ──────────────────────────────────────────────

  const activePresenceBadge = useMemo(() => {
    if (!isEnCours || !heureDebut) return null;
    return badgeages.find(b => b.type === 'PRESENCE_DEBUT' && b.timestamp === heureDebut) || null;
  }, [isEnCours, heureDebut, badgeages]);

  const activeTacheBadge = useMemo(() => {
    const tacheBadges = badgeages
      .filter(b => b.type.startsWith('TACHE_'))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (!tacheBadges.length) return null;
    const last = tacheBadges[0];
    return (last.type === 'TACHE_DEBUT' || last.type === 'TACHE_REPRISE') ? last : null;
  }, [badgeages]);

  // ── Handlers modal ────────────────────────────────────────────────────────

  const closeModal = () => {
    setShowModal(false);
    setModalStep('action');
    setNewTacheName('');
  };

  const submitBadge = async (type, tacheId = null) => {
    setSubmitting(true);
    try {
      await badgeageService.createBadgeage(chantierId, {
        type,
        tache_id: tacheId || '',
        latitude: position?.latitude?.toFixed(6) || '',
        longitude: position?.longitude?.toFixed(6) || '',
        precision_metres: position?.precision || ''
      });
      const labels = {
        PRESENCE_DEBUT: 'Arrivée enregistrée',
        PRESENCE_FIN: 'Départ enregistré',
        TACHE_DEBUT: 'Début de tâche enregistré',
        TACHE_PAUSE: 'Pause enregistrée',
        TACHE_FIN: 'Fin de tâche enregistrée',
        TACHE_REPRISE: 'Reprise enregistrée',
      };
      toast.success(labels[type] || 'Badgeage enregistré');
      closeModal();
      await loadBadgeages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectExistingTache = async (tacheId) => {
    await submitBadge('TACHE_DEBUT', tacheId);
  };

  const handleCreateAndStartTache = async () => {
    if (!newTacheName.trim()) return;
    setSubmitting(true);
    try {
      const tache = await tacheService.createTache(chantierId, { nom: newTacheName.trim() });
      await tacheService.getTachesByChantier(chantierId).then(setTaches);
      await submitBadge('TACHE_DEBUT', tache.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la tâche');
      setSubmitting(false);
    }
  };

  // ── Handlers actions inline ───────────────────────────────────────────────

  const handleTacheAction = async (type) => {
    if (!activeTacheBadge) return;
    await submitBadge(type, activeTacheBadge.tache?.id || activeTacheBadge.tache_id || null);
  };

  // ── Helpers affichage ─────────────────────────────────────────────────────

  const getTypeBadge = (type) => ({
    PRESENCE_DEBUT: { color: 'bg-green-100 text-green-700', label: 'Arrivée', icon: '→' },
    PRESENCE_FIN:   { color: 'bg-red-100 text-red-700',     label: 'Départ',  icon: '←' },
    TACHE_DEBUT:    { color: 'bg-blue-100 text-blue-700',    label: 'Début tâche', icon: '▶' },
    TACHE_FIN:      { color: 'bg-purple-100 text-purple-700', label: 'Fin tâche', icon: '■' },
    TACHE_PAUSE:    { color: 'bg-orange-100 text-orange-700', label: 'Pause', icon: '⏸' },
    TACHE_REPRISE:  { color: 'bg-blue-100 text-blue-700',    label: 'Reprise', icon: '▶' }
  }[type] || { color: 'bg-gray-100 text-gray-700', label: type, icon: '•' });

  const getMethodeBadge = (m) => ({
    GPS_AUTO:    { color: 'bg-green-50 text-green-700 border-green-200',    label: 'GPS Auto' },
    MANUEL:      { color: 'bg-blue-50 text-blue-700 border-blue-200',       label: 'Manuel' },
    OFFLINE_SYNC:{ color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Sync Offline' }
  }[m] || { color: 'bg-gray-50 text-gray-700 border-gray-200', label: m });

  const groupByDate = (list) => {
    const groups = {};
    list.forEach(b => {
      const d = new Date(b.timestamp).toLocaleDateString('fr-FR');
      if (!groups[d]) groups[d] = [];
      groups[d].push(b);
    });
    return groups;
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ─── Barre de statut compacte ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs">
        {/* En cours */}
        {isEnCours ? (
          <div className="flex items-center gap-1.5 text-green-700 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            En cours depuis {formatHeure(heureDebut)}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Activity className="w-4 h-4" />
            Hors chantier
          </div>
        )}

        <div className="h-4 w-px bg-gray-300" />

        {/* GPS */}
        <div className="flex items-center gap-1 text-gray-500">
          <MapPin className="w-3.5 h-3.5" />
          {positionError ? (
            <span className="text-orange-600">{positionError}</span>
          ) : position ? (
            <span>GPS actif (±{position.precision}m)</span>
          ) : (
            <span>GPS en attente…</span>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300" />

        {/* Online/offline */}
        <div className={`flex items-center gap-1 font-medium ${isOnline ? 'text-green-700' : 'text-red-600'}`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </div>

        {/* Badges offline */}
        {pendingCount > 0 && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <button onClick={handleSync} disabled={!isOnline || syncing}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {pendingCount} en attente
            </button>
          </>
        )}

        {/* Horaires hors plage */}
        {!withinHours && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Hors horaires (7h-19h)
            </div>
          </>
        )}

        {/* Tâche active */}
        {activeTacheBadge && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-medium">
                ▶ {activeTacheBadge.tache?.nom || 'Tâche en cours'}
              </span>
              <button onClick={() => handleTacheAction('TACHE_PAUSE')} disabled={submitting}
                className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 disabled:opacity-50">
                <PauseCircle className="w-3 h-3" /> Pause
              </button>
              <button onClick={() => handleTacheAction('TACHE_FIN')} disabled={submitting}
                className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 disabled:opacity-50">
                <StopCircle className="w-3 h-3" /> Fin
              </button>
            </div>
          </>
        )}
      </div>

      {/* ─── Historique ─── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Historique</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
          <Plus className="w-4 h-4" /> Badgeage manuel
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Type</label>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="">Tous</option>
              <option value="PRESENCE_DEBUT">Arrivée</option>
              <option value="PRESENCE_FIN">Départ</option>
              <option value="TACHE_DEBUT">Début tâche</option>
              <option value="TACHE_FIN">Fin tâche</option>
              <option value="TACHE_PAUSE">Pause</option>
              <option value="TACHE_REPRISE">Reprise</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Date début</label>
            <input type="date" value={filters.date_debut} onChange={(e) => setFilters({ ...filters, date_debut: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Date fin</label>
            <input type="date" value={filters.date_fin} onChange={(e) => setFilters({ ...filters, date_fin: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex items-end">
            <button onClick={loadBadgeages}
              className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
              Appliquer
            </button>
          </div>
        </div>
      </div>

      {loadingHistory ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : badgeages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium">Aucun badgeage enregistré</p>
          <p className="text-sm mt-2">Le badgeage GPS se fait automatiquement à l'arrivée et au départ du chantier</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupByDate(badgeages)).map(([date, badges]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-900">{date}</h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div className="space-y-2">
                {badges.map((badge) => {
                  const tb = getTypeBadge(badge.type);
                  const mb = getMethodeBadge(badge.methode);
                  const isActiveTache = activeTacheBadge?.id === badge.id;
                  const isActivePresence = activePresenceBadge?.id === badge.id;
                  return (
                    <div key={badge.id} className={`bg-white border rounded-lg p-4 transition-colors ${
                      isActiveTache ? 'border-blue-300 bg-blue-50'
                      : isActivePresence ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full text-lg">{tb.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tb.color}`}>{tb.label}</span>
                            <span className={`px-2 py-1 rounded border text-xs ${mb.color}`}>{mb.label}</span>
                            {isActiveTache && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 animate-pulse">
                                En cours
                              </span>
                            )}
                            {isActivePresence && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 animate-pulse">
                                En cours
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(badge.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {badge.employe?.user && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {badge.employe.user.prenom} {badge.employe.user.nom}
                              </div>
                            )}
                            {badge.tache && <div className="text-blue-600">Tâche: {badge.tache.nom}</div>}
                            {badge.latitude && badge.longitude && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <MapPin className="w-4 h-4" />
                                <span className="text-xs">{badge.latitude.toFixed(4)}, {badge.longitude.toFixed(4)}{badge.precision_metres && ` (±${badge.precision_metres}m)`}</span>
                              </div>
                            )}
                          </div>

                          {/* Action inline pour présence active */}
                          {isActivePresence && (
                            <div className="flex items-center gap-2 mt-3">
                              <button onClick={() => submitBadge('PRESENCE_FIN')} disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50">
                                <LogOut className="w-3.5 h-3.5" /> Quitter le chantier
                              </button>
                            </div>
                          )}

                          {/* Actions inline pour tâche active */}
                          {isActiveTache && (
                            <div className="flex items-center gap-2 mt-3">
                              <button onClick={() => handleTacheAction('TACHE_PAUSE')} disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 disabled:opacity-50">
                                <PauseCircle className="w-3.5 h-3.5" /> Mettre en pause
                              </button>
                              <button onClick={() => handleTacheAction('TACHE_FIN')} disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 disabled:opacity-50">
                                <StopCircle className="w-3.5 h-3.5" /> Terminer la tâche
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modal Badgeage Manuel ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                {modalStep === 'tache' && (
                  <button onClick={() => setModalStep('action')} className="p-1 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <h2 className="text-lg font-bold text-gray-900">
                  {modalStep === 'action' ? 'Badgeage manuel' : 'Sélectionner une tâche'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Step 1: choix de l'action */}
            {modalStep === 'action' && (
              <div className="space-y-3">
                {/* Arrivée sur chantier */}
                <button
                  onClick={() => submitBadge('PRESENCE_DEBUT')}
                  disabled={isEnCours || submitting}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <span className="text-2xl">→</span>
                  <div>
                    <p className="font-semibold text-green-800">Arrivée sur chantier</p>
                    {isEnCours && (
                      <p className="text-xs text-green-600 mt-0.5">Déjà en cours depuis {formatHeure(heureDebut)}</p>
                    )}
                  </div>
                </button>

                {/* Début d'une tâche */}
                <button
                  onClick={() => setModalStep('tache')}
                  disabled={!isEnCours || submitting}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <span className="text-2xl">▶</span>
                  <div>
                    <p className="font-semibold text-blue-800">Début d'une tâche</p>
                    {!isEnCours && (
                      <p className="text-xs text-blue-600 mt-0.5">Nécessite une arrivée préalable</p>
                    )}
                    {activeTacheBadge && (
                      <p className="text-xs text-orange-600 mt-0.5">Une tâche est déjà en cours</p>
                    )}
                  </div>
                </button>

                {submitting && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…
                  </div>
                )}
              </div>
            )}

            {/* Step 2: sélection/création de tâche */}
            {modalStep === 'tache' && (
              <div className="space-y-3">
                {/* Tâches existantes */}
                {taches.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Tâches existantes</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {taches.map(t => (
                        <button key={t.id} onClick={() => handleSelectExistingTache(t.id)} disabled={submitting}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left transition-colors disabled:opacity-50">
                          <span className="text-blue-600">▶</span>
                          <span className="text-sm font-medium text-gray-800">{t.nom}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Créer une nouvelle tâche */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Nouvelle tâche</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTacheName}
                      onChange={(e) => setNewTacheName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateAndStartTache()}
                      placeholder="Nom de la tâche…"
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={handleCreateAndStartTache} disabled={!newTacheName.trim() || submitting}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-1.5">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Démarrer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
