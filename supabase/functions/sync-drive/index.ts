// ============================================================
// Edge Function : sync-drive
// Lit les fichiers d'un dossier Google Drive, les découpe en
// morceaux (chunks), génère leurs embeddings via Gemini, et les
// stocke dans Supabase (tables `documents` + `chunks`).
//
// Déclenchement : manuel (appel HTTP), cron Supabase, ou webhook
// Google Drive "push notifications" (à configurer séparément).
//
// Variables d'environnement requises (à définir avec `supabase secrets set`) :
//   GOOGLE_SERVICE_ACCOUNT_JSON   -> contenu JSON du compte de service Google
//   GOOGLE_DRIVE_FOLDER_ID        -> ID du dossier Drive à synchroniser
//   GEMINI_API_KEY                -> clé API Google AI Studio
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY -> injectées automatiquement par Supabase
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';
import { GoogleAuth } from 'https://esm.sh/google-auth-library@9.14.1';

const CHUNK_SIZE = 1200;     // caractères par chunk
const CHUNK_OVERLAP = 150;   // chevauchement entre chunks
const EMBEDDING_MODEL = 'text-embedding-004';

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter(c => c.trim().length > 20);
}

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

/** Devine la matière et le niveau à partir du nom de fichier/dossier — à affiner selon ta convention de nommage Drive. */
function guessMeta(nom: string) {
  const t = nom.toLowerCase();
  const matiere =
    /compta|syscohada/.test(t) ? 'comptabilite' :
    /[eé]co|march[eé]|pib/.test(t) ? 'economie' :
    /math|d[eé]riv[eé]e/.test(t) ? 'maths' :
    /anglais|english/.test(t) ? 'anglais' :
    /espagnol|espa[nñ]ol/.test(t) ? 'espagnol' : null;
  const niveau =
    /2nde|seconde/.test(t) ? 'seconde' :
    /1[eè]re|premi[eè]re/.test(t) ? 'premiere' :
    /terminale|tle/.test(t) ? 'terminale' :
    /universit|l1|l2|l3|master/.test(t) ? 'universite' : null;
  return { matiere, niveau };
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY')!;
    const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')!;
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Authentification Google (compte de service)
    const auth = new GoogleAuth({
      credentials: JSON.parse(serviceAccountJson),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();

    // 2. Lister les fichiers du dossier Drive (Docs, PDF, texte)
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,modifiedTime)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { files } = await listRes.json();

    const resultats = [];

    for (const file of files) {
      // 3. Vérifier si le fichier a déjà été synchronisé et n'a pas changé
      const { data: existing } = await supabase
        .from('documents')
        .select('id, modifie_le')
        .eq('drive_file_id', file.id)
        .maybeSingle();

      if (existing && existing.modifie_le === file.modifiedTime) {
        resultats.push({ fichier: file.name, statut: 'déjà à jour' });
        continue;
      }

      // 4. Extraire le texte (Google Docs natif → export texte brut ; PDF/autres → à adapter)
      let texte = '';
      if (file.mimeType === 'application/vnd.google-apps.document') {
        const exportRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        texte = await exportRes.text();
      } else {
        // Pour les PDF/DOCX : télécharger puis extraire le texte côté serveur.
        // Ici on suppose un service d'extraction externe (ou une lib Deno compatible).
        resultats.push({ fichier: file.name, statut: 'type non géré (PDF/DOCX à implémenter)' });
        continue;
      }

      const { matiere, niveau } = guessMeta(file.name);

      // 5. Upsert du document
      const { data: doc, error: docErr } = await supabase
        .from('documents')
        .upsert(
          {
            drive_file_id: file.id,
            titre: file.name,
            matiere,
            niveau,
            mime_type: file.mimeType,
            modifie_le: file.modifiedTime,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'drive_file_id' }
        )
        .select()
        .single();
      if (docErr) throw docErr;

      // 6. Supprimer les anciens chunks de ce document avant de les régénérer
      await supabase.from('chunks').delete().eq('document_id', doc.id);

      // 7. Découper + embedder + insérer
      const morceaux = chunkText(texte);
      for (let i = 0; i < morceaux.length; i++) {
        const embedding = await getGeminiEmbedding(morceaux[i], geminiKey);
        await supabase.from('chunks').insert({
          document_id: doc.id,
          contenu: morceaux[i],
          embedding,
          position: i,
        });
      }

      resultats.push({ fichier: file.name, statut: 'synchronisé', chunks: morceaux.length });
    }

    return new Response(JSON.stringify({ ok: true, resultats }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
