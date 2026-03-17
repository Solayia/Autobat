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
  Zap,
  HardHat,
  UserPlus,
  Shield,
  Lock,
  RefreshCw,
} from 'lucide-react'

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border border-white/10 rounded-2xl mb-3 overflow-hidden transition-all ${open ? 'bg-white/8' : 'bg-white/4 hover:bg-white/6'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center w-full text-left gap-4 px-6 py-5"
      >
        <span className="font-semibold text-white text-base">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-secondary-400' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-blue-100/60 leading-relaxed text-sm">{answer}</p>
        </div>
      )}
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
    mobile: '/screenshots/feature-1-mobile.png',
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
    desktop: '/screenshots/feature-2-desktop.png',
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
    desktop: '/screenshots/feature-3-desktop.png',
    mobile: '/screenshots/mobile-pilotage.png',
  },
]

const FAQS = [
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
    question: "L'essai est gratuit pendant 7 jours — et après ?",
    answer:
      "Vous renseignez votre carte bancaire à l'inscription, mais aucun prélèvement n'est effectué pendant les 7 jours d'essai. À partir du 8ème jour, l'abonnement démarre automatiquement. Si vous résiliez avant, vous ne payez rien.",
  },
  {
    question: 'Combien ça coûte avec mes employés ?',
    answer:
      "Le compte gérant coûte 100 € HT/mois. Chaque employé supplémentaire que vous ajoutez coûte 20 € HT/mois. Exemple : vous + 2 employés = 100 + 2×20 = 140 €/mois. Vous + 9 employés = 100 + 9×20 = 280 €/mois. Vous ne payez que les comptes actifs, pas plus.",
  },
  {
    question: "Autobat fonctionne-t-il pour tous les corps de métier du BTP ?",
    answer:
      "Oui. Autobat est conçu pour tous les artisans et entreprises du bâtiment : maçonnerie, plomberie, électricité, menuiserie, carrelage, peinture, couverture… Le catalogue de prestations est entièrement personnalisable selon votre métier.",
  },
  {
    question: "Comment Autobat ajuste-t-il mes prix automatiquement ?",
    answer:
      "Après chaque chantier terminé, Autobat compare le temps réel passé sur chaque prestation avec le temps estimé dans votre devis. Tous les 2 chantiers, il ajuste automatiquement vos prix unitaires pour que vos prochains devis reflètent votre réalité terrain — pas des estimations à l'aveugle.",
  },
  {
    question: "En quoi Autobat est-il différent d'un tableur Excel ?",
    answer:
      "Excel ne sait pas où sont vos équipes, ne génère pas de factures légales, ne suit pas la rentabilité en temps réel et n'apprend pas de vos chantiers. Autobat connecte le terrain (badgeage GPS), le bureau (devis, factures PDF) et le pilotage (marges, CA) dans un seul outil — accessible depuis n'importe quel téléphone, sans installation.",
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(({ question, answer }) => ({
      "@type": "Question",
      "name": question,
      "acceptedAnswer": { "@type": "Answer", "text": answer }
    }))
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Autobat",
    "url": "https://autobat.pro",
    "logo": "https://autobat.pro/images/Logo-Atuobat.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@autobat.pro",
      "contactType": "customer support",
      "availableLanguage": "French"
    },
    "areaServed": "FR",
    "description": "Logiciel SaaS de gestion de chantier pour artisans et entreprises du BTP en France."
  }

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Autobat",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "url": "https://autobat.pro",
    "description": "Logiciel de gestion chantier BTP : devis, factures légales, badgeage GPS des équipes, catalogue auto-apprenant et pilotage de rentabilité en temps réel.",
    "screenshot": "https://autobat.pro/images/Logo-Atuobat.png",
    "featureList": [
      "Création de devis BTP avec export PDF",
      "Facturation légale française",
      "Badgeage GPS des équipes en temps réel",
      "Catalogue de prix auto-apprenant",
      "Pilotage de rentabilité par chantier",
      "Fonctionne hors-ligne (PWA)"
    ],
    "offers": {
      "@type": "Offer",
      "price": "100",
      "priceCurrency": "EUR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "100",
        "priceCurrency": "EUR",
        "unitText": "MONTH"
      },
      "description": "100 € HT/mois pour le compte gérant, +20 € HT/mois par employé supplémentaire",
      "trialSpec": {
        "@type": "OfferShippingDetails",
        "shippingLabel": "Essai gratuit 7 jours"
      }
    },
    "inLanguage": "fr",
    "publisher": {
      "@type": "Organization",
      "name": "Autobat",
      "url": "https://autobat.pro"
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo — icône "A" uniquement */}
            <div className="flex items-center">
              <img src="/images/Logo-Atuobat.png" alt="Autobat" className="h-9 w-auto" />
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[
                ['Le problème', 'problem'],
                ['Fonctionnalités', 'features'],
                ['Tarifs', 'pricing'],
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
              ['Le problème', 'problem'],
              ['Fonctionnalités', 'features'],
              ['Tarifs', 'pricing'],
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
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
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
                  <CheckCircle className="w-4 h-4 text-green-500" /> Accessible sur mobile
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Facturation légale France
                </span>
              </div>
            </div>

            {/* Right — photo hero */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/hero-photo.png"
                  alt="Artisans BTP sur chantier"
                  className="w-full object-cover max-h-[620px]"
                  style={{ objectPosition: '50% 35%' }}
                  loading="eager"
                />
              </div>

              {/* Card — milieu gauche, déborde à gauche */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2.5 hidden lg:flex items-center gap-2.5">
                <div className="bg-primary-600 rounded-xl p-2 flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Marge moyenne</p>
                  <p className="text-sm font-bold text-primary-600">+23% vs estimé</p>
                </div>
              </div>

              {/* Card — haut droit, déborde à droite */}
              <div className="absolute top-6 -right-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2.5 hidden lg:flex items-center gap-2.5">
                <div className="bg-primary-600 rounded-xl p-2 flex-shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Heures suivies</p>
                  <p className="text-sm font-bold text-primary-600">100% auto</p>
                </div>
              </div>

              {/* Card — bas droit, déborde à droite */}
              <div className="absolute bottom-6 -right-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2.5 hidden lg:flex items-center gap-2.5">
                <div className="bg-secondary-500 rounded-xl p-2 flex-shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Devis généré en</p>
                  <p className="text-sm font-bold text-secondary-500">3 minutes</p>
                </div>
              </div>
            </div>
          </div>
          {/* Scroll indicator */}
          <div className="flex justify-center mt-10">
            <button
              onClick={() => scrollTo('problem')}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary-600 transition-colors"
              aria-label="Défiler vers le bas"
            >
              <span className="text-xs font-medium tracking-wide uppercase">Découvrir</span>
              <div className="flex flex-col items-center" style={{ animation: 'bounce 1.8s infinite' }}>
                <ChevronDown className="w-6 h-6" />
              </div>
            </button>
          </div>
        </div>
      </section>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>

      {/* ── PROBLEM ── */}
      <section id="problem" className="py-24 relative overflow-hidden" style={{ background: '#0d1f35' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block bg-secondary-500/20 text-secondary-400 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-secondary-500/30 mb-5">
              Autobat résout exactement ça
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-5 leading-tight">
              Le casse-tête du temps<br className="hidden lg:block" /> sur le chantier
            </h2>
            <p className="text-blue-100/80 text-lg max-w-2xl mx-auto leading-relaxed">
              Sans données précises sur le temps réel, vous naviguez à l'aveugle.
              Chaque heure non comptabilisée est une marge qui s'envole.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-5 mb-14">
            {[
              {
                num: '01',
                icon: <Clock className="w-6 h-6 text-secondary-400" />,
                title: 'Temps invisible',
                text: 'Impossible de savoir combien de temps prend réellement chaque tâche sur le terrain.',
              },
              {
                num: '02',
                icon: <FileText className="w-6 h-6 text-secondary-400" />,
                title: 'Devis approximatifs',
                text: "Vos prix sont basés sur des estimations à l'intuition, pas sur vos vrais historiques.",
              },
              {
                num: '03',
                icon: <TrendingDown className="w-6 h-6 text-secondary-400" />,
                title: "Marges qui s'évaporent",
                text: 'Les écarts entre prévu et réel grignotent votre rentabilité sans que vous le voyiez venir.',
              },
              {
                num: '04',
                icon: <AlertTriangle className="w-6 h-6 text-secondary-400" />,
                title: 'Alerte trop tardive',
                text: 'Vous découvrez les dépassements une fois le chantier terminé — quand il est trop tard.',
              },
            ].map((item) => (
              <div key={item.num} className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-secondary-500/40 rounded-2xl p-6 text-left transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-secondary-400 tracking-widest">{item.num}</span>
                      <h3 className="text-white font-bold text-lg">{item.title}</h3>
                    </div>
                    <p className="text-blue-100/80 leading-relaxed">{item.text}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-secondary-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>

          {/* CTA bas */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-secondary-500/10 border border-secondary-500/30 rounded-2xl px-8 py-4">
              <div className="w-2 h-2 rounded-full bg-secondary-400 animate-pulse" />
              <p className="text-secondary-400 font-bold text-lg">
                Autobat résout exactement ça.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-24">
            <span className="inline-block bg-primary-600/10 text-primary-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-primary-600/20 mb-5">Fonctionnalités</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Vos chantiers rentables.<br className="hidden lg:block" /> Enfin.
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Autobat connecte le terrain à votre bureau. Chaque heure badgée, chaque devis affiné, chaque marge visualisée — en temps réel.</p>
          </div>

          <div className="space-y-24">

            {/* — 01 Badgeage — */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-secondary-500/10 flex items-center justify-center"><MapPin className="w-5 h-5 text-secondary-500" /></div>
                  <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">01 — Présence</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-5 leading-tight">Badgeage automatique.<br />Zéro papier.</h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-8">Vos équipes arrivent sur le chantier, Autobat enregistre grâce à leur téléphone. GPS, heure d'arrivée, heure de départ : tout est capturé automatiquement, même sans réseau.</p>
                <ul className="space-y-3">
                  {['Vos gars badgent en 1 tap, même sans réseau', 'Tout se synchronise dès le retour du réseau', 'Fini les feuilles de présence papier', 'iOS, Android, tablette — tout fonctionne'].map(b => (
                    <li key={b} className="flex items-center gap-3 text-gray-700"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /><span>{b}</span></li>
                  ))}
                </ul>
              </div>
              {/* Phone placeholder — Badgeage GPS */}
              <div className="flex justify-center py-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)' }} />
                <div className="relative mx-auto" style={{ width: 200 }}>
                  <div style={{ position: 'absolute', left: -4, top: 60, width: 4, height: 22, background: '#374151', borderRadius: '3px 0 0 3px' }} />
                  <div style={{ position: 'absolute', left: -4, top: 90, width: 4, height: 22, background: '#374151', borderRadius: '3px 0 0 3px' }} />
                  <div style={{ position: 'absolute', left: -4, top: 42, width: 4, height: 16, background: '#374151', borderRadius: '3px 0 0 3px' }} />
                  <div style={{ position: 'absolute', right: -4, top: 70, width: 4, height: 36, background: '#374151', borderRadius: '0 3px 3px 0' }} />
                  <div style={{ background: 'linear-gradient(145deg, #1f2937, #0f172a)', borderRadius: 38, padding: 9, boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset, 0 25px 50px rgba(0,0,0,0.5)' }}>
                    <div style={{ borderRadius: 30, overflow: 'hidden', background: '#0f172a' }}>
                      <div style={{ background: '#000', height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 60, height: 16, background: '#111', borderRadius: 99, border: '1px solid #2d2d2d' }} />
                      </div>
                      <div style={{ background: '#0f172a', padding: '12px 12px 16px' }}>
                        {/* Map */}
                        <div style={{ background: '#1e293b', borderRadius: 12, height: 150, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                          <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <div style={{ width: 32, height: 32, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(34,197,94,0.6)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, background: 'rgba(15,23,42,0.85)', borderRadius: 8, padding: '4px 8px' }}>
                            <div style={{ color: '#94a3b8', fontSize: 9, letterSpacing: 1 }}>12 RUE DES LILAS, LYON</div>
                          </div>
                        </div>
                        {/* Check-in */}
                        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '8px 10px', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <div style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%' }} />
                            <span style={{ color: '#4ade80', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>BADGÉ — 07:42</span>
                          </div>
                          <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Chantier Dupont</div>
                        </div>
                        {/* Employees */}
                        {[['Jean M.', '07:40', true], ['Karim B.', '07:43', true], ['Thomas L.', '—', false]].map(([name, time, active]) => (
                          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: active ? 'rgba(34,197,94,0.2)' : 'rgba(71,85,105,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', color: active ? '#4ade80' : '#64748b' }}>{name[0]}</div>
                            <span style={{ color: 'white', fontSize: 11, flex: 1 }}>{name}</span>
                            <span style={{ color: active ? '#4ade80' : '#475569', fontSize: 11 }}>{time}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: '#000', height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 55, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 99 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* — 02 Devis — */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="lg:order-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-secondary-500/10 flex items-center justify-center"><FileText className="w-5 h-5 text-secondary-500" /></div>
                  <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">02 — Devis</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-5 leading-tight">Des devis qui s'améliorent<br />à chaque chantier.</h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-8">Autobat ajuste vos prix en fonction du temps réellement passé. Plus vous l'utilisez, plus vos devis sont précis. Plus vos devis sont précis, plus vous gagnez.</p>
                <ul className="space-y-3">
                  {['Vos prix s\'affinent seuls après chaque chantier', 'PDF pro prêt à envoyer en 2 minutes', 'Vous savez exactement où en est chaque devis'].map(b => (
                    <li key={b} className="flex items-center gap-3 text-gray-700"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /><span>{b}</span></li>
                  ))}
                </ul>
              </div>
              {/* Browser placeholder — Devis */}
              <div className="lg:order-1">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                    <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">autobat.pro/devis/DEV-2025-0047</div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div className="text-xs text-gray-400 mb-1 font-mono">DEV-2025-0047</div>
                        <div className="text-lg font-bold text-gray-900">Rénovation salle de bain</div>
                        <div className="text-sm text-gray-400 mt-0.5">M. Dupont • 12 mars 2025</div>
                      </div>
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">EN ATTENTE</span>
                    </div>
                    <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
                      <div className="bg-gray-50 grid grid-cols-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <span className="col-span-2">Désignation</span><span className="text-right">Qté</span><span className="text-right">HT</span>
                      </div>
                      {[['Pose carrelage sol', '24 m²', '480 €'], ['Fourniture carrelage 60×60', '24 m²', '864 €'], ['Dépose ancien revêtement', '1 fft', '150 €'], ['Joint et finitions', '1 fft', '95 €']].map(([d, q, p]) => (
                        <div key={d} className="grid grid-cols-4 px-4 py-2.5 text-sm border-t border-gray-50">
                          <span className="col-span-2 text-gray-700">{d}</span>
                          <span className="text-right text-gray-400">{q}</span>
                          <span className="text-right font-medium text-gray-800">{p}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-2.5 flex items-center gap-3 mb-5">
                      <div className="w-6 h-6 rounded-full bg-primary-600/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-3 h-3 text-primary-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-primary-600">Prix auto-ajustés</div>
                        <div className="text-xs text-primary-400">Basés sur 12 chantiers similaires</div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="text-right">
                        <div className="text-xs text-gray-400 mb-0.5">Total HT</div>
                        <div className="text-3xl font-bold text-primary-600">1 589 €</div>
                        <div className="text-xs text-gray-400">TVA 20% : 317,80 €</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* — 03 Pilotage — */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-secondary-500/10 flex items-center justify-center"><BarChart2 className="w-5 h-5 text-secondary-500" /></div>
                  <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">03 — Pilotage</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-5 leading-tight">Sachez en temps réel<br />si vous gagnez de l'argent.</h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-8">Visualisez votre chiffre d'affaires chantier par chantier. Anticipez les dérives avant qu'il ne soit trop tard. Identifiez vos chantiers les plus rentables.</p>
                <ul className="space-y-3">
                  {['Voyez en direct si un chantier dérive', 'Comparez ce que vous aviez prévu à ce qui se passe vraiment', 'Identifiez vos chantiers les plus rentables — et doublez-les'].map(b => (
                    <li key={b} className="flex items-center gap-3 text-gray-700"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /><span>{b}</span></li>
                  ))}
                </ul>
              </div>
              {/* Browser placeholder — Dashboard */}
              <div>
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                    <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">autobat.pro/pilotage</div>
                  </div>
                  <div style={{ background: '#0f172a', padding: 24 }}>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[['CA ce mois', '28 400 €', '↑ 12%', '#4ade80'], ['Chantiers', '7 actifs', '↑ 2', '#60a5fa'], ['Marge moy.', '34%', '↑ 4 pts', '#fbbf24']].map(([label, val, trend, color]) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>{label}</div>
                          <div style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{val}</div>
                          <div style={{ color, fontSize: 11, fontWeight: 600 }}>{trend}</div>
                        </div>
                      ))}
                    </div>
                    {/* Courbe CA */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ color: '#475569', fontSize: 11 }}>Évolution CA — 2025</span>
                        <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 600 }}>↑ 23% vs N-1</span>
                      </div>
                      <svg viewBox="0 0 280 60" style={{ width: '100%', height: 60, overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Aire sous la courbe */}
                        <path d="M0,52 C20,50 35,44 60,38 C80,33 100,42 120,30 C140,18 160,22 180,14 C200,8 220,16 240,10 C255,6 270,4 280,2 L280,60 L0,60 Z" fill="url(#curveGrad)" />
                        {/* Courbe */}
                        <path d="M0,52 C20,50 35,44 60,38 C80,33 100,42 120,30 C140,18 160,22 180,14 C200,8 220,16 240,10 C255,6 270,4 280,2" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                        {/* Point final */}
                        <circle cx="280" cy="2" r="3" fill="#f59e0b" />
                        {/* Labels mois */}
                        {[['Jan',0],['Mar',60],['Mai',120],['Jul',180],['Sep',240],['Nov',280]].map(([m, x]) => (
                          <text key={m} x={x} y="58" textAnchor="middle" style={{ fontSize: 8, fill: '#475569' }}>{m}</text>
                        ))}
                      </svg>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ color: '#475569', fontSize: 11, marginBottom: 8 }}>Chantiers en cours</div>
                      {[['Dupont — SDB', '4 200 €', '+8%', '#4ade80'], ['Mairie Annexe', '18 500 €', '-3%', '#f87171'], ['Résidence Arc', '9 800 €', '+21%', '#4ade80']].map(([name, ca, marge, color]) => (
                        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ flex: 1, color: '#cbd5e1', fontSize: 12 }}>{name}</div>
                          <div style={{ color: '#94a3b8', fontSize: 12, width: 70, textAlign: 'right' }}>{ca}</div>
                          <div style={{ color, fontSize: 12, fontWeight: 600, width: 45, textAlign: 'right' }}>{marge}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* CTA final */}
          <div className="mt-24 text-center">
            <p className="text-gray-400 text-sm mb-5 uppercase tracking-widest font-semibold">Prêt à voir la différence ?</p>
            <Link to="/register" className="inline-flex items-center gap-3 bg-secondary-500 hover:bg-secondary-600 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-lg shadow-secondary-500/30 hover:shadow-secondary-500/50 hover:-translate-y-0.5">
              Démarrer l'essai gratuit — 7 jours
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-gray-400 text-sm mt-3">CB requise · Aucun débit pendant 7 jours · Résiliable à tout moment</p>
          </div>

        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2f4e 50%, #0f172a 100%)' }}>
        {/* Stars */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 60%)' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-block bg-secondary-500/15 text-secondary-400 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-secondary-500/30 mb-5">Tarifs</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Un seul abonnement.<br />Tout inclus.
            </h2>
            <p className="text-blue-100/50 text-lg">Pas de fonctionnalité cachée derrière un plan supérieur.</p>
          </div>

          {/* Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="grid lg:grid-cols-2">

              {/* Left — prix + exemples */}
              <div className="p-10 border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="text-blue-100/40 text-xs uppercase tracking-widest mb-4">Compte gérant</div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-8xl font-black text-white leading-none">100</span>
                  <span className="text-xl text-white/50 mb-3">€ HT/mois</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white/60 text-sm font-semibold px-4 py-2 rounded-full mb-10">
                  + 20 € HT / mois par employé
                </div>

                <div className="text-white/30 text-xs uppercase tracking-widest mb-3">Exemples de facturation</div>
                <div className="space-y-2 mb-8">
                  {[['1 personne', '100 €/mois'], ['5 personnes', '180 €/mois'], ['10 personnes', '280 €/mois'], ['20 personnes', '380 €/mois']].map(([label, price]) => (
                    <div key={label} className="flex justify-between items-center py-2.5 border-b border-white/10">
                      <span className="text-blue-100/50 text-sm">{label}</span>
                      <span className="text-white font-bold text-sm">{price}</span>
                    </div>
                  ))}
                </div>

                {/* ROI callout */}
                <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-secondary-400" />
                    <span className="text-secondary-400 text-xs font-bold uppercase tracking-wide">En pratique</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">1 chantier sans dérive de marge = plusieurs mois d'abonnement remboursés.</p>
                </div>
              </div>

              {/* Right — features + CTA */}
              <div className="p-10 flex flex-col">
                <div className="text-white/30 text-xs uppercase tracking-widest mb-5">Tout inclus dès le 1er euro</div>
                <div className="flex-1 mb-8">
                  {[
                    'Badgeage GPS automatique',
                    'Catalogue auto-apprenant',
                    'Devis PDF professionnels',
                    'Pilotage du CA en temps réel',
                    'Facturation légale France',
                    'Accessible sur mobile, sans installation',
                    'Mode hors ligne complet',
                    'Support email réactif',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-3 py-3.5 border-b border-white/5">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-blue-100/70 text-sm">{f}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <Link
                    to="/register"
                    className="block w-full text-center bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg shadow-secondary-500/25 hover:shadow-secondary-500/40 hover:-translate-y-0.5 mb-3"
                  >
                    Démarrer l'essai gratuit — 7 jours
                  </Link>
                  <p className="text-center text-white/30 text-sm">CB requise · Aucun débit pendant 7 jours · Résiliable à tout moment</p>
                </div>
              </div>
            </div>

            {/* Trust bar */}
            <div className="border-t border-white/10 px-10 py-5 grid grid-cols-3 gap-4 text-center">
              {[
                [Shield, 'Sans engagement'],
                [Lock, 'Paiement sécurisé SSL'],
                [RefreshCw, 'Résiliable en 1 clic'],
              ].map(([Icon, label]) => (
                <div key={label} className="flex items-center justify-center gap-2 text-white/30 text-xs font-medium">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 relative overflow-hidden" style={{ background: '#0f172a' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, #0f172a 100%)' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-secondary-500/15 text-secondary-400 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-secondary-500/30 mb-5">
              <Zap className="w-3 h-3" /> Démarrage rapide
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Opérationnel en 10 minutes.</h2>
            <p className="text-blue-100/60 text-lg">Pas de formation, pas d'intégration complexe.</p>
          </div>

          {/* Cards + arrows */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {[
              {
                icon: <UserPlus className="w-6 h-6 text-secondary-400" />,
                step: '01',
                title: 'Créez votre compte',
                desc: 'Votre entreprise configurée, catalogue BTP inclus. Prêt à facturer.',
                time: '~2 min',
              },
              {
                icon: <HardHat className="w-6 h-6 text-secondary-400" />,
                step: '02',
                title: 'Premier chantier lancé',
                desc: "Créez le client, générez le devis, ouvrez le chantier. Vos équipes badgent dès maintenant.",
                time: '~5 min',
              },
              {
                icon: <Zap className="w-6 h-6 text-secondary-400" />,
                step: '03',
                title: 'Le catalogue s\'affine seul',
                desc: "Chaque chantier terminé ajuste vos prix. Votre catalogue devient plus précis que n'importe quel concurrent.",
                time: 'En continu',
              },
            ].map((item, idx) => (
              <>
                <div key={item.step} className="flex-1 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-secondary-500/30 rounded-2xl p-7 transition-all group">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-secondary-500/40 transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-white/20 text-4xl font-black">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-blue-100/50 text-sm leading-relaxed mb-4">{item.desc}</p>
                  <div className="inline-flex items-center gap-1.5 bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 text-xs font-semibold px-3 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </div>
                </div>
                {idx < 2 && (
                  <div key={`arrow-${idx}`} className="hidden md:flex items-center justify-center flex-shrink-0 px-1">
                    <ArrowRight className="w-5 h-5 text-white/20" />
                  </div>
                )}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 relative overflow-hidden" style={{ background: '#0d1f35' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-secondary-500/15 text-secondary-400 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-secondary-500/30 mb-5">FAQ</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Vous avez des questions ?</h2>
            <p className="text-blue-100/50 text-lg">Les réponses aux doutes les plus fréquents.</p>
          </div>
          <div>
            {FAQS.map((faq) => (
              <FAQItem key={faq.question} {...faq} />
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-white/50 text-sm">Vous ne trouvez pas votre réponse ? <a href="mailto:contact@autobat.pro" className="text-secondary-400 hover:text-secondary-300 font-medium underline underline-offset-2 transition-colors">Écrivez-nous</a></p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2f4e 60%, #0f172a 100%)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-secondary-500/15 text-secondary-400 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-secondary-500/30 mb-8">
            Essai gratuit 7 jours
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            Vos chantiers méritent<br />
            <span style={{ color: '#F59E0B' }}>mieux qu'un tableur.</span>
          </h2>
          <p className="text-blue-100/50 text-xl mb-10 max-w-xl mx-auto">
            Rejoignez les artisans qui pilotent leur activité en temps réel — et arrêtent de perdre de la marge sans s'en rendre compte.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-3 text-white font-bold px-12 py-5 rounded-2xl text-lg transition-all shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
          >
            Démarrer l'essai gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-white/40">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400/70" />Sans engagement</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400/70" />7 jours gratuits</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400/70" />Aucun débit avant le 8ème jour</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400/70" />Résiliable en 1 clic</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12" style={{ background: '#070e1a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
            <div>
              <img src="/images/Logo-Atuobat.png" alt="Autobat" className="h-8 w-auto mb-2" />
              <p className="text-white/25 text-sm">Logiciel de gestion chantier BTP</p>
              <a href="mailto:contact@autobat.pro" className="text-white/30 hover:text-secondary-400 text-sm transition-colors mt-1 inline-block">contact@autobat.pro</a>
            </div>
            <div className="flex flex-wrap gap-6 text-gray-500 text-sm">
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
              <Link to="/register" className="text-secondary-400 hover:text-secondary-300 font-medium transition-colors">
                Essai gratuit →
              </Link>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
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
