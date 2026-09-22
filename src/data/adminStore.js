/**
 * adminStore.js — Comptes administrateurs et laissez-passer
 *
 * Deux clés admin distinctes :
 *   - admin1 (Support)     : gère les élèves, la modération, les abonnements
 *   - admin2 (Technicien)  : gère les bugs, la maintenance, le contenu
 * Les deux partagent le MÊME tableau de bord et voient les mêmes chiffres,
 * mais leur historique de connexion est tracé séparément.
 *
 * Un unique laissez-passer permet à l'un ou l'autre de se connecter en tant
 * qu'élève, à n'importe quel niveau, pour inspecter et tester le site.
 *
 * ⚠️ En production, ces clés devront être vérifiées côté serveur
 * (Supabase Auth + colonne `role`), jamais comparées dans le navigateur.
 * Voir RAG_SETUP.md — ce fichier ne sert qu'au fonctionnement en démo.
 */

export const ROLES_ADMIN = {
  admin1: {
    id: 'admin1',
    role: 'support',
    label: 'Admin Support',
    description: 'Élèves, modération, abonnements, communication',
  },
  admin2: {
    id: 'admin2',
    role: 'technicien',
    label: 'Admin Technicien',
    description: 'Bugs, maintenance, contenu, intégrations',
  },
};

/* Clés de démonstration — à remplacer par une vraie authentification serveur */
const CLES_DEMO = {
  'MI-ADMIN-SUPPORT-2026': 'admin1',
  'MI-ADMIN-TECH-2026':    'admin2',
};

/** Le laissez-passer commun aux deux administrateurs. */
export const LAISSEZ_PASSER = 'MI-PASS-2026';

const LS_SESSION   = 'mi_admin_session';
const LS_HISTORIQUE = 'mi_admin_historique';

/** Vérifie une clé admin et renvoie le rôle correspondant, ou null. */
export function verifierCleAdmin(cle) {
  const id = CLES_DEMO[(cle || '').trim().toUpperCase()];
  return id ? ROLES_ADMIN[id] : null;
}

/** Ouvre une session admin et journalise la connexion. */
export function ouvrirSessionAdmin(adminId) {
  const admin = ROLES_ADMIN[adminId];
  if (!admin) return null;
  localStorage.setItem(LS_SESSION, JSON.stringify(admin));
  journaliser(adminId, 'connexion');
  return admin;
}

/** L'admin actuellement connecté, ou null. */
export function getSessionAdmin() {
  try { return JSON.parse(localStorage.getItem(LS_SESSION) || 'null'); }
  catch { return null; }
}

export function fermerSessionAdmin() {
  const admin = getSessionAdmin();
  if (admin) journaliser(admin.id, 'déconnexion');
  localStorage.removeItem(LS_SESSION);
}

/** Journal des connexions — séparé par administrateur, comme demandé. */
export function journaliser(adminId, action, detail = '') {
  try {
    const hist = JSON.parse(localStorage.getItem(LS_HISTORIQUE) || '[]');
    hist.unshift({
      admin_id: adminId,
      action,
      detail,
      date: new Date().toISOString(),
    });
    /* On garde les 200 dernières entrées pour ne pas saturer le stockage */
    localStorage.setItem(LS_HISTORIQUE, JSON.stringify(hist.slice(0, 200)));
  } catch { /* stockage indisponible : le journal n'est pas critique */ }
}

/** Historique complet, ou filtré sur un administrateur précis. */
export function getHistorique(adminId = null) {
  try {
    const hist = JSON.parse(localStorage.getItem(LS_HISTORIQUE) || '[]');
    return adminId ? hist.filter(h => h.admin_id === adminId) : hist;
  } catch { return []; }
}

/* ══════════════════════════════════════════
   LAISSEZ-PASSER — se connecter en tant qu'élève
══════════════════════════════════════════ */

export const NIVEAUX_INSPECTION = [
  { val:'seconde',            label:'Seconde (2nde)' },
  { val:'premiere',           label:'Première (1ère)' },
  { val:'terminale',          label:'Terminale' },
  { val:'universite-l1',      label:'Licence 1 (L1)' },
  { val:'universite-l2',      label:'Licence 2 (L2)' },
  { val:'universite-l3',      label:'Licence 3 (L3)' },
  { val:'universite-master',  label:'Master' },
];

/**
 * Construit le profil élève utilisé par le laissez-passer.
 * L'administrateur devient un élève ordinaire : il suit les cours, gagne des
 * points et figure au classement — mais son compte reste marqué `inspection`
 * pour qu'on puisse le distinguer d'un vrai élève si besoin.
 */
export function profilInspection({ niveau, plan = 'premium', admin }) {
  const estUniv = niveau.startsWith('universite');
  return {
    id: `inspection-${admin?.id || 'admin'}-${niveau}`,
    prenom: admin?.role === 'technicien' ? 'Inspection' : 'Support',
    nom: 'Madior',
    email: `${admin?.id || 'admin'}@madiorinsight.sn`,
    niveau,
    type: estUniv ? 'universite' : 'lycee',
    plan: estUniv && !['pro','elite'].includes(plan) ? 'premium' : plan,
    lycee: 'Compte d\'inspection',
    contenuDebloque: [],
    contenuChoisiConfirme: true,
    points: 0,
    streak: 0,
    INBoutique: 0,
    is_admin: false,      /* pendant l'inspection, il navigue comme un élève */
    inspection: true,     /* marqueur interne */
    admin_origine: admin?.id || null,
  };
}
