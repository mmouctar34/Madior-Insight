/* ════════════════════════════
   constants.js — Madior Insight
════════════════════════════ */

/* ── Règle d'accès cours par niveau ──
   2nde    → cours 2nde uniquement
   1ère    → cours 2nde + 1ère
   Terminale → cours 2nde + 1ère + Terminale
   Université → tous les cours
*/
export const NIVEAUX_ORDRE = ['seconde','premiere','terminale','universite'];

export function getNiveauIndex(niveau) {
  if (!niveau) return 2;
  if (niveau.startsWith('universite')) return 3;
  return NIVEAUX_ORDRE.indexOf(niveau);
}

/* L'élève peut voir un cours si son niveau >= niveau du cours */
export function peutVoirCours(userNiveau, coursNiveau) {
  return getNiveauIndex(userNiveau) >= getNiveauIndex(coursNiveau);
}

/* ── Matières enseignées sur le site ── */
export const MATIERES_COURS = ['comptabilite','economie','maths','anglais','espagnol','statistiques','microeconomie'];

/* ── Matières calculateur de moyenne uniquement ── */
export const MATIERES_CALC_ONLY = ['francais','philosophie','eps','informatique','cmc','management','droit'];

/* ── Toutes les matières avec coefficients ── */
export const MATIERES = {
  comptabilite: { label:'Comptabilité',  coeff:6, color:'#1D3557', bg:'rgba(29,53,87,0.09)',   cours:true  },
  economie:     { label:'Économie',      coeff:6, color:'#C4621A', bg:'rgba(196,98,26,0.09)',  cours:true  },
  maths:        { label:'Mathématiques', coeff:4, color:'#7C3AED', bg:'rgba(124,58,237,0.09)', cours:true  },
  anglais:      { label:'Anglais',       coeff:2, color:'#0284C7', bg:'rgba(2,132,199,0.09)',  cours:true  },
  espagnol:     { label:'Espagnol',      coeff:2, color:'#DC2626', bg:'rgba(220,38,38,0.09)',  cours:true  },
  francais:     { label:'Français',      coeff:3, color:'#059669', bg:'rgba(5,150,105,0.09)',  cours:false },
  philosophie:  { label:'Philosophie',   coeff:2, color:'#9D174D', bg:'rgba(157,23,77,0.09)',  cours:false, niveaux:['terminale'] },
  droit:        { label:'Droit',         coeff:2, color:'#92400E', bg:'rgba(146,64,14,0.09)',  cours:false },
  management:   { label:'Management',    coeff:2, color:'#065F46', bg:'rgba(6,95,70,0.09)',    cours:false },
  informatique: { label:'Informatique',  coeff:2, color:'#1E40AF', bg:'rgba(30,64,175,0.09)', cours:false },
  cmc:          { label:'CMC',           coeff:2, color:'#6B7280', bg:'rgba(107,114,128,0.09)',cours:false },
  eps:          { label:'EPS',           coeff:1, color:'#047857', bg:'rgba(4,120,87,0.09)',   cours:false },
  statistiques: { label:'Statistiques',  coeff:3, color:'#0E7490', bg:'rgba(14,116,144,0.09)', cours:true,  niveaux:['universite'] },
  microeconomie:{ label:'Microéconomie', coeff:4, color:'#B45309', bg:'rgba(180,83,9,0.09)',   cours:true,  niveaux:['universite'] },
};

/* ── Comptabilité par niveau ── */
/* Comptabilité : Seconde/Première n'ont que la comptabilité générale.
   Terminale et Université partagent les 3 mêmes rubriques (accessibles
   depuis la même matière "Comptabilité" dans la page Cours). */
export const COMPTA_TYPES = {
  seconde:    ['Comptabilité générale'],
  premiere:   ['Comptabilité générale'],
  terminale:  ['Comptabilité générale','Comptabilité analytique','Analyse financière'],
  universite: ['Comptabilité générale','Comptabilité analytique','Analyse financière'],
};

/* ── Mathématiques par niveau ──
   Comme pour la comptabilité : deux rubriques disponibles sous la
   matière "Mathématiques" (Cours), à tous les niveaux où des cours existent. */
export const MATHS_TYPES = {
  seconde:    ['Mathématiques générales','Mathématiques financières'],
  premiere:   ['Mathématiques générales','Mathématiques financières'],
  terminale:  ['Mathématiques générales','Mathématiques financières'],
  universite: ['Mathématiques générales','Mathématiques financières'],
};

