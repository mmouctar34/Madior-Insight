/**
 * moderationStore.js — Modération de la Communauté
 *
 * Deux modes :
 * - Supabase configuré → lit/écrit dans les tables (persistant, partagé entre tous les élèves)
 * - Sinon (démo)        → localStorage, pour que l'admin et l'élève voient le même état
 *   dans le même navigateur sans backend réel.
 *
 * Dans les deux cas, l'API exposée est identique pour ne pas complexifier
 * les composants qui l'utilisent (Communaute.jsx, admin/Admin.jsx).
 */
import { supabase, isRagConfigured } from './supabaseClient';

const LS_BLOQUES      = 'mi_moderation_bloques';
const LS_SIGNALEMENTS = 'mi_moderation_signalements';
const LS_SUPPRIMES    = 'mi_moderation_supprimes'; // ids de messages supprimés (mode démo uniquement)

function lire(key, defaut) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaut;
  } catch { return defaut; }
}
function ecrire(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ══════════════════════════════════════════
   UTILISATEURS BLOQUÉS
══════════════════════════════════════════ */

export async function getUtilisateursBloques() {
  if (isRagConfigured()) {
    const { data, error } = await supabase.from('communaute_bloques').select('*').order('created_at', { ascending:false });
    if (!error && data) return data;
  }
  return lire(LS_BLOQUES, []);
}

export async function bloquerUtilisateur({ userId, prenom, raison = '' }) {
  if (isRagConfigured()) {
    const { error } = await supabase.from('communaute_bloques').upsert({ user_id:userId, prenom, raison });
    if (!error) return true;
  }
  const liste = lire(LS_BLOQUES, []);
  if (!liste.find(b => b.user_id === userId)) {
    liste.unshift({ user_id:userId, prenom, raison, created_at:new Date().toISOString() });
    ecrire(LS_BLOQUES, liste);
  }
  return true;
}

export async function debloquerUtilisateur(userId) {
  if (isRagConfigured()) {
    const { error } = await supabase.from('communaute_bloques').delete().eq('user_id', userId);
    if (!error) return true;
  }
  ecrire(LS_BLOQUES, lire(LS_BLOQUES, []).filter(b => b.user_id !== userId));
  return true;
}

export async function estBloque(userId) {
  const liste = await getUtilisateursBloques();
  return liste.some(b => b.user_id === userId);
}

/* ══════════════════════════════════════════
   SIGNALEMENTS
══════════════════════════════════════════ */

export async function getSignalements() {
  if (isRagConfigured()) {
    const { data, error } = await supabase.from('communaute_signalements').select('*').order('created_at', { ascending:false });
    if (!error && data) return data;
  }
  return lire(LS_SIGNALEMENTS, []);
}

export async function signalerMessage({ messageId, texte, userId, prenom, signalePar, raison = 'Contenu inapproprié' }) {
  const entree = {
    id: `sig-${Date.now()}`,
    message_id: messageId,
    texte,
    user_id: userId,
    prenom,
    signale_par: signalePar,
    raison,
    statut: 'attente',
    created_at: new Date().toISOString(),
  };
  if (isRagConfigured()) {
    const { error } = await supabase.from('communaute_signalements').insert(entree);
    if (!error) return true;
  }
  const liste = lire(LS_SIGNALEMENTS, []);
  liste.unshift(entree);
  ecrire(LS_SIGNALEMENTS, liste);
  return true;
}

export async function resoudreSignalement(id, statut = 'traite') {
  if (isRagConfigured()) {
    const { error } = await supabase.from('communaute_signalements').update({ statut }).eq('id', id);
    if (!error) return true;
  }
  const liste = lire(LS_SIGNALEMENTS, []).map(s => s.id === id ? { ...s, statut } : s);
  ecrire(LS_SIGNALEMENTS, liste);
  return true;
}

/* ══════════════════════════════════════════
   SUPPRESSION DE MESSAGES
══════════════════════════════════════════ */

export async function supprimerMessage(messageId) {
  if (isRagConfigured()) {
    const { error } = await supabase.from('messages_communaute').delete().eq('id', messageId);
    if (!error) return true;
  }
  /* Mode démo : on garde juste la liste des ids supprimés, Communaute.jsx
     filtre dessus au chargement (les messages démo sont statiques en mémoire). */
  const liste = lire(LS_SUPPRIMES, []);
  if (!liste.includes(messageId)) { liste.push(messageId); ecrire(LS_SUPPRIMES, liste); }
  return true;
}

export function getMessagesSupprimesLocal() {
  return lire(LS_SUPPRIMES, []);
}

/* ══════════════════════════════════════════
   BLOCAGE GLOBAL DU CHAT COMMUNAUTAIRE
══════════════════════════════════════════
   L'administrateur peut fermer la communauté pour tout le monde, soit
   temporairement (jusqu'à une date/heure), soit indéfiniment jusqu'à
   réouverture manuelle. */

const LS_CHAT_BLOQUE = 'mi_chat_bloque';

/**
 * État du blocage : { actif, jusqu_a, motif, par }
 * `jusqu_a` à null = blocage indéfini.
 */
export function getEtatChat() {
  try {
    const raw = localStorage.getItem(LS_CHAT_BLOQUE);
    if (!raw) return { actif: false };
    const etat = JSON.parse(raw);
    /* Un blocage temporaire expiré se lève tout seul */
    if (etat.actif && etat.jusqu_a && new Date(etat.jusqu_a) <= new Date()) {
      localStorage.removeItem(LS_CHAT_BLOQUE);
      return { actif: false };
    }
    return etat;
  } catch { return { actif: false }; }
}

/**
 * Bloque le chat pour tous les élèves.
 * @param {number|null} dureeHeures — nombre d'heures, ou null pour un blocage indéfini
 */
export function bloquerChat({ dureeHeures = null, motif = '', par = '' } = {}) {
  const etat = {
    actif: true,
    jusqu_a: dureeHeures ? new Date(Date.now() + dureeHeures * 3600000).toISOString() : null,
    motif,
    par,
    depuis: new Date().toISOString(),
  };
  localStorage.setItem(LS_CHAT_BLOQUE, JSON.stringify(etat));
  window.dispatchEvent(new CustomEvent('mi-chat-etat-change'));
  return etat;
}

/** Rouvre la communauté. */
export function debloquerChat() {
  localStorage.removeItem(LS_CHAT_BLOQUE);
  window.dispatchEvent(new CustomEvent('mi-chat-etat-change'));
}

/** S'abonner aux changements d'état du chat (côté élève comme côté admin). */
export function onEtatChatChange(callback) {
  window.addEventListener('mi-chat-etat-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('mi-chat-etat-change', callback);
    window.removeEventListener('storage', callback);
  };
}
