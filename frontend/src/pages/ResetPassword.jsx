import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ new_password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = formData.new_password && formData.new_password === formData.confirm_password;
  const passwordsNoMatch = formData.confirm_password && formData.new_password !== formData.confirm_password;

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="card-body p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide</h2>
              <p className="text-gray-600 mb-6">Ce lien de réinitialisation est invalide ou a expiré.</p>
              <Link to="/forgot-password" className="btn btn-primary w-full">
                Faire une nouvelle demande
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: formData.new_password
      });
      toast.success('Mot de passe réinitialisé ! Vous pouvez vous connecter.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || 'Lien invalide ou expiré.';
      toast.error(msg);
      if (msg.includes('expiré') || msg.includes('invalide')) {
        setTimeout(() => navigate('/forgot-password'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <KeyRound className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Autobat</h1>
          <p className="text-primary-100 mt-2">Nouveau mot de passe</p>
        </div>

        <div className="card">
          <div className="card-body p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Choisir un nouveau mot de passe
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              12 caractères min. · majuscule · chiffre · caractère spécial
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    className="input pr-10"
                    placeholder="••••••••••••"
                    minLength="12"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className={`input pr-10 ${passwordsNoMatch ? 'border-red-500 focus:ring-red-500' : ''} ${passwordsMatch ? 'border-green-500 focus:ring-green-500' : ''}`}
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordsNoMatch && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-green-600 mt-1">Les mots de passe correspondent ✓</p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full flex items-center justify-center"
                disabled={loading || !passwordsMatch}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Réinitialisation...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5 mr-2" />
                    Réinitialiser le mot de passe
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center text-primary-100 text-sm">
          <p>© 2026 Autobat. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
