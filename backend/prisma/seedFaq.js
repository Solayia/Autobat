import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const faqItems = [
  // ── Démarrage ──────────────────────────────────────────────────────────────
  { categorie: 'Démarrage', ordre: 1, question: 'Comment créer mon premier client ?', reponse: 'Rendez-vous dans le menu "Clients" puis cliquez sur le bouton "+ Nouveau client". Renseignez les informations obligatoires (nom, type) puis validez. Votre client apparaîtra immédiatement dans la liste.' },
  { categorie: 'Démarrage', ordre: 2, question: 'Comment créer un devis ?', reponse: 'Depuis le menu "Devis", cliquez sur "+ Nouveau devis". Sélectionnez un client, ajoutez des ouvrages depuis le catalogue ou saisissez des lignes manuellement. Une fois terminé, vous pouvez générer le PDF et le télécharger pour l\'envoyer à votre client.' },
  { categorie: 'Démarrage', ordre: 3, question: 'Comment créer un chantier ?', reponse: 'Allez dans "Chantiers" > "+ Nouveau chantier". Vous pouvez lier un devis existant, assigner des employés et définir les dates de début/fin. Le chantier passe ensuite de PLANIFIÉ → EN COURS → TERMINÉ.' },
  { categorie: 'Démarrage', ordre: 4, question: 'Comment accéder à Autobat depuis mon téléphone ?', reponse: 'Autobat est une Progressive Web App (PWA). Ouvrez autobat.pro dans Chrome ou Safari sur votre téléphone, puis ajoutez-le à votre écran d\'accueil via le menu "Partager" > "Ajouter à l\'écran d\'accueil". L\'application fonctionne même hors ligne.' },
  { categorie: 'Démarrage', ordre: 5, question: 'Comment réinitialiser mon mot de passe ?', reponse: 'Sur la page de connexion, cliquez sur "Mot de passe oublié ?". Saisissez votre adresse email et suivez les instructions reçues. Si vous ne recevez rien, vérifiez vos spams ou contactez votre administrateur.' },
  { categorie: 'Démarrage', ordre: 6, question: 'Comment utiliser la recherche globale ?', reponse: 'Appuyez sur Ctrl+K (ou cliquez sur l\'icône loupe en haut à gauche) pour ouvrir la recherche globale. Vous pouvez rechercher des clients, devis, chantiers et factures par nom, numéro ou montant.' },

  // ── Clients ─────────────────────────────────────────────────────────────────
  { categorie: 'Clients', ordre: 1, question: 'Comment modifier les informations d\'un client ?', reponse: 'Dans la liste des clients, cliquez sur la fiche du client puis sur le bouton "Modifier". Vous pouvez mettre à jour le nom, le type (particulier/professionnel), l\'adresse, le téléphone et l\'email.' },
  { categorie: 'Clients', ordre: 2, question: 'Comment voir l\'historique d\'un client ?', reponse: 'Ouvrez la fiche d\'un client pour voir tous ses devis, chantiers et factures associés. Un résumé du chiffre d\'affaires et du nombre de projets est affiché en haut de la fiche.' },
  { categorie: 'Clients', ordre: 3, question: 'Quelle est la différence entre client particulier et professionnel ?', reponse: 'Un client professionnel peut avoir un numéro SIRET et un numéro de TVA intracommunautaire. Ces informations apparaissent sur les devis et factures. Le type n\'influe pas sur les fonctionnalités disponibles.' },
  { categorie: 'Clients', ordre: 4, question: 'Puis-je supprimer un client ?', reponse: 'Oui, depuis la fiche client via le bouton "Supprimer". Attention : un client lié à des devis ou chantiers ne peut pas être supprimé. Archivez-le plutôt en le gardant dans la liste sans l\'utiliser pour de nouveaux projets.' },

  // ── Devis & Factures ────────────────────────────────────────────────────────
  { categorie: 'Devis & Factures', ordre: 1, question: 'Quels sont les statuts d\'un devis ?', reponse: 'Un devis passe par les statuts suivants : BROUILLON (en cours de création, modifiable) → ENVOYÉ (transmis au client) → ACCEPTÉ (signé) → REFUSÉ. Seul un devis BROUILLON peut être modifié.' },
  { categorie: 'Devis & Factures', ordre: 2, question: 'Puis-je modifier un devis après l\'avoir envoyé ?', reponse: 'Non, un devis envoyé ne peut plus être modifié directement. Vous pouvez le dupliquer pour créer une nouvelle version modifiable. Seuls les devis en statut BROUILLON sont éditables.' },
  { categorie: 'Devis & Factures', ordre: 3, question: 'Comment dupliquer un devis ?', reponse: 'Depuis la liste des devis ou le détail d\'un devis, cliquez sur le menu "…" puis "Dupliquer". Un nouveau devis BROUILLON est créé avec toutes les lignes copiées. Vous pouvez alors le modifier librement.' },
  { categorie: 'Devis & Factures', ordre: 4, question: 'Comment ajouter des sections à un devis ?', reponse: 'Dans l\'éditeur de devis, cliquez sur "+ Ajouter une section". Chaque section peut contenir des ouvrages du catalogue et des lignes libres (matériaux, fournitures). Les sections permettent d\'organiser le devis par corps de métier ou par zone.' },
  { categorie: 'Devis & Factures', ordre: 5, question: 'Comment ajouter un ouvrage depuis le catalogue dans un devis ?', reponse: 'Dans une section, cliquez sur "+ Ajouter un ouvrage". Recherchez par nom ou référence dans le catalogue. Le prix unitaire et le temps estimé sont pré-remplis automatiquement. Vous pouvez ajuster la quantité et le prix.' },
  { categorie: 'Devis & Factures', ordre: 6, question: 'Comment générer une facture depuis un devis ?', reponse: 'Sur un chantier TERMINÉ lié à un devis accepté, rendez-vous dans "Factures" > "+ Nouvelle facture" et sélectionnez le chantier correspondant. Les lignes du devis seront importées automatiquement.' },
  { categorie: 'Devis & Factures', ordre: 7, question: 'Quels sont les statuts d\'une facture ?', reponse: 'Une facture peut être : BROUILLON → ENVOYÉE → EN ATTENTE (impayée dans les délais) → EN RETARD (échéance dépassée) → PARTIELLEMENT PAYÉE → PAYÉE. Le statut se met à jour automatiquement selon les paiements enregistrés.' },
  { categorie: 'Devis & Factures', ordre: 8, question: 'Comment enregistrer un paiement ?', reponse: 'Ouvrez la facture concernée et cliquez sur "Enregistrer un paiement". Renseignez le montant, la date et le moyen de paiement. Le statut se met à jour automatiquement (PARTIELLEMENT PAYÉE ou PAYÉE).' },
  { categorie: 'Devis & Factures', ordre: 9, question: 'Comment télécharger le PDF d\'un devis ou d\'une facture ?', reponse: 'Ouvrez le devis ou la facture et cliquez sur le bouton "Télécharger PDF" (icône de téléchargement). Le fichier est généré avec votre logo, couleur de marque et toutes les mentions légales obligatoires.' },
  { categorie: 'Devis & Factures', ordre: 10, question: 'Le PDF n\'affiche pas mon logo, pourquoi ?', reponse: 'Assurez-vous d\'avoir uploadé votre logo dans "Paramètres" > "Mon entreprise". Le logo doit être au format PNG ou JPG, de moins de 2 Mo. Après l\'avoir ajouté, re-générez le PDF.' },
  { categorie: 'Devis & Factures', ordre: 11, question: 'La numérotation des devis et factures est-elle automatique ?', reponse: 'Oui. Les devis sont numérotés DEV-AAAA-NNNN et les factures FAC-AAAA-NNNN. La numérotation est séquentielle et ne peut pas être modifiée, conformément aux obligations légales françaises.' },

  // ── Catalogue ───────────────────────────────────────────────────────────────
  { categorie: 'Catalogue', ordre: 1, question: 'Qu\'est-ce que l\'auto-apprentissage du catalogue ?', reponse: 'Autobat ajuste automatiquement les prix de vos ouvrages tous les 2 chantiers terminés, en se basant sur le temps réel passé versus le temps estimé. Cela permet à vos prix de refléter la réalité terrain au fil du temps.' },
  { categorie: 'Catalogue', ordre: 2, question: 'Puis-je ajouter mes propres ouvrages au catalogue ?', reponse: 'Oui ! Dans "Catalogue", cliquez sur "+ Nouvel ouvrage". Renseignez le nom, l\'unité, le prix unitaire HT et le temps estimé. Cet ouvrage sera ensuite disponible dans vos devis.' },
  { categorie: 'Catalogue', ordre: 3, question: 'Comment modifier le prix d\'un ouvrage existant ?', reponse: 'Dans "Catalogue", cliquez sur l\'ouvrage puis sur "Modifier". Vous pouvez ajuster le prix unitaire HT, le temps estimé et la description. La modification prend effet immédiatement sur les prochains devis.' },
  { categorie: 'Catalogue', ordre: 4, question: 'Qu\'est-ce que le "temps estimé" dans un ouvrage ?', reponse: 'Le temps estimé (en heures) correspond au temps de main-d\'œuvre prévu pour réaliser l\'unité de cet ouvrage. Il sert à l\'auto-apprentissage : si le temps réel est différent, le prix sera ajusté en conséquence.' },
  { categorie: 'Catalogue', ordre: 5, question: 'Comment rechercher un ouvrage dans le catalogue ?', reponse: 'Utilisez la barre de recherche en haut de la page "Catalogue". Vous pouvez filtrer par nom, référence ou catégorie. Le catalogue Autobat contient plus de 300 ouvrages BTP pré-chargés.' },
  { categorie: 'Catalogue', ordre: 6, question: 'Comment désactiver l\'auto-apprentissage pour un ouvrage ?', reponse: 'Cette fonctionnalité n\'est pas encore désactivable par ouvrage. Si vous souhaitez figer un prix, notez-le dans la description. Une option de blocage de prix est prévue dans une prochaine version.' },

  // ── Chantiers & Équipes ─────────────────────────────────────────────────────
  { categorie: 'Chantiers & Équipes', ordre: 1, question: 'Comment assigner des employés à un chantier ?', reponse: 'Dans le détail d\'un chantier, onglet "Infos", cliquez sur "Assigner des employés". Sélectionnez les membres de votre équipe dans la liste. Ils verront ce chantier dans leur espace et pourront y badger.' },
  { categorie: 'Chantiers & Équipes', ordre: 2, question: 'Comment faire avancer le statut d\'un chantier ?', reponse: 'Dans le détail du chantier, cliquez sur le bouton de statut en haut de la page. Vous pouvez faire passer un chantier de PLANIFIÉ → EN COURS → TERMINÉ. Un chantier doit être TERMINÉ pour pouvoir créer la facture.' },
  { categorie: 'Chantiers & Équipes', ordre: 3, question: 'Comment ajouter une tâche à un chantier ?', reponse: 'Dans le détail d\'un chantier, onglet "Tâches", cliquez sur "+ Nouvelle tâche". Renseignez le titre, la description et assignez-la à un employé. Les tâches peuvent être marquées comme terminées par l\'équipe.' },
  { categorie: 'Chantiers & Équipes', ordre: 4, question: 'Comment uploader un document sur un chantier ?', reponse: 'Dans le détail d\'un chantier, onglet "Documents", cliquez sur "+ Ajouter un document". Sélectionnez le fichier (PDF, image, etc.). Les documents sont accessibles à toute l\'équipe assignée au chantier.' },
  { categorie: 'Chantiers & Équipes', ordre: 5, question: 'Comment fonctionne le badgeage GPS ?', reponse: 'L\'application détecte automatiquement la présence d\'un employé sur le chantier (rayon 100m). Le badgeage se fait entre 7h et 19h du lundi au samedi. Si le téléphone est hors ligne, les pointages sont sauvegardés et synchronisés au retour de la connexion.' },
  { categorie: 'Chantiers & Équipes', ordre: 6, question: 'Comment badger manuellement si le GPS ne fonctionne pas ?', reponse: 'Un manager ou admin peut enregistrer un badgeage manuel depuis le détail du chantier, onglet "Badgeages". Renseignez l\'employé, l\'heure d\'arrivée et de départ. Ce badgeage sera marqué comme "manuel" dans les rapports.' },
  { categorie: 'Chantiers & Équipes', ordre: 7, question: 'Comment consulter les heures badgées d\'un employé ?', reponse: 'Dans "Employés", ouvrez la fiche d\'un employé pour voir ses badgeages récents. Depuis "Chantiers", l\'onglet "Badgeages" liste toutes les présences sur ce chantier avec les totaux d\'heures par employé.' },
  { categorie: 'Chantiers & Équipes', ordre: 8, question: 'Qu\'est-ce que l\'onglet Discussion dans un chantier ?', reponse: 'L\'onglet Discussion permet à toute l\'équipe assignée à un chantier d\'échanger des messages. Les messages sont actualisés régulièrement. Seul l\'auteur ou un manager peut supprimer un message.' },
  { categorie: 'Chantiers & Équipes', ordre: 9, question: 'À quoi sert l\'onglet Tâches dans un chantier ?', reponse: 'Les tâches permettent de découper le travail en étapes et de les assigner à des membres de l\'équipe. Chaque tâche a un statut (À faire / En cours / Terminé) visible par tout le monde sur le chantier.' },

  // ── Planning ────────────────────────────────────────────────────────────────
  { categorie: 'Planning', ordre: 1, question: 'À quoi sert le Planning ?', reponse: 'Le Planning affiche l\'emploi du temps de votre équipe sous forme de calendrier hebdomadaire. Il permet de visualiser qui est assigné à quel chantier sur quelle période, et d\'anticiper les conflits de planning.' },
  { categorie: 'Planning', ordre: 2, question: 'Comment naviguer dans le Planning ?', reponse: 'Utilisez les flèches gauche/droite pour naviguer semaine par semaine. Les boutons "Jour", "Semaine", "Mois" permettent de changer la vue. Chaque événement coloré représente un chantier avec son équipe assignée.' },
  { categorie: 'Planning', ordre: 3, question: 'Les congés et absences apparaissent-ils dans le Planning ?', reponse: 'La gestion des congés n\'est pas encore disponible dans Autobat. Le planning affiche uniquement les chantiers planifiés et les assignations d\'équipe. Cette fonctionnalité est prévue dans une prochaine version.' },

  // ── Notifications ────────────────────────────────────────────────────────────
  { categorie: 'Notifications', ordre: 1, question: 'Comment fonctionnent les notifications ?', reponse: 'Les notifications in-app apparaissent dans la cloche en haut de l\'écran. Elles vous alertent sur les événements importants : facture en retard, devis accepté, nouveau message sur un chantier, etc.' },
  { categorie: 'Notifications', ordre: 2, question: 'Comment marquer les notifications comme lues ?', reponse: 'Cliquez sur la cloche pour ouvrir le panneau de notifications. Cliquez sur une notification pour la marquer comme lue et accéder directement à l\'élément concerné. Vous pouvez aussi tout marquer comme lu d\'un coup.' },
  { categorie: 'Notifications', ordre: 3, question: 'Quels événements déclenchent une notification ?', reponse: 'Vous recevez des notifications pour : une facture arrivant à échéance, un devis accepté ou refusé, un nouveau message dans une discussion de chantier, et d\'autres événements métier importants.' },

  // ── Compte & Abonnement ─────────────────────────────────────────────────────
  { categorie: 'Compte & Abonnement', ordre: 1, question: 'Comment ajouter un employé ?', reponse: 'Allez dans "Employés" > "+ Nouvel employé". Renseignez ses informations et son rôle (EMPLOYEE ou MANAGER). Transmettez-lui manuellement son email et son mot de passe provisoire. Notez que chaque compte supplémentaire coûte 20€/mois.' },
  { categorie: 'Compte & Abonnement', ordre: 2, question: 'Quelle est la différence entre EMPLOYEE et MANAGER ?', reponse: 'Un EMPLOYEE peut badger, voir ses chantiers et ses heures. Un MANAGER a accès à tout sauf la gestion des comptes et les paramètres de l\'entreprise. Il peut créer des devis, gérer les chantiers et voir les finances.' },
  { categorie: 'Compte & Abonnement', ordre: 3, question: 'Comment changer le rôle d\'un employé ?', reponse: 'Dans "Employés", ouvrez la fiche de l\'employé et cliquez sur "Modifier". Changez le rôle dans le menu déroulant. La modification prend effet immédiatement à la prochaine connexion de l\'employé.' },
  { categorie: 'Compte & Abonnement', ordre: 4, question: 'Comment modifier les informations de mon entreprise ?', reponse: 'Rendez-vous dans "Paramètres" > "Mon entreprise". Vous pouvez modifier votre SIRET, adresse, logo, couleur de marque et les mentions légales qui apparaissent sur vos PDF.' },
  { categorie: 'Compte & Abonnement', ordre: 5, question: 'Comment changer mon mot de passe ?', reponse: 'Allez dans "Profil & Paramètres" (en bas à gauche) > "Sécurité". Saisissez votre mot de passe actuel puis le nouveau. Le changement est immédiat.' },
  { categorie: 'Compte & Abonnement', ordre: 6, question: 'Comment consulter mon abonnement ?', reponse: 'Rendez-vous dans "Paramètres" > "Abonnement" pour voir votre plan actuel, le nombre de comptes actifs et la prochaine date de facturation. Pour toute question de facturation, contactez-nous via le support.' },
  { categorie: 'Compte & Abonnement', ordre: 7, question: 'Comment personnaliser la couleur de marque sur mes PDF ?', reponse: 'Dans "Paramètres" > "Mon entreprise", cliquez sur le sélecteur de couleur. La couleur choisie sera appliquée à l\'en-tête et aux éléments de mise en forme de tous vos devis et factures PDF.' },

  // ── Dashboard ────────────────────────────────────────────────────────────────
  { categorie: 'Dashboard', ordre: 1, question: 'Que signifient les indicateurs du Dashboard ?', reponse: 'Le Dashboard affiche : Chantiers actifs (EN COURS), Taux d\'encaissement (CA payé / CA facturé), CA encaissé (montant réellement reçu) et Chiffre d\'affaires TTC (total facturé sur la période). Utilisez les boutons Jour/Semaine/Mois/Année pour filtrer.' },
  { categorie: 'Dashboard', ordre: 2, question: 'Comment filtrer les données du Dashboard par période ?', reponse: 'En haut à droite du Dashboard, cliquez sur "Jour", "Semaine", "Mois" ou "Année" pour changer la période d\'analyse. Les KPIs et graphiques se mettent à jour instantanément.' },
  { categorie: 'Dashboard', ordre: 3, question: 'Qu\'est-ce que le taux d\'encaissement ?', reponse: 'Le taux d\'encaissement est le ratio entre le CA effectivement encaissé (factures payées) et le CA total facturé sur la période. Un taux de 100% signifie que toutes les factures ont été payées.' },
];

async function main() {
  console.log('Seeding FAQ items...');

  // Supprimer les anciens items avant de re-seeder
  await prisma.faqItem.deleteMany();

  for (const item of faqItems) {
    await prisma.faqItem.create({ data: item });
  }

  console.log(`✅ ${faqItems.length} FAQ items créés.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
