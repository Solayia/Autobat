import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { UserPlus, Loader2, CheckCircle, XCircle, CreditCard, ExternalLink } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loading, error, clearError, tenant, isAuthenticated, refreshUser } = useAuthStore();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeCancelled, setStripeCancelled] = useState(false);

  // Suivi ouverture + acceptation de chaque document
  const [docsOpened, setDocsOpened] = useState({ cgu: false, cgv: false, confidentialite: false });
  const [docsAccepted, setDocsAccepted] = useState({ cgu: false, cgv: false, confidentialite: false });
  const allAccepted = docsAccepted.cgu && docsAccepted.cgv && docsAccepted.confidentialite;

  const openDoc = (key, url) => {
    window.open(url, '_blank');
    setDocsOpened(prev => ({ ...prev, [key]: true }));
  };

  useEffect(() => {
    if (searchParams.get('stripe_cancel') === '1') {
      setStripeCancelled(true);
    }
  }, []);

  // Si l'user est déjà authentifié avec statut PENDING, afficher l'écran de relance paiement
  const isPendingUser = isAuthenticated && tenant?.statut === 'PENDING';

  // Quand on arrive sur Register avec un compte PENDING (ex: retour de Stripe après paiement),
  // vérifier si le webhook a mis à jour le statut → rediriger vers le dashboard si c'est le cas
  useEffect(() => {
    if (!isPendingUser) return;
    refreshUser().then(() => {
      const currentTenant = useAuthStore.getState().tenant;
      if (currentTenant?.statut && currentTenant.statut !== 'PENDING') {
        navigate('/dashboard');
      }
    });
  }, [isPendingUser]);

  const handleRelaunchStripe = async () => {
    setStripeLoading(true);
    try {
      const response = await api.post('/stripe/create-subscription-checkout');
      window.location.href = response.data.url;
    } catch (err) {
      setStripeLoading(false);
      toast.error('Erreur lors de la redirection vers le paiement');
    }
  };
  const [passwordError, setPasswordError] = useState('');

  const validatePasswordRules = (pwd) => {
    const rules = [
      { label: '12 caractères minimum', ok: pwd.length >= 12 },
      { label: 'Une majuscule', ok: /[A-Z]/.test(pwd) },
      { label: 'Une minuscule', ok: /[a-z]/.test(pwd) },
      { label: 'Un chiffre', ok: /[0-9]/.test(pwd) },
      { label: 'Un caractère spécial (!@#$%...)', ok: /[^A-Za-z0-9]/.test(pwd) }
    ];
    return rules;
  };

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
    if (!allAccepted) {
      toast.error('Vous devez lire et accepter les CGU, CGV et la Politique de confidentialité');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    const rules = validatePasswordRules(formData.password);
    const failedRules = rules.filter(r => !r.ok);
    if (failedRules.length > 0) {
      setPasswordError(`Mot de passe invalide : ${failedRules.map(r => r.label.toLowerCase()).join(', ')}`);
      return;
    }
    setPasswordError('');

    try {
      const { password_confirm, ...registerData } = formData;
      await register({ ...registerData, accept_cgu: true, accept_cgv: true });
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

  // Écran de relance paiement pour les comptes PENDING
  if (isPendingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
              <CreditCard className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">Autobat</h1>
            <p className="text-primary-100 mt-2">Finaliser votre abonnement</p>
          </div>
          <div className="card">
            <div className="card-body p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Votre compte est créé !
              </h2>
              <p className="text-gray-600 mb-6">
                Il ne vous reste plus qu'à activer votre essai gratuit de 7 jours en renseignant vos informations de paiement. Vous ne serez débité qu'à l'issue de la période d'essai.
              </p>
              <button
                onClick={handleRelaunchStripe}
                disabled={stripeLoading}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                {stripeLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Redirection...</>
                ) : (
                  <><CreditCard className="w-5 h-5 mr-2" />Activer mon essai gratuit 7 jours</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                      placeholder="Min. 12 caractères"
                      required
                    />
                    {/* Règles du mot de passe */}
                    <div className="mt-2 space-y-1">
                      {validatePasswordRules(formData.password).map((rule) => (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          {rule.ok ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          )}
                          <span className={`text-xs ${rule.ok ? 'text-green-600' : 'text-gray-400'}`}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    {passwordError && (
                      <p className="mt-1 text-xs text-red-600">{passwordError}</p>
                    )}
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

              {/* Documents légaux — lecture obligatoire avant acceptation */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Documents à lire et accepter *
                </p>
                {[
                  { key: 'cgu', label: 'Conditions Générales d\'Utilisation', url: '/cgu' },
                  { key: 'cgv', label: 'Conditions Générales de Vente', url: '/cgv' },
                  { key: 'confidentialite', label: 'Politique de confidentialité & RGPD', url: '/confidentialite' },
                ].map(({ key, label, url }) => (
                  <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${docsAccepted[key] ? 'bg-green-50 border-green-200' : docsOpened[key] ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    {/* Bouton ouvrir */}
                    <button
                      type="button"
                      onClick={() => openDoc(key, url)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-primary-400 transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Lire
                    </button>
                    {/* Label */}
                    <span className="text-sm text-gray-700 flex-1">{label}</span>
                    {/* Checkbox acceptation — désactivée tant que doc pas ouvert */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {docsAccepted[key] ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : !docsOpened[key] ? (
                        <span className="text-xs text-gray-400 italic">Lisez d'abord</span>
                      ) : null}
                      <input
                        type="checkbox"
                        id={`accept_${key}`}
                        checked={docsAccepted[key]}
                        disabled={!docsOpened[key]}
                        onChange={(e) => setDocsAccepted(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full flex items-center justify-center"
                disabled={loading || stripeLoading || !allAccepted}
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
