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

-- Fonction utilitaire pour créditer un solde (IN_boutique, IS) depuis le webhook Wave
create or replace function incrementer_solde(p_user_id uuid, p_champ text, p_valeur integer)
returns void
language plpgsql
security definer
set search_path = public
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
-- La ligne est créée automatiquement par le trigger `on_auth_user_created`
-- (section Sécurité en fin de fichier) dès qu'un compte Supabase Auth est créé.
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
  plan                   text not null default 'gratuit',
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

-- ============================================================
-- SÉCURITÉ — RLS, droits et triggers
-- ============================================================
-- Principe : les Edge Functions utilisent la clé service_role, qui ignore
-- la RLS. Les policies ci-dessous ne concernent donc que le navigateur
-- (rôles `anon` et `authenticated`). Tout ce qui touche à l'argent
-- (plan, abonnement, IS, IN_boutique, transactions) ne peut être écrit que
-- côté serveur.
--
-- Cette section peut être ré-exécutée sans erreur (drop … if exists).

-- ── Fonction utilitaire : l'utilisateur connecté est-il admin ? ──
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from users where id = auth.uid()), false);
$$;

-- Vrai quand la requête vient du navigateur (clé anon + éventuel JWT
-- utilisateur), faux pour les Edge Functions (service_role) et le SQL Editor.
create or replace function requete_client()
returns boolean
language sql
stable
as $$
  select coalesce(auth.role(), '') in ('anon', 'authenticated');
$$;

-- ── Fonctions réservées au serveur ──
-- Par défaut, Postgres donne EXECUTE à tout le monde (donc à anon via /rpc).
revoke execute on function incrementer_solde(uuid, text, integer) from public, anon, authenticated;
grant  execute on function incrementer_solde(uuid, text, integer) to service_role;

revoke execute on function match_chunks(vector, int, text) from public, anon, authenticated;
grant  execute on function match_chunks(vector, int, text) to service_role;

-- ============================================================
-- users
-- ============================================================
alter table users enable row level security;

drop policy if exists "Lecture propre profil"     on users;
drop policy if exists "Mise a jour propre profil" on users;
drop policy if exists "Creation propre profil"    on users;

create policy "Lecture propre profil"     on users for select to authenticated using (auth.uid() = id);
create policy "Mise a jour propre profil" on users for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
-- Pas de policy INSERT : la ligne est créée par le trigger on_auth_user_created.

-- Colonnes qu'un élève ne peut jamais modifier lui-même. Elles sont
-- remises à leur ancienne valeur (plutôt que de rejeter toute la mise à
-- jour) pour ne pas casser les autres champs envoyés dans le même patch.
-- IS et IN_boutique (payés en argent réel) peuvent seulement baisser
-- (dépense en boutique) ; les crédits passent par le webhook Wave.
create or replace function proteger_colonnes_users()
returns trigger
language plpgsql
as $$
begin
  if requete_client() then
    new.id            := old.id;
    new.matricule     := old.matricule;
    new.email         := old.email;
    new.plan          := old.plan;
    new.abo_debut     := old.abo_debut;
    new.abo_fin       := old.abo_fin;
    new.is_admin      := old.is_admin;
    new.filigrane     := old.filigrane;
    new.parrain_code  := old.parrain_code;
    new.parrain_id    := old.parrain_id;
    new.created_at    := old.created_at;
    new."IS"          := least(coalesce(new."IS", 0), coalesce(old."IS", 0));
    new."IN_boutique" := least(coalesce(new."IN_boutique", 0), coalesce(old."IN_boutique", 0));
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_colonnes_users on users;
create trigger proteger_colonnes_users
  before update on users
  for each row execute function proteger_colonnes_users();

-- Création automatique du profil à l'inscription (supabase.auth.signUp).
-- Les infos saisies arrivent dans options.data (raw_user_meta_data).
-- Le plan est toujours « gratuit » : un plan payant s'obtient uniquement
-- après paiement. Le matricule vient d'une séquence (unique, sans
-- dépendre de ce que l'élève peut lire).
create sequence if not exists users_matricule_seq;

create or replace function creer_profil_utilisateur()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta   jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  num    text  := lpad(nextval('users_matricule_seq')::text, 4, '0');
  v_prenom text := coalesce(nullif(trim(meta->>'prenom'), ''), 'Élève');
  mat    text  := 'MI-' || extract(year from now())::int || '-' || num;
