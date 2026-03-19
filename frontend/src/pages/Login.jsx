import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Loader2, HardHat, FileText, BarChart2, Users, ArrowRight } from 'lucide-react';

import useAuthStore from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      const data = await login(formData.email, formData.password);
      toast.success('Connexion réussie !');
      if (data.user?.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else if (data.tenant?.statut === 'PENDING') {
        const response = await api.post('/stripe/create-subscription-checkout');
        window.location.href = response.data.url;
      } else {
        navigate('/dashboard');
      }
    } catch {
      toast.error(error || 'Erreur de connexion');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col">

      {/* NAV */}
      <nav className="bg-white shadow-sm border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link to="/">
          <img src="/images/Logo-Atuobat.png" alt="Autobat" className="h-9 w-auto" />
        </Link>
        <Link
          to="/register"
          className="bg-secondary-500 hover:bg-secondary-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
        >
          Essai gratuit →
        </Link>
      </nav>

      <div className="flex flex-1">

        {/* ── Panneau gauche (desktop) ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[420px] xl:w-[460px] flex-shrink-0 p-10"
          style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0d1f35 50%, #10264d 100%)' }}
        >
          <div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
              Bon retour<br />
              <span className="text-secondary-400">sur Autobat.</span>
            </h2>
            <p className="text-blue-100/60 text-base leading-relaxed mb-10">
              Gérez vos chantiers, devis et équipes depuis un seul outil pensé pour le BTP.
            </p>

            <ul className="space-y-4">
              {[
                { icon: <HardHat className="w-5 h-5 text-secondary-400" />, text: 'Badgeage GPS automatique, même hors réseau' },
                { icon: <FileText className="w-5 h-5 text-secondary-400" />, text: 'Devis PDF & catalogue auto-apprenant' },
                { icon: <BarChart2 className="w-5 h-5 text-secondary-400" />, text: 'Pilotage des marges en temps réel' },
                { icon: <Users className="w-5 h-5 text-secondary-400" />, text: 'Gestion complète de vos équipes' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <span className="text-blue-100/80 text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white/50 text-xs mb-3">Pas encore client ?</p>
            <p className="text-white font-semibold text-sm mb-4">
              7 jours d'essai gratuit — aucun débit avant la fin de la période.
            </p>
            <Link
              to="/register"
              className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors w-full justify-center"
            >
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Formulaire ── */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <h2 className="text-2xl font-bold text-primary-600 mb-1">Connexion</h2>
              <p className="text-gray-500 text-sm">Bienvenue sur Autobat</p>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Se connecter</h2>
              <p className="text-gray-500 mt-1 text-sm">Accédez à votre espace de gestion</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="label !mb-0">Mot de passe</label>
                  <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-secondary-500 hover:bg-secondary-600 disabled:opacity-60 text-white font-bold px-6 py-4 rounded-xl text-base transition-all shadow-lg hover:shadow-xl mt-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Connexion...</>
                ) : (
                  <><LogIn className="w-5 h-5" />Se connecter</>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Essai gratuit 7 jours →
              </Link>
            </p>

            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
              <Link to="/cgu" className="hover:text-gray-600 transition-colors">CGU</Link>
              <Link to="/cgv" className="hover:text-gray-600 transition-colors">CGV</Link>
              <Link to="/mentions-legales" className="hover:text-gray-600 transition-colors">Mentions légales</Link>
              <Link to="/confidentialite" className="hover:text-gray-600 transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
