import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, Users, Building, Clock } from 'lucide-react';
import chantierService from '../services/chantierService';
import employeService from '../services/employeService';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const JOURS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const STATUT_COLORS = {
  PLANIFIE: { bg: 'bg-blue-500', light: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
  EN_COURS: { bg: 'bg-green-500', light: 'bg-green-100 text-green-800 border-green-300', dot: 'bg-green-500' },
  TERMINE:  { bg: 'bg-gray-400',  light: 'bg-gray-100 text-gray-600 border-gray-300',  dot: 'bg-gray-400' },
  ANNULE:   { bg: 'bg-red-400',   light: 'bg-red-100 text-red-700 border-red-300',     dot: 'bg-red-400' },
};

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
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

function isToday(d) {
  return isSameDay(d, new Date());
}

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
  const startStr = monday.toLocaleDateString('fr-FR', opts);
  const endStr = saturday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startStr} – ${endStr}`;
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
  const [viewMode, setViewMode] = useState('semaine'); // 'semaine' | 'mois'

  useEffect(() => {
    loadData();
  }, []);

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

  // Jours affichés selon le mode
  const days = viewMode === 'semaine'
    ? Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))
    : (() => {
        // Mois entier du lundi de la semaine courante
        const firstDay = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
        const lastDay = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0);
        const result = [];
        for (let d = new Date(firstDay); d <= lastDay; d = addDays(d, 1)) {
          if (d.getDay() !== 0) result.push(new Date(d)); // skip dimanche
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

  // Pour un employé et un jour donné, retourne les chantiers actifs
  const getChantiersForEmployeDay = (employe, day) => {
    return chantiers.filter(c => {
      const isAssigned = c.employes_assignes?.some(a => a.employe?.id === employe.id);
      if (!isAssigned) return false;
      return dateInRange(day, c.date_debut, c.date_fin_prevue || c.date_fin_reelle);
    });
  };

  const periodLabel = viewMode === 'semaine'
    ? formatWeekRange(weekStart)
    : formatMonthYear(weekStart);

  // Statistiques rapides
  const chantiersActifs = chantiers.filter(c => c.statut === 'EN_COURS').length;
  const chantiersPlannifies = chantiers.filter(c => c.statut === 'PLANIFIE').length;
  const employesActifs = employes.filter(emp =>
    chantiers.some(c => c.statut === 'EN_COURS' && c.employes_assignes?.some(a => a.employe?.id === emp.id))
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-xl py-4 sm:py-5">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">Planning</h1>
                <p className="text-blue-100 mt-1 hidden sm:block">Emploi du temps des équipes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* KPIs rapides */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{chantiersActifs}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{chantiersPlannifies}</p>
              <p className="text-xs text-gray-500">Planifiés</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{employesActifs}</p>
              <p className="text-xs text-gray-500">Employés actifs</p>
            </div>
          </div>
        </div>

        {/* Barre de navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={prevPeriod}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm sm:text-base font-semibold text-gray-900 ml-1 capitalize">
              {periodLabel}
            </span>
          </div>

          {/* Toggle semaine/mois */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('semaine')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'semaine'
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('mois')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'mois'
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mois
            </button>
          </div>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 flex-wrap mb-4 px-1">
          {Object.entries(STATUT_COLORS).map(([statut, c]) => (
            <div key={statut} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className={`w-3 h-3 rounded-full ${c.dot}`} />
              {statut === 'PLANIFIE' ? 'Planifié' : statut === 'EN_COURS' ? 'En cours' : statut === 'TERMINE' ? 'Terminé' : 'Annulé'}
            </div>
          ))}
        </div>

        {/* Grille planning */}
        {employes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun employé</h3>
            <p className="text-gray-500">Ajoutez des employés pour visualiser leur planning</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-600 to-primary-800">
                    {/* Colonne employé */}
                    <th className="sticky left-0 z-10 bg-primary-700 px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-36 min-w-[9rem] border-r border-primary-500">
                      Employé
                    </th>
                    {days.map((day, i) => {
                      const today = isToday(day);
                      const label = viewMode === 'semaine'
                        ? JOURS[day.getDay() === 0 ? 6 : day.getDay() - 1]
                        : day.getDate();
                      return (
                        <th
                          key={i}
                          className={`px-2 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider min-w-[7rem] border-r border-primary-500 last:border-r-0 ${
                            today ? 'bg-white/20' : ''
                          }`}
                        >
                          <div>{label}</div>
                          {viewMode === 'semaine' && (
                            <div className={`text-xs font-normal mt-0.5 ${today ? 'text-yellow-300 font-bold' : 'text-blue-200'}`}>
                              {day.getDate()}/{day.getMonth() + 1}
                            </div>
                          )}
                          {viewMode === 'mois' && (
                            <div className="text-xs font-normal text-blue-200">
                              {JOURS[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employes.map((employe) => (
                    <tr key={employe.id} className="hover:bg-gray-50 transition-colors">
                      {/* Nom employé */}
                      <td className="sticky left-0 z-10 bg-white hover:bg-gray-50 px-4 py-2 border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                            {(employe.user?.prenom?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {employe.user?.prenom} {employe.user?.nom}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cellules par jour */}
                      {days.map((day, di) => {
                        const today = isToday(day);
                        const chantiersJour = getChantiersForEmployeDay(employe, day);
                        return (
                          <td
                            key={di}
                            className={`px-1 py-1.5 border-r border-gray-100 last:border-r-0 align-top min-w-[7rem] ${
                              today ? 'bg-yellow-50' : ''
                            }`}
                          >
                            {chantiersJour.map((c) => {
                              const colors = STATUT_COLORS[c.statut] || STATUT_COLORS.PLANIFIE;
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => navigate(`/chantiers/${c.id}`)}
                                  className={`text-xs px-2 py-1 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity mb-0.5 truncate ${colors.light}`}
                                  title={`${c.nom}${c.client ? ` – ${c.client.nom}` : ''}`}
                                >
                                  <span className="font-medium">{c.nom}</span>
                                  {c.client && (
                                    <span className="block text-xs opacity-70 truncate">{c.client.nom}</span>
                                  )}
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chantiers sans employés assignés */}
        {(() => {
          const sansEmployes = chantiers.filter(
            c => c.statut !== 'TERMINE' && c.statut !== 'ANNULE' &&
              (!c.employes_assignes || c.employes_assignes.length === 0)
          );
          if (sansEmployes.length === 0) return null;
          return (
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-orange-500" />
                Chantiers sans équipe assignée ({sansEmployes.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {sansEmployes.map(c => {
                  const colors = STATUT_COLORS[c.statut] || STATUT_COLORS.PLANIFIE;
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/chantiers/${c.id}`)}
                      className={`text-xs px-3 py-2 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${colors.light}`}
                    >
                      <p className="font-semibold">{c.nom}</p>
                      {c.client && <p className="opacity-70">{c.client.nom}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
