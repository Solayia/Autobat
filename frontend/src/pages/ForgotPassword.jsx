import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
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
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Autobat</h1>
          <p className="text-primary-100 mt-2">Réinitialisation du mot de passe</p>
        </div>

        <div className="card">
          <div className="card-body p-8">
            {sent ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Email envoyé !</h2>
                <p className="text-gray-600 mb-6">
                  Si ce compte existe, vous recevrez un lien de réinitialisation dans quelques minutes.
                  Vérifiez aussi vos spams.
                </p>
                <Link
                  to="/login"
                  className="btn btn-primary w-full flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Mot de passe oublié ?
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="label">
                      Adresse email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      placeholder="votre@email.com"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Envoyer le lien
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Retour à la connexion
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-primary-100 text-sm">
          <p>© 2026 Autobat. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
