/**
 * messagesStore.js — Conversations démo + suivi des messages non lus
 *
 * Avant ce fichier, Messages.jsx gérait son propre état local ET la Sidebar
 * affichait un badge codé en dur ("2"), déconnecté de la réalité : le badge
 * ne changeait jamais, même après lecture de tous les messages.
 *
 * Ce module centralise les conversations et le statut "lu" (persistant en
 * localStorage) pour que la Sidebar et la page Messages restent synchronisées.
 */

export const CONVS_INIT = [
  {
    id:'admin', nom:'Équipe Madior Insight', init:'MI', couleur:'var(--copper)',
    messages:[
      { from:'admin', text:'Bienvenue sur Madior Insight ! N\'hésite pas à nous écrire si tu as des questions.', ts:'01/08/2026 09:00', lu:true },
      { from:'admin', text:'Ton accès Premium est activé. Profite de l\'IA illimitée et des bacs corrigés !', ts:'01/08/2026 09:01', lu:true },
      { from:'eleve', text:'Merci ! J\'ai une question sur le chapitre SYSCOHADA.', ts:'20/08/2026 14:30', lu:true },
      { from:'admin', text:'Bien sûr ! Pose ta question ici ou utilise l\'Assistant IA directement.', ts:'20/08/2026 15:00', lu:false },
    ]
  },
  {
    id:'tuteur', nom:'M. Diop — Tuteur', init:'D', couleur:'#1D3557',
    messages:[
      { from:'admin', text:'Bonjour ! Je suis ton tuteur assigné. Je suis disponible pour corriger tes exercices soumis.', ts:'15/08/2026 10:00', lu:true },
      { from:'eleve', text:'Super ! Quand aurai-je la correction de mon TD de comptabilité ?', ts:'18/08/2026 16:00', lu:true },
      { from:'admin', text:'Ta correction sera prête demain matin avec les étapes SYSCOHADA détaillées.', ts:'18/08/2026 17:30', lu:false },
    ]
  },
];

const LS_KEY = 'mi_conversations_ouvertes';
const EVENT_NAME = 'mi-messages-changed';

function getConvsOuvertes() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
  catch { return new Set(); }
}

/** Renvoie les conversations avec leurs messages marqués "lu" si la conv a déjà été ouverte. */
export function chargerConvs() {
  const ouvertes = getConvsOuvertes();
  return CONVS_INIT.map(c => ouvertes.has(c.id)
    ? { ...c, messages: c.messages.map(m => ({ ...m, lu: true })) }
    : c
  );
}

/** Marque une conversation comme ouverte (tous ses messages passent à lu) et prévient les autres composants (ex: Sidebar). */
export function marquerConvLue(id) {
  const ouvertes = getConvsOuvertes();
  ouvertes.add(id);
  localStorage.setItem(LS_KEY, JSON.stringify([...ouvertes]));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

/** Nombre total de messages non lus (admin → élève), toutes conversations confondues. */
export function getTotalNonLus() {
  const convs = chargerConvs();
  return convs.reduce((total, c) => total + c.messages.filter(m => m.from === 'admin' && !m.lu).length, 0);
}

/** S'abonner aux changements (à utiliser dans un useEffect, ex: Sidebar). Renvoie une fonction de désabonnement. */
export function onMessagesChanged(callback) {
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener('storage', callback); // synchronise aussi entre onglets
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
}
