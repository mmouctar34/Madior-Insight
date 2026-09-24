import { createContext, useContext, useState, useEffect } from 'react';
import { genMatricule, getQuotasForPlan } from '../data/constants';
import { supabase, isRagConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

/* Utilisateur démo — utilisé uniquement tant que Supabase n'est pas configuré */
const DEMO_USER = {
  id: 1,
  prenom: 'Moustapha',
  nom: 'Aïdara',
  email: 'demo@madiorinsight.sn',
  tel: '+221 77 123 45 67',
  niveau: 'terminale',
  type: 'lycee',
  plan: 'premium',
  IN: 120,
  IS: 30,
  points: 28450,
  streak: 6,
  lycee: 'Lycée Blaise Diagne, Dakar',
  matricule: genMatricule(1),
  filigrane: 'MIAB3X7K2P',
  parrain_code: 'MI-AID-3421',
  abo_debut: '2026-09-01',
  abo_fin: '2026-10-31',
  palmares: [],
  contenuDebloque: ['s-eco-1','s-compta-1','s-maths-1','p-eco-1','p-compta-1','t-compta-ana'],
  contenuChoisiConfirme: true,
  INBoutique: 0,
  is_admin: true, /* le compte démo joue le rôle du propriétaire de la plateforme */
};

/* Convertit une ligne de la table `users` (snake_case côté SQL) vers le
   format utilisé partout dans le frontend (camelCase, IN/IS en majuscules). */
function depuisLigneSupabase(row) {
  return {
    id: row.id,
    prenom: row.prenom,
    nom: row.nom,
    email: row.email,
    tel: row.tel,
    niveau: row.niveau,
    type: row.type,
    lycee: row.lycee,
    plan: row.plan,
    IN: row.IN ?? 0,
    INBoutique: row.IN_boutique ?? 0,
    IS: row.IS ?? 0,
    points: row.points ?? 0,
    streak: row.streak ?? 0,
    matricule: row.matricule,
    filigrane: row.filigrane,
    parrain_code: row.parrain_code,
    contenuDebloque: row.contenu_debloque || [],
    contenuChoisiConfirme: !!row.contenu_choisi_confirme,
    abo_debut: row.abo_debut,
    abo_fin: row.abo_fin,
    is_admin: !!row.is_admin,
  };
}

/* Convertit les updates frontend (camelCase) vers les colonnes SQL (snake_case) */
function versLigneSupabase(updates) {
  const map = {
    IN: 'IN', INBoutique: 'IN_boutique', IS: 'IS',
    contenuDebloque: 'contenu_debloque', contenuChoisiConfirme: 'contenu_choisi_confirme',
  };
  const out = {};
  for (const [k, v] of Object.entries(updates)) out[map[k] || k] = v;
  return out;
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── Mode réel : Supabase Auth ── */
  useEffect(() => {
    if (!isRagConfigured()) {
      /* ── Mode démo : session locale dans le navigateur ── */
      try {
        const stored = sessionStorage.getItem('mi_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.prenom && parsed.plan) setUser(parsed);
          else sessionStorage.removeItem('mi_user');
        }
      } catch {
        sessionStorage.removeItem('mi_user');
      }
      setLoading(false);
      return;
    }

    /* Charge le profil `users` correspondant à la session Supabase Auth active */
    const chargerProfil = async (session) => {
      if (!session?.user) { setUser(null); setLoading(false); return; }
      const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (error || !data) { setUser(null); setLoading(false); return; }
      setUser(depuisLigneSupabase(data));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => chargerProfil(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      chargerProfil(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  /* ── Connexion / inscription DÉMO (aucune vérification réelle) ── */
  const login = (userData) => {
    const u = { ...DEMO_USER, ...userData };
    const { IN, IS } = getQuotasForPlan(u.plan, u.niveau);
    u.IN = IN; u.IS = IS;
    sessionStorage.setItem('mi_user', JSON.stringify(u));
    setUser(u);
  };
  const loginDemo = () => login(DEMO_USER);

  /* ── Connexion RÉELLE (Supabase Auth) — utilisée quand isRagConfigured() ── */
  const connexionReelle = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message);
    return data;
  };

  /* ── Inscription RÉELLE (Supabase Auth) ──
     La ligne `users` est créée côté base par le trigger `on_auth_user_created`
     (supabase/schema.sql) à partir de options.data : matricule unique, plan
     « gratuit ». Un plan payant s'obtient ensuite via /abonnement. */
  const inscriptionReelle = async ({ email, password, profil }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: {
          prenom: profil.prenom,
          nom: profil.nom,
          tel: profil.tel || '',
          niveau: profil.niveau,
          type: profil.type,
          lycee: profil.lycee || '',
        },
      },
    });
    if (error) throw new Error(error.message.includes('already registered') ? 'Un compte existe déjà avec cet email.' : error.message);
    if (!data.user) throw new Error("La création du compte a échoué. Réessaie.");
    return data;
  };

  const logout = async () => {
    if (isRagConfigured()) {
      await supabase.auth.signOut();
    } else {
      sessionStorage.removeItem('mi_user');
    }
    setUser(null);
  };

  const updateUser = async (updates) => {
    if (!user) return;
    const u = { ...user, ...updates };
    if ('plan' in updates || 'niveau' in updates) {
      const { IN, IS } = getQuotasForPlan(u.plan, u.niveau);
      u.IN = IN; u.IS = IS;
    }
    setUser(u); // mise à jour optimiste

    if (isRagConfigured()) {
      const patch = versLigneSupabase(updates);
      if ('plan' in updates || 'niveau' in updates) { patch.IN = u.IN; patch.IS = u.IS; }
      await supabase.from('users').update(patch).eq('id', user.id);
    } else {
      sessionStorage.setItem('mi_user', JSON.stringify(u));
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, DEMO_USER,
      login, loginDemo, logout, updateUser,
      connexionReelle, inscriptionReelle,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
