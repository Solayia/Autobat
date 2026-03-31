import { Sparkles, CalendarCheck, Search, Mail, Cloud, ExternalLink, Phone } from 'lucide-react';

const offers = [
  {
    id: 'onboarding',
    icon: CalendarCheck,
    color: 'blue',
    badge: '490 € HT',
    badgeColor: 'bg-blue-100 text-blue-700',
    title: 'Accompagnement démarrage',
    subtitle: '3 mois pour bien démarrer',
    description:
      'Un expert Autobat vous accompagne pendant 3 mois pour paramétrer votre compte, former vos équipes, importer votre catalogue et optimiser vos premiers chantiers.',
    details: [
      'Paramétrage complet de votre compte',
      'Formation personnalisée (gérant + équipe)',
      'Import de votre catalogue de prix',
      '3 visios de suivi mensuel',
      'Support prioritaire pendant 3 mois',
    ],
    cta: 'Je suis intéressé',
  },
  {
    id: 'audit',
    icon: Search,
    color: 'green',
    badge: 'Gratuit',
    badgeColor: 'bg-green-100 text-green-700',
    title: 'Audit digital gratuit',
    subtitle: 'Diagnostiquez votre maturité numérique',
    description:
      'En 45 minutes, un expert analyse vos outils actuels (devis, suivi chantier, facturation) et vous propose un plan d\'action concret pour gagner du temps.',
    details: [
      'Analyse de vos processus actuels',
      'Comparatif avec les bonnes pratiques du secteur BTP',
      'Plan d\'action personnalisé',
      'Sans engagement',
    ],
    cta: 'Réserver mon audit',
  },
  {
    id: 'email',
    icon: Mail,
    color: 'purple',
    badge: 'Sur devis',
    badgeColor: 'bg-purple-100 text-purple-700',
    title: 'Email professionnel',
    subtitle: 'contact@votreentreprise.fr',
    description:
      'Envoyez vos devis et factures depuis une adresse email à votre nom de domaine. Plus professionnel, meilleure délivrabilité, image de marque cohérente.',
    details: [
      'Nom de domaine professionnel',
      'Boîtes mail illimitées',
      'Intégration avec Autobat',
      'Configuration incluse',
    ],
    cta: 'Obtenir un devis',
  },
  {
    id: 'cloud',
    icon: Cloud,
    color: 'orange',
    badge: 'Sur devis',
    badgeColor: 'bg-orange-100 text-orange-700',
    title: 'Stockage cloud dossiers',
    subtitle: 'Tous vos documents en sécurité',
    description:
      'Un espace de stockage cloud dédié pour archiver vos dossiers chantiers, plans, photos, contrats et documents administratifs. Accessible depuis n\'importe quel appareil.',
    details: [
      'Stockage sécurisé et sauvegardé',
      'Partage avec votre équipe',
      'Accès mobile inclus',
      'Organisation par chantier',
    ],
    cta: 'En savoir plus',
  },
];

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    btn: 'bg-blue-600 hover:bg-blue-700',
    dot: 'text-blue-500',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    btn: 'bg-green-600 hover:bg-green-700',
    dot: 'text-green-500',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    btn: 'bg-purple-600 hover:bg-purple-700',
    dot: 'text-purple-500',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    btn: 'bg-orange-600 hover:bg-orange-700',
    dot: 'text-orange-500',
  },
};

export default function BonsPlans() {
  const handleCta = (offerId) => {
    window.open('mailto:contact@solayia.fr?subject=Intérêt pour : ' + offers.find(o => o.id === offerId)?.title, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Les bons plans</h1>
            <p className="text-sm text-gray-500">Services complémentaires pour aller plus loin</p>
          </div>
        </div>
        <p className="text-gray-600 mt-4 text-sm max-w-2xl">
          En plus de votre abonnement Autobat, découvrez nos services pour accélérer votre digitalisation, gagner du temps et projeter une image professionnelle.
        </p>
      </div>

      {/* Offers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offers.map((offer) => {
          const c = colorMap[offer.color];
          const Icon = offer.icon;
          return (
            <div
              key={offer.id}
              className={`rounded-2xl border ${c.border} ${c.bg} p-6 flex flex-col`}
            >
              {/* Top */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${c.iconColor}`} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${offer.badgeColor}`}>
                  {offer.badge}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-base font-bold text-gray-900 mb-0.5">{offer.title}</h3>
              <p className="text-xs font-medium text-gray-500 mb-3">{offer.subtitle}</p>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{offer.description}</p>

              {/* Details */}
              <ul className="space-y-1.5 mb-6 flex-1">
                {offer.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className={`mt-0.5 text-lg leading-none ${c.dot}`}>•</span>
                    {d}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCta(offer.id)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 ${c.btn}`}
              >
                {offer.cta}
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Contact banner */}
      <div className="mt-8 bg-gray-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold">Une question ? On vous rappelle.</p>
          <p className="text-gray-400 text-sm mt-0.5">L'équipe Autobat est disponible du lundi au vendredi, 9h–18h.</p>
        </div>
        <a
          href="tel:+33000000000"
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Phone className="w-4 h-4" />
          Nous contacter
        </a>
      </div>
    </div>
  );
}
