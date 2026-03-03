import { useState } from 'react';
import toast from 'react-hot-toast';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../services/api';

export default function MonProfil() {
  const { user, setUser } = useAuthStore();

  const [profileData, setProfileData] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    telephone: user?.telephone || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.patch('/auth/profile', profileData);
      // Update store
      if (setUser) {
        setUser({ ...user, ...res.data.user });
      }
      toast.success('Profil mis à jour');
    } catch (error) {
      const msg = error.response?.data?.error || 'Erreur lors de la mise à jour';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      setSavingPassword(true);
      await api.patch('/auth/change-password', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      toast.success('Mot de passe modifié avec succès');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      const details = error.response?.data?.details;
      const msg = error.response?.data?.error || 'Erreur lors du changement de mot de passe';
      if (details?.length) {
        toast.error(details[0]);
      } else {
        toast.error(msg);
      }
    } finally {
      setSavingPassword(false);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-600 mt-1">Gérez vos informations personnelles et votre mot de passe</p>
      </div>

      {/* Infos lecture seule */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.prenom} {user?.nom}</p>
          <p className="text-sm text-gray-600">{user?.email}</p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
            {getRoleLabel(user?.role)}
          </span>
        </div>
      </div>

      {/* Section infos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-500" />
          Informations personnelles
        </h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input
                type="text"
                value={profileData.prenom}
                onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={profileData.nom}
                onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              value={profileData.telephone}
              onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 06 12 34 56 78"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {/* Section mot de passe */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-500" />
          Changer le mot de passe
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          12 caractères min. · majuscule · chiffre · caractère spécial (!@#$...)
        </p>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel *</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe *</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength="12"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe *</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
              <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {savingPassword ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
