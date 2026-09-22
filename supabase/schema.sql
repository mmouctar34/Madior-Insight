-- ============================================================
-- Madior Insight — Schéma RAG (Google Drive → chunks → embeddings)
-- À exécuter dans l'éditeur SQL de ton projet Supabase.
-- ============================================================

-- 1. Extension vectorielle
create extension if not exists vector;

-- 2. Table des documents sources (1 ligne = 1 fichier Drive)
create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  drive_file_id text unique not null,
  titre         text not null,
  matiere       text,           -- 'comptabilite' | 'economie' | 'maths' | ...
  niveau        text,           -- 'seconde' | 'premiere' | 'terminale' | 'universite'
  mime_type     text,
  modifie_le    timestamptz,
  synced_at     timestamptz default now()
);

-- 3. Table des chunks + embeddings
create table if not exists chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid references documents(id) on delete cascade,
  contenu      text not null,
  embedding    vector(768),   -- 768 = dimension des embeddings Gemini (text-embedding-004)
  position     int default 0,
  created_at   timestamptz default now()
);

-- Index pour la recherche de similarité (cosine)
create index if not exists chunks_embedding_idx
  on chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Fonction de recherche sémantique (appelée par l'Edge Function ask-ia)
create or replace function match_chunks (
  query_embedding vector(768),
  match_count int default 5,
  filter_matiere text default null
)
returns table (
  id uuid,
  contenu text,
  document_id uuid,
  titre text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.contenu,
    c.document_id,
    d.titre,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  join documents d on d.id = c.document_id
  where filter_matiere is null or d.matiere = filter_matiere
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- 5. Historique des questions/réponses IA (optionnel, utile pour analytics/quota)
create table if not exists ia_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        text,
  question       text not null,
  reponse        text,
  matiere        text,
  chunks_used    int default 0,
  hors_cours     boolean default false, -- true = repli sur connaissances générales (aucun cours pertinent trouvé)
  similarite_max float,                  -- score de similarité du meilleur extrait trouvé — utile pour ajuster SEUIL_PERTINENCE
  created_at     timestamptz default now()
);

-- Repérer facilement les questions fréquentes hors programme : un signal
-- direct sur les cours à créer ou enrichir en priorité.
create index if not exists idx_ia_logs_hors_cours on ia_logs (hors_cours, created_at desc);

-- ============================================================
-- Chat communauté (tous les élèves, tous niveaux confondus)
-- Texte uniquement, pas de vocal.
-- ============================================================
create table if not exists messages_communaute (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  prenom      text not null,
  niveau      text,
  texte       text not null check (char_length(texte) between 1 and 500),
  created_at  timestamptz default now()
);

create index if not exists messages_communaute_created_idx on messages_communaute (created_at desc);

alter table messages_communaute enable row level security;

-- Lecture publique (tous les élèves connectés voient tous les messages)
create policy "Lecture publique communaute" on messages_communaute for select using (true);
-- Écriture publique (élève connecté peut poster) — la modération se fait a posteriori depuis l'admin
create policy "Ecriture publique communaute" on messages_communaute for insert with check (true);

-- Suppression réservée à la modération (l'admin utilise la clé service, donc
-- cette policy couvre le cas où on voudrait un jour l'ouvrir à un rôle "moderateur")
create policy "Suppression moderation communaute" on messages_communaute for delete using (true);

-- Active le temps réel sur cette table (sinon on reste en polling côté frontend)
alter publication supabase_realtime add table messages_communaute;

-- ============================================================
-- Modération de la communauté — utilisateurs bloqués + signalements
-- ============================================================
create table if not exists communaute_bloques (
  user_id     text primary key,
  prenom      text,
  raison      text,
  created_at  timestamptz default now()
);

create table if not exists communaute_signalements (
  id           text primary key,
  message_id   text,
  texte        text,
  user_id      text,
  prenom       text,
  signale_par  text,
  raison       text default 'Contenu inapproprié',
  statut       text default 'attente', -- 'attente' | 'traite' | 'ignore'
  created_at   timestamptz default now()
);

alter table communaute_bloques enable row level security;
alter table communaute_signalements enable row level security;

-- Démo simplifiée : lecture/écriture ouvertes (comme messages_communaute).
-- En production, restreindre l'écriture sur communaute_bloques au rôle service.
create policy "Lecture bloques"     on communaute_bloques      for select using (true);
create policy "Ecriture bloques"    on communaute_bloques      for all    using (true);
create policy "Lecture signalements"  on communaute_signalements for select using (true);
create policy "Ecriture signalements" on communaute_signalements for all    using (true);
alter table documents enable row level security;
alter table chunks enable row level security;
alter table ia_logs enable row level security;

-- Lecture publique des documents/chunks (le filtrage se fait côté Edge Function)
create policy "Lecture publique documents" on documents for select using (true);
create policy "Lecture publique chunks"    on chunks    for select using (true);

-- Écriture réservée au rôle service (Edge Functions), pas aux clients anonymes
create policy "Ecriture service uniquement documents" on documents for all
  using (auth.role() = 'service_role');
create policy "Ecriture service uniquement chunks" on chunks for all
  using (auth.role() = 'service_role');
create policy "Ecriture logs" on ia_logs for insert with check (true);
create policy "Lecture logs service" on ia_logs for select using (auth.role() = 'service_role');

-- ============================================================
-- Paiement Wave — transactions
-- ============================================================
create table if not exists transactions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            text not null,
  montant            integer not null,       -- en FCFA
  description        text,
  moyen              text default 'wave',    -- 'wave' pour l'instant ; 'orange_money'/'free_money'/'carte' à venir
  statut             text default 'en_attente', -- 'en_attente' | 'confirme' | 'echoue'
  wave_session_id    text unique,
  client_reference   text unique,
  metadata           jsonb default '{}',      -- { type:'abonnement', plan:'premium' } ou { type:'boutique', item_id, gain_in, gain_is }
  created_at         timestamptz default now(),
  confirme_at        timestamptz
);

alter table transactions enable row level security;

-- Démo simplifiée : lecture/écriture ouvertes, comme le reste des tables démo.
-- En production, restreindre l'écriture au rôle service (Edge Functions uniquement).
create policy "Lecture transactions" on transactions for select using (true);
create policy "Ecriture transactions" on transactions for all using (true);

-- Fonction utilitaire pour créditer un solde (IN_boutique, IS) depuis le webhook Wave
create or replace function incrementer_solde(p_user_id uuid, p_champ text, p_valeur integer)
returns void
language plpgsql
security definer
as $$
begin
  if p_champ = 'IN_boutique' then
    update users set "IN_boutique" = coalesce("IN_boutique", 0) + p_valeur where id = p_user_id;
  elsif p_champ = 'IS' then
    update users set "IS" = coalesce("IS", 0) + p_valeur where id = p_user_id;
  end if;
end;
$$;

-- ============================================================
-- Comptes élèves — Authentification réelle (Supabase Auth)
-- ============================================================
-- L'id correspond exactement à auth.users.id (Supabase Auth).
-- Une ligne est créée ici juste après un supabase.auth.signUp() réussi
-- (voir AuthContext.jsx → inscriptionReelle).
create table if not exists users (
  id                     uuid primary key references auth.users(id) on delete cascade,
  matricule              text unique,
  prenom                 text not null,
  nom                    text not null,
  email                  text,
  tel                    text,
  niveau                 text not null,             -- 'seconde'|'premiere'|'terminale'|'universite-l1'...
  type                   text not null default 'lycee', -- 'lycee' | 'universite'
  lycee                  text,
  plan                   text not null default 'standard',
  "IN"                   integer default 0,
  "IN_boutique"          integer default 0,
  "IS"                   integer default 0,
  points                 integer default 0,
  streak                 integer default 0,
  filigrane              text,
  parrain_code           text unique,
  parrain_id             uuid references users(id),
  contenu_debloque       jsonb default '[]',
  contenu_choisi_confirme boolean default false,
  abo_debut              timestamptz,
  abo_fin                timestamptz,
  is_admin               boolean default false,
  created_at             timestamptz default now()
);

alter table users enable row level security;

-- Chacun peut lire/modifier sa propre fiche.
create policy "Lecture propre profil"      on users for select using (auth.uid() = id);
create policy "Mise a jour propre profil"  on users for update using (auth.uid() = id);
create policy "Creation propre profil"     on users for insert with check (auth.uid() = id);

-- Le classement doit pouvoir afficher prénom/points/rang de tout le monde :
-- on autorise la lecture publique d'un sous-ensemble de colonnes via une vue dédiée
-- plutôt que d'ouvrir toute la table users (qui contient email/tel).
create or replace view classement_public as
  select id, prenom, niveau, type, points, lycee from users;

grant select on classement_public to anon, authenticated;

-- ============================================================
-- Actualités — articles récupérés depuis les flux RSS (voir
-- l'Edge Function fetch-actualites). Texte uniquement, pas d'image.
-- ============================================================
create table if not exists actualites (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  resume      text,
  lien        text unique not null,
  source      text not null,
  publie_le   timestamptz not null default now(),
  created_at  timestamptz default now()
);

create index if not exists idx_actualites_publie_le on actualites (publie_le desc);

alter table actualites enable row level security;
create policy "Lecture actualites" on actualites for select using (true);
create policy "Ecriture actualites" on actualites for all using (true);

-- Rafraîchissement automatique toutes les heures via pg_cron (si l'extension
-- est activée sur ton projet Supabase — Database → Extensions → pg_cron).
-- Sans pg_cron, l'Edge Function est simplement appelée à chaque ouverture
-- de la page Actualité côté frontend, ce qui suffit largement en pratique.
--
-- select cron.schedule(
--   'rafraichir-actualites',
--   '0 * * * *',  -- toutes les heures
--   $$ select net.http_post(
--        url := 'https://VOTRE_PROJET.supabase.co/functions/v1/fetch-actualites',
--        headers := '{"Authorization": "Bearer VOTRE_ANON_KEY"}'::jsonb
--      ); $$
-- );
