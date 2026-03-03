import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">{title}</h2>
    <div className="text-sm text-gray-700 space-y-2 leading-relaxed">{children}</div>
  </div>
);

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-full mb-4">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mentions légales</h1>
          <p className="text-sm text-gray-500 mt-1">Dernière mise à jour : mars 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          <Section title="Éditeur du site">
            <p>
              Le site <strong>app.autobat.fr</strong> est édité par :
            </p>
            <div className="mt-3 bg-gray-50 rounded-lg p-4 space-y-1">
              <p><strong>Raison sociale :</strong> [NOM SOCIÉTÉ]</p>
              <p><strong>Forme juridique :</strong> [SAS / SARL / EI / …]</p>
              <p><strong>Capital social :</strong> [MONTANT] €</p>
              <p><strong>SIRET :</strong> [SIRET — 14 chiffres]</p>
              <p><strong>RCS :</strong> [Ville] [NUMÉRO RCS]</p>
              <p><strong>Siège social :</strong> [ADRESSE COMPLÈTE]</p>
              <p><strong>Téléphone :</strong> [TÉLÉPHONE]</p>
              <p><strong>Email :</strong> [EMAIL]</p>
              <p><strong>Directeur de la publication :</strong> [PRÉNOM NOM]</p>
            </div>
          </Section>

          <Section title="Hébergement">
            <p>Le site et ses données sont hébergés par :</p>
            <div className="mt-3 bg-gray-50 rounded-lg p-4 space-y-1">
              <p><strong>Hébergeur :</strong> Hostinger International Ltd</p>
              <p><strong>Adresse :</strong> 61 Lordou Vironos Street, 6023 Larnaca, Chypre</p>
              <p><strong>Site web :</strong> https://www.hostinger.fr</p>
            </div>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              L'ensemble du contenu du site Autobat (interface, textes, graphismes, logo, icônes,
              code source) est la propriété exclusive de [NOM SOCIÉTÉ] ou de ses partenaires,
              et est protégé par les lois françaises et internationales relatives à la propriété
              intellectuelle.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication ou adaptation de tout
              ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé,
              est interdite sans autorisation écrite préalable de [NOM SOCIÉTÉ].
            </p>
            <p>
              Le catalogue de prix intégré à la plateforme (bibliothèque Syla) est utilisé
              sous licence. Toute extraction ou réutilisation de ce catalogue en dehors
              de la plateforme est strictement interdite.
            </p>
          </Section>

          <Section title="Données personnelles">
            <p>
              Le traitement des données personnelles est décrit dans notre{' '}
              <Link to="/confidentialite" className="text-primary-600 hover:underline font-medium">
                Politique de confidentialité
              </Link>.
            </p>
            <p>
              Pour exercer vos droits (accès, rectification, suppression, portabilité),
              contactez-nous à : <strong>[EMAIL DPO]</strong>
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Le site utilise uniquement des cookies strictement nécessaires au fonctionnement
              du service (session d'authentification, préférences d'interface). Aucun cookie
              publicitaire ou de traçage tiers n'est utilisé.
            </p>
          </Section>

          <Section title="Droit applicable">
            <p>
              Les présentes mentions légales sont soumises au droit français.
              En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Pour toute question ou signalement :<br />
              Email : <strong>[EMAIL CONTACT]</strong><br />
              Courrier : <strong>[ADRESSE]</strong>
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
            <Link to="/confidentialite" className="hover:text-primary-600">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
