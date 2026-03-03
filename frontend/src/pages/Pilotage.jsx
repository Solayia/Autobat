import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Target, Briefcase, FileText,
  AlertCircle, CheckCircle, Clock, Settings, BarChart2
} from 'lucide-react';
import dashboardService from '../services/dashboardService';
import devisService from '../services/devisService';
import chantierService from '../services/chantierService';
import factureService from '../services/factureService';
import settingsService from '../services/settingsService';

export default function Pilotage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('MOIS');
  const [kpis, setKpis] = useState({});
  const [devis, setDevis] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [factures, setFactures] = useState([]);
  const [objectifs, setObjectifs] = useState({});

  useEffect(() => {
    loadAll();
  }, [periode]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [dash, devisData, chantiersData, facturesData, settingsData] = await Promise.all([
        dashboardService.getDashboard(periode),
        devisService.getDevis({ limit: 100 }),
        chantierService.getChantiers({ limit: 100 }),
        factureService.getFactures({ limit: 100 }),
        settingsService.getSettings(),
      ]);
      setKpis(dash.kpis || {});
      setDevis(devisData.devis || devisData.data || devisData || []);
      setChantiers(chantiersData.chantiers || chantiersData.data || chantiersData || []);
      setFactures(facturesData.factures || facturesData.data || facturesData || []);
      setObjectifs(settingsData || {});
    } catch (e) {
      console.error('Erreur chargement pilotage:', e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
  const pct = (v, max) => max > 0 ? Math.min(Math.round((v / max) * 100), 100) : 0;

  // Couleur barre de progression selon le % atteint
  const barColor = (ratio) => {
    if (ratio >= 100) return 'from-green-400 to-green-600';
    if (ratio >= 70) return 'from-blue-400 to-blue-600';
    if (ratio >= 40) return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  // Badge statut
  const StatusBadge = ({ ratio }) => {
    if (ratio >= 100) return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Objectif atteint</span>;
    if (ratio >= 70) return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">En bonne voie</span>;
    if (ratio >= 40) return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">À surveiller</span>;
    return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">En retard</span>;
  };

  // Pipeline devis
  const devisBrouillon = devis.filter(d => d.statut === 'BROUILLON').length;
  const devisEnvoyes   = devis.filter(d => d.statut === 'ENVOYE').length;
  const devisAcceptes  = devis.filter(d => d.statut === 'ACCEPTE').length;
  const devisRefuses   = devis.filter(d => d.statut === 'REFUSE').length;
  const montantAccepte = devis.filter(d => d.statut === 'ACCEPTE').reduce((s, d) => s + (d.montant_ttc || 0), 0);

  // Chantiers par statut
  const chantiersActifs    = chantiers.filter(c => c.statut === 'EN_COURS');
  const chantiersTermines  = chantiers.filter(c => c.statut === 'TERMINE');
  const chantiersPlannifes = chantiers.filter(c => c.statut === 'PLANIFIE');

  // Factures en retard
  const now = new Date();
  const facturesEnRetard = factures.filter(f =>
    ['EN_ATTENTE', 'PARTIEL'].includes(f.statut_paiement) &&
    f.date_echeance && new Date(f.date_echeance) < now
  );

  // Trésorerie
  const caFacture  = kpis.ca_facture_ttc || 0;
  const caEncaisse = kpis.ca_encaisse || 0;
  const caAttente  = kpis.montant_en_attente || 0;
  const tauxEnc    = caFacture > 0 ? Math.round((caEncaisse / caFacture) * 100) : 0;
  const tauxAcc    = kpis.taux_acceptation_devis || 0;

  // Objectifs calculés
  const objCaMensuel    = objectifs.objectif_ca_mensuel || null;
  const objCaAnnuel     = objectifs.objectif_ca_annuel || null;
  const objTauxEnc      = objectifs.objectif_taux_encaissement || null;
  const objTauxAcc      = objectifs.objectif_taux_acceptation || null;
  const objDelai        = objectifs.objectif_delai_paiement || null;

  // CA cible selon la période
  const caObjectif = periode === 'ANNEE' ? objCaAnnuel : objCaMensuel;
  const caLabel    = periode === 'ANNEE' ? 'CA annuel' : 'CA mensuel';

  // Indicateurs objectifs (on affiche seulement ceux qui ont un objectif défini)
  const indicateurs = [
    caObjectif && {
      label: caLabel + ' TTC',
      realise: caFacture,
      cible: caObjectif,
      ratio: pct(caFacture, caObjectif),
      fmtRealise: fmt(caFacture),
      fmtCible: fmt(caObjectif),
      unite: '€'
    },
    objTauxEnc && {
      label: "Taux d'encaissement",
      realise: tauxEnc,
      cible: objTauxEnc,
      ratio: pct(tauxEnc, objTauxEnc),
      fmtRealise: `${tauxEnc}%`,
      fmtCible: `${objTauxEnc}%`,
      unite: '%'
    },
    objTauxAcc && {
      label: "Taux d'acceptation devis",
      realise: tauxAcc,
      cible: objTauxAcc,
      ratio: pct(tauxAcc, objTauxAcc),
      fmtRealise: `${tauxAcc}%`,
      fmtCible: `${objTauxAcc}%`,
      unite: '%'
    },
  ].filter(Boolean);

  const hasObjectifs = indicateurs.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-xl py-3 sm:py-5">
        <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm flex-shrink-0">
                <BarChart2 className="w-5 h-5 sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-3xl font-bold">Pilotage</h1>
                <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">Vue de gestion pour le gérant</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <div className="flex gap-1 sm:gap-2">
                {['MOIS', 'ANNEE'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriode(p)}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      periode === p ? 'bg-white text-primary-600' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {p === 'MOIS' ? 'Ce mois' : 'Cette année'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate('/settings?tab=objectifs')}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
                title="Configurer les objectifs"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Objectifs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

      {/* Section Objectifs vs Réalisé */}
      {hasObjectifs ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-5 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" /> Objectifs vs Réalisé — {periode === 'MOIS' ? 'ce mois' : 'cette année'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {indicateurs.map(ind => (
              <div key={ind.label} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">{ind.label}</p>
                  <StatusBadge ratio={ind.ratio} />
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-2xl font-bold text-gray-900">{ind.fmtRealise}</span>
                  <span className="text-sm text-gray-400 mb-0.5">/ {ind.fmtCible}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full bg-gradient-to-r ${barColor(ind.ratio)} transition-all duration-700`}
                    style={{ width: `${ind.ratio}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{ind.ratio}% de l'objectif</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 border border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 sm:p-3 bg-blue-50 rounded-xl flex-shrink-0">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Aucun objectif défini</p>
                <p className="text-xs text-gray-400 mt-0.5">Définissez vos objectifs pour suivre votre progression ici.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/settings?tab=objectifs')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Définir mes objectifs
            </button>
          </div>
        </div>
      )}

      {/* Section 1 — Trésorerie */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-5 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-green-600" /> Trésorerie — {periode === 'MOIS' ? 'ce mois' : 'cette année'}
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-6">
          <div className="text-center p-2 sm:p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">CA facturé</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900">{fmt(caFacture)}</p>
            <p className="text-xs text-gray-400 mt-1 hidden sm:block">total émis sur la période</p>
          </div>
          <div className="text-center p-2 sm:p-4 bg-green-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">Encaissé</p>
            <p className="text-base sm:text-2xl font-bold text-green-700">{fmt(caEncaisse)}</p>
            <p className="text-xs text-gray-400 mt-1 hidden sm:block">argent reçu en banque</p>
          </div>
          <div className="text-center p-2 sm:p-4 bg-orange-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">À encaisser</p>
            <p className="text-base sm:text-2xl font-bold text-orange-600">{fmt(caAttente)}</p>
            <p className="text-xs text-gray-400 mt-1 hidden sm:block">non encore réglées</p>
          </div>
        </div>
        {/* Barre de progression encaissement */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Taux d'encaissement</span>
            <span className="font-semibold text-gray-700">{tauxEnc}%
              {objTauxEnc && <span className="text-gray-400 font-normal"> / obj. {objTauxEnc}%</span>}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
              style={{ width: `${tauxEnc}%` }}
            />
            {/* Marqueur objectif */}
            {objTauxEnc && objTauxEnc <= 100 && (
              <div
                className="absolute top-0 h-4 w-0.5 bg-blue-600 opacity-70"
                style={{ left: `${objTauxEnc}%` }}
                title={`Objectif : ${objTauxEnc}%`}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 €</span><span>{fmt(caFacture)}</span>
          </div>
        </div>
      </div>

      {/* Section 2 — Pipeline commercial */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-5 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" /> Pipeline commercial
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-5">
          {[
            { label: 'Brouillons', count: devisBrouillon, color: 'bg-gray-100 text-gray-600', desc: 'en préparation' },
            { label: 'Envoyés', count: devisEnvoyes, color: 'bg-blue-100 text-blue-700', desc: 'en attente de réponse' },
            { label: 'Acceptés', count: devisAcceptes, color: 'bg-green-100 text-green-700', desc: 'signés par le client' },
            { label: 'Refusés', count: devisRefuses, color: 'bg-red-100 text-red-700', desc: 'non retenus' },
          ].map(({ label, count, color, desc }) => (
            <div key={label} className={`rounded-xl p-2 sm:p-4 text-center ${color.split(' ')[0]}`}>
              <p className={`text-xl sm:text-3xl font-bold ${color.split(' ')[1]}`}>{count}</p>
              <p className={`text-xs sm:text-sm font-medium mt-1 ${color.split(' ')[1]}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-3 sm:p-4 bg-purple-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">Montant total accepté</p>
            <p className="text-xs text-gray-400">valeur des devis signés</p>
          </div>
          <p className="text-xl font-bold text-purple-700">{fmt(montantAccepte)}</p>
        </div>
      </div>

      {/* Section 3 — Chantiers */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-5 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-orange-600" /> Suivi des chantiers
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-5">
          {[
            { label: 'Planifiés', count: chantiersPlannifes.length, color: 'bg-blue-50 text-blue-700', desc: 'à démarrer' },
            { label: 'En cours', count: chantiersActifs.length, color: 'bg-orange-50 text-orange-700', desc: 'en exécution' },
            { label: 'Terminés', count: chantiersTermines.length, color: 'bg-green-50 text-green-700', desc: 'livrés' },
          ].map(({ label, count, color, desc }) => (
            <div key={label} className={`rounded-xl p-2 sm:p-4 text-center ${color.split(' ')[0]}`}>
              <p className={`text-xl sm:text-3xl font-bold ${color.split(' ')[1]}`}>{count}</p>
              <p className={`text-xs sm:text-sm font-medium mt-1 ${color.split(' ')[1]}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{desc}</p>
            </div>
          ))}
        </div>
        {chantiersActifs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Chantiers en cours</p>
            {chantiersActifs.slice(0, 4).map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/chantiers/${c.id}`)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.nom}</p>
                  <p className="text-xs text-gray-400">{c.client?.nom || c.client_nom || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">{fmt(c.budget_ht || c.montant_ht)}</p>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">En cours</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4 — Alertes */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-5 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" /> Alertes
          </h2>
          {facturesEnRetard.length === 0 && devisEnvoyes === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Aucune alerte en cours — tout est à jour !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {facturesEnRetard.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-700">
                      {facturesEnRetard.length} facture{facturesEnRetard.length > 1 ? 's' : ''} en retard de paiement
                    </p>
                  </div>
                  {facturesEnRetard.slice(0, 3).map(f => (
                    <div
                      key={f.id}
                      onClick={() => navigate(`/factures/${f.id}`)}
                      className="flex justify-between text-xs text-red-600 cursor-pointer hover:underline mt-1"
                    >
                      <span>{f.numero_facture} — {f.client_nom}</span>
                      <span className="font-medium">{fmt(f.reste_a_payer)}</span>
                    </div>
                  ))}
                </div>
              )}
              {devisEnvoyes > 0 && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-orange-700">
                      {devisEnvoyes} devis en attente de réponse client
                    </p>
                  </div>
                  <p className="text-xs text-orange-500 mt-1">Pensez à relancer vos clients</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