/* ── Rangs (inspiré CODM) ── */
export const RANGS = [
  { id:'challenger',  label:'Challenger',  min:0,     max:2000,    color:'#8B6914', bg:'rgba(139,105,20,0.12)'  },
  { id:'rising_star', label:'Rising Star',  min:2001,  max:6000,    color:'#3B82F6', bg:'rgba(59,130,246,0.12)'  },
  { id:'pro_mind',    label:'Pro-Mind',     min:6001,  max:12000,   color:'#10B981', bg:'rgba(16,185,129,0.12)'  },
  { id:'vanguard',    label:'Vanguard',     min:12001, max:20000,   color:'#8B5CF6', bg:'rgba(139,92,246,0.12)'  },
  { id:'mastermind',  label:'Mastermind',   min:20001, max:35000,   color:'#F59E0B', bg:'rgba(245,158,11,0.12)'  },
  { id:'titan',       label:'Titan',        min:35001, max:55000,   color:'#EF4444', bg:'rgba(239,68,68,0.12)'   },
  { id:'mythic',      label:'Mythic',       min:55001, max:Infinity, color:'#C4621A', bg:'rgba(196,98,26,0.15)'  },
];

export function getRang(pts) {
  return RANGS.find(r => pts >= r.min && pts <= r.max) || RANGS[0];
}

/* ── Plans ── */
export const PLANS_LYCEE = {
  standard:{ label:'Standard', prix:3000,  IN:20,  IS:0,  rag:2,   features:['20 Insights Normaux','1 leçon + son TD au choix','2 questions IA/jour','Accès à la boutique'] },
  medium:  { label:'Medium',   prix:8000,  IN:120, IS:0,  rag:10,  features:['120 Insights Normaux','6 leçons + leurs TD au choix','10 questions IA/jour','Exercices corrigés'], featured:true },
  premium: { label:'Premium',  prix:30000, IN:120, IS:30, rag:999, features:['120 IN + 30 IS','6 leçons + leurs TD au choix','IA illimitée','3 bacs/mois','2h coaching/semaine'] },
};
export const PLANS_UNIV = {
  pro:   { label:'Pro',   prix:null, IN:300, IS:0,   rag:15, features:['Insights libres','Quota RAG moyen','Toutes matières + Stats'] },
  elite: { label:'Elite', prix:null, IN:600, IS:100, rag:50, features:['Plus d\'insights','RAG élevé','Accompagnement personnel'], featured:true },
};

/* ── Insights Spéciaux (IS) : réservés Terminale + Université ──
   Seconde et Première ne reçoivent jamais d'IS, même sur un plan qui en
   prévoit (ex. Premium) — ils gardent uniquement leurs Insights Normaux (IN). */
export function isEligibleIS(niveau) {
  return niveau === 'terminale' || (niveau || '').startsWith('universite');
}

/* Calcule les quotas réels (IN/IS) pour un couple plan + niveau donné.
   À utiliser à chaque inscription/connexion/changement de plan, plutôt que
   de faire confiance à un IN/IS stocké côté client. */
export function getQuotasForPlan(plan, niveau) {
  const def = PLANS_LYCEE[plan] || PLANS_UNIV[plan];
  if (!def) return { IN:0, IS:0 };
  return {
    IN: def.IN,
    IS: isEligibleIS(niveau) ? def.IS : 0,
  };
}

/* ── Sélection de contenu (déblocage cours + TD avec les Insights Normaux) ──
   Chaque « pack » = 1 cours + son TD, débloqués ENSEMBLE pour 20 IN.
   Le TD se débloque automatiquement avec son cours, dans Exercices & TD.
   Standard (20 IN) = 1 pack. Medium/Premium (120 IN) = 6 packs.
   Pro/Elite (300/600 IN) = 15/30 packs. */
export const COUT_PACK_COURS = 20;

/** Nombre de packs (cours+TD) qu'un solde d'IN donné permet de débloquer. */
export function getBudgetPacks(IN) {
  return Math.floor((IN || 0) / COUT_PACK_COURS);
}

/* ── Points ── */
export const POINTS = {
  quiz_cours:     10,
  quiz_infini:    10,
  quiz_actualite: 15,
  bonus_95:        5,
  bonus_vitesse:   5,
};

/* ── Couleurs avatars ── */
export const AV_COLORS = ['#C4621A','#1D3557','#7C3AED','#059669','#DC2626','#D97706','#0284C7','#9D174D','#065F46','#1E40AF'];

/* ── Matricule ── */
export function genMatricule(id) {
  return 'MI-' + new Date().getFullYear() + '-' + String(id).padStart(4,'0');
}

/* ── Plan labels ── */
export const PLAN_LABELS = { premium:'Premium', medium:'Medium', standard:'Standard', gratuit:'Visiteur', pro:'Pro', elite:'Elite' };

