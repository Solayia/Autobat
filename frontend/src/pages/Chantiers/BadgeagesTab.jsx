import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Activity, MapPin, Clock, User, Plus, Navigation,
  Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2,
  LogIn, LogOut, ChevronDown, Loader2
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

function formatDistance(meters) {
  if (meters == null) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatHeure(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function DistancePill({ distance, rayon }) {
  if (distance == null)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
        <Navigation className="w-3 h-3" /> GPS requis
      </span>
    );
  const within = distance <= rayon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      within ? 'bg-green-100 text-green-700'
        : distance <= rayon * 3 ? 'bg-orange-100 text-orange-700'
        : 'bg-red-100 text-red-700'
    }`}>
      <Navigation className="w-3 h-3" />
      {formatDistance(distance)}{within && ' · Zone OK'}
    </span>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function BadgeagesTab({ chantierId, chantier }) {
  // ── Badgeage GPS ──────────────────────────────────────────────────────────
  const [position, setPosition] = useState(null);
  const [positionError, setPositionError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [badging, setBadging] = useState(false);
  const [selectedTache, setSelectedTache] = useState('');
  const [withinHours, setWithinHours] = useState(isWithinBadgingHours());
  const [badgeActuel, setBadgeActuel] = useState(null); // 'PRESENCE_DEBUT' si en cours
  const [heureDebut, setHeureDebut] = useState(null);
  const intervalRef = useRef(null);

  // ── Historique ────────────────────────────────────────────────────────────
  const [badgeages, setBadgeages] = useState([]);
  const [taches, setTaches] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [formData, setFormData] = useState({
    type: 'PRESENCE_DEBUT', tache_id: '', latitude: '', longitude: '', precision_metres: ''
  });
  const [filters, setFilters] = useState({ type: '', date_debut: '', date_fin: '' });

  // ── Chargement ────────────────────────────────────────────────────────────

  const loadBadgeages = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const data = await badgeageService.getBadgeagesByChantier(chantierId, filters);
      const list = data.badgeages || [];
      setBadgeages(list);
      // Détecter si l'employé est déjà en cours sur ce chantier
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
    } catch {
      // silencieux
    }
  }, [chantierId]);

  const updatePendingCount = useCallback(async () => {
    const count = await badgeageService.getPendingCount();
    setPendingCount(count);
  }, []);

  const updatePosition = useCallback(() => {
    if (!navigator.geolocation) {
      setPositionError('Géolocalisation non supportée');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, precision: Math.round(pos.coords.accuracy) });
        setPositionError(null);
      },
      () => setPositionError('Position GPS indisponible'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  // ── Synchronisation ──────────────────────────────────────────────────────

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

  // ── Badgeage GPS ──────────────────────────────────────────────────────────

  const handleBadge = useCallback(async () => {
    if (!withinHours) {
      toast.error('Badgeage autorisé uniquement du lundi au samedi, 7h-19h');
      return;
    }
    const isEnCours = badgeActuel === 'PRESENCE_DEBUT';
    const type = isEnCours ? 'PRESENCE_FIN' : 'PRESENCE_DEBUT';

    if (chantier?.badgeage_par_tache && !selectedTache) {
      toast.error('Sélectionnez une tâche avant de badger');
      return;
    }

    const badgeData = {
      chantier_id: chantierId,
      type,
      latitude: position?.latitude ?? null,
      longitude: position?.longitude ?? null,
      precision_metres: position?.precision ?? null,
      timestamp: new Date().toISOString(),
      ...(selectedTache ? { tache_id: selectedTache } : {})
    };

    setBadging(true);
    try {
      if (isOnline) {
        await badgeageService.badgerGPS(chantierId, badgeData);
        toast.success(type === 'PRESENCE_DEBUT' ? '✅ Arrivée enregistrée' : '✅ Départ enregistré');
      } else {
        await badgeageService.saveBadgeOffline(badgeData);
        toast('Badge sauvegardé hors ligne — sera sync à la reconnexion', { icon: '📲' });
        await updatePendingCount();
      }
      await loadBadgeages();
    } catch {
      toast.error('Erreur lors du badgeage');
    } finally {
      setBadging(false);
    }
  }, [withinHours, badgeActuel, chantier, selectedTache, chantierId, position, isOnline, loadBadgeages, updatePendingCount]);

  // ── Effets ───────────────────────────────────────────────────────────────

  useEffect(() => {
    loadBadgeages();
    loadTaches();
    updatePosition();
    updatePendingCount();

    intervalRef.current = setInterval(() => {
      updatePosition();
      setWithinHours(isWithinBadgingHours());
    }, 60000);

    const handleOnline = () => { setIsOnline(true); toast.success('Connexion rétablie'); };
    const handleOffline = () => { setIsOnline(false); toast('Mode hors ligne activé', { icon: '📵' }); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [chantierId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOnline && pendingCount > 0) handleSync();
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers historique ───────────────────────────────────────────────────

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error('Géolocalisation non supportée'); return; }
    setLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setFormData({ ...formData, latitude: p.coords.latitude.toFixed(6), longitude: p.coords.longitude.toFixed(6), precision_metres: Math.round(p.coords.accuracy) }); setLoadingGPS(false); },
      () => { toast.error('Impossible de récupérer votre position'); setLoadingGPS(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmitManuel = async (e) => {
    e.preventDefault();
    try {
      await badgeageService.createBadgeage(chantierId, formData);
      toast.success('Badgeage enregistré');
      setShowModal(false);
      setFormData({ type: 'PRESENCE_DEBUT', tache_id: '', latitude: '', longitude: '', precision_metres: '' });
      loadBadgeages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const getTypeBadge = (type) => ({
    PRESENCE_DEBUT: { color: 'bg-green-100 text-green-700', label: 'Arrivée', icon: '→' },
    PRESENCE_FIN:   { color: 'bg-red-100 text-red-700',   label: 'Départ',  icon: '←' },
    TACHE_DEBUT:    { color: 'bg-blue-100 text-blue-700',  label: 'Début tâche', icon: '▶' },
    TACHE_FIN:      { color: 'bg-purple-100 text-purple-700', label: 'Fin tâche', icon: '■' },
    TACHE_PAUSE:    { color: 'bg-orange-100 text-orange-700', label: 'Pause', icon: '⏸' },
    TACHE_REPRISE:  { color: 'bg-blue-100 text-blue-700',  label: 'Reprise', icon: '▶' }
  }[type] || { color: 'bg-gray-100 text-gray-700', label: type, icon: '•' });

  const getMethodeBadge = (m) => ({
    GPS_AUTO:    { color: 'bg-green-50 text-green-700 border-green-200',   label: 'GPS Auto' },
    MANUEL:      { color: 'bg-blue-50 text-blue-700 border-blue-200',      label: 'Manuel' },
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

  const distance = position && chantier?.latitude && chantier?.longitude
    ? haversineDistance(position.latitude, position.longitude, chantier.latitude, chantier.longitude)
    : null;
  const rayon = chantier?.rayon_gps_metres || 100;
  const isEnCours = badgeActuel === 'PRESENCE_DEBUT';

  // ── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ─── Zone de badgeage GPS ─── */}
      <div className={`rounded-2xl border-2 p-5 mb-6 ${isEnCours ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Badgeage GPS</h2>

          {/* Statut online/offline */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
        </div>

        {/* GPS + horaires */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gray-400" />
            {positionError ? (
              <span className="text-orange-600">{positionError}</span>
            ) : position ? (
              <span>{position.latitude.toFixed(5)}, {position.longitude.toFixed(5)} <span className="text-gray-400">(±{position.precision}m)</span></span>
            ) : (
              <span className="text-gray-400">Localisation en cours…</span>
            )}
          </div>
          <DistancePill distance={distance} rayon={rayon} />
          <div className={`flex items-center gap-1 ml-auto text-xs ${withinHours ? 'text-green-600' : 'text-orange-500'}`}>
            <Clock className="w-3 h-3" />
            {withinHours ? 'Horaires OK (7h-19h)' : 'Hors horaires'}
          </div>
        </div>

        {/* Bannière hors horaires */}
        {!withinHours && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-700">Badgeage GPS disponible du lundi au samedi, 7h à 19h.</p>
          </div>
        )}

        {/* Badges en attente */}
        {pendingCount > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{pendingCount}</span>
              </div>
              <p className="text-sm text-blue-800">{pendingCount} badge{pendingCount > 1 ? 's' : ''} en attente de sync</p>
            </div>
            <button onClick={handleSync} disabled={!isOnline || syncing}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sync…' : 'Sync'}
            </button>
          </div>
        )}

        {/* Sélection tâche */}
        {chantier?.badgeage_par_tache && taches.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Tâche en cours</label>
            <div className="relative">
              <select value={selectedTache} onChange={(e) => setSelectedTache(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner une tâche —</option>
                {taches.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Heure début si en cours */}
        {isEnCours && heureDebut && (
          <div className="mb-4 flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>En cours depuis {formatHeure(heureDebut)}</span>
          </div>
        )}

        {/* Bouton badge principal */}
        <button onClick={handleBadge} disabled={badging || !withinHours}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 ${
            isEnCours ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
          }`}>
          {badging ? <Loader2 className="w-5 h-5 animate-spin" />
            : isEnCours ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          {badging ? 'Enregistrement…' : isEnCours ? 'Pointer la sortie' : 'Pointer l\'arrivée'}
        </button>

        {!isOnline && (
          <p className="text-center text-xs text-gray-400 mt-2">Mode hors ligne — badge sauvegardé localement</p>
        )}
      </div>

      {/* ─── Historique des badgeages ─── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Historique</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
          <Plus className="w-4 h-4" /> Badgeage manuel
        </button>
      </div>

      {/* Info mode */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 text-blue-900 text-sm">
          <Activity className="w-4 h-4" />
          <span className="font-medium">Mode: {chantier?.badgeage_par_tache ? 'Détaillé (GPS + par tâche)' : 'Simple (GPS)'}</span>
          {chantier?.latitude && <span className="text-blue-600 ml-2">· Rayon {rayon}m</span>}
        </div>
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
          <p className="text-sm mt-2">Les badgeages GPS et manuels apparaîtront ici</p>
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
                  return (
                    <div key={badge.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full text-lg">{tb.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tb.color}`}>{tb.label}</span>
                            <span className={`px-2 py-1 rounded border text-xs ${mb.color}`}>{mb.label}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(badge.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                            {badge.employe?.user && (
                              <div className="flex items-center gap-1"><User className="w-4 h-4" />{badge.employe.user.prenom} {badge.employe.user.nom}</div>
                            )}
                            {badge.tache && <div className="text-blue-600">Tâche: {badge.tache.nom}</div>}
                            {badge.latitude && badge.longitude && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <MapPin className="w-4 h-4" />
                                <span className="text-xs">{badge.latitude.toFixed(4)}, {badge.longitude.toFixed(4)}{badge.precision_metres && ` (±${badge.precision_metres}m)`}</span>
                              </div>
                            )}
                          </div>
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

      {/* Modal Badgeage Manuel */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Badgeage manuel</h2>
            <form onSubmit={handleSubmitManuel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required>
                  <option value="PRESENCE_DEBUT">Arrivée sur chantier</option>
                  <option value="PRESENCE_FIN">Départ du chantier</option>
                  <option value="TACHE_DEBUT">Début de tâche</option>
                  <option value="TACHE_PAUSE">Pause tâche</option>
                  <option value="TACHE_REPRISE">Reprise tâche</option>
                  <option value="TACHE_FIN">Fin de tâche</option>
                </select>
              </div>
              {formData.type.startsWith('TACHE_') && taches.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tâche</label>
                  <select value={formData.tache_id} onChange={(e) => setFormData({ ...formData, tache_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                    <option value="">-- Sélectionner --</option>
                    {taches.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                </div>
              )}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Position GPS (optionnel)</label>
                  <button type="button" onClick={handleGetLocation} disabled={loadingGPS}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50">
                    <Navigation className="w-4 h-4" />{loadingGPS ? 'Localisation...' : 'Ma position'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                    <input type="number" step="0.000001" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="48.856614" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                    <input type="number" step="0.000001" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="2.352222" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setShowModal(false); setFormData({ type: 'PRESENCE_DEBUT', tache_id: '', latitude: '', longitude: '', precision_metres: '' }); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
