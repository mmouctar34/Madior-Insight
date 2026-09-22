/**
 * boutiqueCatalogue.js — Catalogue de la boutique + suivi des achats
 *
 * Extrait de Boutique.jsx pour que la page « Mes documents » puisse afficher
 * les documents et sujets du BAC réellement achetés par l'élève, sans
 * dupliquer les données (une seule source de vérité).
 */

export const BOUTIQUE = {
  jetons: [
    { id:'j1', label:'Pack 50 IN',  desc:'50 Insights Normaux à dépenser librement', prix:2500,  gain_in:50 },
    { id:'j2', label:'Pack 120 IN', desc:'120 Insights Normaux — le plus choisi',     prix:5000,  gain_in:120, bestseller:true },
    { id:'j3', label:'Pack 300 IN', desc:'300 Insights Normaux — meilleur rapport',   prix:10000, gain_in:300 },
    { id:'j4', label:'Pack 20 IS',  desc:'20 Insights Spéciaux (Terminale/Université)', prix:6000, gain_is:20 },
  ],
  documents: [
    { id:'d1', label:'Fascicule Économie Série STEG', desc:'68 pages · Cours complets + exercices résolus', prix_in:30, matiere:'Économie' },
    { id:'d2', label:'Fascicule Comptabilité SYSCOHADA', desc:'84 pages · Plan comptable, journal, bilan, amortissements', prix_in:35, matiere:'Comptabilité' },
    { id:'d3', label:'Fascicule Mathématiques', desc:'72 pages · Dérivées, variations, intérêts, annuités', prix_in:30, matiere:'Mathématiques' },
    { id:'d4', label:'TD Corrigés — Économie (10 TD)', desc:'10 travaux dirigés corrigés étape par étape', prix_in:20, matiere:'Économie' },
    { id:'d5', label:'TD Corrigés — Comptabilité (10 TD)', desc:'10 travaux dirigés corrigés SYSCOHADA', prix_in:20, matiere:'Comptabilité' },
    { id:'d6', label:'PDF Offert — Économie (aperçu)', desc:'Extrait gratuit pour découvrir la qualité', prix_in:0, matiere:'Économie', gratuit:true },
  ],
  bacs: [
    { id:'b1', label:'Sujet BAC 2023 — Économie + Correction', desc:'Sujet officiel avec correction complète', prix_is:10, annee:2023, matiere:'Économie' },
    { id:'b2', label:'Sujet BAC 2023 — Comptabilité + Correction', desc:'Sujet officiel avec correction détaillée', prix_is:10, annee:2023, matiere:'Comptabilité' },
    { id:'b3', label:'Sujet BAC 2022 — Économie + Correction', desc:'Sujet officiel BAC 2022 avec correction', prix_is:10, annee:2022, matiere:'Économie' },
    { id:'b4', label:'Sujet BAC 2022 — Comptabilité + Correction', desc:'Correction SYSCOHADA révisé', prix_is:10, annee:2022, matiere:'Comptabilité' },
    { id:'b5', label:'Pack 3 BAC corrigés — ton choix', desc:'3 sujets parmi toute la collection', prix_fcfa:7500, pack:true },
    { id:'b6', label:'Pack 8 BAC corrigés — collection complète', desc:'8 sujets BAC corrigés — meilleur rapport qualité/prix', prix_fcfa:15000, pack:true, bestseller:true },
    { id:'b7', label:'Sujet spécial 2nde — Économie', desc:'Niveau adapté avec correction (non BAC)', prix_is:5, matiere:'Économie', special:true },
    { id:'b8', label:'Sujet spécial 1ère — Comptabilité', desc:'Correction détaillée adaptée au niveau', prix_is:5, matiere:'Comptabilité', special:true },
  ],
};

const LS_ACHATS = 'mi_achats';

/** Liste des identifiants d'articles achetés par l'élève. */
export function getAchats() {
  try { return JSON.parse(localStorage.getItem(LS_ACHATS) || '[]'); }
  catch { return []; }
}

/** Enregistre un achat et prévient les autres pages (ex: Mes documents). */
export function enregistrerAchat(itemId) {
  const achats = getAchats();
  if (!achats.includes(itemId)) {
    achats.push(itemId);
    localStorage.setItem(LS_ACHATS, JSON.stringify(achats));
    window.dispatchEvent(new CustomEvent('mi-achats-changed'));
  }
}

/** Retrouve un article du catalogue à partir de son identifiant. */
export function trouverArticle(itemId) {
  for (const [section, items] of Object.entries(BOUTIQUE)) {
    const found = items.find(i => i.id === itemId);
    if (found) return { ...found, section };
  }
  return null;
}

/** Les documents et sujets BAC achetés, prêts à afficher dans « Mes documents ». */
export function getMesDocuments() {
  return getAchats()
    .map(trouverArticle)
    .filter(a => a && (a.section === 'documents' || a.section === 'bacs'));
}

/** S'abonner aux changements (achats depuis la boutique). */
export function onAchatsChanged(callback) {
  window.addEventListener('mi-achats-changed', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('mi-achats-changed', callback);
    window.removeEventListener('storage', callback);
  };
}
