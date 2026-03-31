-- AlterTable: rendre chantier_id optionnel sur Facture
-- Permet de créer une facture sans chantier associé (client direct)
ALTER TABLE "Facture" ALTER COLUMN "chantier_id" DROP NOT NULL;

-- Ajout des champs manquants objet et mentions_legales (si pas déjà présents via migrations précédentes)
-- Ces colonnes sont ajoutées par les migrations 20260319000001 et 20260319000002
-- Cette migration ne les re-crée pas pour éviter les conflits
