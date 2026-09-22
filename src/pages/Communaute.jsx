import { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase, isRagConfigured } from '../lib/supabaseClient';
import { messageEstAcceptable, NIVEAU_GROUPES_CHAT } from '../data/constants';
import { estBloque, signalerMessage, getMessagesSupprimesLocal, getEtatChat, onEtatChatChange } from '../lib/moderationStore';

const NIVEAU_LABEL = { seconde:'2nde', premiere:'1ère', terminale:'Terminale', 'universite-l1':'L1', 'universite-l2':'L2', 'universite-l3':'L3', 'universite-master':'Master' };

/* Messages de démonstration affichés si Supabase n'est pas encore configuré,
   pour que la page ne soit jamais vide en attendant le vrai backend partagé. */
const MESSAGES_DEMO = [
  { id:'d1', user_id:'demo1', prenom:'Fatou', niveau:'terminale', texte:'Salut tout le monde ! Quelqu\'un a compris l\'exercice sur les amortissements ?', created_at:'2026-09-05T09:12:00Z' },
  { id:'d2', user_id:'demo2', prenom:'Ibrahima', niveau:'premiere', texte:'Oui, regarde le TD du cours de compta, y a un exemple similaire.', created_at:'2026-09-05T09:15:00Z' },
  { id:'d3', user_id:'demo3', prenom:'Aïssatou', niveau:'universite-l1', texte:'Bon courage à tous pour les révisions cette semaine 💪', created_at:'2026-09-05T10:02:00Z' },
  { id:'d4', user_id:'demo4', prenom:'Cheikh', niveau:'seconde', texte:'Quelqu\'un peut m\'expliquer la loi de l\'offre simplement ?', created_at:'2026-09-05T10:20:00Z' },
];

const COULEURS = ['#C4621A','#1D3557','#7C3AED','#059669','#DC2626','#0284C7'];
const couleurPour = (id) => COULEURS[[...String(id)].reduce((a,c)=>a+c.charCodeAt(0),0) % COULEURS.length];

function formatHeure(iso) {
  const d = new Date(iso);
  const auj = new Date();
  const memeJour = d.toDateString() === auj.toDateString();
  return memeJour
    ? d.toLocaleTimeString('fr-SN', { hour:'2-digit', minute:'2-digit' })
    : d.toLocaleDateString('fr-SN', { day:'2-digit', month:'2-digit' }) + ' ' + d.toLocaleTimeString('fr-SN', { hour:'2-digit', minute:'2-digit' });
}

/* Groupe d'un niveau précis (ex: 'universite-l2') vers le canal du filtre (ex: 'universite') */
function groupeDe(niveau) {
  if (!niveau) return null;
  if (niveau.startsWith('universite')) return 'universite';
  return niveau;
}

