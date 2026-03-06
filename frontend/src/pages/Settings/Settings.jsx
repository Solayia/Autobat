import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { Save, Palette, Upload, Image as ImageIcon, Settings as SettingsIcon, CreditCard, Plus, Minus, Lock, HardHat, Target, Mail, CheckCircle, AlertCircle, Loader2, LogOut, User, Eye, EyeOff } from 'lucide-react';
import settingsService from '../../services/settingsService';
import authService from '../../services/authService';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';
  const { tenant, setTenant, refreshUser, user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    telephone: user?.telephone || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPwdOld, setShowPwdOld] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingObjectifs, setSavingObjectifs] = useState(false);
  const [objectifs, setObjectifs] = useState({
    objectif_ca_annuel: '',
    objectif_ca_mensuel: '',
    objectif_taux_acceptation: '',
    objectif_taux_encaissement: '',
    objectif_delai_paiement: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [updatingSubscription, setUpdatingSubscription] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [gmailStatus, setGmailStatus] = useState({ connected: false, email: null });
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [gmailDisconnecting, setGmailDisconnecting] = useState(false);
  const [smtpData, setSmtpData] = useState({ smtp_host: '', smtp_port: 587, smtp_secure: false, smtp_user: '', smtp_password: '', smtp_from: '' });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const logoInputRef = useRef(null);
  const [newEmployesMax, setNewEmployesMax] = useState(tenant?.employes_max || 1);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [settings, setSettings] = useState({
    nom: '',
    siret: '',
    adresse: '',
    code_postal: '',
    ville: '',
    telephone: '',
    email: '',
    logo_url: null,
    rib: '',
    capital: '',
    rcs: '',
    tva_intra: '',
    couleur_primaire: '#FF9F43',
    badgeage_par_tache_defaut: false
  });

  const tabs = [
    { id: 'profil', label: 'Mon profil', icon: User },
    { id: 'general', label: 'Général', icon: SettingsIcon },
    { id: 'chantier', label: 'Chantier', icon: HardHat },
    { id: 'objectifs', label: 'Objectifs', icon: Target },
    { id: 'securite', label: 'Sécurité', icon: Lock },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'abonnement', label: 'Abonnement', icon: CreditCard }
  ];

  useEffect(() => {
    // Rafraîchir les données du tenant depuis l'API
    refreshUser();
    loadSettings();

    // Gérer les retours de paiement Stripe
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.error('Paiement réussi ! Votre abonnement a été mis à jour. Rechargement de la page...');
      // Retirer le paramètre payment de l'URL et recharger les données
      searchParams.delete('payment');
      setSearchParams(searchParams);
      // Recharger les données du tenant
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else if (paymentStatus === 'cancel') {
      toast.success('Paiement annulé. Votre abonnement n\'a pas été modifié.');
      // Retirer le paramètre payment de l'URL
      searchParams.delete('payment');
      setSearchParams(searchParams);
    }
  }, []);

  useEffect(() => {
    setNewEmployesMax(tenant?.employes_max || 1);
  }, [tenant]);

  // Gérer le retour OAuth2 Gmail (?gmail=success ou ?gmail=error)
  useEffect(() => {
    const gmailParam = searchParams.get('gmail');
    if (gmailParam === 'success') {
      toast.success('Gmail connecté avec succès !');
      searchParams.delete('gmail');
      setSearchParams({ tab: 'email' });
      settingsService.getGmailStatus()
        .then(s => setGmailStatus(s))
        .catch(() => {});
    } else if (gmailParam === 'error') {
      const msg = searchParams.get('msg') || 'Erreur lors de la connexion Gmail';
      toast.error(`Connexion Gmail échouée : ${decodeURIComponent(msg)}`);
      searchParams.delete('gmail');
      searchParams.delete('msg');
      setSearchParams({ tab: 'email' });
    }
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [data, gmail, smtp] = await Promise.all([
        settingsService.getSettings(),
        settingsService.getGmailStatus().catch(() => ({ connected: false, email: null })),
        settingsService.getSmtpSettings().catch(() => null)
      ]);
      setSettings(data);
      setObjectifs({
        objectif_ca_annuel: data.objectif_ca_annuel ?? '',
        objectif_ca_mensuel: data.objectif_ca_mensuel ?? '',
        objectif_taux_acceptation: data.objectif_taux_acceptation ?? '',
        objectif_taux_encaissement: data.objectif_taux_encaissement ?? '',
        objectif_delai_paiement: data.objectif_delai_paiement ?? ''
      });
      setGmailStatus(gmail || { connected: false, email: null });
      if (smtp) setSmtpData(prev => ({ ...prev, ...smtp }));
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setGmailConnecting(true);
      const { url } = await settingsService.getGmailAuthUrl();
      window.location.href = url;
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la connexion Gmail';
      toast.error(msg);
      setGmailConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      setGmailDisconnecting(true);
      await settingsService.disconnectGmail();
      setGmailStatus({ connected: false, email: null });
      toast.success('Gmail déconnecté');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setGmailDisconnecting(false);
    }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    try {
      setSavingSmtp(true);
      await settingsService.updateSmtpSettings(smtpData);
      toast.success('Configuration SMTP enregistrée');
    } catch {
      toast.error('Erreur lors de l\'enregistrement SMTP');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    try {
      setTestingSmtp(true);
      await settingsService.testSmtp(smtpData);
      toast.success('Email de test envoyé avec succès !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec du test SMTP');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      await settingsService.updateSettings(settings);
      toast.success('Paramètres enregistrés avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    console.log('📸 handleLogoUpload déclenché', e);
    console.log('📸 Fichiers:', e.target.files);

    const file = e.target.files[0];
    if (!file) {
      console.log('❌ Aucun fichier sélectionné');
      return;
    }

    console.log('✅ Fichier sélectionné:', file.name, file.type, file.size);

    // Vérifier le type de fichier
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
      toast.error('Seuls les fichiers image (JPEG, PNG, GIF) sont autorisés');
      return;
    }

    // Vérifier la taille (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 2 MB');
      return;
    }

    try {
      setUploadingLogo(true);
      console.log('🚀 Début upload...');
      const data = await settingsService.uploadLogo(file);
      console.log('✅ Upload réussi:', data);
      setSettings({ ...settings, logo_url: data.logo_url });
      toast.success('Logo uploadé avec succès');
    } catch (error) {
      console.error('❌ Erreur upload logo:', error);
      toast.error('Erreur lors de l\'upload du logo');
    } finally {
      setUploadingLogo(false);
      // Reset input pour permettre de re-sélectionner le même fichier
      e.target.value = '';
    }
  };

  const handleUpdateSubscription = () => {
    if (newEmployesMax === (tenant?.employes_max || 1)) {
      toast.error('Veuillez sélectionner un nouveau nombre d\'employés différent');
      return;
    }

    if (newEmployesMax < (tenant?.employes_max || 1)) {
      toast.error('Vous ne pouvez pas réduire le nombre d\'employés. Contactez le support pour diminuer votre abonnement.');
      return;
    }

    setShowSubscriptionModal(true);
  };

  const handleConfirmUpdateSubscription = async () => {
    try {
      setUpdatingSubscription(true);
      setShowSubscriptionModal(false);
      await settingsService.upgradeEmployees(newEmployesMax);
      toast.success(`Abonnement mis à jour : ${newEmployesMax} compte${newEmployesMax > 1 ? 's' : ''}`);
      // Rafraîchir les infos tenant
      await refreshUser();
    } catch (error) {
      console.error('Erreur upgrade employés:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'abonnement');
    } finally {
      setUpdatingSubscription(false);
    }
  };

  const calculateNewPrice = (employesCount) => {
    return employesCount === 1 ? 100 : 100 + (employesCount - 1) * 20;
  };

  const handleSaveObjectifs = async (e) => {
    e.preventDefault();
    try {
      setSavingObjectifs(true);
      await settingsService.updateObjectifs(objectifs);
      toast.success('Objectifs enregistrés avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde objectifs:', error);
      toast.error('Erreur lors de la sauvegarde des objectifs');
    } finally {
      setSavingObjectifs(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      COMPANY_ADMIN: 'Gérant',
      MANAGER: 'Chef de chantier',
      EMPLOYEE: 'Employé',
      COMPTABLE: 'Comptable'
    };
    return labels[role] || role;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.patch('/auth/profile', profileData);
      if (setUser) setUser({ ...user, ...res.data.user });
      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const pwdRules = [
      { ok: passwordData.newPassword.length >= 12, msg: '12 caractères minimum' },
      { ok: /[A-Z]/.test(passwordData.newPassword), msg: 'une majuscule' },
      { ok: /[a-z]/.test(passwordData.newPassword), msg: 'une minuscule' },
      { ok: /[0-9]/.test(passwordData.newPassword), msg: 'un chiffre' },
      { ok: /[^A-Za-z0-9]/.test(passwordData.newPassword), msg: 'un caractère spécial' }
    ];
    const failedPwd = pwdRules.filter(r => !r.ok);
    if (failedPwd.length > 0) {
      toast.error(`Mot de passe invalide : ${failedPwd.map(r => r.msg).join(', ')}`);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setChangingPassword(true);
      await authService.changePassword(passwordData.oldPassword, passwordData.newPassword);
      toast.success('Mot de passe changé avec succès !');
      // Réinitialiser le formulaire
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-xl py-4 sm:py-5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">Paramètres</h1>
              <p className="text-blue-100 mt-1 hidden sm:block">Gérez les informations de votre entreprise</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* Onglets */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-4 sm:mb-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`flex-shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-2 sm:px-5 sm:py-3 rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm ${
                    isActive
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu des onglets */}

        {/* Onglet Mon profil */}
        {activeTab === 'profil' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Carte identité */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{user?.prenom} {user?.nom}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                Informations personnelles
              </h2>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      value={profileData.prenom}
                      onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={profileData.nom}
                      onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={profileData.telephone}
                    onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                    placeholder="Ex: 06 12 34 56 78"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>

            {/* Lien vers sécurité */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900 text-sm">Modifier votre mot de passe</p>
                  <p className="text-xs text-amber-700 mt-0.5">Rendez-vous dans l'onglet Sécurité</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'securite' })}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Onglet Sécurité
              </button>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Informations générales</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison sociale <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.nom}
                  onChange={(e) => setSettings({ ...settings, nom: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SIRET <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.siret}
                  onChange={(e) => setSettings({ ...settings, siret: e.target.value })}
                  required
                  placeholder="14 chiffres"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={settings.telephone}
                  onChange={(e) => setSettings({ ...settings, telephone: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={settings.adresse}
                  onChange={(e) => setSettings({ ...settings, adresse: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                <input
                  type="text"
                  value={settings.code_postal}
                  onChange={(e) => setSettings({ ...settings, code_postal: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <input
                  type="text"
                  value={settings.ville}
                  onChange={(e) => setSettings({ ...settings, ville: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Informations légales */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Informations légales</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RCS</label>
                <input
                  type="text"
                  value={settings.rcs || ''}
                  onChange={(e) => setSettings({ ...settings, rcs: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capital</label>
                <input
                  type="text"
                  value={settings.capital || ''}
                  onChange={(e) => setSettings({ ...settings, capital: e.target.value })}
                  placeholder="Ex: 10 000 €"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TVA Intracommunautaire</label>
                <input
                  type="text"
                  value={settings.tva_intra || ''}
                  onChange={(e) => setSettings({ ...settings, tva_intra: e.target.value })}
                  placeholder="FR12345678901"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RIB</label>
                <input
                  type="text"
                  value={settings.rib || ''}
                  onChange={(e) => setSettings({ ...settings, rib: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Personnalisation */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Palette className="w-6 h-6" />
              Personnalisation
            </h2>

            {/* Logo */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo de l'entreprise
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Ce logo apparaîtra sur vos devis PDF (2MB max, formats: JPEG, PNG, GIF)
              </p>

              <div className="flex items-start gap-6">
                {/* Aperçu du logo */}
                <div className="flex-shrink-0">
                  {settings.logo_url ? (
                    <label
                      htmlFor="logo-upload"
                      className="relative group cursor-pointer block"
                    >
                      <img
                        src={`${(import.meta.env.VITE_API_URL || 'http://localhost:3000').replace('/api', '')}${settings.logo_url}`}
                        alt="Logo entreprise"
                        crossOrigin="anonymous"
                        className="w-32 h-32 object-contain border-2 border-gray-200 rounded-xl bg-gray-50 p-2"
                      />
                      <div className="absolute inset-0 bg-black/50 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                    </label>
                  ) : (
                    <label
                      htmlFor="logo-upload"
                      className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                    >
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">Ajouter logo</span>
                    </label>
                  )}
                </div>

                {/* Bouton d'upload */}
                <div className="flex items-center gap-2">
                  <input
                    id="logo-upload"
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer"
                  />
                  {uploadingLogo && (
                    <p className="text-sm text-gray-500 mt-2">Upload en cours...</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur de marque
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Cette couleur sera utilisée dans vos devis (sections, en-têtes, boutons)
              </p>

              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.couleur_primaire}
                  onChange={(e) => setSettings({ ...settings, couleur_primaire: e.target.value })}
                  className="h-16 w-32 rounded-xl border-2 border-gray-300 cursor-pointer"
                />
                <div>
                  <input
                    type="text"
                    value={settings.couleur_primaire}
                    onChange={(e) => setSettings({ ...settings, couleur_primaire: e.target.value })}
                    placeholder="#FF9F43"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="w-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: #RRGGBB</p>
                </div>

                {/* Aperçu */}
                <div className="ml-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">Aperçu</p>
                  <div
                    className="px-6 py-3 rounded-xl text-white font-medium"
                    style={{ backgroundColor: settings.couleur_primaire }}
                  >
                    Section du devis
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={loadSettings}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
        )}

        {/* Onglet Chantier */}
        {activeTab === 'chantier' && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <HardHat className="w-6 h-6" />
              Paramètres de chantier
            </h2>

            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mode de badgeage par défaut
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Choisissez le mode de badgeage qui sera appliqué automatiquement lors de la création de nouveaux chantiers.
                  Vous pourrez toujours le modifier individuellement pour chaque chantier.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mode Simple */}
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, badgeage_par_tache_defaut: false })}
                    className={`relative p-6 border-2 rounded-xl text-left transition-all ${
                      !settings.badgeage_par_tache_defaut
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          !settings.badgeage_par_tache_defaut
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {!settings.badgeage_par_tache_defaut && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900">Mode Simple</h3>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        GPS uniquement
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Badgeage automatique par GPS uniquement. Idéal pour un suivi simple des présences sur chantier.
                    </p>
                    <ul className="mt-3 space-y-1">
                      <li className="text-xs text-gray-500">✓ Arrivée/Départ automatique</li>
                      <li className="text-xs text-gray-500">✓ Simple et rapide</li>
                      <li className="text-xs text-gray-500">✓ Pas de badgeage manuel</li>
                    </ul>
                  </button>

                  {/* Mode Détaillé */}
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, badgeage_par_tache_defaut: true })}
                    className={`relative p-6 border-2 rounded-xl text-left transition-all ${
                      settings.badgeage_par_tache_defaut
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          settings.badgeage_par_tache_defaut
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {settings.badgeage_par_tache_defaut && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900">Mode Détaillé</h3>
                      </div>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        GPS + Tâches
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Badgeage GPS + suivi détaillé par tâche. Permet un suivi précis du temps passé sur chaque tâche.
                    </p>
                    <ul className="mt-3 space-y-1">
                      <li className="text-xs text-gray-500">✓ Arrivée/Départ + GPS</li>
                      <li className="text-xs text-gray-500">✓ Début/Fin/Pause par tâche</li>
                      <li className="text-xs text-gray-500">✓ Suivi précis du temps</li>
                    </ul>
                  </button>
                </div>

                {/* Informations supplémentaires */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <p className="text-sm text-blue-900">
                    <strong>Note :</strong> Ce paramètre définit le mode par défaut pour les <strong>nouveaux chantiers</strong>.
                    Vous pourrez modifier ce mode individuellement pour chaque chantier existant ou futur.
                  </p>
                  <p className="text-xs text-blue-700">
                    ⚠️ Ce réglage ne restreint pas l'employé — il pré-sélectionne simplement le mode lors de la création d'un chantier.
                    L'employé peut toujours accéder aux deux types de badgeage sur le terrain.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={loadSettings}
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Objectifs */}
        {activeTab === 'objectifs' && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-600" />
                Objectifs de pilotage
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Définissez vos objectifs pour visualiser la progression sur la page Pilotage.
              </p>
            </div>

            <form onSubmit={handleSaveObjectifs} className="space-y-8 max-w-2xl">

              {/* CA */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
                  Chiffre d'affaires
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CA annuel cible (€ HT)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">Montant facturé hors taxes sur l'année</p>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="ex: 200000"
                        value={objectifs.objectif_ca_annuel}
                        onChange={e => setObjectifs({ ...objectifs, objectif_ca_annuel: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400 text-sm">€</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CA mensuel cible (€ HT)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">Montant facturé par mois</p>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder="ex: 15000"
                        value={objectifs.objectif_ca_mensuel}
                        onChange={e => setObjectifs({ ...objectifs, objectif_ca_mensuel: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400 text-sm">€</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Taux */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
                  Taux de performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taux d'acceptation devis (%)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">% de devis signés par les clients</p>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        placeholder="ex: 60"
                        value={objectifs.objectif_taux_acceptation}
                        onChange={e => setObjectifs({ ...objectifs, objectif_taux_acceptation: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taux d'encaissement cible (%)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">% du CA facturé réellement encaissé</p>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        placeholder="ex: 80"
                        value={objectifs.objectif_taux_encaissement}
                        onChange={e => setObjectifs({ ...objectifs, objectif_taux_encaissement: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Production */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
                  Paiements
                </h3>
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Délai moyen de paiement (jours)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Délai cible entre émission et encaissement</p>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      step="5"
                      placeholder="ex: 30"
                      value={objectifs.objectif_delai_paiement}
                      onChange={e => setObjectifs({ ...objectifs, objectif_delai_paiement: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm">j</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingObjectifs}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingObjectifs ? 'Enregistrement...' : 'Enregistrer les objectifs'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Onglet Sécurité */}
        {activeTab === 'securite' && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6" />
              Changer mon mot de passe
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ancien mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Saisissez votre ancien mot de passe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength="12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Minimum 12 caractères"
                />
                <p className="text-xs text-gray-500 mt-1">12 caractères min. · majuscule · minuscule · chiffre · caractère spécial</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength="12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Confirmez votre nouveau mot de passe"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })}
                  className="px-6 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Changement...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Changer le mot de passe
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Onglet Email / Gmail */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
              {/* En-tête */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                    <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#EA4335" fillOpacity="0.15" stroke="#EA4335" strokeWidth="1.5"/>
                    <path d="M2 6l10 7 10-7" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">Connexion Gmail</h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Vos devis et factures partiront depuis votre adresse Gmail
                  </p>
                </div>
                {gmailStatus.connected && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    Gmail connecté
                  </div>
                )}
              </div>

              {/* État connecté */}
              {gmailStatus.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">Compte Gmail connecté</p>
                      <p className="text-sm text-green-700 mt-0.5">{gmailStatus.email}</p>
                      <p className="text-xs text-green-600 mt-1">Les emails partent automatiquement depuis cette adresse</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectGmail}
                      disabled={gmailDisconnecting}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all text-sm font-medium disabled:opacity-50"
                    >
                      {gmailDisconnecting
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <LogOut className="w-4 h-4" />
                      }
                      Déconnecter
                    </button>
                  </div>

                  <p className="text-sm text-gray-500">
                    Pour changer de compte Gmail, déconnectez d'abord le compte actuel puis reconnectez-en un nouveau.
                  </p>
                </div>
              ) : (
                /* État non connecté */
                <div className="space-y-6">
                  <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl text-center">
                    <Mail className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm mb-1">Aucun compte Gmail connecté</p>
                    <p className="text-gray-400 text-xs">Les boutons d'envoi par email sont masqués jusqu'à la connexion</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectGmail}
                    disabled={gmailConnecting}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:shadow-md transition-all font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {gmailConnecting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      /* Logo Google */
                      <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    {gmailConnecting ? 'Redirection vers Google...' : 'Se connecter avec Google'}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    Vous serez redirigé vers Google pour autoriser l'envoi d'emails. Aucun mot de passe n'est stocké.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Alternative SMTP */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Configuration SMTP</h2>
                <p className="text-sm text-gray-500">Alternative si Gmail OAuth2 ne fonctionne pas</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
              <p className="text-sm text-blue-800">
                <strong>Pour Gmail :</strong> activez la validation 2 étapes puis créez un{' '}
                <strong>mot de passe d'application</strong> sur{' '}
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline">
                  myaccount.google.com/apppasswords
                </a>.
                Utilisez ensuite <code className="bg-blue-100 px-1 rounded">smtp.gmail.com</code> port 587.
              </p>
            </div>

            <form onSubmit={handleSaveSmtp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serveur SMTP</label>
                  <input
                    type="text"
                    value={smtpData.smtp_host}
                    onChange={e => setSmtpData({ ...smtpData, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <input
                    type="number"
                    value={smtpData.smtp_port}
                    onChange={e => setSmtpData({ ...smtpData, smtp_port: parseInt(e.target.value) })}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email (expéditeur)</label>
                  <input
                    type="email"
                    value={smtpData.smtp_user}
                    onChange={e => setSmtpData({ ...smtpData, smtp_user: e.target.value })}
                    placeholder="contact@mon-entreprise.fr"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe SMTP</label>
                  <input
                    type="password"
                    value={smtpData.smtp_password}
                    onChange={e => setSmtpData({ ...smtpData, smtp_password: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom affiché (from)</label>
                  <input
                    type="text"
                    value={smtpData.smtp_from}
                    onChange={e => setSmtpData({ ...smtpData, smtp_from: e.target.value })}
                    placeholder="Mon Entreprise BTP <contact@mon-entreprise.fr>"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp || !smtpData.smtp_host}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {testingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Tester l'envoi
                </button>
                <button
                  type="submit"
                  disabled={savingSmtp}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {savingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer SMTP
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Onglet Abonnement */}
        {activeTab === 'abonnement' && (
          <div className="space-y-6">
            {/* Statut de l'abonnement */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Mon abonnement</h2>

              {/* Badge statut */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Autobat Pro</h3>
                    <p className="text-gray-600 mt-1">Accès complet à toutes les fonctionnalités</p>
                  </div>
                  {/* Badge statut coloré */}
                  {tenant?.statut === 'TRIAL' && (
                    <div className="bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold">Essai gratuit</div>
                  )}
                  {tenant?.statut === 'ACTIF' && (
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold">Actif</div>
                  )}
                  {tenant?.statut === 'SUSPENDU' && (
                    <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">Suspendu</div>
                  )}
                  {tenant?.statut === 'RESILIE' && (
                    <div className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold">Résilié</div>
                  )}
                </div>

                {/* Trial countdown */}
                {tenant?.statut === 'TRIAL' && tenant?.trial_ends_at && (() => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(tenant.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-amber-800 font-medium">
                        {daysLeft > 0
                          ? `Essai gratuit : ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
                          : "Votre essai gratuit se termine aujourd'hui — votre carte sera débitée."}
                      </p>
                    </div>
                  );
                })()}

                {/* Alerte si suspendu */}
                {tenant?.statut === 'SUSPENDU' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800 font-medium">
                      Votre paiement a échoué. Mettez à jour votre moyen de paiement pour réactiver l'accès.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="bg-white/80 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Comptes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tenant?.employes_max || 1} compte{(tenant?.employes_max || 1) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Tarif mensuel</p>
                    <p className="text-4xl font-bold text-green-600">
                      {(tenant?.employes_max || 1) === 1 ? '100€' : `${100 + ((tenant?.employes_max || 1) - 1) * 20}€`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">HT / mois</p>
                  </div>
                </div>
              </div>

              {/* Bouton Gérer l'abonnement → Stripe Portal */}
              {tenant?.stripe_customer_id && (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setUpdatingSubscription(true);
                        const { url } = await settingsService.createPortalSession();
                        window.location.href = url;
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Erreur lors de la redirection');
                        setUpdatingSubscription(false);
                      }
                    }}
                    disabled={updatingSubscription}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {updatingSubscription ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Redirection...</>
                    ) : (
                      <><CreditCard className="w-5 h-5" /> Gérer mon abonnement</>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Modifier votre carte, consulter les factures ou résilier via le portail sécurisé Stripe.
                  </p>
                </div>
              )}

              {/* Si pas encore de customer Stripe */}
              {!tenant?.stripe_customer_id && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    Votre abonnement n'est pas encore activé. Contactez le support à{' '}
                    <a href="mailto:support@autobat.fr" className="underline">support@autobat.fr</a>.
                  </p>
                </div>
              )}
            </div>

            {/* Ajouter des comptes employés — seulement si abonnement actif */}
            {(tenant?.statut === 'ACTIF' || tenant?.statut === 'TRIAL') && (
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Ajouter des comptes employés</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Nombre de comptes souhaité
                    </label>

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setNewEmployesMax(Math.max(1, newEmployesMax - 1))}
                        disabled={newEmployesMax <= 1}
                        className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-5 h-5" />
                      </button>

                      <div className="flex-1 max-w-xs">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newEmployesMax}
                          onChange={(e) => setNewEmployesMax(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                          className="w-full px-4 py-3 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <p className="text-sm text-gray-500 mt-1 text-center">compte{newEmployesMax > 1 ? 's' : ''}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setNewEmployesMax(Math.min(100, newEmployesMax + 1))}
                        disabled={newEmployesMax >= 100}
                        className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Calcul du tarif */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">1er compte</span>
                        <span className="font-medium">100€ HT/mois</span>
                      </div>
                      {newEmployesMax > 1 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">{newEmployesMax - 1} compte{newEmployesMax - 1 > 1 ? 's' : ''} supplémentaire{newEmployesMax - 1 > 1 ? 's' : ''}</span>
                          <span className="font-medium">{(newEmployesMax - 1) * 20}€ HT/mois</span>
                        </div>
                      )}
                      <div className="border-t border-green-300 pt-3 flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-lg">Total mensuel</span>
                        <span className="font-bold text-green-600 text-2xl">{calculateNewPrice(newEmployesMax)}€ HT</span>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setNewEmployesMax(tenant?.employes_max || 1)}
                      disabled={newEmployesMax === (tenant?.employes_max || 1)}
                      className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateSubscription}
                      disabled={updatingSubscription || newEmployesMax === (tenant?.employes_max || 1)}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {updatingSubscription ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Payer la différence
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 italic">
                    * Pour réduire votre abonnement, gérez-le via le portail Stripe ci-dessus ou contactez{' '}
                    <a href="mailto:support@autobat.fr" className="text-blue-600 hover:underline">support@autobat.fr</a>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Confirmation Mise à jour Abonnement */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Mettre à jour votre abonnement
            </h2>
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                Nouveau nombre d'employés : <strong>{newEmployesMax} employé{newEmployesMax > 1 ? 's' : ''}</strong>
              </p>
              <p className="text-gray-700">
                Nouveau tarif : <strong>{calculateNewPrice(newEmployesMax)}€ HT/mois</strong>
              </p>
              <p className="text-gray-700">
                Montant à payer : <strong>{calculateNewPrice(newEmployesMax) - calculateNewPrice(tenant?.employes_max || 1)}€ HT</strong>
              </p>
              <p className="text-sm text-gray-500 mt-4 pt-4 border-t">
                Vous allez être redirigé vers notre plateforme de paiement sécurisée Stripe.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmUpdateSubscription}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
