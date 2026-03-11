import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Folder, Plus, Upload, Trash2, File, FileText, Image as ImageIcon, FolderOpen } from 'lucide-react';
import documentService from '../../services/documentService';

export default function DocumentsTab({ chantierId }) {
  const [documents, setDocuments] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [currentDossier, setCurrentDossier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [folderName, setFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
  }, [chantierId, currentDossier]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocumentsByChantier(chantierId, currentDossier);
      setDocuments(data.documents);
      setDossiers(data.dossiers);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 10 Mo)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 10 Mo)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);
      await documentService.uploadDocument(
        chantierId,
        selectedFile,
        currentDossier,
        uploadDescription
      );

      toast.success('Document uploadé avec succès');
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadDescription('');
      loadDocuments();
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload du document');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();

    if (!folderName) {
      toast.error('Veuillez saisir un nom de dossier');
      return;
    }

    try {
      await documentService.createFolder(chantierId, folderName);
      toast.success('Dossier créé avec succès');
      setShowFolderModal(false);
      setFolderName('');
      loadDocuments();
    } catch (error) {
      console.error('Erreur création dossier:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création du dossier');
    }
  };

  const handleDelete = async (documentId, isFolder = false) => {
    const message = isFolder
      ? 'Êtes-vous sûr de vouloir supprimer ce dossier ?'
      : 'Êtes-vous sûr de vouloir supprimer ce document ?';

    if (!confirm(message)) return;

    try {
      await documentService.deleteDocument(chantierId, documentId);
      const successMsg = isFolder ? 'Dossier supprimé avec succès' : 'Document supprimé avec succès';
      toast.error(successMsg);
      if (isFolder && currentDossier) {
        setCurrentDossier(null); // Retourner à la racine si on supprime le dossier actuel
      }
      loadDocuments();
    } catch (error) {
      console.error('Erreur suppression:', error);
      const errorMsg = error.response?.data?.message ||
        (isFolder ? 'Erreur lors de la suppression du dossier' : 'Erreur lors de la suppression du document');
      toast.error(errorMsg);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PHOTO':
        return <ImageIcon className="w-5 h-5 text-blue-600" />;
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'DOCUMENT':
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-gray-900">Documents du chantier</h2>
          {currentDossier && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <button
                onClick={() => setCurrentDossier(null)}
                className="hover:text-green-600"
              >
                Racine
              </button>
              <span>/</span>
              <span className="text-green-600 font-medium truncate">{currentDossier}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Folder className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau dossier</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Upload fichier</span>
          </button>
        </div>
      </div>

      {/* Liste des dossiers */}
      {!currentDossier && dossiers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Dossiers</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {dossiers.map((dossier) => (
              <div
                key={dossier.id}
                className="relative group flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <button
                  onClick={() => setCurrentDossier(dossier.nom)}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <FolderOpen className="w-6 h-6 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900 truncate">{dossier.nom}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(dossier.id, true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                  title="Supprimer le dossier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des documents */}
      {documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium">Aucun document</p>
          <p className="text-sm mt-2">
            {currentDossier
              ? 'Ce dossier est vide'
              : 'Uploadez des photos, PDFs, contrats et autres documents'
            }
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Fichiers ({documents.length})
          </h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.nom}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(doc.taille_bytes)}</span>
                      <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                      {doc.description && <span className="truncate">{doc.description}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`${import.meta.env.VITE_API_URL}${doc.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    Ouvrir
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload un document</h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier *
                </label>

                {/* Input file caché */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Zone de drag & drop */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className={`w-full px-6 py-8 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
                    isDragging
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <Upload className={`w-12 h-12 ${isDragging ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez un fichier'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ou cliquez pour sélectionner
                      </p>
                    </div>
                  </div>
                </div>

                {selectedFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <File className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm text-green-900 font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-700">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Formats acceptés: PDF, JPG, PNG, DOCX • Max 10 Mo
                </p>
              </div>

              {currentDossier && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    Le fichier sera enregistré dans le dossier: <strong>{currentDossier}</strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ajoutez une description..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setUploadDescription('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Upload...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Créer Dossier */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nouveau dossier</h2>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du dossier *
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Ex: Photos avant travaux"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderModal(false);
                    setFolderName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
