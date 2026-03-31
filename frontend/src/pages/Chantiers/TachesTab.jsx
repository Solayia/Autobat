import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, CheckCircle, Clock, Play, FileText, X, UserPlus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import tacheService from '../../services/tacheService';
import employeService from '../../services/employeService';

export default function TachesTab({ chantierId, chantier }) {
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateFromDevisModal, setShowCreateFromDevisModal] = useState(false);
  const [selectedTache, setSelectedTache] = useState(null);
  const [editingTache, setEditingTache] = useState(null);
  const [schedulingEmployeId, setSchedulingEmployeId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ date_planifiee: '', heure_debut: '', duree_minutes: '' });
  const [employes, setEmployes] = useState([]);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    piece: '',
    quantite_prevue: '',
    unite: '',
    employe_id: '' // Pour assigner un employé dès la création
  });

  useEffect(() => {
    loadTaches();
    loadEmployes();
  }, [chantierId]);

  const loadTaches = async () => {
    try {
      setLoading(true);
      const data = await tacheService.getTachesByChantier(chantierId);
      setTaches(data);
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployes = async () => {
    try {
      const data = await employeService.getEmployes();
      setEmployes(data);
    } catch (error) {
      console.error('Erreur chargement employés:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTache) {
        await tacheService.updateTache(chantierId, editingTache.id, {
          nom: formData.nom,
          description: formData.description,
          piece: formData.piece,
          quantite_prevue: formData.quantite_prevue,
          unite: formData.unite
        });
        toast.success('Tâche modifiée avec succès');
      } else {
        const tacheData = {
          nom: formData.nom,
          description: formData.description,
          piece: formData.piece,
          quantite_prevue: formData.quantite_prevue,
          unite: formData.unite
        };
        const newTache = await tacheService.createTache(chantierId, tacheData);

        // Assigner l'employé si sélectionné
        if (formData.employe_id) {
          await tacheService.assignEmploye(chantierId, newTache.id, formData.employe_id);
        }

        toast.success('Tâche créée avec succès');
      }

      setShowModal(false);
      setFormData({ nom: '', description: '', piece: '', quantite_prevue: '', unite: '', employe_id: '' });
      setEditingTache(null);
      loadTaches();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement de la tâche');
    }
  };

  const handleEdit = (tache) => {
    setEditingTache(tache);
    setFormData({
      nom: tache.nom,
      description: tache.description || '',
      piece: tache.piece || '',
      quantite_prevue: tache.quantite_prevue || '',
      unite: tache.unite || '',
      employe_id: ''
    });
    setShowModal(true);
  };

  const handleDelete = (tacheId) => {
    setSelectedTache(tacheId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await tacheService.deleteTache(chantierId, selectedTache);
      toast.success('Tâche supprimée avec succès');
      setShowDeleteModal(false);
      setSelectedTache(null);
      loadTaches();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression de la tâche');
    }
  };

  const handleChangeStatus = async (tacheId, newStatus) => {
    try {
      await tacheService.updateTache(chantierId, tacheId, { statut: newStatus });
      toast.success('Statut mis à jour');
      loadTaches();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleCreateFromDevis = () => {
    setShowCreateFromDevisModal(true);
  };

  const handleConfirmCreateFromDevis = async () => {
    try {
      setShowCreateFromDevisModal(false);
      const result = await tacheService.createTachesFromDevis(chantierId);
      toast.success(result.message);
      loadTaches();
    } catch (error) {
      console.error('Erreur:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la création des tâches';
      toast.error(errorMsg);
    }
  };

  const handleAssignEmploye = async (tacheId, employeId, scheduleData = {}) => {
    try {
      await tacheService.assignEmploye(chantierId, tacheId, employeId, scheduleData);
      toast.success('Employé assigné à la tâche');
      setSchedulingEmployeId(null);
      setScheduleForm({ date_planifiee: '', heure_debut: '', duree_minutes: '' });
      loadTaches();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'assignation de l\'employé');
    }
  };

  const handleUnassignEmploye = async (tacheId, employeId) => {
    try {
      await tacheService.unassignEmploye(chantierId, tacheId, employeId);
      toast.success('Employé retiré de la tâche');
      loadTaches();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du retrait de l\'assignation');
    }
  };

  const openAssignModal = (tache) => {
    setSelectedTache(tache);
    setSchedulingEmployeId(null);
    setScheduleForm({ date_planifiee: '', heure_debut: '', duree_minutes: '' });
    setShowAssignModal(true);
  };

  const isEmployeAssigned = (tache, employeId) => {
    return tache.employes_assignes?.some(assign => assign.employe.id === employeId);
  };

  const getStatutBadge = (statut) => {
    const badges = {
      A_FAIRE: { color: 'bg-gray-100 text-gray-700', label: 'À faire' },
      EN_COURS: { color: 'bg-blue-100 text-blue-700', label: 'En cours' },
      TERMINEE: { color: 'bg-green-100 text-green-700', label: 'Terminée' }
    };
    return badges[statut] || badges.A_FAIRE;
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Tâches du chantier</h2>
        <div className="flex gap-3">
          {chantier?.devis && taches.length === 0 && (
            <button
              onClick={handleCreateFromDevis}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Créer depuis devis
            </button>
          )}
          <button
            onClick={() => {
              setEditingTache(null);
              setFormData({ nom: '', description: '', piece: '', quantite_prevue: '', unite: '', employe_id: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une tâche
          </button>
        </div>
      </div>

      {taches.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium">Aucune tâche</p>
          <p className="text-sm mt-2">Ajoutez des tâches pour organiser le travail sur ce chantier</p>
        </div>
      ) : (
        <div className="space-y-4">
          {taches.map((tache) => {
            const badge = getStatutBadge(tache.statut);
            return (
              <div key={tache.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{tache.nom}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {tache.description && (
                      <p className="text-gray-600 text-sm mb-3">{tache.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      {tache.piece && (
                        <span className="text-purple-600 font-medium">
                          📍 {tache.piece}
                        </span>
                      )}
                      {tache.quantite_prevue && (
                        <span>
                          Quantité: {tache.quantite_prevue} {tache.unite}
                        </span>
                      )}
                      {tache.ouvrage && (
                        <span className="text-blue-600">
                          Ouvrage: {tache.ouvrage.nom}
                        </span>
                      )}
                      {tache.badgeages && tache.badgeages.length > 0 && (
                        <span>
                          {tache.badgeages.length} badgeage{tache.badgeages.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Employés assignés */}
                    {tache.employes_assignes && tache.employes_assignes.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {tache.employes_assignes.map((assign) => (
                          <div
                            key={assign.id}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            <Users className="w-3 h-3" />
                            <span>{assign.employe.user.prenom} {assign.employe.user.nom}</span>
                            {assign.date_planifiee && (
                              <span className="ml-1 text-blue-500 flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(assign.date_planifiee).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                {assign.heure_debut && ` ${assign.heure_debut}`}
                              </span>
                            )}
                            <button
                              onClick={() => handleUnassignEmploye(tache.id, assign.employe.id)}
                              className="ml-1 hover:text-blue-900"
                              title="Retirer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openAssignModal(tache)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Assigner un employé"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    {(tache.statut === 'A_FAIRE' || tache.statut === 'EN_COURS') && (
                      <button
                        onClick={() => handleChangeStatus(tache.id, 'TERMINEE')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Terminer"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {tache.statut !== 'TERMINEE' && (
                      <>
                        <button
                          onClick={() => handleEdit(tache)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tache.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ajouter/Modifier Tâche */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingTache ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la tâche *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pièce concernée
                </label>
                <input
                  type="text"
                  value={formData.piece}
                  onChange={(e) => setFormData({ ...formData, piece: e.target.value })}
                  placeholder="Ex: Salon, Cuisine, Salle de bain..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {!editingTache && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigner à un employé (optionnel)
                  </label>
                  <select
                    value={formData.employe_id}
                    onChange={(e) => setFormData({ ...formData, employe_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Aucun employé assigné</option>
                    {employes.map((employe) => (
                      <option key={employe.id} value={employe.id}>
                        {employe.user.prenom} {employe.user.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantite_prevue}
                    onChange={(e) => setFormData({ ...formData, quantite_prevue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unité
                  </label>
                  <input
                    type="text"
                    value={formData.unite}
                    onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                    placeholder="M², ML, U..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTache(null);
                    setFormData({ nom: '', description: '', piece: '', quantite_prevue: '', unite: '', employe_id: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingTache ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Assigner Employés */}
      {showAssignModal && selectedTache && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Assigner des employés
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Tâche: <strong>{selectedTache.nom}</strong>
            </p>

            {employes && employes.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {employes.map((employe) => {
                  const isAssigned = isEmployeAssigned(selectedTache, employe.id);
                  const isScheduling = schedulingEmployeId === employe.id;
                  return (
                    <div key={employe.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {employe.user.prenom} {employe.user.nom}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAssigned && (
                            <button
                              onClick={() => handleUnassignEmploye(selectedTache.id, employe.id)}
                              className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            >
                              Retirer
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (isScheduling) {
                                setSchedulingEmployeId(null);
                              } else {
                                setSchedulingEmployeId(employe.id);
                                setScheduleForm({ date_planifiee: '', heure_debut: '', duree_minutes: '' });
                              }
                            }}
                            className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                              isScheduling
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {isAssigned ? 'Replanifier' : 'Assigner'}
                          </button>
                        </div>
                      </div>
                      {isScheduling && (
                        <div className="px-3 pb-3 bg-gray-50 border-t border-gray-100 space-y-2">
                          <p className="text-xs text-gray-500 pt-2 font-medium">Créneau (optionnel)</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Date</label>
                              <input
                                type="date"
                                value={scheduleForm.date_planifiee}
                                onChange={e => setScheduleForm(f => ({ ...f, date_planifiee: e.target.value }))}
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Heure début</label>
                              <input
                                type="time"
                                value={scheduleForm.heure_debut}
                                onChange={e => setScheduleForm(f => ({ ...f, heure_debut: e.target.value }))}
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Durée (minutes)</label>
                            <input
                              type="number"
                              min="15"
                              step="15"
                              placeholder="Ex: 120"
                              value={scheduleForm.duree_minutes}
                              onChange={e => setScheduleForm(f => ({ ...f, duree_minutes: e.target.value }))}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <button
                            onClick={() => handleAssignEmploye(selectedTache.id, employe.id, {
                              date_planifiee: scheduleForm.date_planifiee || undefined,
                              heure_debut: scheduleForm.heure_debut || undefined,
                              duree_minutes: scheduleForm.duree_minutes ? parseInt(scheduleForm.duree_minutes) : undefined
                            })}
                            className="w-full py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors font-medium"
                          >
                            Confirmer l'assignation
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm">Aucun employé disponible</p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedTache(null);
                  setSchedulingEmployeId(null);
                  setScheduleForm({ date_planifiee: '', heure_debut: '', duree_minutes: '' });
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Confirmer la suppression
            </h2>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTache(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Création depuis Devis */}
      {showCreateFromDevisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Créer les tâches depuis le devis
            </h2>
            <p className="text-gray-600 mb-6">
              Voulez-vous créer automatiquement les tâches depuis les lignes du devis ? Les ouvrages du devis seront convertis en tâches.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateFromDevisModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmCreateFromDevis}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Créer les tâches
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
