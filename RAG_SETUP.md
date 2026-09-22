# Guide — Connecter Google Drive + RAG + Gemini à Madior Insight

Ce document explique comment activer le tuteur IA réel (basé sur tes propres cours),
qui remplace les réponses simulées actuellement dans `IA.jsx`.

Tant que ces étapes ne sont pas faites, **le site fonctionne normalement** :
`IA.jsx` détecte automatiquement l'absence de configuration Supabase et
retombe sur les réponses simulées (`REPONSES`). Rien ne casse.

> ℹ️ **Ces mêmes variables activent aussi l'authentification réelle et le
> paiement Wave.** Dès que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
> sont renseignées, la page de connexion bascule automatiquement sur de
> vrais comptes (le bouton "Continuer en mode démo" disparaît tout seul) —
> voir `PAIEMENT_SETUP.md` pour la suite (webhook Wave, table `users`).

---

## Vue d'ensemble

```
Tes cours (Google Drive)
       ↓  sync-drive (Edge Function)
  Découpage en chunks + embeddings (Gemini)
       ↓
  Supabase (pgvector)
       ↓
  Question élève → ask-ia (Edge Function)
       ↓  recherche sémantique + Gemini
  Réponse basée sur TES cours
```

## Étape 1 — Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → New project (gratuit)
2. Récupère `Project URL` et `anon public key` dans *Project Settings → API*
3. Crée `.env.local` à la racine (copie de `.env.example`) et renseigne :
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

## Étape 2 — Exécuter le schéma SQL

1. Dans Supabase → *SQL Editor*
2. Colle et exécute le contenu de `supabase/schema.sql`
   (crée les tables `documents`, `chunks`, `ia_logs`, active `pgvector`, etc.)

## Étape 3 — Créer le compte de service Google Drive

### C'est quoi, un "compte de service" ?

Ce n'est **pas** ton compte Gmail personnel, et ce n'est **pas** un abonnement à payer.

Imagine que tu embauches un assistant robot dont le seul travail est de lire
ton dossier Drive et rien d'autre — il n'a pas de boîte mail, il ne peut pas
se connecter à ton compte, il ne peut rien faire d'autre que ce que tu lui
autorises explicitement. Un "compte de service" (*service account* en
anglais), c'est exactement ça : un compte robot fabriqué par Google,
spécialement pour qu'un programme (ici, ton site) puisse accéder à des
fichiers automatiquement, sans qu'un humain n'ait besoin de se connecter à
chaque fois.

Il a sa propre adresse bizarre du genre
`madior-insight@mon-projet.iam.gserviceaccount.com` — ce n'est pas une vraie
boîte mail, juste un identifiant. Tu vas ensuite **partager ton dossier
Drive avec cette adresse**, exactement comme tu partagerais un dossier avec
un collègue — sauf que ce "collègue" est un robot en lecture seule.

**Est-ce que ça coûte quelque chose ?** Non. C'est une fonctionnalité gratuite
de Google Cloud, incluse avec n'importe quel compte Google. Tu n'as rien à
payer ni à souscrire pour cette étape — seule la clé Gemini (Étape 4) et
Supabase (Étape 1) ont des paliers gratuits, tous les deux largement
suffisants pour démarrer.

### La marche à suivre, clic par clic

