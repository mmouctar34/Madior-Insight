// ============================================================
// Edge Function : wave-webhook
// Reçoit les événements Wave (checkout.session.completed, etc.),
// vérifie la signature, marque la transaction comme payée et
// débloque l'accès (abonnement ou achat boutique) côté élève.
//
// À configurer dans le tableau de bord Wave Business comme URL
// de webhook : https://VOTRE_PROJET.supabase.co/functions/v1/wave-webhook
//
// Variable d'environnement requise :
//   WAVE_WEBHOOK_SECRET — pour vérifier la signature (Wave-Signature header)
//
// ⚠️ Prérequis important : cette fonction met à jour la table `users`
// (plan, IN, IS). Tant que l'authentification réelle Supabase Auth n'est
// pas branchée (voir RAG_SETUP.md — l'app tourne aujourd'hui en session
// locale de démonstration), aucun `user_id` réel n'existe côté Supabase :
// active donc l'auth réelle avant de mettre ce webhook en production,
// sinon les paiements confirmés ne pourront pas créditer un compte.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';

async function verifierSignature(payload: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === signature;
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const WAVE_WEBHOOK_SECRET = Deno.env.get('WAVE_WEBHOOK_SECRET');
    const signature = req.headers.get('Wave-Signature');

    if (WAVE_WEBHOOK_SECRET) {
      const valide = await verifierSignature(rawBody, signature, WAVE_WEBHOOK_SECRET);
      if (!valide) {
        return new Response(JSON.stringify({ error: 'Signature invalide' }), { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    /* Wave envoie notamment : checkout.session.completed */
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.payment_succeeded') {
      const session = event.data;

      const { data: tx } = await supabase
        .from('transactions')
        .select('*')
        .eq('wave_session_id', session.id)
        .single();

      if (!tx) {
        console.warn('Transaction introuvable pour session Wave', session.id);
        return new Response(JSON.stringify({ received: true, note: 'transaction introuvable' }), { status: 200 });
      }

      /* Idempotence : ne pas retraiter une transaction déjà confirmée */
      if (tx.statut === 'confirme') {
        return new Response(JSON.stringify({ received: true, note: 'déjà traité' }), { status: 200 });
      }

      await supabase.from('transactions').update({ statut: 'confirme', confirme_at: new Date().toISOString() }).eq('id', tx.id);

      /* Débloquer l'accès selon le type d'achat */
      const meta = tx.metadata || {};

      if (meta.type === 'abonnement' && meta.plan) {
        await supabase.from('users').update({
          plan: meta.plan,
          abo_debut: new Date().toISOString(),
          abo_fin: new Date(Date.now() + 30 * 86400000).toISOString(),
        }).eq('id', tx.user_id);

      } else if (meta.type === 'boutique') {
        if (meta.gain_in) {
          await supabase.rpc('incrementer_solde', { p_user_id: tx.user_id, p_champ: 'IN_boutique', p_valeur: meta.gain_in });
        }
        if (meta.gain_is) {
          await supabase.rpc('incrementer_solde', { p_user_id: tx.user_id, p_champ: 'IS', p_valeur: meta.gain_is });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err) {
    console.error('Erreur wave-webhook:', err);
    return new Response(JSON.stringify({ error: err.message || 'Erreur serveur' }), { status: 500 });
  }
});
