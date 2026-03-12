import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, Users, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import chantierService from '../services/chantierService';
import employeService from '../services/employeService';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const STATUT_CONFIG = {
  PLANIFIE: { label: 'Planifié',  border: 'border-l-blue-500',  bg: 'bg-blue-50',   text: 'text-blue-800',  dot: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-700' },
  EN_COURS: { label: 'En cours',  border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  TERMINE:  { label: 'Terminé',   border: 'border-l-gray-400',  bg: 'bg-gray-50',   text: 'text-gray-600',  dot: 'bg-gray-400',  badge: 'bg-gray-100 text-gray-600' },
  ANNULE:   { label: 'Annulé',    border: 'border-l-red-400',   bg: 'bg-red-50',    text: 'text-red-700',   dot: 'bg-red-400',   badge: 'bg-red-100 text-red-700' },
};

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
];

function getAvatarGradient(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(d) { return isSameDay(d, new Date()); }

function dateInRange(day, debut, fin) {
  if (!debut) return false;
  const d = new Date(day); d.setHours(12, 0, 0, 0);
  const start = new Date(debut); start.setHours(0, 0, 0, 0);
  const end = fin ? new Date(fin) : new Date(debut);
  end.setHours(23, 59, 59, 0);
  return d >= start && d <= end;
}

function formatWeekRange(monday) {
  const saturday = addDays(monday, 5);
  const opts = { day: 'numeric', month: 'short' };
  return `${monday.toLocaleDateString('fr-FR', opts)} – ${saturday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function formatMonthYear(date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function Planning() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employes, setEmployes] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [viewMode, setViewMode] = useState('semaine');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employesData, chantiersData] = await Promise.all([
        employeService.getEmployes(),
        chantierService.getChantiers({ limit: 200, page: 1 }),
      ]);
      setEmployes(employesData || []);
      setChantiers(chantiersData.data || []);
    } catch (err) {
      console.error('Erreur chargement planning:', err);
    } finally {
      setLoading(false);
    }
  };

  const days = viewMode === 'semaine'
    ? Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))
    : (() => {
        const firstDay = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
        const lastDay = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0);
        const result = [];
        for (let d = new Date(firstDay); d <= lastDay; d = addDays(d, 1)) {
          if (d.getDay() !== 0) result.push(new Date(d));
        }
        return result;
      })();

  const prevPeriod = () => {
    if (viewMode === 'semaine') setWeekStart(w => addDays(w, -7));
    else setWeekStart(w => new Date(w.getFullYear(), w.getMonth() - 1, 1));
  };
  const nextPeriod = () => {
    if (viewMode === 'semaine') setWeekStart(w => addDays(w, 7));
    else setWeekStart(w => new Date(w.getFullYear(), w.getMonth() + 1, 1));
  };
  const goToToday = () => setWeekStart(getMondayOfWeek(new Date()));

  const getChantiersForEmployeDay = (employe, day) =>
    chantiers.filter(c => {
      const isAssigned = c.employes_assignes?.some(a => a.employe?.id === employe.id);
      return isAssigned && dateInRange(day, c.date_debut, c.date_fin_prevue || c.date_fin_reelle);
    });

  const periodLabel = viewMode === 'semaine' ? formatWeekRange(weekStart) : formatMonthYear(weekStart);
  const chantiersActifs = chantiers.filter(c => c.statut === 'EN_COURS').length;
  const chantiersPlannifies = chantiers.filter(c => c.statut === 'PLANIFIE').length;
  const employesActifs = employes.filter(emp =>
    chantiers.some(c => c.statut === 'EN_COURS' && c.employes_assignes?.some(a => a.employe?.id === emp.id))
  ).length;

  const sansEmployes = chantiers.filter(
    c => c.statut !== 'TERMINE' && c.statut !== 'ANNULE' &&
      (!c.employes_assignes || c.employes_assignes.length === 0)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Chargement du planning…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-xl">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm ring-1 ring-white/20">
              <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Planning</h1>
              <p className="text-primary-100 text-sm mt-0.5 hidden sm:block">Emploi du temps des équipes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{chantiersActifs}</p>
              <p className="text-xs text-gray-500 leading-tight">En cours</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{chantiersPlannifies}</p>
              <p className="text-xs text-gray-500 leading-tight">Planifiés</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{employesActifs}</p>
              <p className="text-xs text-gray-500 leading-tight">Actifs</p>
            </div>
          </div>
        </div>

        {/* Barre de navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-3 sm:px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={prevPeriod}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-xl transition-colors border border-primary-200"
            >
              Aujourd'hui
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 hover:text-gray-900"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <span className="text-sm sm:text-base font-semibold text-gray-900 ml-1 capitalize hidden sm:inline">
              {periodLabel}
            </span>
            <span className="text-xs font-semibold text-gray-800 capitalize sm:hidden">
              {viewMode === 'semaine'
                ? `${weekStart.getDate()}/${weekStart.getMonth() + 1}`
                : formatMonthYear(weekStart)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Légende */}
            <div className="hidden lg:flex items-center gap-3">
              {Object.entries(STATUT_CONFIG).map(([statut, c]) => (
                <div key={statut} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                  {c.label}
                </div>
              ))}
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('semaine')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  viewMode === 'semaine'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setViewMode('mois')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  viewMode === 'mois'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Mois
              </button>
            </div>
          </div>
        </div>

        {/* Grille */}
        {employes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucun employé</h3>
            <p className="text-sm text-gray-500">Ajoutez des employés pour visualiser leur planning</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    {/* En-tête colonne employé */}
                    <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left w-44 min-w-[11rem]">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employé</span>
                    </th>
                    {days.map((day, i) => {
                      const today = isToday(day);
                      const dayIndex = day.getDay() === 0 ? 6 : day.getDay() - 1;
                      return (
                        <th
                          key={i}
                          className={`px-2 py-3 text-center border-b border-r border-gray-200 last:border-r-0 min-w-[7.5rem] ${
                            today ? 'bg-primary-50' : 'bg-gray-50'
                          }`}
                        >
                          <div className={`text-xs font-semibold uppercase tracking-wider ${today ? 'text-primary-600' : 'text-gray-500'}`}>
                            {viewMode === 'semaine' ? JOURS[dayIndex] : JOURS[dayIndex]}
                          </div>
                          <div className={`mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                            today
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'text-gray-800'
                          }`}>
                            {day.getDate()}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employes.map((employe, idx) => {
                    const name = `${employe.user?.prenom || ''} ${employe.user?.nom || ''}`.trim();
                    const initials = [employe.user?.prenom?.[0], employe.user?.nom?.[0]].filter(Boolean).join('').toUpperCase() || '?';
                    const gradient = getAvatarGradient(name || employe.id);
                    return (
                      <tr key={employe.id} className={`group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-primary-50/30 transition-colors`}>
                        {/* Cellule employé */}
                        <td className={`sticky left-0 z-10 px-4 py-3 border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} group-hover:bg-primary-50/30 transition-colors`}>
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{name || 'Employé'}</p>
                              {employe.poste && (
                                <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">{employe.poste}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cellules jours */}
                        {days.map((day, di) => {
                          const today = isToday(day);
                          const chantiersJour = getChantiersForEmployeDay(employe, day);
                          return (
                            <td
                              key={di}
                              className={`px-1.5 py-1.5 border-r border-gray-100 last:border-r-0 align-top min-w-[7.5rem] ${
                                today ? 'bg-primary-50/40' : ''
                              }`}
                            >
                              <div className="space-y-1">
                                {chantiersJour.map((c) => {
                                  const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG.PLANIFIE;
                                  return (
                                    <button
                                      key={c.id}
                                      onClick={() => navigate(`/chantiers/${c.id}`)}
                                      className={`w-full text-left text-xs px-2 py-1.5 rounded-lg border-l-4 ${cfg.border} ${cfg.bg} ${cfg.text} hover:brightness-95 transition-all shadow-sm`}
                                      title={`${c.nom}${c.client ? ` – ${c.client.nom}` : ''}`}
                                    >
                                      <p className="font-semibold truncate leading-tight">{c.nom}</p>
                                      {c.client && (
                                        <p className="text-xs opacity-60 truncate leading-tight mt-0.5">{c.client.nom}</p>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chantiers sans équipe */}
        {sansEmployes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Chantiers sans équipe assignée
              <span className="ml-1 px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs font-bold">
                {sansEmployes.length}
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {sansEmployes.map(c => {
                const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG.PLANIFIE;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/chantiers/${c.id}`)}
                    className={`text-left text-xs px-3 py-2.5 rounded-xl border-l-4 ${cfg.border} ${cfg.bg} ${cfg.text} hover:brightness-95 transition-all shadow-sm`}
                  >
                    <p className="font-semibold">{c.nom}</p>
                    {c.client && <p className="opacity-60 mt-0.5">{c.client.nom}</p>}
                    <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-xs ${cfg.badge}`}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
