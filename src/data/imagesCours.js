/**
 * imagesCours.js — Registre centralisé des diagrammes/visuels utilisés
 * dans le contenu des leçons (voir coursCatalogue.js).
 *
 * Chaque cours référence une image via la syntaxe :
 *   ![légende](cle_image)
 * dans son texte de chapitre — Cours.jsx (MarkdownContent) résout la clé
 * vers l'import Vite correspondant ci-dessous.
 */
import statL1Camembert from '../assets/cours/statistiques/l1-camembert.png';
import statL1Bandes from '../assets/cours/statistiques/l1-bandes.png';
import statL2Batons from '../assets/cours/statistiques/l2-batons.png';
import statL2Histogramme from '../assets/cours/statistiques/l2-histogramme.png';
import statL4Quartiles from '../assets/cours/statistiques/l4-quartiles.png';
import statL6Asymetrie from '../assets/cours/statistiques/l6-asymetrie.png';
import statL7Lorenz from '../assets/cours/statistiques/l7-lorenz.png';
import statL9FormesNuages from '../assets/cours/statistiques/l9-formes-nuages.png';
import statL9DroiteAjustement from '../assets/cours/statistiques/l9-droite-ajustement.png';

export const IMAGES_COURS = {
  stat_l1_camembert: statL1Camembert,
  stat_l1_bandes: statL1Bandes,
  stat_l2_batons: statL2Batons,
  stat_l2_histogramme: statL2Histogramme,
  stat_l4_quartiles: statL4Quartiles,
  stat_l6_asymetrie: statL6Asymetrie,
  stat_l7_lorenz: statL7Lorenz,
  stat_l9_formes_nuages: statL9FormesNuages,
  stat_l9_droite_ajustement: statL9DroiteAjustement,
};
