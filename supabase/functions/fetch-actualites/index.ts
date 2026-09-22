// ============================================================
// Edge Function : fetch-actualites
// Récupère plusieurs flux RSS économiques francophones, les
// parse en JSON (titre + résumé texte, sans image), déduplique
// et stocke le résultat dans la table `actualites`.
//
// Choix RSS plutôt qu'API payante :
//   - Gratuit, aucune clé à gérer, aucun quota
//   - Format texte pur, exactement ce qu'il faut ici
//   - Sources stables et reconnues
//
// Appelée depuis le frontend (Actualite.jsx) à l'ouverture de la page,
// et peut aussi être planifiée via pg_cron pour un rafraîchissement
// automatique toutes les heures (voir RAG_SETUP.md).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* Flux RSS économiques francophones — stables et sans clé API */
const FLUX = [
  { url: 'https://www.rfi.fr/fr/economie/rss',        source: 'RFI Économie' },
  { url: 'http://feeds.bbci.co.uk/afrique/rss.xml',    source: 'BBC Afrique' },
  { url: 'https://www.financialafrik.com/feed/',       source: 'Financial Afrik' },
];

/* Nettoie le HTML d'une description RSS pour n'en garder que le texte */
function nettoyerTexte(html) {
  if (!html) return '';
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/* Parseur XML minimal, suffisant pour les flux RSS 2.0 standards */
function parserRSS(xml, source) {
  const items = [];
  const blocs = xml.split('<item>').slice(1);

  for (const bloc of blocs.slice(0, 12)) { // 12 derniers articles par flux
    const extraire = (balise) => {
      const m = bloc.match(new RegExp(`<${balise}[^>]*>([\\s\\S]*?)<\\/${balise}>`, 'i'));
      return m ? nettoyerTexte(m[1]) : '';
    };
    const titre = extraire('title');
    const description = extraire('description') || extraire('content:encoded');
    const lienMatch = bloc.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const lien = lienMatch ? lienMatch[1].trim() : '';
    const dateMatch = bloc.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const datePub = dateMatch ? new Date(dateMatch[1].trim()) : new Date();

    if (titre && lien) {
      items.push({
        titre,
        resume: description.slice(0, 400),
        lien,
        source,
        publie_le: isNaN(datePub.getTime()) ? new Date().toISOString() : datePub.toISOString(),
      });
    }
  }
  return items;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let totalNouveaux = 0;
    const erreurs: string[] = [];

    for (const flux of FLUX) {
      try {
        const res = await fetch(flux.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MadiorInsightBot/1.0)' },
        });
        if (!res.ok) { erreurs.push(`${flux.source}: HTTP ${res.status}`); continue; }

        const xml = await res.text();
        const articles = parserRSS(xml, flux.source);

        for (const art of articles) {
          const { error } = await supabase
            .from('actualites')
            .upsert(
              {
                titre: art.titre,
                resume: art.resume,
                lien: art.lien,
                source: art.source,
                publie_le: art.publie_le,
              },
              { onConflict: 'lien', ignoreDuplicates: true }
            );
          if (!error) totalNouveaux++;
        }
      } catch (err) {
        erreurs.push(`${flux.source}: ${err.message}`);
      }
    }

    /* Purge des articles de plus de 30 jours pour ne pas accumuler indéfiniment */
    await supabase
      .from('actualites')
      .delete()
      .lt('publie_le', new Date(Date.now() - 30 * 86400000).toISOString());

    return new Response(JSON.stringify({
      ok: true,
      articles_traites: totalNouveaux,
      erreurs,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Erreur fetch-actualites:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
