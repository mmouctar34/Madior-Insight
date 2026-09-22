import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/*
 * En développement, si les variables ne sont pas encore configurées,
 * on exporte `null` plutôt que de faire planter l'app : le reste du code
 * (IA.jsx) doit vérifier `supabase` avant de l'utiliser et retomber sur
 * les réponses simulées si besoin.
 */
export const supabase = (url && anonKey) ? createClient(url, anonKey) : null;

export const isRagConfigured = () => Boolean(supabase);