1. Va sur [console.cloud.google.com](https://console.cloud.google.com) et
   connecte-toi avec **ton compte Gmail habituel** (celui que tu as déjà —
   pas besoin d'en créer un autre)
2. En haut de la page, clique sur le sélecteur de projet → **Nouveau projet**
   → donne-lui un nom (ex. `madior-insight`) → Créer
3. Une fois le projet créé et sélectionné, va dans le menu ☰ → **API et
   services** → **Bibliothèque**
4. Cherche **Google Drive API** → clique dessus → bouton **Activer**
5. Toujours dans "API et services", va dans **Identifiants** →
   **+ Créer des identifiants** → **Compte de service**
6. Donne-lui un nom (ex. `madior-insight-drive`) → Créer et continuer → tu
   peux laisser les étapes suivantes vides → Terminé
7. Clique sur le compte de service que tu viens de créer dans la liste
8. Onglet **Clés** → **Ajouter une clé** → **Créer une clé** → format
   **JSON** → Créer
   → un fichier `.json` se télécharge automatiquement sur ton ordinateur.
   **Garde-le précieusement, ne le partage jamais publiquement** (c'est comme
   un mot de passe)
9. Retourne sur [drive.google.com](https://drive.google.com), ouvre le
   dossier où sont rangés tes cours, clic droit → **Partager**
10. Colle l'adresse du compte de service (tu la trouves dans le fichier
    `.json` téléchargé, champ `client_email`, ou dans la console sous
    "Identifiants") → donne-lui l'accès en **Lecteur** (pas besoin de plus)
11. Note l'ID du dossier : dans l'URL de ton dossier Drive, c'est la suite de
    lettres/chiffres après `/folders/`
    (ex. `drive.google.com/drive/folders/`**`1AbCdEfGhIjKlMnOp`**)

## Étape 4 — Obtenir une clé Gemini (gratuite)

1. [aistudio.google.com](https://aistudio.google.com) → Get API key
2. Copie la clé (gratuit jusqu'à 1M tokens/jour)

## Étape 5 — Déployer les Edge Functions

Deux façons de faire, choisis celle qui te convient.

### Option A — Sans terminal (interface Supabase, la plus simple)

Pour les **secrets** (les clés secrètes) :
1. Sur ton projet Supabase → menu **Edge Functions** → onglet **Secrets**
2. Ajoute chacune de ces clés une par une (nom + valeur) :
   - `GEMINI_API_KEY` → ta clé de l'Étape 4
   - `GOOGLE_DRIVE_FOLDER_ID` → l'ID du dossier noté à l'Étape 3
   - `GOOGLE_SERVICE_ACCOUNT_JSON` → ouvre le fichier `.json` téléchargé à
     l'Étape 3 avec un éditeur de texte, copie **tout** son contenu, colle-le
     comme valeur

Pour le **déploiement des fonctions** elles-mêmes (le code dans
`supabase/functions/`), l'interface Supabase ne permet pas encore de coller
du code directement — il faut passer par l'Option B ci-dessous, au moins
pour cette partie-là.

### Option B — Avec la ligne de commande (plus rapide une fois en main)

Installe la CLI Supabase si besoin (`npm i -g supabase`), puis :

```bash
supabase login
supabase link --project-ref TON_PROJECT_REF

# Secrets (jamais dans le frontend)
supabase secrets set GEMINI_API_KEY=ta_cle_gemini
supabase secrets set GOOGLE_DRIVE_FOLDER_ID=id_du_dossier
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat chemin/vers/service-account.json)"

# Déploiement
supabase functions deploy sync-drive
supabase functions deploy ask-ia
```

> 💡 `TON_PROJECT_REF` se trouve dans l'URL de ton projet Supabase
> (`app.supabase.com/project/`**`ton-project-ref`**) ou dans
> *Project Settings → General*.

## Étape 6 — Première synchronisation

Appelle manuellement `sync-drive` une première fois pour indexer tes cours :

```bash
curl -X POST https://TON_PROJECT_REF.supabase.co/functions/v1/sync-drive \
  -H "Authorization: Bearer TA_SERVICE_ROLE_KEY"
```

Ensuite, tu peux soit relancer cette commande à chaque ajout de cours,
soit configurer un **cron Supabase** (Dashboard → Edge Functions → Cron)
pour une synchronisation automatique (ex. toutes les nuits).

## Étape 7 — Tester

Une fois `.env.local` rempli et les fonctions déployées, relance `npm run dev`.
Sur la page `/ia`, le bandeau passe de *"Mode démo"* à
*"RAG connecté à tes cours"* — les réponses citent alors tes vrais cours.

---

## Chat Communauté

La page `/communaute` (visible par tous les élèves, tous niveaux confondus)
utilise la même table `messages_communaute` créée dans `schema.sql` — aucune
étape supplémentaire si tu as déjà suivi l'Étape 1 et 2 ci-dessus.

- Tant que Supabase n'est pas configuré, la page affiche des messages de démo
  en local (rien n'est partagé entre élèves).
- Une fois configuré, les messages sont **partagés** entre tous les élèves
  connectés (rafraîchis toutes les 4 secondes).
- Texte uniquement, 500 caractères max par message, pas de vocal.
- La modération se fait pour l'instant manuellement depuis le Dashboard
  Supabase (table `messages_communaute`) — un outil de modération dans
  l'admin pourra être ajouté plus tard si besoin.

## Vidéo YouTube (page d'accueil)

Ta chaîne YouTube (`@MadiorInsight`) est déjà intégrée dans
`src/pages/Landing.jsx` : une carte cliquable ouvre la chaîne dans un
nouvel onglet. Si tu veux plus tard intégrer une vidéo précise directement
lisible sur le site (plutôt qu'un simple lien), remplace cette carte par un
lecteur `<iframe>` YouTube classique — donne-moi le lien de la vidéo et je
m'en charge.

## Limites actuelles à connaître

- **Extraction PDF/DOCX** : `sync-drive` gère nativement les Google Docs.
  Pour les PDF/Word, il faut ajouter une étape d'extraction de texte
  (ex. bibliothèque `pdf-parse` ou un service externe) avant le chunking —
  la fonction indique `"type non géré"` pour l'instant sur ces fichiers.
- **Webhooks Drive** : la mise à jour automatique dès qu'un fichier change
  nécessite de configurer les
  [notifications push Google Drive](https://developers.google.com/drive/api/guides/push)
  vers `sync-drive` — non incluse par défaut, à ajouter si besoin.
- **Coût** : Gemini Flash reste gratuit jusqu'à 1M tokens/jour, Supabase
  gratuit jusqu'à 500 Mo de base + 2 Go de bande passante Edge Functions/mois.

---

## Actualités en temps réel (flux RSS)

Choix retenu : **flux RSS** plutôt qu'une API payante — gratuit, aucune
clé à gérer, format texte pur (pas d'image, exactement ce qu'il fallait).

### Sources utilisées
- RFI Économie
- BBC Afrique
- Financial Afrik

### Comment ça marche
1. `fetch-actualites` (Edge Function) récupère et parse ces flux, stocke les
   articles dans la table `actualites` (dédupliqués par lien).
2. `Actualite.jsx` appelle cette fonction à chaque ouverture de la page, puis
   lit les articles déjà en base pour un affichage rapide.
3. Comme un article RSS n'a pas de quiz pré-écrit, `generate-quiz-actualite`
   génère 3 questions via Gemini à partir du titre + résumé, à la demande
   (uniquement quand l'élève clique "Faire le quiz").
4. Les articles de démonstration (avec leur quiz écrit à la main) restent
   affichés en plus des vrais articles, aucun conflit.

### Rafraîchissement automatique (optionnel)
Sans configuration supplémentaire, les articles se rafraîchissent à chaque
visite de la page. Pour un rafraîchissement toutes les heures même sans
visite, active l'extension `pg_cron` dans Supabase (Database → Extensions)
puis décommente le bloc `cron.schedule` en fin de `supabase/schema.sql`.

### Déploiement
```bash
supabase functions deploy fetch-actualites
supabase functions deploy generate-quiz-actualite
```
Ces deux fonctions utilisent les mêmes variables d'environnement que le
reste du RAG (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

---

## Comportement de l'IA — mode "cours" vs mode "général"

L'Assistant IA fonctionne en **deux modes**, choisis automatiquement à chaque question :

**Mode "cours"** — un extrait de cours suffisamment proche de la question a été
trouvé (similarité ≥ 0,68 sur 1). La réponse est construite **strictement** à
partir de ces extraits, avec leurs titres affichés en source sous la réponse
(badge vert "Basé sur : ...").

**Mode "général"** — aucun extrait pertinent trouvé (question de culture
générale, actualité, ou hors programme STEG). L'IA répond alors à partir de
ses connaissances générales, avec un badge orange "Connaissance générale —
hors programme" affiché clairement à l'élève. Des garde-fous dans le prompt
lui interdisent d'inventer des chiffres ou faits précis dont elle n'est pas sûre.

Ce choix évite les deux écueils : une IA qui refuse de répondre dès qu'une
question sort des cours (frustrant), et une IA qui force une réponse à partir
d'extraits sans rapport (le "délire").

**Mémoire conversationnelle** : les 3 derniers échanges sont envoyés à chaque
question pour que l'IA garde le fil de la discussion.

**Ajuster le seuil** : `SEUIL_PERTINENCE` dans `supabase/functions/ask-ia/index.ts`
(actuellement 0,68). Trop haut → l'IA bascule trop souvent en mode général
même quand un cours existe. Trop bas → elle force des réponses à partir de
cours sans rapport. À affiner une fois de vraies questions d'élèves observées
(consulter `ia_logs.hors_cours` et `ia_logs.similarite_max` pour ajuster).