export default function Communaute() {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages]   = useState(isRagConfigured() ? [] : MESSAGES_DEMO);
  const [input, setInput]         = useState('');
  const [chargement, setChargement] = useState(isRagConfigured());
  const [canal, setCanal]         = useState('tous');
  const [bloque, setBloque]       = useState(false);
  const [signales, setSignales]   = useState(new Set()); // messages déjà signalés par moi dans cette session
  const [etatChat, setEtatChat]   = useState(getEtatChat); // fermeture globale décidée par l'admin
  const finRef = useRef(null);

  const charger = async () => {
    const supprimesLocal = getMessagesSupprimesLocal();

    if (!isRagConfigured()) {
      setMessages(MESSAGES_DEMO.filter(m => !supprimesLocal.includes(m.id)));
      setChargement(false);
      return;
    }
    const { data, error } = await supabase
      .from('messages_communaute')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200);
    if (!error && data) setMessages(data);
    setChargement(false);
  };

  useEffect(() => {
    charger();
    if (user) estBloque(user.id || user.email).then(setBloque);
    /* Pas de websocket ici pour rester simple et robuste : on rafraîchit
       toutes les 4 secondes tant que la page est ouverte. */
    const interval = setInterval(charger, 4000);
    const off = onEtatChatChange(() => setEtatChat(getEtatChat()));
    return () => { clearInterval(interval); off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, canal]);

  const messagesVisibles = messages.filter(m => {
    if (canal === 'tous') return true;
    return groupeDe(m.niveau) === canal;
  });

  const envoyer = async () => {
    const texte = input.trim();
    if (!texte) return;

    if (etatChat.actif) { toast('La communauté est temporairement fermée par un administrateur.', 'error'); return; }
    if (bloque) { toast('Tu as été bloqué de la communauté par un modérateur.', 'error'); return; }

    const verif = messageEstAcceptable(texte);
    if (!verif.ok) { toast(verif.raison, 'error'); return; }

    setInput('');

    if (!isRagConfigured()) {
      /* Mode démo : le message n'est visible que localement, pas partagé. */
      setMessages(prev => [...prev, { id:`local-${Date.now()}`, user_id:user.id||'moi', prenom:user.prenom, niveau:user.niveau, texte, created_at:new Date().toISOString() }]);
      return;
    }

    const { error } = await supabase.from('messages_communaute').insert({
      user_id: user.id || user.email || 'anonyme',
      prenom: user.prenom,
      niveau: user.niveau,
      texte,
    });
    if (error) { toast("Le message n'a pas pu être envoyé.", 'error'); return; }
    charger();
  };

  const signaler = async (m) => {
    if (signales.has(m.id)) return;
    await signalerMessage({
      messageId: m.id,
      texte: m.texte,
      userId: m.user_id,
      prenom: m.prenom,
      signalePar: user?.prenom || 'Anonyme',
    });
    setSignales(prev => new Set(prev).add(m.id));
    toast('Message signalé — un modérateur va l\'examiner.', 'success');
  };

  const compteur = input.length;
  const compteurCouleur = compteur > 480 ? 'var(--danger)' : compteur > 400 ? 'var(--warning)' : 'var(--muted)';

  return (
    <Layout title="Communauté">
      <div style={{ background:'var(--card-bg)', border:'1.5px solid var(--border-lt)', borderRadius:12, overflow:'hidden', height:'calc(100vh - 130px)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'14px 18px', borderBottom:'1.5px solid var(--border-lt)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'var(--copper-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="2" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, color:'var(--text)' }}>Communauté Madior Insight</div>
              <div style={{ fontSize:'0.74rem', color:'var(--muted)' }}>Tous les élèves · Texte uniquement · Modéré</div>
            </div>
          </div>
          {!isRagConfigured() && (
            <span style={{ fontSize:'0.7rem', fontWeight:700, background:'var(--bg2)', color:'var(--muted)', padding:'4px 10px', borderRadius:100 }}>Mode démo (local)</span>
          )}
        </div>

        {/* Filtre par niveau */}
        <div style={{ padding:'10px 18px', borderBottom:'1px solid var(--border-lt)', display:'flex', gap:7, overflowX:'auto' }}>
          {NIVEAU_GROUPES_CHAT.map(g => (
            <button key={g.id} onClick={() => setCanal(g.id)}
              style={{
                padding:'6px 14px', borderRadius:100, fontSize:'0.78rem', fontWeight:600, whiteSpace:'nowrap',
                border:`1.5px solid ${canal===g.id ? 'var(--copper)' : 'var(--border)'}`,
                background: canal===g.id ? 'var(--copper-bg)' : 'var(--card-bg)',
                color: canal===g.id ? 'var(--copper)' : 'var(--text-3)',
                cursor:'pointer', transition:'all .15s',
              }}
            >{g.label}</button>
          ))}
        </div>

        {/* Règles rapides */}
        <div style={{ padding:'8px 18px', background:'var(--bg2)', fontSize:'0.76rem', color:'var(--text-3)', borderBottom:'1px solid var(--border-lt)' }}>
          Respecte tes camarades · Pas de spam ni de contenu déplacé · Filtrage automatique + modérateurs actifs.
        </div>

        {/* Bandeau si la communauté est fermée par l'administration */}
        {etatChat.actif && (
          <div style={{ padding:'12px 18px', background:'rgba(217,119,6,0.1)', borderBottom:'1px solid rgba(217,119,6,0.2)', fontSize:'0.84rem', color:'var(--warning)' }}>
            <strong>Communauté fermée par l'administration.</strong>{' '}
            {etatChat.jusqu_a
              ? `Réouverture prévue le ${new Date(etatChat.jusqu_a).toLocaleString('fr-SN', { dateStyle:'short', timeStyle:'short' })}.`
              : 'Réouverture ultérieure.'}
            {etatChat.motif ? ` Motif : ${etatChat.motif}` : ''}
            {' '}Tu peux toujours lire les messages.
          </div>
        )}

        {/* Bandeau si bloqué */}
        {bloque && (
          <div style={{ padding:'10px 18px', background:'rgba(220,38,38,0.08)', borderBottom:'1px solid rgba(220,38,38,0.15)', fontSize:'0.82rem', color:'var(--danger)', fontWeight:600 }}>
            🚫 Tu as été bloqué de la communauté par un modérateur. Tu peux toujours lire les messages mais plus en envoyer.
          </div>
        )}

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:18, display:'flex', flexDirection:'column', gap:12 }}>
          {chargement && <div style={{ textAlign:'center', color:'var(--muted)', fontSize:'0.85rem', padding:20 }}>Chargement des messages…</div>}
          {!chargement && messagesVisibles.length === 0 && (
            <div style={{ textAlign:'center', color:'var(--muted)', fontSize:'0.85rem', padding:20 }}>Aucun message dans ce canal pour le moment. Sois le premier à écrire !</div>
          )}
          {messagesVisibles.map(m => {
            const mine = user && (m.user_id === (user.id || user.email));
            const col = couleurPour(m.user_id);
            const dejaSignale = signales.has(m.id);
            return (
              <div key={m.id} style={{ display:'flex', gap:10, alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth:'78%', flexDirection: mine ? 'row-reverse' : 'row' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:col, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'#fff', fontSize:'0.78rem', flexShrink:0 }}>
                  {(m.prenom||'?')[0]?.toUpperCase()}
                </div>
                <div style={{ maxWidth:'100%' }}>
                  <div style={{ display:'flex', gap:6, alignItems:'baseline', marginBottom:3, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text)' }}>{mine ? 'Toi' : m.prenom}</span>
                    {m.niveau && <span style={{ fontSize:'0.66rem', color:'var(--muted)' }}>{NIVEAU_LABEL[m.niveau] || m.niveau}</span>}
                    <span style={{ fontSize:'0.66rem', color:'var(--muted)' }}>{formatHeure(m.created_at)}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:6, flexDirection: mine ? 'row-reverse' : 'row' }}>
                    <div style={{
                      padding:'9px 13px', borderRadius:10, fontSize:'0.87rem', lineHeight:1.55,
                      background: mine ? 'var(--copper)' : 'var(--bg2)',
                      color: mine ? '#fff' : 'var(--text-2)',
                      border: !mine ? '1.5px solid var(--border-lt)' : 'none',
                      borderBottomRightRadius: mine ? 3 : 10,
                      borderBottomLeftRadius: !mine ? 3 : 10,
                      wordBreak: 'break-word',
                    }}>{m.texte}</div>
                    {!mine && (
                      <button
                        onClick={() => signaler(m)}
                        disabled={dejaSignale}
                        title={dejaSignale ? 'Déjà signalé' : 'Signaler ce message'}
                        style={{ width:24, height:24, borderRadius:7, border:'1px solid var(--border-lt)', background:'var(--card-bg)', color: dejaSignale ? 'var(--warning)' : 'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center', cursor: dejaSignale ? 'default' : 'pointer', flexShrink:0, transition:'all .15s' }}
                        onMouseOver={e => { if(!dejaSignale){ e.currentTarget.style.borderColor='var(--danger)'; e.currentTarget.style.color='var(--danger)'; }}}
                        onMouseOut={e => { if(!dejaSignale){ e.currentTarget.style.borderColor='var(--border-lt)'; e.currentTarget.style.color='var(--muted)'; }}}
                      >
                        <svg viewBox="0 0 24 24" fill={dejaSignale?'currentColor':'none'} stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={finRef} />
        </div>

        {/* Input */}
        <div style={{ padding:12, borderTop:'1.5px solid var(--border-lt)' }}>
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <textarea
              className="input"
              rows={1}
              maxLength={500}
              value={input}
              disabled={bloque || etatChat.actif}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
              placeholder={etatChat.actif ? 'La communauté est fermée pour le moment.' : bloque ? 'Tu ne peux plus écrire dans la communauté.' : 'Écrire un message à la communauté…'}
              style={{ flex:1, resize:'none', opacity: (bloque || etatChat.actif) ? 0.6 : 1 }}
            />
            <button onClick={envoyer} disabled={bloque || etatChat.actif || !input.trim()} className="btn btn-primary" style={{ padding:'10px 16px', height:'fit-content', opacity: (bloque || etatChat.actif || !input.trim()) ? 0.55 : 1 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div style={{ textAlign:'right', fontSize:'0.7rem', color:compteurCouleur, marginTop:4, fontFamily:"'Space Mono',monospace" }}>
            {compteur}/500
          </div>
        </div>
      </div>
    </Layout>
  );
}
