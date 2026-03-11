import { useState } from 'react';
import toast from 'react-hot-toast';
import settingsService from '../services/settingsService';
import useAuthStore from '../stores/authStore';

const STEPS = [
  { id: 1, titre: 'Bienvenue', icon: '👋' },
  { id: 2, titre: 'Votre entreprise', icon: '🏢' },
  { id: 3, titre: 'Logo', icon: '🎨' },
  { id: 4, titre: 'Informations légales', icon: '📋' },
  { id: 5, titre: "C'est parti !", icon: '🚀' }
];

export default function OnboardingWizard({ onClose }) {
  const { tenant, setTenant } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Champs étape 2 — entreprise
  const [entreprise, setEntreprise] = useState({
    nom: tenant?.nom || '',
    siret: tenant?.siret || '',
    adresse: tenant?.adresse || '',
    code_postal: tenant?.code_postal || '',
    ville: tenant?.ville || '',
    telephone: tenant?.telephone || '',
    email: tenant?.email || ''
  });

  // Champs étape 4 — légal
  const [legal, setLegal] = useState({
    rib: tenant?.rib || '',
    capital: tenant?.capital || '',
    rcs: tenant?.rcs || '',
    tva_intra: tenant?.tva_intra || ''
  });

  const saveProgress = async (step) => {
    await settingsService.updateOnboarding({ step });
  };

  const goNext = async () => {
    if (currentStep === 2) {
      if (!entreprise.nom || !entreprise.siret) {
        toast.error('Nom et SIRET sont obligatoires');
        return;
      }
      setLoading(true);
      try {
        await settingsService.updateSettings(entreprise);
      } catch {
        toast.error('Erreur lors de la sauvegarde');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    if (currentStep === 4) {
      setLoading(true);
      try {
        await settingsService.updateSettings(legal);
      } catch {
        // Non bloquant
      }
      setLoading(false);
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    try {
      await saveProgress(nextStep);
    } catch {
      // Non bloquant
    }
  };

  const goPrev = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await settingsService.updateOnboarding({ completed: true, step: 5 });
      setTenant({ ...tenant, onboarding_completed: true, onboarding_step: 5 });
      toast.success('Configuration terminée ! Bienvenue sur Autobat 🎉');
      onClose();
    } catch {
      toast.error('Erreur lors de la finalisation');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await settingsService.updateOnboarding({ completed: true, step: 5 });
      setTenant({ ...tenant, onboarding_completed: true, onboarding_step: 5 });
    } catch {
      // Non bloquant
    }
    onClose();
  };

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Configuration initiale</h2>
            <button
              onClick={handleSkip}
              className="text-white/70 hover:text-white text-sm transition-colors"
            >
              Passer →
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/80">
              <span>Étape {currentStep} sur {STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step.id === currentStep
                    ? 'bg-white text-orange-600'
                    : step.id < currentStep
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                <span>{step.icon}</span>
                <span>{step.titre}</span>
                {step.id < currentStep && <span className="text-green-300">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 min-h-72">
          {currentStep === 1 && <StepBienvenue tenant={tenant} />}
          {currentStep === 2 && (
            <StepEntreprise values={entreprise} onChange={setEntreprise} />
          )}
          {currentStep === 3 && <StepLogo />}
          {currentStep === 4 && (
            <StepLegal values={legal} onChange={setLegal} />
          )}
          {currentStep === 5 && <StepFinal />}
        </div>

        {/* Footer navigation */}
        <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <button
            onClick={goPrev}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Précédent
          </button>

          <div className="flex gap-3">
            {currentStep < STEPS.length ? (
              <button
                onClick={goNext}
                disabled={loading}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? 'Sauvegarde...' : 'Suivant →'}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? 'Finalisation...' : 'Commencer à utiliser Autobat 🚀'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== ÉTAPES ===== */

function StepBienvenue({ tenant }) {
  return (
    <div className="text-center py-4">
      <div className="text-6xl mb-4">👋</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        Bienvenue sur Autobat !
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Bonjour <strong>{tenant?.nom}</strong> ! Prenons 2 minutes pour configurer
        votre espace de travail. Vous pourrez tout modifier plus tard dans les Paramètres.
      </p>
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { icon: '📝', label: 'Devis en 2 clics' },
          { icon: '🏗️', label: 'Suivi chantiers' },
          { icon: '📊', label: 'Facturation légale' }
        ].map((item) => (
          <div key={item.label} className="bg-orange-50 rounded-xl p-4">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-xs font-medium text-gray-700">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepEntreprise({ values, onChange }) {
  const handle = (field) => (e) =>
    onChange((v) => ({ ...v, [field]: e.target.value }));

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Votre entreprise</h3>
      <p className="text-sm text-gray-500 mb-5">
        Ces informations apparaîtront sur vos devis et factures.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nom de l'entreprise <span className="text-red-500">*</span>
          </label>
          <input
            value={values.nom}
            onChange={handle('nom')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Ex: BTP Martin SAS"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            SIRET <span className="text-red-500">*</span>
          </label>
          <input
            value={values.siret}
            onChange={handle('siret')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="14 chiffres"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            value={values.telephone}
            onChange={handle('telephone')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="06 00 00 00 00"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
          <input
            value={values.adresse}
            onChange={handle('adresse')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="12 rue des Artisans"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Code postal</label>
          <input
            value={values.code_postal}
            onChange={handle('code_postal')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="75001"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ville</label>
          <input
            value={values.ville}
            onChange={handle('ville')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Paris"
          />
        </div>
      </div>
    </div>
  );
}

function StepLogo() {
  const { tenant, setTenant } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(tenant?.logo_url || null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Fichier trop lourd (max 2 Mo)');
      return;
    }
    setUploading(true);
    try {
      const result = await settingsService.uploadLogo(file);
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      const url = `${baseUrl}${result.logo_url}`;
      setPreview(url);
      setTenant({ ...tenant, logo_url: result.logo_url });
      toast.success('Logo uploadé !');
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="text-center py-4">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Logo de l'entreprise</h3>
      <p className="text-sm text-gray-500 mb-6">
        Votre logo apparaîtra sur les devis et factures. Cette étape est optionnelle.
      </p>

      <div className="flex flex-col items-center gap-4">
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
          {preview ? (
            <img src={preview} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-4xl">🏢</span>
          )}
        </div>

        <label className="cursor-pointer px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors">
          {uploading ? 'Upload en cours...' : preview ? 'Changer le logo' : 'Choisir un logo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFile}
            className="hidden"
          />
        </label>

        <p className="text-xs text-gray-400">JPEG, PNG, GIF — max 2 Mo</p>
      </div>
    </div>
  );
}

function StepLegal({ values, onChange }) {
  const handle = (field) => (e) =>
    onChange((v) => ({ ...v, [field]: e.target.value }));

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Informations légales</h3>
      <p className="text-sm text-gray-500 mb-5">
        Mentions obligatoires sur les factures (optionnel pour l'instant).
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Capital social
          </label>
          <input
            value={values.capital}
            onChange={handle('capital')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Ex: 5 000 €"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            N° RCS / RCM
          </label>
          <input
            value={values.rcs}
            onChange={handle('rcs')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Ex: RCS Paris 123 456 789"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            N° TVA Intracommunautaire
          </label>
          <input
            value={values.tva_intra}
            onChange={handle('tva_intra')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Ex: FR12 345678901"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            RIB / IBAN
          </label>
          <input
            value={values.rib}
            onChange={handle('rib')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="FR76 XXXX XXXX XXXX XXXX"
          />
        </div>
      </div>
      <p className="text-xs text-orange-600 mt-4 bg-orange-50 p-3 rounded-lg">
        💡 Ces informations peuvent être complétées plus tard dans Paramètres → Entreprise
      </p>
    </div>
  );
}

function StepFinal() {
  return (
    <div className="text-center py-4">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        Votre espace est prêt !
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
        Tout est configuré. Vous pouvez maintenant créer vos premiers devis,
        gérer vos chantiers et facturer vos clients.
      </p>
      <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
        {[
          { icon: '📝', text: 'Créer un devis depuis le catalogue de 322 prestations' },
          { icon: '🏗️', text: 'Ouvrir un chantier et assigner vos équipes' },
          { icon: '📲', text: 'Badger depuis le terrain (mobile)' },
          { icon: '💰', text: 'Générer et envoyer vos factures' }
        ].map((item) => (
          <div key={item.text} className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            <span className="text-xs text-gray-700">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
