import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import {
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  MapPin,
  FileText,
  BarChart2,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200 py-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center w-full text-left gap-4"
      >
        <span className="font-semibold text-gray-900 text-lg">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <p className="mt-3 text-gray-600 leading-relaxed">{answer}</p>}
    </div>
  )
}

function BrowserMockup({ src, alt }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
      <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">
          autobat.pro/app
        </div>
      </div>
      <img src={src} alt={alt} className="w-full" loading="lazy" />
    </div>
  )
}

function PhoneMockup({ src, alt, mini = false }) {
  const w = mini ? 120 : 200
  const borderRadius = mini ? 28 : 44
  const innerRadius = mini ? 22 : 34
  const padding = mini ? 6 : 10
  const islandW = mini ? 44 : 70
  const islandH = mini ? 10 : 18
  const islandBarH = mini ? 20 : 30
  const homeW = mini ? 30 : 55
  const homeBarH = mini ? 14 : 22
  const btnW = mini ? 3 : 4
  const v1Top = mini ? 52 : 70
  const v1H = mini ? 18 : 24
  const v2Top = mini ? 76 : 102
  const v2H = mini ? 18 : 24
  const muteTop = mini ? 34 : 50
  const muteH = mini ? 14 : 18
  const pwrTop = mini ? 60 : 82
  const pwrH = mini ? 26 : 38
  const screenW = w - padding * 2
  const imgH = Math.round(screenW * 19.5 / 9) - islandBarH - homeBarH

  return (
    <div className="relative mx-auto" style={{ width: w }}>
      <div style={{ position: 'absolute', left: -btnW, top: v1Top, width: btnW, height: v1H, background: '#374151', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', left: -btnW, top: v2Top, width: btnW, height: v2H, background: '#374151', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', left: -btnW, top: muteTop, width: btnW, height: muteH, background: '#374151', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', right: -btnW, top: pwrTop, width: btnW, height: pwrH, background: '#374151', borderRadius: '0 3px 3px 0' }} />
      <div style={{
        background: 'linear-gradient(145deg, #1f2937, #0f172a)',
        borderRadius,
        padding,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset, 0 25px 50px rgba(0,0,0,0.55)',
      }}>
        <div style={{ borderRadius: innerRadius, overflow: 'hidden', background: '#000', position: 'relative' }}>
          <div style={{ background: '#000', height: islandBarH, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: islandW, height: islandH, background: '#111', borderRadius: 99, border: '1px solid #2d2d2d' }} />
          </div>
          <div style={{ width: '100%', height: imgH, overflow: 'hidden', flexShrink: 0 }}>
            <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
          </div>
          <div style={{ background: '#000', height: homeBarH, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: homeW, height: 4, background: 'rgba(255,255,255,0.38)', borderRadius: 99 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: <MapPin className="w-8 h-8 text-secondary-500" />,
    title: 'Badgeage automatique. Zéro papier.',
    description:
      "Vos équipes arrivent sur le chantier, Autobat enregistre grâce à leur téléphone portable. GPS, heure d'arrivée, heure de départ : tout est capturé automatiquement, même sans réseau.",
    bullets: [
      'Fonctionnement hors ligne',
      'Synchronisation automatique',
      'Historique complet par employé',
      'Disponible sur mobile et tablette',
    ],
    phoneOnly: true,
    mobile: '/screenshots/mobile-chantier-detail.png',
  },
  {
    icon: <FileText className="w-8 h-8 text-secondary-500" />,
    title: "Des devis qui s'améliorent à chaque chantier.",
    description:
      "Autobat vous aide à ajuster vos prix en fonction du temps réellement passé sur vos chantiers précédents. Plus vous l'utilisez, plus vos devis seront précis. Plus vos devis sont précis, plus vous gagnez.",
    bullets: [
      'Catalogue intelligent auto-apprenant',
      'Devis PDF professionnels',
      'Suivi accepté / refusé / en attente',
    ],
    phoneOnly: false,
    desktop: '/screenshots/desktop-devis.png',
    mobile: '/screenshots/mobile-devis.png',
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-secondary-500" />,
    title: "Sachez en temps réel si vous gagnez de l'argent.",
    description:
      "Visualisez votre chiffre d'affaires chantier par chantier. Anticipez les dérives avant qu'il ne soit trop tard. Identifiez les chantiers les plus rentables et faites-en votre standard.",
    bullets: [
      'Tableau de bord en temps réel',
      'Comparatif prévu / réel',
      "Analyse de rentabilité par type d'ouvrage",
    ],
    phoneOnly: false,
    desktop: '/screenshots/desktop-pilotage.png',
    mobile: '/screenshots/mobile-pilotage.png',
  },
]

const FAQS = [
  {
    question: 'Dois-je saisir tout mon catalogue manuellement ?',
    answer:
      "Non. Un catalogue de base BTP est inclus à l'inscription. Vous l'affinez au fil des chantiers, et Autobat ajuste automatiquement vos prix selon vos temps réels.",
  },
  {
    question: "Ça marche sans connexion internet sur un chantier ?",
    answer:
      "Oui. L'application fonctionne entièrement hors-ligne. Les badgeages sont stockés localement et synchronisés automatiquement au retour du réseau.",
  },
  {
    question: 'Les factures sont-elles conformes à la législation française ?',
    answer:
      'Oui. Numérotation séquentielle obligatoire, mentions légales complètes, TVA 20%, archivage 10 ans. Conçu pour les artisans et entreprises du BTP en France.',
  },
  {
    question: "Puis-je résilier à tout moment ?",
    answer:
      "Oui, sans engagement, sans pénalité. Vous pouvez annuler depuis votre espace client à tout moment. L'accès reste actif jusqu'à la fin de la période payée.",
  },
  {
    question: "Combien de temps dure l'essai gratuit ?",
    answer:
      "7 jours. Une carte bancaire est requise à l'inscription mais aucun débit n'est effectué pendant l'essai. Vous êtes prélevé uniquement à partir du 8ème jour si vous ne résiliez pas.",
  },
  {
    question: 'Combien ça coûte avec mes employés ?',
    answer:
      '100 € HT/mois pour le compte gérant, puis 20 € HT/mois par employé supplémentaire. 5 personnes = 180 €/mois. 10 personnes = 280 €/mois. Pas de frais cachés.',
  },
  {
    question: 'Pourquoi la rentabilité est-elle difficile à piloter dans le bâtiment ?',
    answer:
      "Le pilotage de la rentabilité est complexe car il dépend fortement du temps humain, souvent mal évalué ou non suivi avec précision. Les aléas de chantier et le manque de données en temps réel rendent difficile l'ajustement des marges au cours d'un projet.",
  },
  {
    question: 'Comment mieux estimer le temps dans un devis BTP ?',
    answer:
      "Une estimation fiable repose sur l'historique réel des chantiers précédents. En analysant le temps réellement passé par tâche, il devient possible d'ajuster progressivement ses prix et d'améliorer la précision des devis.",
  },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo — icône "A" uniquement, sans texte */}
            <div className="flex items-center">
              <img src="/Logo_Autobat.png" alt="Autobat" className="h-8 w-auto" />
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[
                ['Fonctionnalités', 'features'],
                ['Tarif', 'pricing'],
                ['FAQ', 'faq'],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-gray-600 hover:text-primary-600 font-medium px-4 py-2 transition-colors"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="bg-secondary-500 hover:bg-secondary-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Essai gratuit →
              </Link>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
            {[
              ['Fonctionnalités', 'features'],
              ['Tarif', 'pricing'],
              ['FAQ', 'faq'],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left text-gray-600 font-medium py-2"
              >
                {label}
              </button>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                className="text-center border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-lg"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="text-center bg-secondary-500 text-white font-semibold px-4 py-2.5 rounded-lg"
              >
                Démarrer l'essai gratuit →
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-primary-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-primary-600 leading-tight mb-6">
                Maîtriser son temps pour gagner plus d'argent.
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                Transformer chaque heure passée sur un chantier en données stratégiques pour produire des devis précis et piloter ses marges en temps réel.
              </p>
              <div className="mb-6">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Démarrer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                7 jours gratuits · CB requise · Résiliable à tout moment
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Données sécurisées
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Application mobile incluse
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Facturation légale France
                </span>
              </div>
            </div>

            {/* Right — inchangé */}
            <div className="relative">
              <BrowserMockup src="/screenshots/desktop-dashboard.png" alt="Dashboard Autobat desktop" />
              <div className="absolute -bottom-8 -right-4 hidden lg:block" style={{ width: 120 }}>
                <PhoneMockup mini src="/screenshots/mobile-dashboard.png" alt="Dashboard Autobat mobile" />
              </div>
              <div className="absolute -bottom-4 left-4 bg-white rounded-xl shadow-lg border border-gray-100 p-3 flex items-center gap-3 lg:left-8">
                <div className="bg-green-100 rounded-full p-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Marge moyenne</p>
                  <p className="font-bold text-gray-900 text-sm">+23% vs estimé</p>
                </div>
              </div>
              <div className="absolute -top-4 right-4 bg-white rounded-xl shadow-lg border border-gray-100 p-3 flex items-center gap-3 lg:right-44">
                <div className="bg-blue-100 rounded-full p-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Badgeages actifs</p>
                  <p className="font-bold text-gray-900 text-sm">12 employés</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Le casse-tête du manque de visibilité sur le temps humain
          </h2>
          <p className="text-primary-200 text-lg mb-12 max-w-3xl mx-auto">
            Vous gérez vos chantiers avec passion, mais sans données précises sur le temps réel passé, vous naviguez à l'aveugle.
            Chaque heure non comptabilisée est une marge qui s'envole.
            Chaque estimation approximative est un risque pour votre rentabilité.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Clock className="w-7 h-7 text-secondary-400" />,
                text: 'Impossible de savoir combien de temps prend réellement chaque tâche',
              },
              {
                icon: <FileText className="w-7 h-7 text-secondary-400" />,
                text: 'Des devis basés sur des estimations approximatives',
              },
              {
                icon: <TrendingDown className="w-7 h-7 text-secondary-400" />,
                text: "Des marges qui s'évaporent sans comprendre pourquoi",
              },
              {
                icon: <AlertTriangle className="w-7 h-7 text-secondary-400" />,
                text: 'Découverte des dépassements… trop tard',
              },
            ].map((item, i) => (
              <div key={i} className="bg-primary-700/50 rounded-2xl p-6 flex items-start gap-4 text-left">
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <p className="text-white font-semibold text-lg leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex items-center justify-center gap-4">
            <div className="h-px bg-primary-400 flex-1 max-w-xs" />
            <p className="text-secondary-400 font-bold text-lg whitespace-nowrap">
              Autobat résout exactement ça.
            </p>
            <div className="h-px bg-primary-400 flex-1 max-w-xs" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-600 mb-4">
              Tout ce dont vous avez besoin pour maîtriser vos chantiers, rien de superflu.
            </h2>
            <p className="text-gray-600 text-lg">
              Conçu pour les artisans et les chefs d'entreprise du bâtiment, de l'auto-entrepreneur à l'entreprise de 50 personnes.
            </p>
          </div>

          <div className="space-y-24">
            {FEATURES.map((feature, idx) => (
              <div key={feature.title} className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Text */}
                <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-primary-600 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-3 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual */}
                <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
                  {feature.phoneOnly ? (
                    /* Badgeage : uniquement téléphone portable */
                    <div className="flex justify-center py-8">
                      <PhoneMockup src={feature.mobile} alt={feature.title + ' mobile'} />
                    </div>
                  ) : (
                    <div className="relative">
                      <BrowserMockup src={feature.desktop} alt={feature.title + ' desktop'} />
                      <div className="absolute -bottom-6 -right-4 hidden sm:block" style={{ width: 110 }}>
                        <PhoneMockup mini src={feature.mobile} alt={feature.title + ' mobile'} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-600 mb-4">
              Opérationnel en dix minutes.
            </h2>
            <p className="text-gray-600 text-lg">Pas besoin d'une formation de 3 jours.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Créez votre compte',
                desc: "Configurez votre entreprise : nom, logo, catalogue d'ouvrages.",
              },
              {
                step: '2',
                title: 'Lancez vos premiers chantiers',
                desc: "Créez votre client, générez un devis et ouvrez le chantier. Vos équipes peuvent badger dès aujourd'hui sur mobile.",
              },
              {
                step: '3',
                title: 'Laissez Autobat apprendre',
                desc: "Après chaque chantier, votre temps par tâche sera automatiquement ajusté. Vous gagnerez progressivement en précision et en rentabilité.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-600 mb-4">
              Vous payez uniquement pour les comptes que vous utilisez.
            </h2>
          </div>

          <div className="border-2 border-primary-600 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-primary-600 px-8 py-6 text-center">
              <h3 className="text-white text-2xl font-bold mb-1">Autobat Pro</h3>
              <p className="text-primary-200">Toutes les fonctionnalités incluses</p>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-end justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold text-primary-600">100 €</span>
                  <span className="text-gray-500 text-lg mb-2">HT / mois</span>
                </div>
                <p className="text-gray-500">compte gérant</p>
                <div className="mt-3 inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600">
                  <span className="font-semibold text-primary-600">+ 20 € HT / mois</span>
                  <span>par utilisateur additionnel</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {[
                  'Badgeage GPS automatique',
                  'Catalogue auto-apprenant',
                  'Devis PDF professionnels',
                  'Pilotage du chiffre d\'affaires en temps réel',
                  'Facturation légale France',
                  'Application mobile',
                  'Mode hors ligne complet',
                  'Support email',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className="block w-full text-center bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-lg"
              >
                Démarrer l'essai gratuit — 7 jours
              </Link>
              <p className="text-center text-sm text-gray-400 mt-3">
                Aucun débit pendant l'essai · Résiliable à tout moment
              </p>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-500 mb-4 text-center">Exemples :</p>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  {[
                    ['100 € HT', 'Gérant seul'],
                    ['180 € HT', '5 personnes'],
                    ['280 € HT', '10 personnes'],
                    ['380 € HT', '20 personnes'],
                  ].map(([price, label]) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="font-bold text-primary-600 text-sm">{price}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-600 mb-4">
              Questions fréquentes
            </h2>
          </div>
          <div>
            {FAQS.map((faq) => (
              <FAQItem key={faq.question} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Arrêtez de travailler pour rien. Commencez à piloter.
          </h2>
          <p className="text-primary-200 text-lg mb-8">
            7 jours pour voir si Autobat change vraiment votre façon de travailler.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-xl"
          >
            Démarrer l'essai gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-primary-300 text-sm mt-4">
            CB requise · Aucun débit pendant 7 jours · Sans engagement
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center">
              <img src="/Logo_Autobat.png" alt="Autobat" className="h-7 w-auto" />
            </div>
            <div className="flex flex-wrap gap-6 text-gray-400 text-sm">
              <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">
                Fonctionnalités
              </button>
              <button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">
                Tarif
              </button>
              <button onClick={() => scrollTo('faq')} className="hover:text-white transition-colors">
                FAQ
              </button>
              <Link to="/login" className="hover:text-white transition-colors">
                Se connecter
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2026 Autobat. Tous droits réservés.</p>
            <div className="flex gap-6">
              <Link to="/cgu" className="hover:text-gray-300 transition-colors">CGU</Link>
              <Link to="/mentions-legales" className="hover:text-gray-300 transition-colors">
                Mentions légales
              </Link>
              <Link to="/confidentialite" className="hover:text-gray-300 transition-colors">
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
