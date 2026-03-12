import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Activity, MapPin, Clock, User, Plus, Navigation,
  Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2,
  ChevronLeft, Loader2, PauseCircle, StopCircle, X, LogOut, PlayCircle, Trash2
} from 'lucide-react';
import badgeageService from '../../services/badgeageService';
import tacheService from '../../services/tacheService';
import useAuthStore from '../../stores/authStore';

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

function formatDuration(ms) {
  if (!ms || ms <= 0) return null;
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return null;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`;
}

// Durée de présence : pour PRESENCE_FIN, cherche le PRESENCE_DEBUT précédent du même employé
function computePresenceDuration(badge, allBadges) {
  if (badge.type !== 'PRESENCE_FIN') return null;
  const empId = badge.employe?.user?.id;
  const debut = [...allBadges]
    .filter(b => b.type === 'PRESENCE_DEBUT' && b.employe?.user?.id === empId && new Date(b.timestamp) < new Date(badge.timestamp))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  if (!debut) return null;
  return formatDuration(new Date(badge.timestamp) - new Date(debut.timestamp));
}

// Durée nette d'une tâche (somme cycles DEBUT/REPRISE → PAUSE/FIN) pour TACHE_FIN ou TACHE_PAUSE
function computeTacheDuration(badge, allBadges) {
  if (!badge.type.startsWith('TACHE_') || badge.type === 'TACHE_DEBUT' || badge.type === 'TACHE_REPRISE') return null;
  const tacheId = badge.tache?.id || badge.tache_id;
  const empId = badge.employe?.user?.id;
  if (!tacheId) return null;
  const tacheBadges = allBadges
    .filter(b => (b.tache?.id || b.tache_id) === tacheId && b.employe?.user?.id === empId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let total = 0;
  let debutCycle = null;
  for (const b of tacheBadges) {
    if (b.type === 'TACHE_DEBUT' || b.type === 'TACHE_REPRISE') {
      debutCycle = new Date(b.timestamp);
    } else if ((b.type === 'TACHE_PAUSE' || b.type === 'TACHE_FIN') && debutCycle) {
      total += new Date(b.timestamp) - debutCycle;
      debutCycle = null;
    }
    if (b.id === badge.id) break; // ne compter que jusqu'à ce badge
  }
  return formatDuration(total);
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function BadgeagesTab({ chantierId, chantier }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'MANAGER';

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
      // Détecter si présence en cours (basé sur les badges de l'utilisateur courant)
      const myPresenceBadges = [...list]
        .filter(b => (b.type === 'PRESENCE_DEBUT' || b.type === 'PRESENCE_FIN') && b.employe?.user?.id === user?.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const lastPresence = myPresenceBadges[0];
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
  }, [chantierId, filters, user?.id]);

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
    } else if (dist > rayon * 2 && isEnCours && activePresenceBadge?.methode !== 'MANUEL') {
      // Ne pas auto-sortir si l'arrivée a été saisie manuellement (GPS imprécis)
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

    const hourInterval = setInterval(() => setWithinHours(isWithinBadgingHours()), 60000);

    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, precision: Math.round(pos.coords.accuracy) });
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

  // ── Calcul des tâches actives/pausées ─────────────────────────────────────

  // Dernière action tâche par employé (id → badge)
  const lastTacheBadgeByEmployee = useMemo(() => {
    const byEmployee = {};
    [...badgeages]
      .filter(b => b.type.startsWith('TACHE_'))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .forEach(b => {
        const eId = b.employe?.user?.id;
        if (eId && !byEmployee[eId]) byEmployee[eId] = b;
      });
    return byEmployee;
  }, [badgeages]);

  // Ma tâche active (DEBUT ou REPRISE)
  const myActiveTacheBadge = useMemo(() => {
    const last = lastTacheBadgeByEmployee[user?.id];
    if (!last) return null;
    return (last.type === 'TACHE_DEBUT' || last.type === 'TACHE_REPRISE') ? last : null;
  }, [lastTacheBadgeByEmployee, user?.id]);

  // Ma tâche en pause
  const myPausedTacheBadge = useMemo(() => {
    const last = lastTacheBadgeByEmployee[user?.id];
    if (!last) return null;
    return last.type === 'TACHE_PAUSE' ? last : null;
  }, [lastTacheBadgeByEmployee, user?.id]);

  // Présence active de l'utilisateur courant
  const activePresenceBadge = useMemo(() => {
    if (!isEnCours || !heureDebut) return null;
    return badgeages.find(b => b.type === 'PRESENCE_DEBUT' && b.timestamp === heureDebut && b.employe?.user?.id === user?.id) || null;
  }, [isEnCours, heureDebut, badgeages, user?.id]);

  // Toutes les tâches actives ou en pause (pour vue admin)
  const allActiveTachesByEmployee = useMemo(() => {
    if (!isAdmin) return [];
    return Object.values(lastTacheBadgeByEmployee).filter(
      b => b.type === 'TACHE_DEBUT' || b.type === 'TACHE_REPRISE' || b.type === 'TACHE_PAUSE'
    );
  }, [isAdmin, lastTacheBadgeByEmployee]);

  // ── Handlers modal ────────────────────────────────────────────────────────

  const closeModal = () => {
    setShowModal(false);
    setModalStep('action');
    setNewTacheName('');
  };

  const submitBadge = async (type, tacheId = null) => {
    // Bloquer le départ si une tâche est en cours
    if (type === 'PRESENCE_FIN' && myActiveTacheBadge) {
      toast.error('Terminez ou mettez en pause votre tâche avant de quitter le chantier');
      return;
    }
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

  // Admin : agir sur le badge d'un autre employé
  const adminSubmitBadge = async (type, employeId, tacheId = null) => {
    setSubmitting(true);
    try {
      await badgeageService.adminCreateBadgeage(chantierId, {
        type,
        employe_id: employeId,
        tache_id: tacheId || '',
        latitude: position?.latitude?.toFixed(6) || '',
        longitude: position?.longitude?.toFixed(6) || '',
        precision_metres: position?.precision || ''
      });
      const labels = {
        PRESENCE_FIN: 'Départ enregistré',
        TACHE_PAUSE: 'Pause enregistrée',
        TACHE_FIN: 'Fin de tâche enregistrée',
        TACHE_REPRISE: 'Reprise enregistrée',
      };
      toast.success(labels[type] || 'Badgeage enregistré');
      await loadBadgeages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
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

        <div className={`flex items-center gap-1 font-medium ${isOnline ? 'text-green-700' : 'text-red-600'}`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </div>

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

        {!withinHours && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Hors horaires (7h-19h)
            </div>
          </>
        )}

        {/* Ma tâche active dans la barre */}
        {myActiveTacheBadge && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-medium">
                ▶ {myActiveTacheBadge.tache?.nom || 'Tâche en cours'}
              </span>
              <button onClick={() => submitBadge('TACHE_PAUSE', myActiveTacheBadge.tache?.id || myActiveTacheBadge.tache_id)} disabled={submitting}
                className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 disabled:opacity-50">
                <PauseCircle className="w-3 h-3" /> Pause
              </button>
              <button onClick={() => submitBadge('TACHE_FIN', myActiveTacheBadge.tache?.id || myActiveTacheBadge.tache_id)} disabled={submitting}
                className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 disabled:opacity-50">
                <StopCircle className="w-3 h-3" /> Fin
              </button>
            </div>
          </>
        )}

        {/* Ma tâche en pause dans la barre */}
        {myPausedTacheBadge && !myActiveTacheBadge && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-medium">
                ⏸ {myPausedTacheBadge.tache?.nom || 'Tâche en pause'}
              </span>
              <button onClick={() => submitBadge('TACHE_REPRISE', myPausedTacheBadge.tache?.id || myPausedTacheBadge.tache_id)} disabled={submitting}
                className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 disabled:opacity-50">
                <PlayCircle className="w-3 h-3" /> Reprendre
              </button>
              <button onClick={() => submitBadge('TACHE_FIN', myPausedTacheBadge.tache?.id || myPausedTacheBadge.tache_id)} disabled={submitting}
                className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 disabled:opacity-50">
                <StopCircle className="w-3 h-3" /> Terminer
              </button>
            </div>
          </>
        )}
      </div>

      {/* ─── Vue admin : toutes les tâches actives ─── */}
      {isAdmin && allActiveTachesByEmployee.length > 0 && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Tâches en cours — tous les employés ({allActiveTachesByEmployee.length})
          </h3>
          <div className="space-y-2">
            {allActiveTachesByEmployee.map(badge => {
              const isThisMyBadge = badge.employe?.user?.id === user?.id;
              const isPaused = badge.type === 'TACHE_PAUSE';
              const employeId = badge.employe?.id;
              const tacheId = badge.tache?.id || badge.tache_id;
              return (
                <div key={badge.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`text-lg ${isPaused ? 'text-orange-500' : 'text-blue-600'}`}>
                      {isPaused ? '⏸' : '▶'}
                    </span>
                    <span className="font-medium text-gray-800">{badge.tache?.nom || 'Tâche'}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-600">
                      {badge.employe?.user?.prenom} {badge.employe?.user?.nom}
                    </span>
                    {isPaused && (
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">En pause</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isPaused ? (
                      <>
                        <button
                          onClick={() => isThisMyBadge
                            ? submitBadge('TACHE_REPRISE', tacheId)
                            : adminSubmitBadge('TACHE_REPRISE', employeId, tacheId)
                          }
                          disabled={submitting}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 disabled:opacity-50">
                          <PlayCircle className="w-3 h-3" /> Reprendre
                        </button>
                        <button
                          onClick={() => isThisMyBadge
                            ? submitBadge('TACHE_FIN', tacheId)
                            : adminSubmitBadge('TACHE_FIN', employeId, tacheId)
                          }
                          disabled={submitting}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50">
                          <StopCircle className="w-3 h-3" /> Terminer
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => isThisMyBadge
                            ? submitBadge('TACHE_PAUSE', tacheId)
                            : adminSubmitBadge('TACHE_PAUSE', employeId, tacheId)
                          }
                          disabled={submitting}
                          className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 disabled:opacity-50">
                          <PauseCircle className="w-3 h-3" /> Pause
                        </button>
                        <button
                          onClick={() => isThisMyBadge
                            ? submitBadge('TACHE_FIN', tacheId)
                            : adminSubmitBadge('TACHE_FIN', employeId, tacheId)
                          }
                          disabled={submitting}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50">
                          <StopCircle className="w-3 h-3" /> Terminer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  const badgeUserId = badge.employe?.user?.id;
                  const isMyBadge = badgeUserId === user?.id;
                  // Déterminer si ce badge est "actif" pour cet employé
                  const lastForThisEmployee = lastTacheBadgeByEmployee[badgeUserId];
                  const isActiveTache = badge.type.startsWith('TACHE_') && lastForThisEmployee?.id === badge.id
                    && (badge.type === 'TACHE_DEBUT' || badge.type === 'TACHE_REPRISE');
                  const isPausedTache = badge.type === 'TACHE_PAUSE' && lastForThisEmployee?.id === badge.id;
                  const isActivePresence = activePresenceBadge?.id === badge.id;

                  const presenceDuration = computePresenceDuration(badge, badgeages);
                  const tacheDuration = computeTacheDuration(badge, badgeages);

                  // Inline actions visibles : pour mes badges OU admin sur n'importe quel badge
                  const canActOnTache = isActiveTache && (isMyBadge || isAdmin);
                  const canActOnPause = isPausedTache && (isMyBadge || isAdmin);
                  const canActOnPresence = isActivePresence && isMyBadge;

                  return (
                    <div key={badge.id} className={`bg-white border rounded-lg p-4 transition-colors ${
                      isActiveTache ? 'border-blue-300 bg-blue-50'
                      : isPausedTache ? 'border-orange-300 bg-orange-50'
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
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 animate-pulse">En cours</span>
                            )}
                            {isPausedTache && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">En pause</span>
                            )}
                            {isActivePresence && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 animate-pulse">En cours</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(badge.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {presenceDuration && (
                              <div className="flex items-center gap-1 font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                <Clock className="w-3 h-3" />
                                {presenceDuration} sur chantier
                              </div>
                            )}
                            {tacheDuration && (
                              <div className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                                <Clock className="w-3 h-3" />
                                {tacheDuration} de travail
                              </div>
                            )}
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

                          {/* Action inline : quitter le chantier */}
                          {canActOnPresence && (
                            <div className="flex items-center gap-2 mt-3">
                              {myActiveTacheBadge ? (
                                <span className="text-xs text-red-600 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Terminez votre tâche avant de quitter
                                </span>
                              ) : (
                                <button onClick={() => submitBadge('PRESENCE_FIN')} disabled={submitting}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50">
                                  <LogOut className="w-3.5 h-3.5" /> Quitter le chantier
                                </button>
                              )}
                            </div>
                          )}

                          {/* Actions inline : tâche active */}
                          {canActOnTache && (
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                onClick={() => isMyBadge
                                  ? submitBadge('TACHE_PAUSE', badge.tache?.id || badge.tache_id)
                                  : adminSubmitBadge('TACHE_PAUSE', badge.employe?.id, badge.tache?.id || badge.tache_id)
                                }
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 disabled:opacity-50">
                                <PauseCircle className="w-3.5 h-3.5" /> Mettre en pause
                              </button>
                              <button
                                onClick={() => isMyBadge
                                  ? submitBadge('TACHE_FIN', badge.tache?.id || badge.tache_id)
                                  : adminSubmitBadge('TACHE_FIN', badge.employe?.id, badge.tache?.id || badge.tache_id)
                                }
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 disabled:opacity-50">
                                <StopCircle className="w-3.5 h-3.5" /> Terminer la tâche
                              </button>
                            </div>
                          )}

                          {/* Actions inline : tâche en pause */}
                          {canActOnPause && (
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                onClick={() => isMyBadge
                                  ? submitBadge('TACHE_REPRISE', badge.tache?.id || badge.tache_id)
                                  : adminSubmitBadge('TACHE_REPRISE', badge.employe?.id, badge.tache?.id || badge.tache_id)
                                }
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 disabled:opacity-50">
                                <PlayCircle className="w-3.5 h-3.5" /> Reprendre
                              </button>
                              <button
                                onClick={() => isMyBadge
                                  ? submitBadge('TACHE_FIN', badge.tache?.id || badge.tache_id)
                                  : adminSubmitBadge('TACHE_FIN', badge.employe?.id, badge.tache?.id || badge.tache_id)
                                }
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 disabled:opacity-50">
                                <StopCircle className="w-3.5 h-3.5" /> Terminer
                              </button>
                            </div>
                          )}

                          {/* Bouton supprimer - MANAGER/COMPANY_ADMIN uniquement */}
                          {isAdmin && (
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={async () => {
                                  if (!confirm('Supprimer ce badgeage ?')) return;
                                  try {
                                    await badgeageService.deleteBadgeage(chantierId, badge.id);
                                    toast.success('Badgeage supprimé');
                                    loadBadgeages();
                                  } catch {
                                    toast.error('Erreur lors de la suppression');
                                  }
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs transition-colors"
                                title="Supprimer ce badgeage"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Supprimer
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

            {modalStep === 'action' && (
              <div className="space-y-3">
                {/* Arrivée */}
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
                  disabled={!isEnCours || myActiveTacheBadge || submitting}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <span className="text-2xl">▶</span>
                  <div>
                    <p className="font-semibold text-blue-800">Début d'une tâche</p>
                    {!isEnCours && <p className="text-xs text-blue-600 mt-0.5">Nécessite une arrivée préalable</p>}
                    {myActiveTacheBadge && <p className="text-xs text-orange-600 mt-0.5">Une tâche est déjà en cours — terminez-la d'abord</p>}
                  </div>
                </button>

                {/* Reprendre une tâche en pause */}
                {myPausedTacheBadge && !myActiveTacheBadge && (
                  <button
                    onClick={() => submitBadge('TACHE_REPRISE', myPausedTacheBadge.tache?.id || myPausedTacheBadge.tache_id)}
                    disabled={submitting}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
                  >
                    <span className="text-2xl">▶</span>
                    <div>
                      <p className="font-semibold text-orange-800">
                        Reprendre : {myPausedTacheBadge.tache?.nom || 'Tâche en pause'}
                      </p>
                      <p className="text-xs text-orange-600 mt-0.5">Tâche actuellement en pause</p>
                    </div>
                  </button>
                )}

                {submitting && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…
                  </div>
                )}
              </div>
            )}

            {modalStep === 'tache' && (
              <div className="space-y-3">
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
