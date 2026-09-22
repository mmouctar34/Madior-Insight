// ============================================================
// Edge Function : ask-ia
// Cœur de l'Assistant IA — Madior IA.
//
// Comportement en DEUX MODES, choisi automatiquement selon la pertinence
// des cours trouvés :
//
//   MODE "cours"   → un ou plusieurs extraits de cours sont suffisamment
//                    proches de la question (similarité >= SEUIL_PERTINENCE).
//                    La réponse est construite STRICTEMENT à partir de ces
//                    extraits — comportement d'origine, inchangé.
//
//   MODE "general" → aucun extrait pertinent trouvé (question hors
//                    programme, culture générale, actualité...). L'IA
//                    répond alors à partir de ses connaissances générales,
//                    mais avec des garde-fous explicites contre l'invention
//                    de faits précis non vérifiés (chiffres, dates, noms).
//
// Dans les deux cas, la réponse indique honnêtement son mode (`hors_cours`)
// pour que le frontend puisse l'afficher clairement à l'élève — jamais de
// réponse qui prétend venir des cours alors qu'elle n'en vient pas.
//
// Mémoire conversationnelle : le frontend envoie `historique` (les derniers
// échanges), inclus dans le prompt pour que l'IA se souvienne du fil de la
// discussion, comme demandé.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';

const EMBEDDING_MODEL = 'text-embedding-004';
const CHAT_MODEL = 'gemini-1.5-flash';

/* Seuil de similarité cosinus en dessous duquel on considère qu'aucun cours
   pertinent n'a été trouvé. À ajuster empiriquement une fois en prod :
   - trop haut  → l'IA passe trop souvent en mode général même quand un cours existe
   - trop bas   → l'IA force des réponses à partir de cours sans rapport (le "délire") */
const SEUIL_PERTINENCE = 0.68;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getGeminiEmbedding(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini embedding error: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values;
}

/** Formate les derniers échanges pour donner à l'IA une mémoire de la conversation. */
function formaterHistorique(historique: Array<{ role: string; contenu: string }> = []) {
  if (!historique.length) return '';
  const derniers = historique.slice(-6); // 3 derniers échanges (question+réponse)
  const texte = derniers
    .map(m => `${m.role === 'user' ? 'Élève' : 'Madior IA'} : ${m.contenu}`)
    .join('\n');
  return `\nHistorique récent de la conversation (pour le contexte, ne pas y répondre à nouveau) :\n${texte}\n`;
}

async function askGemini({ question, contexte, historique, geminiKey }: {
  question: string; contexte: string; historique: string; geminiKey: string;
}) {
  const prompt = `Tu es Madior IA, le tuteur pédagogique de Madior Insight pour des élèves sénégalais (BAC Série STEG et université).
Réponds UNIQUEMENT à partir du contexte de cours fourni ci-dessous — c'est la seule source de vérité autorisée pour cette réponse.
Si un point précis manque dans le contexte, dis-le honnêtement plutôt que de l'inventer.
Structure ta réponse en étapes claires. Cite le nom du cours source quand c'est pertinent.
${historique}
Contexte (extraits de cours réels de la plateforme) :
${contexte}

Question de l'élève :
${question}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } }),
    }
  );
  if (!res.ok) throw new Error(`Gemini chat error: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Je n'ai pas pu générer de réponse, réessaie.";
}

async function askGeminiGeneral({ question, historique, geminiKey }: {
  question: string; historique: string; geminiKey: string;
}) {
  const prompt = `Tu es Madior IA, le tuteur pédagogique de Madior Insight pour des élèves sénégalais (BAC Série STEG et université).
Cette question ne correspond à aucun cours de la plateforme (culture générale, actualité, ou hors programme STEG).
Tu peux répondre à partir de tes connaissances générales, MAIS avec ces garde-fous stricts :
- Ne fabrique JAMAIS un chiffre, une date ou un fait précis dont tu n'es pas raisonnablement sûr — dis "je ne suis pas certain" plutôt que d'inventer
- Reste concis, clair et pédagogique, adapté à un lycéen ou étudiant
- Si la question relève en réalité d'une matière du programme (économie, comptabilité, maths, anglais, espagnol), signale à l'élève qu'il devrait aussi consulter ses cours sur Madior Insight pour la version "officielle programme"
- Ne prétends jamais que cette réponse vient des cours de la plateforme — elle vient de tes connaissances générales
${historique}
Question de l'élève :
${question}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5 } }),
    }
  );
  if (!res.ok) throw new Error(`Gemini chat error: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Je n'ai pas pu générer de réponse, réessaie.";
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { question, matiere = null, userId = null, historique = [] } = await req.json();
    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'question manquante' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Embedding de la question
    const queryEmbedding = await getGeminiEmbedding(question, geminiKey);

    // 2. Recherche sémantique dans Supabase
    const { data: chunks, error: matchErr } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_count: 5,
      filter_matiere: matiere,
    });
    if (matchErr) throw matchErr;

    const meilleureSimilarite = chunks?.[0]?.similarity ?? 0;
    const modeGeneral = meilleureSimilarite < SEUIL_PERTINENCE;
    const historiqueTexte = formaterHistorique(historique);

    let reponse: string;
    let sources: string[] = [];

    if (modeGeneral) {
      // Aucun cours suffisamment pertinent : repli sur les connaissances générales
      reponse = await askGeminiGeneral({ question, historique: historiqueTexte, geminiKey });
    } else {
      // Cours pertinents trouvés : réponse strictement basée dessus
      const pertinents = chunks.filter((c: any) => c.similarity >= SEUIL_PERTINENCE);
      const contexte = pertinents
        .map((c: any) => `[Cours : ${c.titre}]\n${c.contenu}`)
        .join('\n\n---\n\n');
      reponse = await askGemini({ question, contexte, historique: historiqueTexte, geminiKey });
      sources = pertinents.map((c: any) => c.titre);
    }

    // 3. Log — utile pour repérer les questions récurrentes hors programme
    //    (signal pour savoir quels cours enrichir en priorité)
    await supabase.from('ia_logs').insert({
      user_id: userId,
      question,
      reponse,
      matiere,
      chunks_used: modeGeneral ? 0 : sources.length,
      hors_cours: modeGeneral,
      similarite_max: meilleureSimilarite,
    });

    return new Response(
      JSON.stringify({ ok: true, reponse, sources, hors_cours: modeGeneral }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
