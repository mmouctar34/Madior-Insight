import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { chargerConvs, marquerConvLue } from '../data/messagesStore';

export default function Messages() {
  const { user } = useAuth();
  const toast = useToast();
  const [convs, setConvs] = useState(chargerConvs);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');

  const activeConv = convs.find(c => c.id === activeId);
  const nonLus = (conv) => conv.messages.filter(m => m.from === 'admin' && !m.lu).length;

  const ouvrirConv = (id) => {
    setActiveId(id);
    marquerConvLue(id); // met à jour le store partagé (badge Sidebar inclus)
    setConvs(prev => prev.map(c => c.id === id
      ? { ...c, messages: c.messages.map(m => ({ ...m, lu: true })) }
      : c
    ));
  };

  const envoyer = () => {
    if (!input.trim() || !activeId) return;
    const now = new Date();
    const ts = `${now.toLocaleDateString('fr-SN')} ${now.toLocaleTimeString('fr-SN',{hour:'2-digit',minute:'2-digit'})}`;
    const newMsg = { from:'eleve', text:input.trim(), ts, lu:true };
    setConvs(prev => prev.map(c => c.id === activeId ? { ...c, messages:[...c.messages, newMsg] } : c));
    setInput('');
    toast('Message envoyé !','success');
    setTimeout(() => {
      const auto = { from:'admin', text:'Message bien reçu ! Nous te répondrons dans les plus brefs délais.', ts, lu:false };
      setConvs(prev => prev.map(c => c.id === activeId ? { ...c, messages:[...c.messages, auto] } : c));
    }, 2000);
  };

  return (
    <Layout title="Messages">
      <div style={{ background:'var(--card-bg)', border:'1.5px solid var(--border-lt)', borderRadius:12, overflow:'hidden', height:'calc(100vh - 130px)', display:'flex' }}>

        {/* Liste conversations */}
        <div style={{ width:300, flexShrink:0, borderRight:'1.5px solid var(--border-lt)', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1.5px solid var(--border-lt)' }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, color:'var(--text)' }}>Messages</div>
            <div style={{ fontSize:'0.74rem', color:'var(--muted)' }}>{convs.length} conversations</div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {convs.map(c => {
              const last = c.messages[c.messages.length-1];
              const unread = nonLus(c);
              const isActive = c.id === activeId;
              return (
                <div key={c.id}
                  onClick={() => ouvrirConv(c.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid var(--border-lt)', background: isActive?'var(--copper-bg)':'var(--card-bg)', transition:'background .2s' }}
                  onMouseOver={e => { if (!isActive) e.currentTarget.style.background='var(--bg2)'; }}
                  onMouseOut={e => { if (!isActive) e.currentTarget.style.background='var(--card-bg)'; }}
                >
                  <div style={{ width:38, height:38, borderRadius:'50%', background:c.couleur, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'#fff', fontSize:'0.88rem', flexShrink:0 }}>{c.init}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text)', marginBottom:2 }}>{c.nom}</div>
                    <div style={{ fontSize:'0.74rem', color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{last.text.substring(0,40)}…</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                    <div style={{ fontSize:'0.66rem', color:'var(--muted)' }}>{last.ts.split(' ')[0]}</div>
                    {unread > 0 && (
                      <div style={{ minWidth:18, height:18, borderRadius:100, background:'var(--copper)', color:'#fff', fontSize:'0.62rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 5px' }}>{unread}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zone chat */}
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          {!activeConv ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, color:'var(--muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" style={{ opacity:.3 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <div style={{ fontSize:'0.85rem' }}>Sélectionne une conversation</div>
            </div>
          ) : (
            <>
              {/* Header conv */}
              <div style={{ padding:'12px 16px', borderBottom:'1.5px solid var(--border-lt)', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:activeConv.couleur, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'#fff', fontSize:'0.88rem' }}>{activeConv.init}</div>
                <div>
                  <div style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--text)' }}>{activeConv.nom}</div>
                  <div style={{ fontSize:'0.73rem', color:'var(--success)' }}>En ligne</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
                {activeConv.messages.map((m,i) => {
                  const isUser = m.from === 'eleve';
                  return (
                    <div key={i} style={{ display:'flex', flexDirection:'column', maxWidth:'75%', alignSelf: isUser?'flex-end':'flex-start' }}>
                      <div style={{
                        padding:'10px 14px', borderRadius:10, fontSize:'0.87rem', lineHeight:1.65,
                        background: isUser?'var(--copper)':'var(--bg2)',
                        color: isUser?'#fff':'var(--text-2)',
                        border: !isUser?'1.5px solid var(--border-lt)':'none',
                        borderBottomRightRadius: isUser?3:10,
                        borderBottomLeftRadius: !isUser?3:10,
                      }}>{m.text}</div>
                      <div style={{ fontSize:'0.66rem', color:'var(--muted)', marginTop:3, alignSelf: isUser?'flex-end':'flex-start' }}>{m.ts}</div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div style={{ padding:12, borderTop:'1.5px solid var(--border-lt)', display:'flex', gap:8, alignItems:'flex-end' }}>
                <textarea
                  className="input"
                  rows={2}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); envoyer(); } }}
                  placeholder="Écrire un message…"
                  style={{ flex:1, resize:'none' }}
                />
                <button onClick={envoyer} className="btn btn-primary" style={{ padding:'10px 16px', height:'fit-content' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
