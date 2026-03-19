import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Loader2, CheckCircle, XCircle, CreditCard, ExternalLink,
  ArrowRight, ArrowLeft, Shield, Lock, HardHat, Users, FileText, BarChart2,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loading, error, clearError, tenant, isAuthenticated, refreshUser } = useAuthStore();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeCancelled, setStripeCancelled] = useState(false);
  const [step, setStep] = useState(1);

  const [docsOpened, setDocsOpened] = useState({ cgu: false, cgv: false, confidentialite: false });
  const [docsAccepted, setDocsAccepted] = useState({ cgu: false, cgv: false, confidentialite: false });
  const allAccepted = docsAccepted.cgu && docsAccepted.cgv && docsAccepted.confidentialite;

  const openDoc = (key, url) => {
    window.open(url, '_blank');
    setDocsOpened(prev => ({ ...prev, [key]: true }));
  };

  useEffect(() => {
    if (searchParams.get('stripe_cancel') === '1') setStripeCancelled(true);
  }, []);

  const isPendingUser = isAuthenticated && tenant?.statut === 'PENDING';

  useEffect(() => {
    if (!isPendingUser) return;
    refreshUser().then(() => {
      const currentTenant = useAuthStore.getState().tenant;
      if (currentTenant?.statut && currentTenant.statut !== 'PENDING') navigate('/dashboard');
    });
  }, [isPendingUser]);

  const handleRelaunchStripe = async () => {
    setStripeLoading(true);
    try {
      const response = await api.post('/stripe/create-subscription-checkout');
      window.location.href = response.data.url;
    } catch {
      setStripeLoading(false);
      toast.error('Erreur lors de la redirection vers le paiement');
    }
  };

  const [passwordError, setPasswordError] = useState('');
  const validatePasswordRules = (pwd) => ([
    { label: '12 caractères minimum', ok: pwd.length >= 12 },
    { label: 'Une majuscule', ok: /[A-Z]/.test(pwd) },
    { label: 'Une minuscule', ok: /[a-z]/.test(pwd) },
    { label: 'Un chiffre', ok: /[0-9]/.test(pwd) },
    { label: 'Un caractère spécial (!@#$%...)', ok: /[^A-Za-z0-9]/.test(pwd) },
  ]);

  const [formData, setFormData] = useState({
    entreprise_nom: '', entreprise_siret: '', entreprise_adresse: '',
    entreprise_code_postal: '', entreprise_ville: '', entreprise_telephone: '',
    entreprise_email: '', prenom: '', nom: '', email: '',
    password: '', password_confirm: '', telephone: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleStep1Next = (e) => {
    e.preventDefault();
    const { entreprise_nom, entreprise_siret, entreprise_telephone, entreprise_adresse, entreprise_code_postal, entreprise_ville, entreprise_email } = formData;
    if (!entreprise_nom || !entreprise_siret || !entreprise_telephone || !entreprise_adresse || !entreprise_code_postal || !entreprise_ville || !entreprise_email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
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
      setStripeLoading(true);
      const response = await api.post('/stripe/create-subscription-checkout');
      window.location.href = response.data.url;
    } catch {
      setStripeLoading(false);
      toast.error(error || "Erreur lors de l'inscription");
    }
  };

  // ── Écran PENDING ──────────────────────────────────────────────────────────
  if (isPendingUser) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1f35 60%, #0f2847 100%)' }}>
        <nav className="bg-white/5 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <Link to="/"><img src="/images/Logo-Atuobat.png" alt="Autobat" className="h-8 w-auto" /></Link>
          <Link to="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">Se connecter</Link>
        </nav>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-500/20 border border-secondary-500/30 rounded-2xl mb-6">
                <CreditCard className="w-8 h-8 text-secondary-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Votre compte est créé !</h1>
              <p className="text-blue-100/60 mb-8 leading-relaxed">
                Activez votre essai gratuit de 7 jours en renseignant vos informations de paiement. Vous ne serez débité qu'à l'issue de la période d'essai.
              </p>
              <button
                onClick={handleRelaunchStripe}
                disabled={stripeLoading}
                className="w-full flex items-center justify-center gap-2 bg-secondary-500 hover:bg-secondary-600 disabled:opacity-60 text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg"
              >
                {stripeLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Redirection...</> : <><CreditCard className="w-5 h-5" />Activer mon essai gratuit 7 jours</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Stepper indicator ──────────────────────────────────────────────────────
  const Stepper = () => (
    <div className="flex items-center gap-3 mb-8">
      {[
        { n: 1, label: 'Votre entreprise' },
        { n: 2, label: 'Votre compte' },
      ].map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-3">
          {i > 0 && (
            <div className={`h-px flex-1 w-10 transition-colors ${step > 1 ? 'bg-secondary-400' : 'bg-gray-200'}`} />
          )}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step === n
                ? 'bg-secondary-500 text-white shadow-md'
                : step > n
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {step > n ? <CheckCircle className="w-4 h-4" /> : n}
            </div>
            <span className={`text-sm font-medium transition-colors ${step === n ? 'text-gray-900' : step > n ? 'text-green-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Page principale ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col">

      {/* NAV */}
      <nav className="bg-white shadow-sm border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link to="/"><img src="/images/Logo-Atuobat.png" alt="Autobat" className="h-9 w-auto" /></Link>
        <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium text-sm transition-colors">
          Déjà un compte ? Se connecter
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
              Maîtrisez votre temps.<br />
              <span className="text-secondary-400">Gagnez plus.</span>
            </h2>
            <p className="text-blue-100/60 text-base leading-relaxed mb-10">
              Autobat connecte le terrain, le bureau et le pilotage dans un seul outil pensé pour le BTP.
            </p>

            <ul className="space-y-4 mb-10">
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

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
              <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">Tarification simple</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold text-white">100€</span>
                <span className="text-white/50 text-sm mb-1">/mois HT</span>
              </div>
              <p className="text-blue-100/50 text-xs mb-4">pour le compte gérant</p>
              <div className="flex items-center gap-2 text-sm text-blue-100/70">
                <span className="bg-secondary-500/20 border border-secondary-500/30 text-secondary-300 text-xs font-semibold px-2.5 py-1 rounded-lg">+20€/mois</span>
                <span>par employé supplémentaire</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { icon: <Shield className="w-4 h-4 text-green-400" />, text: 'SSL sécurisé · Données hébergées en France' },
              { icon: <Lock className="w-4 h-4 text-green-400" />, text: 'Sans engagement · Résiliable à tout moment' },
              { icon: <CreditCard className="w-4 h-4 text-green-400" />, text: "7 jours gratuits · Aucun débit avant la fin d'essai" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-blue-100/50 text-xs">
                {icon}<span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Formulaire ── */}
        <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 sm:px-8 overflow-auto">
          <div className="w-full max-w-2xl">

            {/* Mobile heading */}
            <div className="lg:hidden text-center mb-6">
              <h2 className="text-2xl font-bold text-primary-600 mb-1">Créez votre compte</h2>
              <p className="text-gray-500 text-sm">7 jours gratuits · Sans engagement</p>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Créer votre compte entreprise</h2>
              <p className="text-gray-500 mt-1 text-sm">Essai gratuit 7 jours — aucun débit avant la fin d'essai</p>
            </div>

            {/* Stepper */}
            <div className="mt-6">
              <Stepper />
            </div>

            {/* Banners */}
            {stripeCancelled && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800">
                  Vous avez annulé le paiement. Votre compte a été créé mais votre abonnement n'est pas encore actif. Cliquez sur "Créer mon compte" pour activer votre essai gratuit.
                </p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* ── ÉTAPE 1 : Entreprise ── */}
            {step === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="entreprise_nom" className="label">Nom de l'entreprise *</label>
                    <input id="entreprise_nom" type="text" name="entreprise_nom" value={formData.entreprise_nom} onChange={handleChange} className="input" required />
                  </div>
                  <div>
                    <label htmlFor="entreprise_siret" className="label">SIRET *</label>
                    <input id="entreprise_siret" type="text" name="entreprise_siret" value={formData.entreprise_siret} onChange={handleChange} className="input" placeholder="14 chiffres" maxLength="14" required />
                  </div>
                  <div>
                    <label htmlFor="entreprise_telephone" className="label">Téléphone *</label>
                    <input id="entreprise_telephone" type="tel" name="entreprise_telephone" value={formData.entreprise_telephone} onChange={handleChange} className="input" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="entreprise_adresse" className="label">Adresse *</label>
                    <input id="entreprise_adresse" type="text" name="entreprise_adresse" value={formData.entreprise_adresse} onChange={handleChange} className="input" required />
                  </div>
                  <div>
                    <label htmlFor="entreprise_code_postal" className="label">Code postal *</label>
                    <input id="entreprise_code_postal" type="text" name="entreprise_code_postal" value={formData.entreprise_code_postal} onChange={handleChange} className="input" maxLength="5" required />
                  </div>
                  <div>
                    <label htmlFor="entreprise_ville" className="label">Ville *</label>
                    <input id="entreprise_ville" type="text" name="entreprise_ville" value={formData.entreprise_ville} onChange={handleChange} className="input" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="entreprise_email" className="label">Email entreprise *</label>
                    <input id="entreprise_email" type="email" name="entreprise_email" value={formData.entreprise_email} onChange={handleChange} className="input" required />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white font-bold px-6 py-4 rounded-xl text-base transition-all shadow-lg hover:shadow-xl mt-2"
                >
                  Continuer <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}

            {/* ── ÉTAPE 2 : Compte admin + docs + submit ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prenom" className="label">Prénom *</label>
                    <input id="prenom" type="text" name="prenom" value={formData.prenom} onChange={handleChange} className="input" required />
                  </div>
                  <div>
                    <label htmlFor="nom" className="label">Nom *</label>
                    <input id="nom" type="text" name="nom" value={formData.nom} onChange={handleChange} className="input" required />
                  </div>
                  <div>
                    <label htmlFor="email" className="label">Email *</label>
                    <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} className="input" required />
                  </div>
                  <div>
                    <label htmlFor="telephone" className="label">Téléphone</label>
                    <input id="telephone" type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className="input" />
                  </div>
                  <div>
                    <label htmlFor="password" className="label">Mot de passe *</label>
                    <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} className="input" placeholder="Min. 12 caractères" required />
                    <div className="mt-2.5 grid grid-cols-2 gap-1">
                      {validatePasswordRules(formData.password).map((rule) => (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          {rule.ok
                            ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            : <XCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                          <span className={`text-xs ${rule.ok ? 'text-green-600' : 'text-gray-400'}`}>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                    {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
                  </div>
                  <div>
                    <label htmlFor="password_confirm" className="label">Confirmer le mot de passe *</label>
                    <input id="password_confirm" type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} className="input" required />
                    {formData.password_confirm && formData.password !== formData.password_confirm && (
                      <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                    Documents à lire et accepter *
                  </p>
                  <div className="space-y-3">
                    {[
                      { key: 'cgu', label: "Conditions Générales d'Utilisation", url: '/cgu' },
                      { key: 'cgv', label: 'Conditions Générales de Vente', url: '/cgv' },
                      { key: 'confidentialite', label: 'Politique de confidentialité & RGPD', url: '/confidentialite' },
                    ].map(({ key, label, url }) => (
                      <div
                        key={key}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                          docsAccepted[key]
                            ? 'bg-green-50 border-green-200'
                            : docsOpened[key]
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => openDoc(key, url)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors whitespace-nowrap flex-shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Lire
                        </button>
                        <span className="text-sm text-gray-700 flex-1">{label}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {docsAccepted[key]
                            ? <CheckCircle className="w-5 h-5 text-green-500" />
                            : !docsOpened[key]
                              ? <span className="text-xs text-gray-400 italic">Lisez d'abord</span>
                              : null}
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
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-2 px-5 py-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading || stripeLoading || !allAccepted}
                    className="flex-1 flex items-center justify-center gap-2 bg-secondary-500 hover:bg-secondary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-4 rounded-xl text-base transition-all shadow-lg hover:shadow-xl"
                  >
                    {stripeLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />Redirection vers le paiement...</>
                    ) : loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />Création du compte...</>
                    ) : (
                      <>Créer mon compte — Essai gratuit 7 jours <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>

                <p className="text-xs text-center text-gray-400">
                  7 jours gratuits · CB requise · Résiliable à tout moment
                </p>
              </form>
            )}

            {/* Footer légal */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
              <Link to="/cgu" className="hover:text-gray-600 transition-colors">CGU</Link>
              <Link to="/cgv" className="hover:text-gray-600 transition-colors">CGV</Link>
              <Link to="/mentions-legales" className="hover:text-gray-600 transition-colors">Mentions légales</Link>
              <Link to="/confidentialite" className="hover:text-gray-600 transition-colors">Confidentialité</Link>
              <a href="mailto:contact@autobat.pro" className="hover:text-gray-600 transition-colors">contact@autobat.pro</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