/* ══════════════════════════════════════════
   MODÉRATION — Communauté
══════════════════════════════════════════ */

/* Liste volontairement courte de racines à filtrer (grossièretés / insultes
   courantes en français). Filtrage insensible à la casse et aux répétitions
   de lettres (ex: "coooonnard" → détecté). À enrichir depuis l'admin plus tard. */
export const MOTS_INTERDITS = [
  'connard','connasse','encul','pute','putain','salope','batard','bâtard',
  'niquer','nique ta','ntm','fdp','fils de pute','merde alors','abruti',
  'debile','débile','imbecile','imbécile','crétin','cretin','idiot de',
];

/** Normalise un texte pour la détection (minuscules, dédoublonne les lettres répétées). */
function normaliserPourFiltre(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .replace(/(.)\1{2,}/g, '$1$1'); // "coooonnard" → "coonnard"
}

/** Détecte un spam grossier : message en majuscules excessif ou caractères répétés à outrance. */
function ressembleAduSpam(texte) {
  const lettres = texte.replace(/[^a-zA-Zà-üÀ-Ü]/g, '');
  if (lettres.length >= 8) {
    const majuscules = texte.replace(/[^A-ZÀ-Ü]/g, '').length;
    if (majuscules / lettres.length > 0.8) return true; // "ACHETEZ MAINTENANT" style
  }
  if (/(.)\1{6,}/.test(texte)) return true; // "aaaaaaaaaaah" / "!!!!!!!!!!"
  if (/https?:\/\//i.test(texte)) return true; // liens externes interdits dans le chat
  return false;
}

/**
 * Vérifie qu'un message respecte les règles de la communauté.
 * Retourne { ok:boolean, raison?:string }
 */
export function messageEstAcceptable(texte) {
  const t = texte.trim();
  if (!t) return { ok:false, raison:'Message vide.' };
  if (t.length > 500) return { ok:false, raison:'500 caractères maximum.' };

  const normalise = normaliserPourFiltre(t);
  const motTrouve = MOTS_INTERDITS.find(m => normalise.includes(normaliserPourFiltre(m)));
  if (motTrouve) return { ok:false, raison:'Ton message contient un langage inapproprié.' };

  if (ressembleAduSpam(t)) return { ok:false, raison:'Ton message ressemble à du spam (majuscules, liens ou répétitions).' };

  return { ok:true };
}

/* ── Groupes de niveaux pour les canaux de discussion de la Communauté ── */
export const NIVEAU_GROUPES_CHAT = [
  { id:'tous',       label:'Tous les niveaux', match: () => true },
  { id:'seconde',    label:'2nde',             match: (n) => n === 'seconde' },
  { id:'premiere',   label:'1ère',             match: (n) => n === 'premiere' },
  { id:'terminale',  label:'Terminale',        match: (n) => n === 'terminale' },
  { id:'universite', label:'Université',       match: (n) => n?.startsWith('universite') },
];

/* ══════════════════════════════════════════
   PLAN GRATUIT — aperçu limité
══════════════════════════════════════════
   Un élève peut créer un compte sans payer. Il entre sur le site et peut
   tout consulter (classement, communauté, actualité), mais côté cours il
   n'a droit qu'à un aperçu : le PREMIER CHAPITRE de la PREMIÈRE leçon
   d'Économie et de Comptabilité, rien d'autre.
   Ce principe ne concerne QUE les lycéens — les étudiants d'université
   doivent souscrire un plan (Pro ou Elite) pour accéder au contenu. */
export const MATIERES_APERCU_GRATUIT = ['economie', 'comptabilite'];

/** Un élève sans abonnement a-t-il droit à l'aperçu de ce cours ? */
export function estCoursApercuGratuit(cours, tousLesCours) {
  if (!MATIERES_APERCU_GRATUIT.includes(cours.mat)) return false;
  /* Uniquement la toute première leçon de la matière, dans l'ordre du catalogue */
  const premierDeLaMatiere = tousLesCours
    .filter(c => c.mat === cours.mat && c.niveau === cours.niveau)
    .sort((a, b) => a.ordre - b.ordre)[0];
  return premierDeLaMatiere?.id === cours.id;
}

/** Le plan donne-t-il accès à la boutique ? (Standard minimum requis) */
export function peutAccederBoutique(plan) {
  return ['standard', 'medium', 'premium', 'pro', 'elite'].includes(plan);
}

/** Le plan est-il un plan payant (par opposition au compte gratuit) ? */
export function estPlanPayant(plan) {
  return plan && plan !== 'gratuit';
}
