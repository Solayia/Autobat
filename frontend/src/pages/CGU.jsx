import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">{title}</h2>
    <div className="text-sm text-gray-700 space-y-2 leading-relaxed">{children}</div>
  </div>
);

export default function CGU() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-full mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Conditions Générales d'Utilisation</h1>
          <p className="text-sm text-gray-500 mt-1">Dernière mise à jour : mars 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          <Section title="Article 1 — Objet">
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et
              l'utilisation de la plateforme SaaS <strong>Autobat</strong> (ci-après « le Service »),
              éditée par <strong>[NOM SOCIÉTÉ] — SIRET : [SIRET]</strong>, dont le siège social est
              situé au [ADRESSE].
            </p>
            <p>
              Le Service est une solution de gestion d'entreprise BTP en mode SaaS, accessible via
              internet, permettant notamment la gestion de clients, devis, chantiers, badgeages et factures.
            </p>
          </Section>

          <Section title="Article 2 — Acceptation">
            <p>
              L'accès au Service est conditionné à l'acceptation pleine et entière des présentes CGU.
              En cochant la case prévue à cet effet lors de l'inscription, l'utilisateur reconnaît avoir
              lu, compris et accepté les présentes CGU sans réserve.
            </p>
            <p>
              L'éditeur se réserve le droit de modifier les CGU à tout moment. L'utilisateur sera notifié
              par email au moins 30 jours avant toute modification substantielle. La poursuite de
              l'utilisation du Service après notification vaut acceptation des nouvelles CGU.
            </p>
          </Section>

          <Section title="Article 3 — Accès et période d'essai">
            <p>
              L'accès au Service est proposé avec une <strong>période d'essai gratuite de 7 jours</strong>,
              sans engagement et sans nécessité de moyen de paiement. À l'issue de la période d'essai,
              l'accès est conditionné à la souscription d'un abonnement payant.
            </p>
            <p>
              Le compte d'essai sera automatiquement suspendu à l'expiration de la période d'essai en
              l'absence d'activation d'un abonnement. Les données saisies pendant l'essai sont conservées
              30 jours après la suspension, puis définitivement supprimées.
            </p>
          </Section>

          <Section title="Article 4 — Abonnement et tarification">
            <p>L'abonnement est facturé mensuellement selon le barème suivant :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>100 € HT/mois</strong> pour le premier compte (gérant / administrateur)</li>
              <li><strong>+20 € HT/mois</strong> par compte utilisateur supplémentaire</li>
            </ul>
            <p className="mt-2">
              La TVA applicable est de 20 %. Le montant total TTC est indiqué sur chaque facture.
              Les tarifs sont révisables chaque année au 1er janvier, avec notification préalable
              de 60 jours par email.
            </p>
            <p>
              Le paiement s'effectue par prélèvement automatique via notre prestataire de paiement
              sécurisé (Stripe). Toute facture non réglée dans un délai de 15 jours entraîne la
              suspension du compte.
            </p>
          </Section>

          <Section title="Article 5 — Obligations de l'utilisateur">
            <p>L'utilisateur s'engage à :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Fournir des informations exactes et à jour lors de l'inscription</li>
              <li>Maintenir la confidentialité de ses identifiants de connexion</li>
              <li>Ne pas partager son accès avec des tiers non autorisés</li>
              <li>Utiliser le Service conformément à sa destination (gestion BTP)</li>
              <li>Ne pas tenter de contourner les mesures de sécurité du Service</li>
              <li>Respecter la législation applicable, notamment en matière de données personnelles</li>
            </ul>
            <p className="mt-2">
              L'utilisateur est seul responsable des données qu'il saisit dans le Service
              (données clients, chantiers, factures, etc.) et garantit en être légalement autorisé.
            </p>
          </Section>

          <Section title="Article 6 — Disponibilité et maintenance">
            <p>
              L'éditeur s'engage à mettre tout en œuvre pour assurer la disponibilité du Service
              24h/24, 7j/7, avec un objectif de disponibilité de 99,5 % par mois hors maintenance
              planifiée. Des interruptions peuvent survenir pour maintenance, mises à jour ou
              en cas de force majeure.
            </p>
            <p>
              Les opérations de maintenance planifiée sont annoncées avec un préavis minimum de
              48 heures, sauf urgence de sécurité. L'éditeur ne saurait être tenu responsable
              des dommages liés à une indisponibilité temporaire du Service.
            </p>
          </Section>

          <Section title="Article 7 — Données et sauvegarde">
            <p>
              L'éditeur effectue des sauvegardes quotidiennes automatiques des données.
              Les données sont hébergées en France sur des serveurs sécurisés.
            </p>
            <p>
              Les factures et documents comptables sont conservés pendant <strong>10 ans</strong>
              conformément aux obligations légales françaises (article L123-22 du Code de commerce),
              même après résiliation du contrat.
            </p>
          </Section>

          <Section title="Article 8 — Propriété intellectuelle">
            <p>
              Le Service, son interface, ses fonctionnalités, son code source et tout contenu
              créé par l'éditeur sont protégés par le droit de la propriété intellectuelle.
              Aucune reproduction, représentation ou exploitation n'est autorisée sans
              l'accord préalable écrit de l'éditeur.
            </p>
            <p>
              Les données saisies par l'utilisateur (clients, devis, chantiers, etc.) restent
              la propriété exclusive de l'utilisateur. L'éditeur ne revendique aucun droit
              sur ces données.
            </p>
          </Section>

          <Section title="Article 9 — Résiliation">
            <p>
              L'utilisateur peut résilier son abonnement à tout moment depuis son espace
              Paramètres ou en contactant le support. La résiliation prend effet à la fin
              du mois en cours. Aucun remboursement partiel n'est effectué.
            </p>
            <p>
              L'éditeur peut résilier le compte de l'utilisateur en cas de non-paiement,
              violation des CGU, ou comportement abusif, après mise en demeure restée
              sans effet pendant 15 jours.
            </p>
            <p>
              Après résiliation, l'utilisateur dispose de <strong>30 jours</strong> pour
              exporter ses données. Au-delà, les données sont supprimées, sauf les documents
              comptables soumis aux obligations légales de conservation.
            </p>
          </Section>

          <Section title="Article 10 — Responsabilité">
            <p>
              L'éditeur ne saurait être tenu responsable des dommages indirects (perte de
              chiffre d'affaires, perte de données, préjudice commercial) résultant de
              l'utilisation ou de l'impossibilité d'utiliser le Service. La responsabilité
              de l'éditeur est limitée au montant des sommes versées au cours des 12 derniers mois.
            </p>
          </Section>

          <Section title="Article 11 — Droit applicable et juridiction">
            <p>
              Les présentes CGU sont soumises au droit français. En cas de litige, les parties
              s'engagent à rechercher une solution amiable dans un délai de 30 jours. À défaut,
              tout litige relèvera de la compétence exclusive des tribunaux français.
            </p>
            <p>
              Conformément à l'article L612-1 du Code de la consommation, le client professionnel
              peut recourir à la médiation via : <strong>https://www.economie.gouv.fr/mediation-conso</strong>
            </p>
          </Section>

          <Section title="Article 12 — Contact">
            <p>
              Pour toute question relative aux présentes CGU :<br />
              Email : <strong>[EMAIL CONTACT]</strong><br />
              Adresse : <strong>[ADRESSE]</strong>
            </p>
          </Section>
        </div>

        {/* Footer nav */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <Link to="/login" className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
          <div className="flex gap-4 text-gray-500">
            <Link to="/mentions-legales" className="hover:text-primary-600">Mentions légales</Link>
            <Link to="/confidentialite" className="hover:text-primary-600">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
