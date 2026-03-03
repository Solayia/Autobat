import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, TrendingUp, TrendingDown, Activity, Download, Upload, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import catalogueService from '../../services/catalogueService';

export default function Catalogue() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [ouvrages, setOuvrages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    search: '',
    categorie: ''
  });

  useEffect(() => {
    loadOuvrages();
  }, [filters]);

  const loadOuvrages = async () => {
    try {
      setLoading(true);
      const data = await catalogueService.getOuvrages(filters);
      setOuvrages(data.data);
      setPagination(data.pagination);
      setCategories(data.categories);
    } catch (error) {
      console.error('Erreur chargement catalogue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters({ ...filters, page: 1, search: value });
  };

  const handleCategoryFilter = (categorie) => {
    setFilters({ ...filters, page: 1, categorie });
  };

  const handleDownloadTemplate = async () => {
    try {
      await catalogueService.downloadTemplate();
      toast.success('Modèle CSV téléchargé');
    } catch (error) {
      console.error('Erreur téléchargement template:', error);
      toast.error('Erreur lors du téléchargement du modèle');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier l'extension
    if (!file.name.endsWith('.csv')) {
      toast.error('Seuls les fichiers CSV sont acceptés');
      return;
    }

    try {
      setImporting(true);
      const result = await catalogueService.importCSV(file);

      // Afficher le résultat
      if (result.created > 0) {
        toast.success(`${result.created} ouvrage(s) importé(s)`);
        loadOuvrages(); // Recharger la liste
      }

      if (result.errors.length > 0) {
        toast.error(`${result.skipped} ligne(s) ignorée(s) (voir console)`);
        console.log('Erreurs d\'import:', result.errors);
      }

      if (result.created === 0) {
        toast.error('Aucun ouvrage n\'a pu être importé');
      }
    } catch (error) {
      console.error('Erreur import CSV:', error);
      toast.error('Erreur lors de l\'import du CSV');
    } finally {
      setImporting(false);
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getEtatInfo = (ouvrage) => {
    // Si pas encore testé
    if (!ouvrage.temps_reel_moyen || ouvrage.nb_chantiers_realises === 0) {
      return {
        color: 'bg-gray-100 text-gray-700',
        icon: Activity,
        label: 'Non testé',
        ecart: null
      };
    }

    // Calculer l'écart en % (positif = sous-estimé, négatif = sur-estimé)
    const tempsEstime = ouvrage.temps_estime_minutes || 0;
    if (tempsEstime === 0) {
      return {
        color: 'bg-gray-100 text-gray-700',
        icon: Activity,
        label: 'Données incomplètes',
        ecart: null
      };
    }

    const ecart = ((ouvrage.temps_reel_moyen - tempsEstime) / tempsEstime) * 100;

    // Moins de 10 chantiers = en apprentissage
    if (ouvrage.nb_chantiers_realises < 10) {
      return {
        color: 'bg-blue-100 text-blue-700',
        icon: TrendingUp,
        label: 'En apprentissage',
        ecart: ecart.toFixed(1)
      };
    }

    // Si écart < 10% = aligné
    if (Math.abs(ecart) < 10) {
      return {
        color: 'bg-green-100 text-green-700',
        icon: Activity,
        label: 'Aligné',
        ecart: ecart.toFixed(1)
      };
    }

    // Si écart > 0 = sous-estimé (temps réel > temps estimé)
    if (ecart > 0) {
      return {
        color: 'bg-orange-100 text-orange-700',
        icon: TrendingUp,
        label: 'Sous-estimé',
        ecart: ecart.toFixed(1)
      };
    }

    // Si écart < 0 = sur-estimé (temps réel < temps estimé)
    return {
      color: 'bg-purple-100 text-purple-700',
      icon: TrendingDown,
      label: 'Sur-estimé',
      ecart: ecart.toFixed(1)
    };
  };

  if (loading && ouvrages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-xl py-4 sm:py-5 flex items-center">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm flex-shrink-0">
                <BookOpen className="w-5 h-5 sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-3xl font-bold truncate">Catalogue de prix</h1>
                <p className="text-blue-100 mt-1 hidden sm:block">
                  {pagination.total || 0} ouvrage{pagination.total > 1 ? 's' : ''} • Auto-learning actif
                </p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-2 py-2 sm:px-4 sm:py-3 bg-white/10 text-white border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all duration-200"
                title="Modèle CSV"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Modèle CSV</span>
              </button>
              <button
                onClick={handleImportClick}
                disabled={importing}
                className="flex items-center gap-2 px-2 py-2 sm:px-4 sm:py-3 bg-white/10 text-white border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Importer CSV"
              >
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">{importing ? 'Import...' : 'Importer CSV'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => navigate('/catalogue/new')}
                className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-white text-primary-600 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" /><span className="hidden sm:inline">Nouvel ouvrage</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

      {/* Info auto-learning */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 mb-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-white/20 rounded-xl flex-shrink-0 backdrop-blur-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base mb-1">Système d'auto-learning</h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Le système suit automatiquement le temps réel constaté sur vos chantiers et vous indique
              si vos prix catalogue sont alignés avec la réalité.{' '}
              <span className="text-white font-semibold">Les prix ne sont jamais modifiés automatiquement</span>{' '}
              — c'est vous qui décidez quand les ajuster.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par code ou dénomination..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Category filter */}
          <select
            value={filters.categorie}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.nom} value={cat.nom}>
                {cat.nom} ({cat.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dénomination
                </th>
                <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix HT
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temps Est.
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temps Réel
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  État
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chantiers
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ouvrages.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    Aucun ouvrage trouvé
                  </td>
                </tr>
              ) : (
                ouvrages.map((ouvrage) => {
                  const etatInfo = getEtatInfo(ouvrage);
                  const Icon = etatInfo.icon;

                  return (
                    <tr
                      key={ouvrage.id}
                      onClick={() => navigate(`/catalogue/${ouvrage.id}/edit`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-mono font-medium text-gray-900">
                          {ouvrage.code}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          {ouvrage.denomination}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {ouvrage.categorie} • {ouvrage.unite}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(ouvrage.prix_unitaire_ht)}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-600">
                          {ouvrage.temps_estime_minutes ? (
                            <>
                              {ouvrage.temps_estime_minutes} min
                              <span className="text-xs text-gray-400 ml-1">/{ouvrage.unite}</span>
                            </>
                          ) : '-'}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {ouvrage.temps_reel_moyen ? (
                            <>
                              {Math.round(ouvrage.temps_reel_moyen)} min
                              <span className="text-xs text-gray-500 ml-1">/{ouvrage.unite}</span>
                            </>
                          ) : '-'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${etatInfo.color}`}>
                          <Icon className="w-3 h-3" />
                          <span className="hidden sm:inline">{etatInfo.label}</span>
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-600">
                          {ouvrage.nb_chantiers_realises || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.page} sur {pagination.pages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
