import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building, MapPin, CheckSquare, Square, Clock,
  Calendar, ChevronRight, Hammer, AlertCircle
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../services/api';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function DashboardEmploye() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/employe');
      setData(response.data);
    } catch (error) {
      console.error('Erreur chargement dashboard employé:', error);
    } finally {
      setLoading(false);
    }
  };

  // Génère les 6 jours de la semaine (lundi → samedi)
  const getWeekDays = () => {
    if (!data) return [];
    const debut = new Date(data.semaine.debut);
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(debut);
      d.setDate(debut.getDate() + i);
      return d;
    });
  };

  const isToday = (date) => {
    const now = new Date();
    return date.toDateString() === now.toDateString();
  };

  // Retourne les chantiers actifs pour un jour donné
  const chantiersForDay = (day) => {
    if (!data) return [];
    return data.chantiers_semaine.filter((c) => {
      const debut = new Date(c.date_debut);
      debut.setHours(0, 0, 0, 0);
      const fin = c.date_fin_prevue ? new Date(c.date_fin_prevue) : null;
      if (fin) fin.setHours(23, 59, 59, 999);
      return day >= debut && (!fin || day <= fin);
    });
  };

  // Groupe les tâches par chantier
  const tachesParChantier = () => {
    if (!data) return [];
    const map = new Map();
    data.taches_assignees.forEach((t) => {
      const cid = t.chantier.id;
      if (!map.has(cid)) {
        map.set(cid, { chantier: t.chantier, taches: [] });
      }
      map.get(cid).taches.push(t);
    });
    return Array.from(map.values());
  };

  const badgeStatut = (statut) => {
    if (statut === 'EN_COURS') {
      return (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          En cours
        </span>
      );
    }
    return (
      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
        À faire
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const weekDays = getWeekDays();
  const groupedTaches = tachesParChantier();
  const today = new Date();
  const todayStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour, {user?.prenom} 👷
        </h1>
        <p className="text-gray-500 mt-1 capitalize">{todayStr}</p>
      </div>

      {/* Planning de la semaine */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Planning de la semaine</h2>
        </div>

        {weekDays.length === 0 ? (
          <p className="text-gray-500 text-center py-6">Données non disponibles</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {weekDays.map((day, i) => {
              const actifs = chantiersForDay(day);
              const today_ = isToday(day);
              return (
                <div
                  key={i}
                  className={`rounded-xl p-3 border-2 transition-all ${
                    today_
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="text-center mb-2">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${today_ ? 'text-blue-600' : 'text-gray-500'}`}>
                      {JOURS[i]}
                    </p>
                    <p className={`text-lg font-bold ${today_ ? 'text-blue-700' : 'text-gray-700'}`}>
                      {day.getDate()}
                    </p>
                    {today_ && (
                      <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                        Auj.
                      </span>
                    )}
                  </div>

                  {actifs.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center">—</p>
                  ) : (
                    <div className="space-y-1 mt-1">
                      {actifs.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => navigate(`/chantiers/${c.id}`)}
                          className="w-full text-left text-xs bg-white border border-blue-200 text-blue-700 rounded-lg px-2 py-1 hover:bg-blue-50 transition-colors truncate"
                          title={c.nom}
                        >
                          {c.nom}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {data?.chantiers_semaine.length === 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Aucun chantier assigné cette semaine
          </div>
        )}
      </div>

      {/* Tâches assignées */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Mes tâches
            {data?.taches_assignees?.length > 0 && (
              <span className="ml-2 text-sm font-normal bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                {data.taches_assignees.length}
              </span>
            )}
          </h2>
        </div>

        {groupedTaches.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Aucune tâche assignée en cours
          </div>
        ) : (
          <div className="space-y-5">
            {groupedTaches.map(({ chantier, taches }) => (
              <div key={chantier.id}>
                {/* Chantier header */}
                <button
                  onClick={() => navigate(`/chantiers/${chantier.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors mb-2 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-sm">{chantier.nom}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {chantier.adresse}, {chantier.ville}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>

                {/* Liste de tâches */}
                <div className="space-y-2 pl-2">
                  {taches.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-white transition-all"
                    >
                      {t.statut === 'EN_COURS' ? (
                        <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.nom}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.piece && (
                            <span className="text-xs text-gray-500">{t.piece}</span>
                          )}
                          {t.quantite_prevue && (
                            <span className="text-xs text-gray-400">
                              {t.quantite_prevue} {t.unite || ''}
                            </span>
                          )}
                        </div>
                      </div>
                      {badgeStatut(t.statut)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accès rapide chantiers */}
      {data?.chantiers_semaine.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.chantiers_semaine.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/chantiers/${c.id}`)}
              className="group flex items-center gap-4 p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <Hammer className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{c.nom}</p>
                <p className="text-sm text-gray-500 truncate">{c.client?.nom}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  {c.ville}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
