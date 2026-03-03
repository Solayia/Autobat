import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Trash2, Edit2, Mail, Phone, Calendar, AlertCircle, CreditCard, ArrowRight, Key, LogIn, Eye, EyeOff, UserCheck, UserX, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import employeService from '../services/employeService';
import useAuthStore from '../stores/authStore';

export default function Employes() {
  const navigate = useNavigate();
  const { tenant, user } = useAuthStore();
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState(null);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    telephone: '',
    quota_mensuel_heures: '',
    role: 'EMPLOYEE'
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({ new_password: '', confirm: '' });
  const [showResetPwd, setShowResetPwd] = useState(false);

  useEffect(() => {
    loadEmployes();
  }, []);

  const loadEmployes = async () => {
    try {
      setLoading(true);
      const data = await employeService.getEmployes();
      setEmployes(data);
    } catch (error) {
      console.error('Erreur chargement employés:', error);
      toast.error('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingEmploye) {
        const updateData = {
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
          quota_mensuel_heures: formData.quota_mensuel_heures,
          role: formData.role
        };
        await employeService.updateEmploye(editingEmploye.id, updateData);
        toast.success('Employé modifié avec succès');
      } else {
        await employeService.createEmploye(formData);
        toast.success('Employé créé avec succès');
      }

      setShowModal(false);
      setShowResetPassword(false);
      setResetPasswordData({ new_password: '', confirm: '' });
      setFormData({
        prenom: '',
        nom: '',
        email: '',
        password: '',
        telephone: '',
        quota_mensuel_heures: '',
        role: 'EMPLOYEE'
      });
      setEditingEmploye(null);
      loadEmployes();
    } catch (error) {
      console.error('Erreur:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'employé';

      if (error.response?.data?.code === 'EMPLOYES_LIMIT_REACHED') {
        const data = error.response.data;
        toast.error(`${errorMsg}\n\nTarification:\n- 1er employé: ${data.pricing.first}\n- Employés supplémentaires: ${data.pricing.additional}\n\nVeuillez contacter le support pour augmenter votre limite.`);
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPasswordData.new_password !== resetPasswordData.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      await employeService.resetPassword(editingEmploye.id, resetPasswordData.new_password);
      toast.success('Mot de passe réinitialisé avec succès');
      setShowResetPassword(false);
      setResetPasswordData({ new_password: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    }
  };

  const handleEdit = (employe) => {
    setShowResetPassword(false);
    setResetPasswordData({ new_password: '', confirm: '' });
    setEditingEmploye(employe);
    setFormData({
      prenom: employe.user.prenom,
      nom: employe.user.nom,
      email: employe.user.email,
      password: '', // Ne pas pré-remplir le mot de passe
      telephone: employe.user.telephone || '',
      quota_mensuel_heures: employe.quota_mensuel_heures || '',
      role: employe.user.role || 'EMPLOYEE'
    });
    setShowModal(true);
  };

  const handleExportHeures = async () => {
    const now = new Date();
    const mois = now.getMonth() + 1;
    const annee = now.getFullYear();
    try {
      const blob = await employeService.exportHeures(mois, annee);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heures-employes-${annee}-${String(mois).padStart(2, '0')}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleToggleActif = async (employe) => {
    const newActif = !employe.user.actif;
    const label = newActif ? 'activer' : 'désactiver';
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} cet employé ?`)) return;
    try {
      await employeService.updateEmploye(employe.id, { actif: newActif });
      toast.success(`Employé ${newActif ? 'activé' : 'désactivé'}`);
      loadEmployes();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (employeId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.')) return;

    try {
      await employeService.deleteEmploye(employeId);
      toast.success('Employé supprimé avec succès');
      loadEmployes();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression de l\'employé');
    }
  };

  const getRoleBadge = (role) => {
    const roles = {
      COMPANY_ADMIN: { label: 'Gérant', color: 'bg-purple-100 text-purple-700' },
      MANAGER: { label: 'Chef de chantier', color: 'bg-blue-100 text-blue-700' },
      EMPLOYEE: { label: 'Employé', color: 'bg-green-100 text-green-700' },
      COMPTABLE: { label: 'Comptable', color: 'bg-orange-100 text-orange-700' }
    };
    return roles[role] || { label: role, color: 'bg-gray-100 text-gray-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-xl py-4 sm:py-5 flex items-center">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">Employés</h1>
                <p className="text-blue-100 mt-1 hidden sm:block">Gérez les employés de votre entreprise</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportHeures}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-white/10 text-white border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all duration-200"
                title="Exporter les heures du mois en CSV"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Export heures</span>
              </button>
              <button
                onClick={() => {
                  setEditingEmploye(null);
                  setFormData({
                    prenom: '',
                    nom: '',
                    email: '',
                    password: '',
                    telephone: '',
                    quota_mensuel_heures: '',
                    role: 'EMPLOYEE'
                  });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-white text-primary-600 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" /><span className="hidden sm:inline">Ajouter un employé</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

      {/* Compteur d'employés et limite */}
      <div className={`mb-4 sm:mb-6 p-4 rounded-lg border ${
        employes.length >= (tenant?.employes_max || 1)
          ? 'bg-red-50 border-red-200'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {employes.length >= (tenant?.employes_max || 1) ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <Users className="w-5 h-5 text-blue-600" />
            )}
            <div>
              <p className={`font-medium ${
                employes.length >= (tenant?.employes_max || 1)
                  ? 'text-red-900'
                  : 'text-blue-900'
              }`}>
                {employes.length} / {tenant?.employes_max || 1} employé{(tenant?.employes_max || 1) > 1 ? 's' : ''} utilisé{employes.length > 1 ? 's' : ''}
              </p>
              <p className={`text-sm ${
                employes.length >= (tenant?.employes_max || 1)
                  ? 'text-red-700'
                  : 'text-blue-700'
              }`}>
                {employes.length >= (tenant?.employes_max || 1)
                  ? 'Limite atteinte'
                  : `${(tenant?.employes_max || 1) - employes.length} emplacement${((tenant?.employes_max || 1) - employes.length) > 1 ? 's' : ''} disponible${((tenant?.employes_max || 1) - employes.length) > 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <div className="text-right">
                <p className="text-gray-900 font-medium">1er: 100€ HT/mois</p>
                <p className="text-gray-600">+20€ HT/mois par employé supp.</p>
              </div>
            </div>
            {employes.length >= (tenant?.employes_max || 1) && (
              <button
                onClick={() => navigate('/settings?tab=abonnement')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                Augmenter mon compte
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {employes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900">Aucun employé</p>
          <p className="text-sm text-gray-600 mt-2">Ajoutez votre premier employé pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employes.map((employe) => (
            <div
              key={employe.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {employe.user.prenom} {employe.user.nom}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded ${
                        getRoleBadge(employe.user.role).color
                      }`}>
                        {getRoleBadge(employe.user.role).label}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        employe.user.actif
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {employe.user.actif ? 'Actif' : 'Inactif'}
                      </span>
                      {!employe.user.last_login && (
                        <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          Jamais connecté
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(employe)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {user?.role === 'COMPANY_ADMIN' && (
                    <button
                      onClick={() => handleToggleActif(employe)}
                      className={`p-2 rounded transition-colors ${
                        employe.user.actif
                          ? 'text-orange-500 hover:bg-orange-50'
                          : 'text-green-500 hover:bg-green-50'
                      }`}
                      title={employe.user.actif ? 'Désactiver' : 'Activer'}
                    >
                      {employe.user.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(employe.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{employe.user.email}</span>
                </div>
                {employe.user.telephone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{employe.user.telephone}</span>
                  </div>
                )}
                {employe.quota_mensuel_heures && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Quota: {employe.quota_mensuel_heures}h/mois</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-gray-400" />
                  <span className={employe.user.last_login ? 'text-gray-600' : 'text-orange-600 font-medium'}>
                    {employe.user.last_login
                      ? `Connecté le ${new Date(employe.user.last_login).toLocaleDateString('fr-FR')}`
                      : 'Jamais connecté'
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajouter/Modifier Employé */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingEmploye ? 'Modifier l\'employé' : 'Nouvel employé'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={editingEmploye} // Désactiver en mode édition
                />
                {editingEmploye && (
                  <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="EMPLOYEE">Employé</option>
                  <option value="MANAGER">Chef de chantier</option>
                  <option value="COMPTABLE">Comptable</option>
                  <option value="COMPANY_ADMIN">Gérant</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Définit les permissions de l'utilisateur
                </p>
              </div>

              {!editingEmploye && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                      required={!editingEmploye}
                      minLength="12"
                      placeholder="Saisir ou générer..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%';
                        const pwd = Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                        setFormData({ ...formData, password: pwd });
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm text-gray-700 transition-colors whitespace-nowrap"
                    >
                      Générer
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Ce mot de passe sera envoyé par email à l'employé.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quota mensuel d'heures
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.quota_mensuel_heures}
                  onChange={(e) => setFormData({ ...formData, quota_mensuel_heures: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: 151.67"
                />
                <p className="text-xs text-gray-500 mt-1">35h/semaine = 151.67h/mois</p>
              </div>

              {/* Section reset password (édition uniquement) */}
              {editingEmploye && (
                <div className="border border-orange-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors text-sm font-medium text-orange-800"
                  >
                    <span className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Réinitialiser le mot de passe
                    </span>
                    <span>{showResetPassword ? '▲' : '▼'}</span>
                  </button>
                  {showResetPassword && (
                    <div className="p-4 bg-white space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nouveau mot de passe *
                        </label>
                        <div className="relative">
                          <input
                            type={showResetPwd ? 'text' : 'password'}
                            value={resetPasswordData.new_password}
                            onChange={(e) => setResetPasswordData({ ...resetPasswordData, new_password: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            minLength="12"
                            placeholder="12 car. min. · MAJ · chiffre · spécial"
                          />
                          <button type="button" onClick={() => setShowResetPwd(!showResetPwd)} className="absolute right-3 top-2.5 text-gray-400">
                            {showResetPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirmer *
                        </label>
                        <input
                          type={showResetPwd ? 'text' : 'password'}
                          value={resetPasswordData.confirm}
                          onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirm: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        {resetPasswordData.confirm && resetPasswordData.new_password !== resetPasswordData.confirm && (
                          <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={!resetPasswordData.new_password || resetPasswordData.new_password !== resetPasswordData.confirm}
                        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        Réinitialiser le mot de passe
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setShowResetPassword(false);
                    setResetPasswordData({ new_password: '', confirm: '' });
                    setEditingEmploye(null);
                    setFormData({
                      prenom: '',
                      nom: '',
                      email: '',
                      password: '',
                      telephone: '',
                      quota_mensuel_heures: '',
                      role: 'EMPLOYEE'
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingEmploye ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
