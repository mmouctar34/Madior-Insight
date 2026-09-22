/**
 * wavePayment.js — Paiement Wave (unique moyen de paiement actif pour l'instant)
 *
 * Deux modes :
 * - Supabase configuré → appelle l'Edge Function `wave-checkout` qui crée
 *   une vraie session de paiement Wave et renvoie l'URL de paiement
 *   (wave_launch_url) vers laquelle rediriger l'élève.
 * - Sinon (démo)        → simule un paiement réussi après un court délai,
 *   pour que le reste de l'app (abonnement, boutique) reste testable
 *   sans configuration.
 */
import { supabase, isRagConfigured } from './supabaseClient';

export const isWaveConfigured = isRagConfigured;

/**
 * Crée une session de paiement Wave.
 * @param {{ montant:number, description:string, userId:string, metadata:object }} params
 * @returns {Promise<{ demo:true } | { demo:false, wave_launch_url:string, session_id:string }>}
 */
export async function creerPaiementWave({ montant, description, userId, metadata = {} }) {
  if (!isWaveConfigured()) {
    /* Mode démo : pas d'Edge Function déployée. Le composant appelant
       simule le succès localement (voir PaiementModal.jsx). */
    return { demo: true };
  }

  const { data, error } = await supabase.functions.invoke('wave-checkout', {
    body: { montant, description, userId, metadata },
  });

  if (error) throw new Error(error.message || 'Impossible de créer le paiement Wave');
  if (!data?.wave_launch_url) throw new Error('Réponse Wave invalide');

  return { demo: false, ...data };
}

/**
 * Vérifie le statut d'une transaction (utilisé sur la page de retour après paiement).
 */
export async function verifierTransactionWave(sessionId) {
  if (!isWaveConfigured() || !sessionId) return null;
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('wave_session_id', sessionId)
    .single();
  if (error) return null;
  return data;
}
