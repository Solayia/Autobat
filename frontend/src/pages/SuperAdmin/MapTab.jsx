import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';

const STATUT_COLORS = {
  ACTIF: '#22c55e',
  TRIAL: '#a855f7',
  SUSPENDU: '#ef4444',
  RESILIE: '#6b7280',
  PENDING: '#f59e0b',
};

const STATUT_LABELS = {
  ACTIF: 'Actif',
  TRIAL: 'Trial',
  SUSPENDU: 'Suspendu',
  RESILIE: 'Résilié',
  PENDING: 'En attente',
};

const CACHE_KEY = 'sa_geocode_cache_v1';

const loadCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
  catch { return {}; }
};

const saveCache = (cache) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
};

async function geocodeAddress(adresse, code_postal, ville) {
  const q = `${adresse}, ${code_postal} ${ville}, France`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
  const data = await res.json();
  if (data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  // Fallback: essayer juste le code postal + ville
  const q2 = `${code_postal} ${ville}, France`;
  const url2 = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q2)}`;
  const res2 = await fetch(url2, { headers: { 'Accept-Language': 'fr' } });
  const data2 = await res2.json();
  if (data2.length > 0) {
    return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };
  }
  return null;
}

export default function MapTab() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const cache = loadCache();

      try {
        const res = await api.get('/super-admin/tenants', { params: { limit: 500, page: 1 } });
        const tenants = res.data.tenants || [];

        if (cancelled) return;
        setProgress({ done: 0, total: tenants.length });

        const results = [];

        for (let i = 0; i < tenants.length; i++) {
          if (cancelled) break;
          const t = tenants[i];
          const cacheKey = `${t.adresse}|${t.code_postal}|${t.ville}`;

          let position;
          if (cache[cacheKey]) {
            position = cache[cacheKey];
          } else {
            try {
              position = await geocodeAddress(t.adresse, t.code_postal, t.ville);
              if (position) {
                cache[cacheKey] = position;
                saveCache(cache);
              }
              await new Promise(r => setTimeout(r, 350));
            } catch {
              position = null;
            }
          }

          if (position) {
            results.push({ ...t, lat: position.lat, lng: position.lng });
          }

          if (!cancelled) setProgress({ done: i + 1, total: tenants.length });
        }

        if (!cancelled) {
          setMarkers(results);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const statusCounts = markers.reduce((acc, m) => {
    acc[m.statut] = (acc[m.statut] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white">Carte des entreprises</h2>
          <p className="text-xs text-gray-400">
            {loading
              ? `Géocodage ${progress.done}/${progress.total}…`
              : `${markers.length} entreprise${markers.length > 1 ? 's' : ''} géolocalisée${markers.length > 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4">
          {Object.entries(statusCounts).map(([statut, count]) => (
            <div key={statut} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border-2 border-white/30"
                style={{ backgroundColor: STATUT_COLORS[statut] || '#6b7280' }}
              />
              <span className="text-xs text-gray-300">
                {STATUT_LABELS[statut] || statut} ({count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-800 relative">
        {loading && progress.total === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <p className="text-gray-400 text-sm">Chargement des entreprises…</p>
          </div>
        )}
        <MapContainer
          center={[46.5, 2.3]}
          zoom={6}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {markers.map(m => (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lng]}
              radius={10}
              fillColor={STATUT_COLORS[m.statut] || '#6b7280'}
              color="white"
              weight={2}
              fillOpacity={0.9}
            >
              <Popup>
                <div style={{ minWidth: '180px', fontFamily: 'Inter, sans-serif' }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{m.nom}</p>
                  <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>
                    {m.adresse}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>
                    {m.code_postal} {m.ville}
                  </p>
                  <p style={{ fontSize: '12px', marginBottom: '6px' }}>{m.email}</p>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'white',
                    backgroundColor: STATUT_COLORS[m.statut] || '#6b7280'
                  }}>
                    {STATUT_LABELS[m.statut] || m.statut}
                  </span>
                  {m._count && (
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                      {m._count.users} user{m._count.users > 1 ? 's' : ''} · {m._count.chantiers} chantier{m._count.chantiers > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
