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
          <p className="text-sm text-gray-500 mt-1">Version 1.0 — Dernière mise à jour : 9 mars 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* Mentions légales */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
            <p className="font-semibold text-gray-900">Éditeur du Service :</p>
            <p><strong>SOLAYIA</strong> — Société par Actions Simplifiée (SAS)</p>
            <p>Capital social : 500 € — RCS Paris 992 983 569</p>
            <p>Siège social : 60 rue François 1er, 75008 Paris, FRANCE</p>
            <p>TVA intracommunautaire : FR15992983569</p>
            <p>Représentant légal : Adrien LECHEVALIER, Président</p>
            <p>Contact : <strong>contact@solayia.fr</strong></p>
            <p className="mt-2 font-semibold text-gray-900">Hébergement :</p>
            <p>Hostinger International Ltd — 61 Lordou Vironos Street, 6023 Larnaca, Chypre</p>
            <p>Données hébergées dans l'Union Européenne</p>
          </div>

          <Section title="Article 1 — Objet et acceptation">
            <p>
              Les présentes Conditions Générales d'Utilisation (« CGU ») définissent les modalités d'accès
              et d'utilisation de la plateforme SaaS <strong>AUTOBAT</strong>, éditée par SOLAYIA.
            </p>
            <p>
              L'accès au Service implique l'acceptation pleine et entière des présentes CGU, matérialisée
              par la case à cocher lors de la création du compte. L'Utilisateur qui n'accepte pas les CGU
              ne doit pas accéder au Service.
            </p>
            <p>
              Les conditions tarifaires, de paiement et de résiliation sont définies dans les Conditions
              Générales de Vente (CGV), acceptées lors de la souscription et faisant partie intégrante
              du contrat.
            </p>
          </Section>

          <Section title="Article 2 — Définitions">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Administrateur :</strong> Titulaire du compte principal disposant de l'ensemble des droits de gestion</li>
              <li><strong>Utilisateur(s) :</strong> Désigne collectivement l'Administrateur et les Utilisateurs Secondaires</li>
              <li><strong>Utilisateur Secondaire :</strong> Collaborateur bénéficiant d'un accès limité selon des profils prédéfinis</li>
              <li><strong>Données Utilisateur :</strong> Données, contenus et fichiers importés, créés ou traités via le Service</li>
              <li><strong>Données Personnelles :</strong> Données à caractère personnel au sens du RGPD</li>
            </ul>
          </Section>

          <Section title="Article 3 — Accès au Service">
            <p>
              Le Service est <strong>exclusivement destiné à des professionnels du secteur du bâtiment</strong>
              agissant à des fins strictement professionnelles.
            </p>
            <p>
              L'accès nécessite la création d'un compte Administrateur avec des informations exactes :
              raison sociale, coordonnées professionnelles, email valide, numéro SIRET.
            </p>
            <p>
              L'Administrateur peut créer des comptes pour ses collaborateurs (Utilisateurs Secondaires)
              et demeure responsable de la création, révocation, et du respect des CGU par ces utilisateurs.
            </p>
            <p>
              Les identifiants sont personnels, confidentiels et incessibles. Toute connexion effectuée
              depuis un compte est réputée avoir été effectuée par son titulaire.
            </p>
          </Section>

          <Section title="Article 4 — Description du Service">
            <p>AUTOBAT est un ERP dédié à la gestion de chantiers proposant notamment :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Gestion administrative et financière : devis, facturation, suivi de rentabilité</li>
              <li>Gestion de la relation tiers : base clients/fournisseurs, CRM, connexion emails</li>
              <li>Gestion des achats et stocks : commandes, inventaires, approvisionnements</li>
              <li>Suivi opérationnel : documents chantier, galerie photos, plannings, tâches</li>
              <li>Ressources humaines : badgeage, suivi des heures et présences</li>
            </ul>
            <p className="mt-2">
              Le Service est fourni en mode SaaS, accessible via Internet sans installation locale.
              SOLAYIA se réserve le droit de faire évoluer le Service. Les évolutions substantielles
              seront notifiées par email.
            </p>
          </Section>

          <Section title="Article 5 — Propriété intellectuelle">
            <p>
              La Plateforme, sa structure, son code source et tous ses éléments sont la propriété
              exclusive de SOLAYIA. Il est strictement interdit de copier, reproduire, décompiler
              ou extraire (scraping) le Service. SOLAYIA concède une licence personnelle, non exclusive,
              non transférable d'utilisation du Service, limitée à la durée de l'abonnement.
            </p>
            <p>
              Tous les droits sur les développements spécifiques réalisés par SOLAYIA restent sa
              propriété exclusive, sauf accord écrit contraire.
            </p>
          </Section>

          <Section title="Article 6 — Données Utilisateur">
            <p>
              L'Utilisateur conserve tous les droits sur les données qu'il importe ou crée via le Service.
              Il est seul responsable de leur licéité et garantit SOLAYIA contre toute réclamation de tiers.
            </p>
            <p>
              Pour le fonctionnement du Service, l'Utilisateur accorde à SOLAYIA une licence pour héberger,
              copier, afficher et sauvegarder ses données.
            </p>
            <p>
              L'Utilisateur autorise SOLAYIA à <strong>anonymiser</strong> ses données pour les agréger
              à des fins d'amélioration des algorithmes d'IA et d'études statistiques sectorielles.
              Ce processus (suppression d'identifiants, agrégation, généralisation, ajout de bruit
              statistique) rend les données irréversiblement anonymes au sens du RGPD.
            </p>
            <p>
              Sont <strong>exclus</strong> de l'exploitation : prix négociés, marges exactes,
              photographies, documents contractuels et juridiques.
            </p>
          </Section>

          <Section title="Article 7 — Obligations et comportements interdits">
            <p>L'Utilisateur s'engage à utiliser le Service conformément aux CGU et à respecter les lois en vigueur.</p>
            <p>Il est interdit de :</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Tenter d'accéder illégitimement aux systèmes de SOLAYIA</li>
              <li>Introduire des virus ou codes malveillants</li>
              <li>Utiliser le Service pour spam, contenu illicite ou usurpation d'identité</li>
              <li>Revendre l'accès au Service sans accord écrit</li>
              <li>Procéder au scraping ou reverse engineering</li>
            </ul>
            <p className="mt-2">Tout manquement peut entraîner suspension, résiliation et poursuites judiciaires.</p>
          </Section>

          <Section title="Article 8 — Disponibilité et niveau de service">
            <p>
              SOLAYIA met en œuvre ses meilleurs efforts pour assurer la disponibilité du Service.
              Aucun SLA n'est contractuellement garanti. Le Service peut être interrompu pour
              maintenance, pannes, attaques ou force majeure.
            </p>
            <p>
              SOLAYIA effectue des <strong>sauvegardes quotidiennes</strong>. En cas d'incident,
              l'engagement se limite à la restauration de la dernière sauvegarde fonctionnelle disponible.
              Aucune indemnisation n'est accordée en cas d'interruption du Service.
            </p>
          </Section>

          <Section title="Article 9 — Responsabilité">
            <p>
              Le Service est fourni « en l'état ». SOLAYIA est soumise à une obligation de moyens.
              Elle décline toute responsabilité pour les dommages indirects (perte de CA, de bénéfices,
              de données, etc.).
            </p>
            <p>
              La responsabilité globale de SOLAYIA ne peut excéder le montant payé par l'Utilisateur
              au cours des <strong>6 mois précédant</strong> le fait générateur. SOLAYIA dispose d'une
              RC Pro couvrant sa responsabilité à hauteur de 50 000 € par sinistre.
            </p>
          </Section>

          <Section title="Article 10 — Protection des données à caractère personnel">
            <p>
              SOLAYIA est <strong>Responsable de Traitement</strong> pour les données de compte et de facturation,
              et <strong>Sous-Traitant</strong> pour les données importées par l'Utilisateur.
            </p>
            <p>En tant que Sous-Traitant, SOLAYIA s'engage à :</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Traiter les données selon les instructions de l'Utilisateur</li>
              <li>Garantir confidentialité et sécurité (chiffrement, contrôle d'accès, journalisation)</li>
              <li>Assister l'Utilisateur dans ses obligations RGPD</li>
              <li>Notifier l'Utilisateur en cas de violation de données dans les meilleurs délais</li>
            </ul>
            <p className="mt-2">
              Les données sont hébergées dans l'UE. Aucun transfert hors UE sans accord préalable.
              L'Utilisateur (Responsable de traitement) est responsable de répondre aux demandes
              d'exercice des droits des personnes concernées.
            </p>
          </Section>

          <Section title="Article 11 — Durée, résiliation et réversibilité">
            <p>
              Le contrat prend effet à la souscription de l'abonnement pour la durée définie dans les CGV.
              Les modalités de résiliation (préavis, procédure) sont définies dans les CGV (article 8).
            </p>
            <p>
              Après résiliation, l'Utilisateur dispose de <strong>60 jours</strong> pour exporter ses données.
              Au-delà, les données sont définitivement supprimées (sauf documents comptables soumis aux
              obligations légales de conservation de 10 ans).
            </p>
          </Section>

          <Section title="Article 12 — Dispositions générales">
            <p>
              En cas de litige, les parties s'engagent à rechercher une solution amiable dans un délai
              de 30 jours. À défaut, tout litige relèvera de la compétence exclusive des tribunaux français.
            </p>
            <p>
              Les présentes CGU sont soumises au droit français et rédigées en langue française
              (version française faisant foi en cas de litige).
            </p>
            <p>
              Pour toute question relative aux présentes CGU :<br />
              Email : <strong>contact@solayia.fr</strong><br />
              Adresse : <strong>SOLAYIA, 60 rue François 1er, 75008 Paris, FRANCE</strong>
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
            <Link to="/cgv" className="hover:text-primary-600">CGV</Link>
            <Link to="/mentions-legales" className="hover:text-primary-600">Mentions légales</Link>
            <Link to="/confidentialite" className="hover:text-primary-600">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
