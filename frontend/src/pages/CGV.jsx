import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">{title}</h2>
    <div className="text-sm text-gray-700 space-y-2 leading-relaxed">{children}</div>
  </div>
);

export default function CGV() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-full mb-4">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Conditions Générales de Vente</h1>
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
            <p>Contact : <strong>adrien.lechevalier@solayia.fr</strong></p>
          </div>

          <div className="mb-8 text-sm text-gray-700 space-y-2">
            <p>
              Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent les aspects commerciaux
              et financiers de l'abonnement à la plateforme <strong>AUTOBAT</strong>, éditée par SOLAYIA.
            </p>
            <p>
              Les CGV sont indissociables des Conditions Générales d'Utilisation (CGU). L'acceptation des présentes
              CGV implique l'acceptation des CGU. Les CGV s'appliquent exclusivement aux relations commerciales
              entre SOLAYIA et ses clients professionnels.
            </p>
          </div>

          <Section title="Article 1 — Offres et tarifs">
            <p><strong>1.1 Offre TPE/PME – Tarification standard</strong></p>
            <p>Formule unique avec tarification par utilisateur :</p>
            <p className="font-medium mt-2">Abonnement mensuel :</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Premier utilisateur : <strong>100 € HT/mois</strong></li>
              <li>Utilisateur supplémentaire : <strong>20 € HT/mois</strong> par utilisateur additionnel</li>
            </ul>
            <p className="font-medium mt-2">Abonnement annuel (réduction de 10 %) :</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Premier utilisateur : 1 080 € HT/an (soit 90 €/mois)</li>
              <li>Utilisateur supplémentaire : 216 € HT/an (soit 18 €/mois)</li>
            </ul>
            <p className="mt-2">Fonctionnalités incluses : accès complet, IA avancée, chantiers illimités,
              stockage 50 Go, support (chat IA 24/7 + email). Aucune limitation fonctionnelle ou quantitative.</p>
            <p className="mt-2"><strong>1.2 Offre Grande Entreprise</strong> — Pour les entreprises de plus de
              50 utilisateurs ou ayant des besoins spécifiques : tarification sur devis, valable 60 jours.</p>
            <p className="mt-2">Tous les prix sont en euros HT. TVA 20 % applicable pour les clients français.
              Les tarifs applicables sont ceux en vigueur au jour de la souscription.</p>
          </Section>

          <Section title="Article 2 — Période d'essai">
            <p>SOLAYIA offre une <strong>période d'essai gratuite de 7 jours</strong> avec accès complet,
              utilisateurs illimités et aucune limitation fonctionnelle.</p>
            <p>L'inscription à la période d'essai nécessite de renseigner ses informations bancaires et
              engage l'Utilisateur pour un abonnement payant automatique à l'issue des 7 jours,
              <strong> sauf résiliation avant la fin de la période d'essai</strong>.</p>
            <p>Si l'Utilisateur résilie avant la fin de l'essai : toutes les données sont supprimées après
              30 jours (sauf données anonymisées à des fins statistiques).</p>
            <p>La période d'essai est accordée <strong>une seule fois par entreprise</strong> (identifiée
              par SIRET). Toute tentative de création de multiples comptes d'essai pourra entraîner une
              suspension immédiate.</p>
          </Section>

          <Section title="Article 3 — Souscription à l'abonnement">
            <p>La souscription s'effectue en ligne sur www.autobat.pro ou sur rendez-vous (offres Grande Entreprise).</p>
            <p>En cochant la case « J'ai lu et j'accepte les CGV et CGU » lors de la validation,
              l'Utilisateur forme un contrat valablement conclu avec SOLAYIA.</p>
            <p>Une <strong>confirmation de souscription</strong> est envoyée par email, récapitulant la formule,
              le nombre d'utilisateurs, le montant et la date du prochain prélèvement.</p>
          </Section>

          <Section title="Article 4 — Moyens et conditions de paiement">
            <p>Moyens de paiement acceptés :</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Carte bancaire (Visa, Mastercard, American Express)</li>
              <li>Prélèvement automatique SEPA</li>
              <li>Virement bancaire (offres Grande Entreprise uniquement)</li>
            </ul>
            <p className="mt-2">Tous les abonnements sont payables <strong>d'avance</strong>. En cas d'échec de
              paiement, une relance est effectuée sous 3 jours. Des frais de rejet de <strong>15 € TTC</strong> sont
              facturés en cas de rejet bancaire. Toutes les transactions sont sécurisées (prestataires certifiés PCI-DSS).</p>
          </Section>

          <Section title="Article 5 — Facturation">
            <p>Les factures sont émises automatiquement à chaque échéance et envoyées par email.
              En acceptant les présentes CGV, l'Utilisateur accepte de recevoir ses factures sous format électronique.</p>
            <p>Les factures sont téléchargeables depuis l'espace de facturation sécurisé Stripe accessible via
              la plateforme. <strong>Il appartient à l'Utilisateur d'archiver ses factures sur un support pérenne.</strong></p>
            <p className="mt-2"><strong>TVA applicable :</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Clients France : TVA 20 %</li>
              <li>Clients UE avec n° TVA valide : autoliquidation</li>
              <li>Clients hors UE : facture HT, TVA non applicable</li>
            </ul>
            <p className="mt-2">Toute contestation de facture doit être adressée à adrien.lechevalier@solayia.fr
              dans un délai de <strong>15 jours</strong> à compter de son émission.</p>
          </Section>

          <Section title="Article 6 — Durée, engagement et reconduction">
            <p><strong>Abonnement mensuel :</strong> durée minimale 1 mois, renouvelable tacitement.
              Résiliation possible avec préavis de 30 jours avant l'échéance mensuelle.</p>
            <p><strong>Abonnement annuel :</strong> durée ferme de 12 mois, renouvelable tacitement.
              Résiliation avec préavis de 60 jours avant la date anniversaire.
              <strong> Aucun remboursement au prorata</strong> en cas de résiliation anticipée.</p>
            <p>À défaut de résiliation dans les délais, le contrat est <strong>reconduit automatiquement</strong>
              aux conditions tarifaires en vigueur à la date du renouvellement.</p>
          </Section>

          <Section title="Article 7 — Modification du nombre d'utilisateurs">
            <p>L'ajout d'utilisateurs prend effet immédiatement, avec facturation au prorata pour
              la période en cours (mensuelle ou annuelle).</p>
            <p>La suppression d'utilisateurs prend effet à la fin de la période en cours.
              <strong> Aucun remboursement au prorata</strong> n'est effectué.</p>
            <p>Le premier utilisateur (Administrateur) ne peut pas être supprimé — sa suppression équivaut
              à une résiliation de l'abonnement.</p>
          </Section>

          <Section title="Article 8 — Résiliation">
            <p>L'Utilisateur peut résilier depuis son espace client en respectant les préavis :
              30 jours (mensuel) ou 60 jours (annuel) avant l'échéance.</p>
            <p><strong>Aucun remboursement</strong> n'est effectué pour la période en cours, sauf en cas
              d'augmentation tarifaire notifiée par SOLAYIA (résiliation sans pénalité possible avant
              la date d'application des nouveaux tarifs).</p>
            <p>SOLAYIA peut résilier immédiatement en cas d'impayé, violation des CGU ou fausse déclaration.
              Elle peut également résilier pour convenance avec un préavis de 3 mois (remboursement au prorata
              pour abonnements annuels).</p>
            <p>Après résiliation : accès suspendu immédiatement. L'Utilisateur dispose de <strong>60 jours</strong>
              pour exporter ses données, puis suppression définitive.</p>
          </Section>

          <Section title="Article 9 — Impayés et retards de paiement">
            <p>En cas de non-paiement : relance email sous 3 jours, puis mise en demeure accordant 8 jours
              supplémentaires. Passé ce délai : suspension du Service.</p>
            <p>Si le paiement n'intervient pas sous 30 jours après suspension : résiliation de plein droit.</p>
            <p>Conformément à l'article L. 441-10 du Code de commerce, tout retard entraîne automatiquement :</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Pénalités de retard : taux BCE + 10 points</li>
              <li>Indemnité forfaitaire : <strong>40 €</strong> par facture impayée</li>
              <li>Frais de recouvrement supplémentaires à la charge de l'Utilisateur</li>
            </ul>
          </Section>

          <Section title="Article 10 — Révision des tarifs">
            <p>SOLAYIA peut modifier ses tarifs avec un préavis de <strong>60 jours</strong> par email
              (mensuel : à compter de la première échéance suivant le préavis ;
              annuel : uniquement à la date anniversaire).</p>
            <p>En cas d'augmentation, l'Utilisateur peut résilier sans pénalité avant la date d'entrée en vigueur.
              Les tarifs ne sont pas indexés automatiquement sur l'inflation.</p>
          </Section>

          <Section title="Article 11 — Programme de parrainage">
            <p>SOLAYIA propose un programme permettant aux clients (Parrains) de faire bénéficier de nouveaux
              clients (Filleuls) de l'offre AUTOBAT :</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>Parrain :</strong> un avoir équivalent à 1 mois d'abonnement de base déduit de sa
                prochaine facture (après paiement de la 1ère facture du Filleul)</li>
              <li><strong>Filleul :</strong> une remise équivalente à 1 mois d'abonnement de base sur sa
                1ère facture payante</li>
            </ul>
            <p className="mt-2">L'avantage est non cumulable, non monnayable et personnel. SOLAYIA se réserve
              le droit de modifier ou suspendre le programme à tout moment.</p>
          </Section>

          <Section title="Article 12 — Suspension du Service">
            <p>SOLAYIA peut suspendre l'accès en cas d'impayé, violation des CGU, maintenance ou motif
              de sécurité. Sauf urgence, une notification est envoyée 48h à l'avance.</p>
            <p>Aucun remboursement pour les périodes de suspension, sauf si imputable à SOLAYIA et
              excédant 30 jours cumulés sur 12 mois.</p>
          </Section>

          <Section title="Article 13 — Clients internationaux">
            <p>Le Service est accessible aux entreprises UE et certains pays hors UE. Tarifs en euros uniquement.
              Le Service est fourni en langue française. SOLAYIA ne garantit pas la conformité aux réglementations
              locales hors France.</p>
          </Section>

          <Section title="Article 14 — Droit de rétractation">
            <p>Conformément à l'article L. 221-28 du Code de la consommation, le droit de rétractation de
              14 jours <strong>ne s'applique pas</strong> aux contrats conclus entre professionnels.
              Les présentes CGV s'appliquant exclusivement aux relations B2B, la souscription est
              ferme et définitive, sous réserve des modalités de résiliation de l'article 8.</p>
          </Section>

          <Section title="Article 15 — Données personnelles">
            <p>Le traitement des données personnelles est régi par les CGU (article 10) et la
              Politique de Confidentialité disponible sur www.solayia.fr.</p>
            <p>Contact : adrien.lechevalier@solayia.fr</p>
          </Section>

          <Section title="Article 16 — Règlement des litiges">
            <p>Les présentes CGV sont régies par le droit français. En cas de litige, les parties
              s'engagent à une résolution amiable préalable (sauf recouvrement de créances et procédures d'urgence).</p>
            <p><strong>Médiateur compétent :</strong> Le Médiateur des Entreprises, 98-102 rue de Richelieu,
              75002 Paris — <strong>https://www.economie.gouv.fr/mediateur-des-entreprises</strong></p>
            <p>En cas d'échec de médiation : compétence exclusive du
              <strong> Tribunal de commerce de Paris</strong>.</p>
          </Section>

          <Section title="Article 17 — Dispositions générales">
            <p>Les présentes CGV, avec les CGU et la Politique de Confidentialité, constituent l'intégralité
              de l'accord entre SOLAYIA et l'Utilisateur.</p>
            <p>Les modifications des CGV sont notifiées par email au moins 30 jours avant leur entrée
              en vigueur. L'Utilisateur est invité à les accepter lors de sa connexion ; en cas de refus,
              résiliation possible sans pénalité.</p>
            <p>Contact : <strong>adrien.lechevalier@solayia.fr</strong> — SOLAYIA, 60 rue François 1er, 75008 Paris</p>
          </Section>

          {/* Annexe tarifaire */}
          <div className="mt-8 p-4 bg-primary-50 rounded-lg border border-primary-100">
            <h3 className="font-semibold text-primary-900 mb-3">Annexe — Récapitulatif tarifaire</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-primary-900">
              <div>
                <p className="font-medium">Abonnement mensuel</p>
                <ul className="mt-1 space-y-0.5 text-primary-700">
                  <li>1er utilisateur : 100 € HT/mois</li>
                  <li>Utilisateur supp. : 20 € HT/mois</li>
                  <li>Engagement min. : 1 mois</li>
                  <li>Préavis résiliation : 30 jours</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Abonnement annuel (−10 %)</p>
                <ul className="mt-1 space-y-0.5 text-primary-700">
                  <li>1er utilisateur : 1 080 € HT/an</li>
                  <li>Utilisateur supp. : 216 € HT/an</li>
                  <li>Engagement ferme : 12 mois</li>
                  <li>Préavis résiliation : 60 jours</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Pénalités</p>
                <ul className="mt-1 space-y-0.5 text-primary-700">
                  <li>Retard de paiement : taux BCE + 10 pts</li>
                  <li>Indemnité forfaitaire : 40 €</li>
                  <li>Frais de rejet bancaire : 15 € TTC</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Période d'essai</p>
                <ul className="mt-1 space-y-0.5 text-primary-700">
                  <li>7 jours gratuits</li>
                  <li>Accès complet illimité</li>
                  <li>Transformation auto en abonnement payant</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Footer nav */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <Link to="/login" className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
          <div className="flex gap-4 text-gray-500">
            <Link to="/cgu" className="hover:text-primary-600">CGU</Link>
            <Link to="/mentions-legales" className="hover:text-primary-600">Mentions légales</Link>
            <Link to="/confidentialite" className="hover:text-primary-600">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