begin
  insert into users (
    id, matricule, prenom, nom, email, tel, niveau, type, lycee,
    plan, "IN", "IS", filigrane, parrain_code,
    contenu_debloque, contenu_choisi_confirme
  ) values (
    new.id,
    mat,
    v_prenom,
    coalesce(meta->>'nom', ''),
    new.email,
    nullif(meta->>'tel', ''),
    coalesce(nullif(meta->>'niveau', ''), 'seconde'),
    case when meta->>'type' = 'universite' then 'universite' else 'lycee' end,
    nullif(meta->>'lycee', ''),
    'gratuit', 0, 0,
    mat || upper(substr(md5(random()::text), 1, 6)),
    'MI-' || upper(left(v_prenom, 3)) || '-' || num,
    '[]'::jsonb,
    true  -- compte gratuit : pas de sélection de contenu à faire
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function creer_profil_utilisateur();

-- ============================================================
-- Communauté
-- ============================================================
alter table messages_communaute     enable row level security;
alter table communaute_bloques      enable row level security;
alter table communaute_signalements enable row level security;

drop policy if exists "Lecture publique communaute"       on messages_communaute;
drop policy if exists "Ecriture publique communaute"      on messages_communaute;
drop policy if exists "Suppression moderation communaute" on messages_communaute;
drop policy if exists "Lecture communaute"                on messages_communaute;
drop policy if exists "Ecriture communaute"               on messages_communaute;
drop policy if exists "Suppression communaute admin"      on messages_communaute;

-- Lecture : élèves connectés uniquement
create policy "Lecture communaute" on messages_communaute for select to authenticated using (true);
-- Écriture : uniquement sous son propre identifiant, et pas si bloqué
create policy "Ecriture communaute" on messages_communaute for insert to authenticated
  with check (
    user_id = auth.uid()::text
    and not exists (select 1 from communaute_bloques b where b.user_id = auth.uid()::text)
  );
-- Suppression : admins
create policy "Suppression communaute admin" on messages_communaute for delete to authenticated
  using (is_admin());

-- Le prénom et le niveau affichés sont pris dans le profil, pas dans la
-- requête (empêche de poster sous le nom d'un autre).
create or replace function remplir_auteur_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if requete_client() then
    select u.prenom, u.niveau into new.prenom, new.niveau
      from users u where u.id::text = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists remplir_auteur_message on messages_communaute;
create trigger remplir_auteur_message
  before insert on messages_communaute
  for each row execute function remplir_auteur_message();

-- Temps réel (ajout idempotent à la publication)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages_communaute'
  ) then
    alter publication supabase_realtime add table messages_communaute;
  end if;
end $$;

drop policy if exists "Lecture bloques"        on communaute_bloques;
drop policy if exists "Ecriture bloques"       on communaute_bloques;
drop policy if exists "Ecriture bloques admin" on communaute_bloques;

-- Un élève voit seulement s'il est lui-même bloqué ; l'admin voit tout.
create policy "Lecture bloques" on communaute_bloques for select to authenticated
  using (user_id = auth.uid()::text or is_admin());
create policy "Ecriture bloques admin" on communaute_bloques for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "Lecture signalements"       on communaute_signalements;
drop policy if exists "Ecriture signalements"      on communaute_signalements;
drop policy if exists "Creation signalement"       on communaute_signalements;
drop policy if exists "Gestion signalements admin" on communaute_signalements;

-- Tout élève connecté peut signaler ; seuls les admins lisent et traitent.
create policy "Creation signalement" on communaute_signalements for insert to authenticated
  with check (statut = 'attente');
create policy "Gestion signalements admin" on communaute_signalements for all to authenticated
  using (is_admin()) with check (is_admin());

-- ============================================================
-- RAG : documents, chunks, ia_logs
-- ============================================================
-- Le contenu des cours n'est lu que par l'Edge Function ask-ia
-- (service_role) : aucune policy client = aucun accès depuis le navigateur.
alter table documents enable row level security;
alter table chunks    enable row level security;
alter table ia_logs   enable row level security;

drop policy if exists "Lecture publique documents"            on documents;
drop policy if exists "Lecture publique chunks"               on chunks;
drop policy if exists "Ecriture service uniquement documents" on documents;
drop policy if exists "Ecriture service uniquement chunks"    on chunks;
drop policy if exists "Ecriture logs"                         on ia_logs;
drop policy if exists "Lecture logs service"                  on ia_logs;

-- ============================================================
-- Transactions (paiement Wave)
-- ============================================================
-- Écriture : uniquement wave-checkout / wave-webhook (service_role).
-- Lecture : chacun ses propres transactions (page de retour après paiement).
alter table transactions enable row level security;

drop policy if exists "Lecture transactions"         on transactions;
drop policy if exists "Ecriture transactions"        on transactions;
drop policy if exists "Lecture propres transactions" on transactions;

create policy "Lecture propres transactions" on transactions for select to authenticated
  using (user_id = auth.uid()::text);

-- ============================================================
-- Actualités
-- ============================================================
-- Écriture : uniquement fetch-actualites (service_role).
alter table actualites enable row level security;

drop policy if exists "Lecture actualites"  on actualites;
drop policy if exists "Ecriture actualites" on actualites;

create policy "Lecture actualites" on actualites for select using (true);

-- Seuls les liens http(s) sont acceptés (pas de javascript:, data:…)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'actualites_lien_http') then
    alter table actualites add constraint actualites_lien_http check (lien ~* '^https?://') not valid;
  end if;
end $$;

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
