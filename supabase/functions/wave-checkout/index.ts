// ============================================================
// Edge Function : wave-checkout
// Crée une session de paiement Wave Checkout API et renvoie
// l'URL vers laquelle rediriger l'élève (wave_launch_url).
//
// Appelée depuis le frontend (PaiementModal.jsx) via
// supabase.functions.invoke('wave-checkout', ...)
//
// Variable d'environnement requise :
//   WAVE_API_SECRET  — clé secrète Wave Business (jamais exposée au frontend)
//   FRONTEND_URL      — pour construire les URLs de retour (succès/échec)
//
// Doc Wave Checkout API : https://docs.wave.com/business/api-checkout
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { montant, description, userId, metadata } = await req.json();

    if (!montant || montant <= 0) {
      return new Response(JSON.stringify({ error: 'Montant invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const WAVE_API_SECRET = Deno.env.get('WAVE_API_SECRET');
    const FRONTEND_URL     = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';

    if (!WAVE_API_SECRET) {
      return new Response(JSON.stringify({ error: 'WAVE_API_SECRET non configurée côté serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    /* Référence unique pour retrouver la transaction côté webhook */
    const clientReference = `MI-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    /* Appel réel à l'API Wave Checkout */
    const waveRes = await fetch('https://api.wave.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAVE_API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(Math.round(montant)),
        currency: 'XOF',
        client_reference: clientReference,
        error_url:   `${FRONTEND_URL}/abonnement?paiement=echec`,
        success_url: `${FRONTEND_URL}/abonnement?paiement=succes&ref=${clientReference}`,
      }),
    });

    const waveData = await waveRes.json();

    if (!waveRes.ok) {
      console.error('Erreur Wave:', waveData);
      return new Response(JSON.stringify({ error: waveData.message || 'Erreur Wave Checkout' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    /* Enregistrer la transaction en attente dans Supabase */
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('transactions').insert({
      user_id: userId,
      montant,
      description,
      moyen: 'wave',
      statut: 'en_attente',
      wave_session_id: waveData.id,
      client_reference: clientReference,
      metadata: metadata || {},
    });

    return new Response(JSON.stringify({
      wave_launch_url: waveData.wave_launch_url,
      session_id: waveData.id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Erreur wave-checkout:', err);
    return new Response(JSON.stringify({ error: err.message || 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
