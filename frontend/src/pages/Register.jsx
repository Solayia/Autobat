import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loading, error, clearError } = useAuthStore();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [stripeCancelled, setStripeCancelled] = useState(false);

  useEffect(() => {
    if (searchParams.get('stripe_cancel') === '1') {
      setStripeCancelled(true);
    }
  }, []);
  const [formData, setFormData] = useState({
    // Entreprise
    entreprise_nom: '',
    entreprise_siret: '',
    entreprise_adresse: '',
    entreprise_code_postal: '',
    entreprise_ville: '',
    entreprise_telephone: '',
    entreprise_email: '',
    // User
    prenom: '',
    nom: '',
    email: '',
    password: '',
    password_confirm: '',
    telephone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Validation
    if (!acceptCGU) {
      toast.error('Vous devez accepter les CGU et la Politique de confidentialité');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères');
      return;
    }

    try {
      const { password_confirm, ...registerData } = formData;
      await register(registerData);
      // Rediriger vers Stripe Checkout pour l'abonnement (trial 7j)
      setStripeLoading(true);
      const response = await api.post('/stripe/create-subscription-checkout');
      window.location.href = response.data.url;
    } catch (err) {
      setStripeLoading(false);
      toast.error(error || "Erreur lors de l'inscription");
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
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Autobat</h1>
          <p className="text-primary-100 mt-2">Créez votre compte entreprise</p>
        </div>

        {/* Formulaire */}
        <div className="card">
          <div className="card-body p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Inscription
            </h2>

            {stripeCancelled && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  Vous avez annulé le paiement. Votre compte a été créé mais votre abonnement n'est pas encore actif.
                  Complétez votre inscription en cliquant sur "Créer mon compte" pour activer votre essai gratuit.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations entreprise */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Informations entreprise
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="entreprise_nom" className="label">
                      Nom de l'entreprise *
                    </label>
                    <input
                      id="entreprise_nom"
                      type="text"
                      name="entreprise_nom"
                      value={formData.entreprise_nom}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="entreprise_siret" className="label">
                      SIRET *
                    </label>
                    <input
                      id="entreprise_siret"
                      type="text"
                      name="entreprise_siret"
                      value={formData.entreprise_siret}
                      onChange={handleChange}
                      className="input"
                      placeholder="14 chiffres"
                      maxLength="14"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="entreprise_telephone" className="label">
                      Téléphone *
                    </label>
                    <input
                      id="entreprise_telephone"
                      type="tel"
                      name="entreprise_telephone"
                      value={formData.entreprise_telephone}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="entreprise_adresse" className="label">
                      Adresse *
                    </label>
                    <input
                      id="entreprise_adresse"
                      type="text"
                      name="entreprise_adresse"
                      value={formData.entreprise_adresse}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="entreprise_code_postal" className="label">
                      Code postal *
                    </label>
                    <input
                      id="entreprise_code_postal"
                      type="text"
                      name="entreprise_code_postal"
                      value={formData.entreprise_code_postal}
                      onChange={handleChange}
                      className="input"
                      maxLength="5"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="entreprise_ville" className="label">
                      Ville *
                    </label>
                    <input
                      id="entreprise_ville"
                      type="text"
                      name="entreprise_ville"
                      value={formData.entreprise_ville}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="entreprise_email" className="label">
                      Email entreprise *
                    </label>
                    <input
                      id="entreprise_email"
                      type="email"
                      name="entreprise_email"
                      value={formData.entreprise_email}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Informations administrateur */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Votre compte administrateur
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prenom" className="label">
                      Prénom *
                    </label>
                    <input
                      id="prenom"
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="nom" className="label">
                      Nom *
                    </label>
                    <input
                      id="nom"
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="label">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="telephone" className="label">
                      Téléphone
                    </label>
                    <input
                      id="telephone"
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="label">
                      Mot de passe *
                    </label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input"
                      placeholder="Min. 8 caractères"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password_confirm" className="label">
                      Confirmer le mot de passe *
                    </label>
                    <input
                      id="password_confirm"
                      type="password"
                      name="password_confirm"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Case à cocher CGU — obligatoire */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  id="accept_cgu"
                  type="checkbox"
                  checked={acceptCGU}
                  onChange={(e) => setAcceptCGU(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="accept_cgu" className="text-sm text-gray-600 cursor-pointer">
                  J'ai lu et j'accepte les{' '}
                  <Link to="/cgu" target="_blank" className="text-primary-600 hover:text-primary-700 font-medium underline">
                    Conditions Générales d'Utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link to="/confidentialite" target="_blank" className="text-primary-600 hover:text-primary-700 font-medium underline">
                    Politique de confidentialité
                  </Link>{' '}
                  d'Autobat. *
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full flex items-center justify-center"
                disabled={loading || stripeLoading || !acceptCGU}
              >
                {stripeLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Redirection vers le paiement...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Créer mon compte — Essai gratuit 7 jours
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer légal */}
        <div className="mt-6 text-center text-primary-100 text-xs space-x-4">
          <Link to="/cgu" className="hover:text-white underline">CGU</Link>
          <span>·</span>
          <Link to="/mentions-legales" className="hover:text-white underline">Mentions légales</Link>
          <span>·</span>
          <Link to="/confidentialite" className="hover:text-white underline">Confidentialité</Link>
        </div>
      </div>
    </div>
  );
}
