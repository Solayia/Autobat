import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">{title}</h2>
    <div className="text-sm text-gray-700 space-y-2 leading-relaxed">{children}</div>
  </div>
);

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-full mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Politique de confidentialité & RGPD</h1>
          <p className="text-sm text-gray-500 mt-1">
            Version 1.0 — Dernière mise à jour : 9 mars 2026 — Conforme au RGPD (Règlement UE 2016/679)
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          <Section title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des données personnelles collectées via la plateforme
              AUTOBAT est :
            </p>
            <div className="mt-3 bg-gray-50 rounded-lg p-4 space-y-1">
              <p><strong>SOLAYIA</strong> — Société par Actions Simplifiée (SAS)</p>
              <p>Capital social : 500 €</p>
              <p>RCS Paris 992 983 569</p>
              <p>Siège social : 60 rue François 1er, 75008 Paris, FRANCE</p>
              <p>TVA intracommunautaire : FR15992983569</p>
              <p>Représentant légal : Adrien LECHEVALIER, Président</p>
              <p>Email DPO / contact RGPD : <strong>adrien.lechevalier@solayia.fr</strong></p>
            </div>
          </Section>

          <Section title="2. Données collectées">
            <p>Nous collectons les données suivantes :</p>
            <div className="mt-2 space-y-4">
              <div>
                <p className="font-medium">Données d'identification de l'entreprise :</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                  <li>Raison sociale, SIRET, forme juridique</li>
                  <li>Adresse du siège social, téléphone, email professionnel</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Données personnelles des utilisateurs :</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                  <li>Prénom, nom, adresse email, numéro de téléphone</li>
                  <li>Identifiants de connexion (email + mot de passe haché)</li>
                  <li>Date et heure de dernière connexion</li>
                  <li>Date d'acceptation des CGU et CGV</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Données métier (saisies par l'utilisateur) :</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                  <li>Fiches clients (coordonnées, SIRET)</li>
                  <li>Devis, chantiers, factures et leurs lignes de détail</li>
                  <li>Données de badgeage (pointages GPS avec horodatage et coordonnées)</li>
                  <li>Documents uploadés (photos de chantier, PDFs)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Données techniques :</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                  <li>Adresse IP, type de navigateur, système d'exploitation</li>
                  <li>Logs d'accès au service (à des fins de sécurité)</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section title="3. Finalités et bases légales">
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-3 py-2 text-left">Finalité</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Base légale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Gestion du compte et authentification', 'Exécution du contrat'],
                  ['Fourniture du service SaaS (devis, facturation, chantiers)', 'Exécution du contrat'],
                  ['Facturation et gestion des abonnements', 'Obligation légale + contrat'],
                  ['Badgeage GPS des employés sur chantier', 'Intérêt légitime (gestion du personnel)'],
                  ['Sécurité et prévention des fraudes', 'Intérêt légitime'],
                  ['Support client et assistance technique', 'Intérêt légitime'],
                  ['Envoi d\'emails transactionnels (devis, factures, alertes)', 'Exécution du contrat'],
                  ['Amélioration du service (analytics agrégées)', 'Intérêt légitime'],
                  ['Conservation des dates d\'acceptation CGU/CGV', 'Obligation légale + contrat'],
                ].map(([fin, base], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2">{fin}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-600">{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="4. Destinataires des données">
            <p>
              Vos données sont accessibles uniquement aux personnes autorisées au sein de
              votre entreprise (selon les rôles configurés). Elles ne sont jamais vendues
              à des tiers.
            </p>
            <p>Nous faisons appel aux sous-traitants suivants :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Hostinger</strong> — hébergement des données (serveurs en Europe)</li>
              <li><strong>Stripe</strong> — traitement des paiements (certifié PCI-DSS)</li>
              <li><strong>Resend</strong> — envoi des emails transactionnels</li>
            </ul>
            <p className="mt-2">
              Ces sous-traitants sont liés par un accord de traitement des données (DPA)
              et opèrent en conformité avec le RGPD.
            </p>
          </Section>

          <Section title="5. Transferts hors UE">
            <p>
              Stripe (paiement) peut traiter des données aux États-Unis. Ce transfert est
              encadré par les clauses contractuelles types de la Commission Européenne (CCT)
              et le mécanisme EU-US Data Privacy Framework.
            </p>
            <p>
              Toutes les autres données sont hébergées et traitées au sein de l'Union Européenne.
            </p>
          </Section>

          <Section title="6. Durée de conservation">
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-3 py-2 text-left">Type de donnée</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Durée</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Données de compte (utilisateur actif)', 'Durée du contrat'],
                  ['Données de compte (après résiliation)', '30 jours puis suppression'],
                  ['Factures et données comptables', '10 ans (obligation légale)'],
                  ['Données de badgeage GPS', '3 ans après la fin du chantier'],
                  ['Logs de sécurité', '12 mois'],
                  ['Données de paiement (Stripe)', 'Selon politique Stripe (13 mois)'],
                  ['Dates d\'acceptation CGU/CGV', 'Durée du contrat + 5 ans (preuve contractuelle)'],
                ].map(([type, duree], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2">{type}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-600">{duree}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="7. Vos droits (RGPD)">
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
              <li><strong>Droit à l'effacement</strong> — demander la suppression de vos données (sous réserve des obligations légales)</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> — s'opposer à certains traitements</li>
              <li><strong>Droit à la limitation</strong> — restreindre temporairement un traitement</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous à : <strong>adrien.lechevalier@solayia.fr</strong><br />
              Nous répondrons dans un délai maximum de <strong>30 jours</strong>.
            </p>
            <p className="mt-2">
              En cas de réponse insatisfaisante, vous pouvez introduire une réclamation
              auprès de la <strong>CNIL</strong> :{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer"
                className="text-primary-600 hover:underline">www.cnil.fr</a>
            </p>
          </Section>

          <Section title="8. Suppression du compte">
            <p>
              Vous pouvez demander la suppression de votre compte et de toutes vos données
              depuis la section <strong>Paramètres → Supprimer mon compte</strong>.
              Cette action est irréversible. Les données comptables (factures) soumises
              à une obligation légale de conservation sont exclues de cette suppression
              et conservées 10 ans.
            </p>
          </Section>

          <Section title="9. Sécurité">
            <p>
              Nous mettons en œuvre les mesures techniques et organisationnelles suivantes
              pour protéger vos données :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Chiffrement des communications (HTTPS/TLS)</li>
              <li>Mots de passe hachés (bcrypt, jamais stockés en clair)</li>
              <li>Authentification par tokens JWT à durée limitée</li>
              <li>Isolation stricte des données entre clients (multi-tenant)</li>
              <li>Sauvegardes quotidiennes chiffrées</li>
              <li>Accès aux données de production restreint au personnel autorisé</li>
            </ul>
          </Section>

          <Section title="10. Modifications">
            <p>
              Nous nous réservons le droit de modifier cette politique à tout moment.
              En cas de modification substantielle, vous serez informé par email
              au moins 30 jours avant l'entrée en vigueur des changements.
            </p>
            <p>
              Contact : <strong>adrien.lechevalier@solayia.fr</strong><br />
              SOLAYIA, 60 rue François 1er, 75008 Paris, FRANCE
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
            <Link to="/cgu" className="hover:text-primary-600">CGU</Link>
            <Link to="/cgv" className="hover:text-primary-600">CGV</Link>
            <Link to="/mentions-legales" className="hover:text-primary-600">Mentions légales</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
