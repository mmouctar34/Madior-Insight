# Madior Insight

Plateforme d'apprentissage pour les élèves sénégalais (Seconde → Université),
centrée sur l'économie, la comptabilité, les maths et les langues : cours,
quiz, exercices corrigés, actualité économique, classement, communauté et
tuteur IA basé sur les propres cours du professeur.

Application **React 19 + Vite**, style **Tailwind CSS**, backend
**Supabase** (base Postgres + pgvector, Auth, Edge Functions), IA
**Gemini**, paiement **Wave**.

## Démarrage rapide

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production (dossier dist/)
npm run preview  # prévisualiser le build
npm run lint     # oxlint
```

**Aucune configuration n'est nécessaire pour tester l'app.** Sans variables
Supabase, tout tourne en **mode démo** :

- connexion avec un compte démo (bouton « Continuer en mode démo ») qui a
  aussi accès à l'admin ;
- réponses IA simulées ;
- paiement Wave simulé (succès après ~2 s) ;
- communauté et modération stockées dans le `localStorage` du navigateur.

## Configuration du backend

1. Copier `.env.example` en `.env.local` et renseigner
   `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
2. Exécuter `supabase/schema.sql` dans le SQL Editor de Supabase.
3. Définir les secrets des Edge Functions et les déployer.

Dès que les deux variables `VITE_…` sont présentes, l'app bascule
automatiquement sur la vraie authentification Supabase (le mode démo
disparaît). Guides détaillés :

| Guide | Contenu |
|---|---|
| [`RAG_SETUP.md`](RAG_SETUP.md) | Supabase, Google Drive, Gemini (tuteur IA), actualités RSS, communauté et modération |
| [`PAIEMENT_SETUP.md`](PAIEMENT_SETUP.md) | Paiement Wave (checkout + webhook) |

Pour donner l'accès admin à un compte réel, passer `is_admin` à `true` sur
sa ligne de la table `users`.

## Pages

| Route | Page |
|---|---|
| `/` | Accueil (landing) |
| `/login` | Connexion / inscription |
| `/choisir-contenu` | Choix des leçons + TD débloqués (obligatoire avant d'accéder au reste) |
| `/dashboard` | Tableau de bord de l'élève |
| `/cours`, `/exercices`, `/quiz` | Cours, exercices corrigés, quiz |
| `/actualite` | Actualité économique (RSS) + quiz générés par IA |
| `/ia` | Assistant IA (RAG sur les cours) |
| `/classement` | Classement et rangs |
| `/communaute` | Chat entre élèves |
| `/messages` | Messages |
| `/mes-documents` | Documents de l'élève |
| `/boutique` | Boutique |
| `/abonnement` | Abonnements (paiement Wave) |
| `/profil` | Profil |
| `/admin` | Espace admin (réservé aux comptes `is_admin`), dont la modération |

## Abonnements

Lycée : **Standard** (3 000 FCFA), **Medium** (8 000 FCFA), **Premium**
(30 000 FCFA). Université : **Pro** et **Elite** (prix à définir). Le
détail des quotas (Insights, questions IA…) est dans `PLANS_LYCEE` /
`PLANS_UNIV` de `src/data/constants.js`.

## Structure du projet

```
src/
  pages/           une page par route (+ admin/Admin.jsx)
  components/      layout (Sidebar, Layout), quiz, ui (PaiementModal, Toast…)
  context/         AuthContext (démo ↔ Supabase), ThemeContext (clair/sombre)
  data/            catalogues de cours/boutique, questions, constantes, stores démo
  lib/             client Supabase, paiement Wave, modération
supabase/
  schema.sql       tables, index, policies RLS
  functions/       Edge Functions (Deno)
    ask-ia                   question → recherche sémantique + Gemini
    sync-drive               indexe les cours Google Drive (chunks + embeddings)
    fetch-actualites         récupère les flux RSS dans la table actualites
    generate-quiz-actualite  génère un quiz à partir d'un article
    wave-checkout            crée une session de paiement Wave
    wave-webhook             confirme le paiement et crédite le compte
```

## Limites connues

- `sync-drive` n'indexe que les Google Docs ; l'extraction PDF/DOCX reste à
  implémenter.
- La fermeture globale du chat communautaire n'est stockée qu'en
  `localStorage` (effective seulement dans le navigateur de l'admin).
- Seul Wave est actif ; Orange Money, Free Money et carte bancaire sont
  affichés « Bientôt disponible ».

Voir les guides ci-dessus pour le détail.
