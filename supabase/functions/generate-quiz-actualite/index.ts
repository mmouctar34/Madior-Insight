// ============================================================
// Edge Function : generate-quiz-actualite
// Les articles récupérés par flux RSS (fetch-actualites) n'ont pas
// de quiz pré-écrit, contrairement aux articles de démonstration.
// Cette fonction génère 3 questions à choix multiples à partir du
// titre + résumé d'un article réel, via Gemini, dans le même format
// que le reste du site (q, opts, correct, exp) — pour que le mécanisme
// "lire l'article puis faire le quiz" fonctionne aussi en conditions
// réelles, pas seulement en démo.
//
// Appelée depuis Actualite.jsx au moment où l'élève clique
// "Faire le quiz" sur un article réel (jamais pour les articles démo,
// qui gardent leur quiz écrit à la main).
// ============================================================

const CHAT_MODEL = 'gemini-1.5-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { titre, resume, articleId } = await req.json();
    if (!titre) {
      return new Response(JSON.stringify({ error: 'Titre requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY non configurée côté serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const prompt = `Tu es un professeur d'économie pour des lycéens et étudiants sénégalais (Série STEG).
Voici un article d'actualité économique :

Titre : ${titre}
Résumé : ${resume || '(pas de résumé disponible, base-toi uniquement sur le titre)'}

Génère EXACTEMENT 3 questions à choix multiples permettant de vérifier la compréhension de cet article, en français.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, sans balises markdown, au format exact :
[
  {"q":"question 1","opts":["option A","option B","option C","option D"],"correct":0,"exp":"explication courte de la bonne réponse"},
  {"q":"question 2","opts":["option A","option B","option C","option D"],"correct":1,"exp":"explication courte"},
  {"q":"question 3","opts":["option A","option B","option C","option D"],"correct":2,"exp":"explication courte"}
]
"correct" est l'index (0 à 3) de la bonne réponse dans "opts". Les questions doivent porter sur le contenu réel de l'article, pas sur des connaissances générales non mentionnées.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Erreur Gemini:', errText);
      return new Response(JSON.stringify({ error: 'Erreur lors de la génération du quiz' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await res.json();
    let texte = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    /* Gemini ajoute parfois des balises ```json malgré la consigne — on les retire */
    texte = texte.replace(/```json|```/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(texte);
    } catch {
      return new Response(JSON.stringify({ error: 'Réponse IA invalide, réessaie.' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    /* Validation minimale du format avant de renvoyer au frontend */
    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(JSON.stringify({ error: 'Format de quiz invalide.' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ questions, articleId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Erreur generate-quiz-actualite:', err);
    return new Response(JSON.stringify({ error: err.message || 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
