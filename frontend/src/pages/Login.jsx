import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';

import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const data = await login(formData.email, formData.password);
      toast.success('Connexion réussie !');
      if (data.user?.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(error || 'Erreur de connexion');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg p-2">
            <img src="/Logo_Autobat.png" alt="Autobat" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white">Autobat</h1>
          <p className="text-primary-100 mt-2">Gestion BTP intelligente</p>
        </div>

        {/* Formulaire */}
        <div className="card">
          <div className="card-body p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Connexion
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
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
                <label htmlFor="password" className="label">
                  Mot de passe
                </label>
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Se souvenir de moi</span>
                </label>
                <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-primary-100 text-sm space-y-2">
          <p>© 2026 Autobat. Tous droits réservés.</p>
          <div className="flex justify-center gap-4 text-xs">
            <Link to="/cgu" className="hover:text-white underline">CGU</Link>
            <span>·</span>
            <Link to="/mentions-legales" className="hover:text-white underline">Mentions légales</Link>
            <span>·</span>
            <Link to="/confidentialite" className="hover:text-white underline">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
