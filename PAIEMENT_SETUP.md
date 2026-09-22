# Paiement Wave — Guide de configuration

Madior Insight n'accepte pour l'instant que **Wave** comme moyen de paiement
(frais les plus bas du marché sénégalais, ~1%). Orange Money, Free Money et
carte bancaire sont affichés dans l'interface avec la mention
**"Bientôt disponible"** — l'app est prête à les activer plus tard sans
changer le design (voir `PaiementModal.jsx`, il suffira d'ajouter un bouton
actif de plus).

## Fonctionnement actuel (sans configuration)

Sans Supabase configuré, `PaiementModal` **simule** un paiement Wave réussi
après ~2 secondes, pour que tu puisses tester tout le parcours (abonnement,
boutique) sans backend réel. Aucune vraie transaction n'a lieu.

## Activer les vrais paiements Wave

### 1. Créer un compte Wave Business

- https://business.wave.com → créer un compte professionnel
- Section **API** → générer une clé secrète API (`WAVE_API_SECRET`)

### 2. Déployer les deux Edge Functions

```bash
supabase functions deploy wave-checkout
supabase functions deploy wave-webhook
```

### 3. Variables d'environnement (Supabase → Project Settings → Edge Functions)

| Variable | Où la trouver |
|---|---|
| `WAVE_API_SECRET` | Tableau de bord Wave Business → API |
| `WAVE_WEBHOOK_SECRET` | Tableau de bord Wave Business → Webhooks (optionnel mais recommandé) |
| `FRONTEND_URL` | L'URL de ton site déployé, ex: `https://madiorinsight.sn` |

### 4. Configurer le webhook côté Wave

Dans le tableau de bord Wave Business → Webhooks, ajouter :

```
https://VOTRE_PROJET.supabase.co/functions/v1/wave-webhook
```

Événements à écouter : `checkout.session.completed`

### 5. Appliquer le schéma SQL

La table `transactions` et la fonction `incrementer_solde` sont dans
`supabase/schema.sql` (section "Paiement Wave"). Exécute-les dans le SQL
Editor de Supabase si ce n'est pas déjà fait.

### 6. ✅ Authentification réelle — déjà câblée

C'est fait : dès que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont
renseignées (voir `RAG_SETUP.md`), `AuthContext.jsx` bascule automatiquement
sur Supabase Auth (`supabase.auth.signUp` / `signInWithPassword`), crée une
vraie ligne dans la table `users`, et le bouton **"Continuer en mode démo"**
disparaît tout seul de la page de connexion. Rien à modifier côté frontend :
il suffit de configurer les variables d'environnement.

Le webhook Wave peut donc créditer un vrai compte dès que le backend est
configuré — aucune étape supplémentaire n'est nécessaire côté paiement.

## Comment ça marche une fois configuré

```
Élève clique "S'abonner" ou "Acheter"
       ↓
PaiementModal → creerPaiementWave() → Edge Function wave-checkout
       ↓
Wave crée une session + wave_launch_url
       ↓
Transaction enregistrée en "en_attente" dans Supabase
       ↓
Élève redirigé vers l'app Wave (ou le lien de paiement)
       ↓
Élève paie
       ↓
Wave envoie un webhook → Edge Function wave-webhook
       ↓
Transaction marquée "confirme" + plan/jetons crédités automatiquement
       ↓
Élève revient sur /abonnement?paiement=succes
```

## Frais Wave

**~1%** — les plus bas du marché sénégalais pour les professionnels.
Limitation actuelle : uniquement les utilisateurs ayant l'app Wave.
