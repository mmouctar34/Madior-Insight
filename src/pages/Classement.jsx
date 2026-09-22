import { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { getRang, RANGS, AV_COLORS } from '../data/constants';

const NIVEAUX_LB = [
  { id:'terminale',  label:'Terminale' },
  { id:'premiere',   label:'Première' },
  { id:'seconde',    label:'Seconde' },
  { id:'universite', label:'Université' },
];

const LB_DATA = {
  terminale: [
    { pos:1, init:'A', nom:'Aminata Diallo',    school:'Lycée Kennedy · Dakar',       pts:42800, rang:'Titan',       plan:'premium' },
    { pos:2, init:'M', nom:'Moussa Koné',       school:'Lycée Blaise Diagne',         pts:39100, rang:'Titan',       plan:'premium' },
    { pos:3, init:'M', nom:'Moustapha Aïdara',  school:'Lycée Blaise Diagne',         pts:28450, rang:'Mastermind',  plan:'premium', me:true },
    { pos:4, init:'F', nom:'Fatou Ndiaye',      school:'Lycée S.Nourou Tall',         pts:25320, rang:'Mastermind',  plan:'standard' },
    { pos:5, init:'O', nom:'Omar Ba',           school:'Lycée de Thiès',              pts:19800, rang:'Vanguard',    plan:'medium' },
    { pos:6, init:'R', nom:'Rokhaya Seck',      school:'Lycée Lamine Guèye',          pts:17650, rang:'Vanguard',    plan:'standard' },
    { pos:7, init:'C', nom:'Cheikh Diop',       school:'Lycée Kennedy · Dakar',       pts:14200, rang:'Pro-Mind',    plan:'standard' },
    { pos:8, init:'N', nom:'Ndéye Fall',        school:'Lycée de Saint-Louis',        pts:11800, rang:'Pro-Mind',    plan:'standard' },
    { pos:9, init:'I', nom:'Ibrahima Sarr',     school:'Lycée de Ziguinchor',         pts:9600,  rang:'Pro-Mind',    plan:'gratuit' },
    { pos:10,init:'A', nom:'Awa Traoré',        school:'Lycée S.Nourou Tall',         pts:7200,  rang:'Rising Star', plan:'gratuit' },
    { pos:11,init:'K', nom:'Khadija Ba',        school:'Lycée Blaise Diagne',         pts:5800,  rang:'Rising Star', plan:'standard' },
    { pos:12,init:'S', nom:'Samba Ndiaye',      school:'Lycée de Kaolack',            pts:4200,  rang:'Rising Star', plan:'standard' },
  ],
  premiere: [
    { pos:1, init:'C', nom:'Cheikh Diop',       school:'Lycée Blaise Diagne',         pts:38900, rang:'Titan',       plan:'premium' },
    { pos:2, init:'N', nom:'Ndéye Fall',        school:'Lycée Kennedy',               pts:29400, rang:'Mastermind',  plan:'medium' },
    { pos:3, init:'I', nom:'Ibrahima Sarr',     school:'Lycée de Ziguinchor',         pts:24300, rang:'Mastermind',  plan:'standard' },
    { pos:4, init:'A', nom:'Aissatou Bah',      school:'Lycée de Kaolack',            pts:18600, rang:'Vanguard',    plan:'standard' },
    { pos:5, init:'S', nom:'Samba Diallo',      school:'Lycée Lamine Guèye',          pts:15800, rang:'Vanguard',    plan:'medium' },
  ],
  seconde: [
    { pos:1, init:'K', nom:'Khady Mbaye',       school:'Lycée Kennedy',               pts:24800, rang:'Mastermind',  plan:'premium' },
    { pos:2, init:'P', nom:'Papa Diallo',       school:'Lycée Blaise Diagne',         pts:18600, rang:'Vanguard',    plan:'medium' },
    { pos:3, init:'S', nom:'Sokhna Gueye',      school:'Lycée Lamine Guèye',          pts:16400, rang:'Vanguard',    plan:'standard' },
    { pos:4, init:'Y', nom:'Yaye Ndoye',        school:'Lycée de Thiès',              pts:12200, rang:'Pro-Mind',    plan:'standard' },
    { pos:5, init:'B', nom:'Boubacar Diallo',   school:'Lycée de Saint-Louis',        pts:9800,  rang:'Pro-Mind',    plan:'standard' },
  ],
  universite: [
    { pos:1, init:'D', nom:'Demba Ndiaye',      school:'UCAD · L3',                   pts:62100, rang:'Mythic',      plan:'elite' },
    { pos:2, init:'A', nom:'Aïcha Sy',          school:'UGB · Master 1',              pts:51800, rang:'Titan',       plan:'elite' },
    { pos:3, init:'M', nom:'Malick Diop',       school:'UCAD · L2',                   pts:44200, rang:'Titan',       plan:'pro' },
    { pos:4, init:'F', nom:'Fatima Balde',      school:'CURI · L1',                   pts:31600, rang:'Mastermind',  plan:'standard' },
    { pos:5, init:'O', nom:'Ousmane Sow',       school:'UCAD · L3',                   pts:28400, rang:'Mastermind',  plan:'pro' },
  ],
};

/* Hall of Fame */
const HALL_OF_FAME = [
  {
    saison: 'Saison 1 — Semestre 1 2026/2027',
    top: [
      { pos:1, nom:'Aminata Diallo',  school:'Lycée Kennedy, Dakar',     rang:'Titan',    score:58400 },
      { pos:2, nom:'Moussa Koné',     school:'Lycée Blaise Diagne',      rang:'Titan',    score:51200 },
      { pos:3, nom:'Khady Mbaye',     school:'Lycée Kennedy, Dakar',     rang:'Mastermind',score:44800 },
    ]
  }
];

const RANG_COLORS = { Challenger:'#8B6914', 'Rising Star':'#3B82F6', 'Pro-Mind':'#10B981', Vanguard:'#8B5CF6', Mastermind:'#F59E0B', Titan:'#EF4444', Mythic:'#C4621A' };
const MEDALS = { 1:'#F59E0B', 2:'#9CA3AF', 3:'#B45309' };

export default function Classement() {
  const { user } = useAuth();
  const [niveau, setNiveau]   = useState('terminale');
  const [tab, setTab]         = useState('classement');
  const [data, setData]       = useState(LB_DATA.terminale);
  const intervalRef           = useRef(null);

  useEffect(() => {
    const rows = JSON.parse(JSON.stringify(LB_DATA[niveau] || []));
    const me = rows.find(r => r.me);
    if (me && user) me.pts = user.points || 28450;
    rows.sort((a,b) => b.pts - a.pts);
    rows.forEach((r,i) => r.pos = i+1);
    setData(rows);
  }, [niveau, user]);

  /* Live simulation */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setData(prev => {
        const updated = prev.map(r => ({
          ...r,
          pts: r.me ? r.pts : r.pts + (Math.random() > 0.7 ? Math.floor(Math.random()*20)+5 : 0)
        }));
        updated.sort((a,b) => b.pts - a.pts);
        updated.forEach((r,i) => r.pos = i+1);
        return updated;
      });
    }, 8000);
    return () => clearInterval(intervalRef.current);
  }, [niveau]);

  const me     = data.find(r => r.me);
  const myRang = user ? getRang(user.points || 0) : null;
  const nextUp = me && me.pos > 1 ? data.find(r => r.pos === me.pos - 1) : null;
  const diff   = nextUp && me ? nextUp.pts - me.pts : 0;
  const top3   = data.filter(r => r.pos <= 3);

  const tabStyle = (t) => ({
    padding:'8px 18px', borderRadius:'var(--rs)', fontFamily:"'Fredoka',sans-serif",
    fontSize:'0.9rem', fontWeight:700, border:'none', cursor:'pointer', transition:'all .2s',
    background: tab===t ? 'var(--copper)' : 'var(--card-bg)',
    color: tab===t ? '#fff' : 'var(--text-3)',
    borderBottom: tab===t ? 'none' : '1.5px solid var(--border-lt)',
  });

  return (
    <Layout title="Classement">
      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[['classement','Classement'],['palmares','Mon palmarès'],['halloffame','Hall of Fame']].map(([t,l]) => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {/* ── CLASSEMENT ── */}
      {tab === 'classement' && (
        <>
          {/* Stats rapides */}
          {me && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
              {[
                { val:`#${me.pos}`, lbl:'Mon rang', col:'var(--copper)' },
                { val:me.pts.toLocaleString('fr-SN'), lbl:'Mes points', col:'var(--text)' },
                { val:`🔥 ${user?.streak||0}`, lbl:'Jours de suite', col:'var(--success)' },
              ].map((s,i) => (
                <div key={i} className="card" style={{ textAlign:'center', padding:14 }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.3rem', fontWeight:700, color:s.col }}>{s.val}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:3 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filtres niveaux */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:14 }}>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {NIVEAUX_LB.map(n => (
                <button key={n.id}
                  onClick={() => setNiveau(n.id)}
                  className={niveau===n.id ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                >
                  {n.label}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.74rem', color:'var(--muted)' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--success)', display:'inline-block', animation:'pulse 2s infinite' }}/>
              En direct
            </div>
          </div>

          {/* Carte */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            {/* Podium */}
            <div style={{ background:'linear-gradient(180deg,var(--dark) 0%,var(--bg2) 100%)', padding:'24px 16px 0', display:'flex', alignItems:'flex-end', justifyContent:'center', gap:10 }}>
              {[top3[1],top3[0],top3[2]].filter(Boolean).map((r,i) => {
                const heights = [80,110,70];
                const medCol  = MEDALS[r.pos] || 'var(--muted)';
                const avCol   = AV_COLORS[(r.pos-1) % AV_COLORS.length];
                return (
                  <div key={r.pos} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1 }}>
                    {r.pos===1 ? (
                      <svg viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" width="22" height="22"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                    ) : <div style={{ height:22 }}/>}
                    <div style={{ width:44, height:44, borderRadius:'50%', background:avCol, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'#fff', fontSize:'1rem', border:`2px solid ${medCol}` }}>
                      {r.init}
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#FDFCF8', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.nom.split(' ')[0]}</div>
                      <div style={{ fontSize:'0.6rem', color:'rgba(253,252,248,0.5)' }}>{r.pts.toLocaleString('fr-SN')} pts</div>
                    </div>
                    <div style={{ width:'100%', height:heights[i], background:medCol, borderRadius:'6px 6px 0 0', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:8 }}>
                      <span style={{ fontSize:'1.2rem' }}>{r.pos===1?'🥇':r.pos===2?'🥈':'🥉'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carte ma position */}
            {me && (
              <div style={{ padding:'12px 16px' }}>
                <div style={{ background:'var(--copper-bg)', border:'2px solid var(--copper)', borderRadius:'var(--rs)', padding:'12px 14px', display:'flex', alignItems:'center', gap:12, marginBottom: nextUp ? 8 : 12 }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1rem', fontWeight:700, color:'var(--copper)', width:28, textAlign:'center' }}>{me.pos}</div>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--copper)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'#fff', flexShrink:0 }}>{me.init}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'0.87rem', color:'var(--text)' }}>{me.nom} <span style={{ fontSize:'0.6rem', background:'var(--copper)', color:'#fff', padding:'1px 6px', borderRadius:100, marginLeft:4 }}>Toi</span></div>
                    <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{me.rang}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, color:'var(--copper)', fontSize:'0.88rem' }}>{me.pts.toLocaleString('fr-SN')}</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--muted)' }}>pts</div>
                  </div>
                </div>
                {nextUp ? (
                  <div style={{ textAlign:'center', fontSize:'0.78rem', color:'var(--muted)', marginBottom:10 }}>
                    À <strong style={{ color:'var(--copper)' }}>{diff.toLocaleString('fr-SN')} pts</strong> de {nextUp.nom.split(' ')[0]} — Continue !
                  </div>
                ) : (
                  <div style={{ textAlign:'center', fontSize:'0.78rem', color:'var(--success)', marginBottom:10 }}>Tu es en tête du classement !</div>
                )}
              </div>
            )}

            {/* Liste */}
            <div style={{ padding:'0 16px', marginBottom:0 }}>
              <div style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)', marginBottom:8, fontFamily:"'Space Mono',monospace" }}>Classement général</div>
            </div>
            {data.filter(r => r.pos > 3).map(r => {
              const avCol  = AV_COLORS[(r.pos-1) % AV_COLORS.length];
              const rCol   = RANG_COLORS[r.rang] || 'var(--muted)';
              return (
                <div key={r.pos} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid var(--border-lt)', background: r.me?'var(--copper-bg)':'var(--card-bg)', transition:'background .3s' }}>
                  <div style={{ width:28, textAlign:'center', fontFamily:"'Space Mono',monospace", fontSize:'0.8rem', fontWeight:700, color:'var(--muted)' }}>{r.pos}</div>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:avCol, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'#fff', fontSize:'0.85rem', flexShrink:0 }}>{r.init}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text)' }}>
                      {r.nom}
                      {r.me && <span style={{ marginLeft:6, fontSize:'0.58rem', background:'var(--copper)', color:'#fff', padding:'1px 6px', borderRadius:100 }}>Toi</span>}
                    </div>
                    <div style={{ fontSize:'0.72rem', color:rCol, fontWeight:700 }}>{r.rang}</div>
                  </div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.82rem', fontWeight:700, color: r.me?'var(--copper)':'var(--text)' }}>{r.pts.toLocaleString('fr-SN')}</div>
                </div>
              );
            })}
            <div style={{ padding:'12px 16px', textAlign:'center', borderTop:'1.5px solid var(--border-lt)', fontSize:'0.74rem', color:'var(--muted)' }}>
              Mis à jour toutes les 8 secondes
            </div>
          </div>

          {/* Récompenses saison */}
          <div className="card" style={{ marginTop:16 }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:12 }}>Récompenses Top 5 — Fin de saison</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { pos:'1er — Le Major', reward:'1 mois Premium offert + Certificat PDF + Cadre doré', col:'#F59E0B' },
                { pos:'2e & 3e', reward:'1 mois Medium offert + Cadre Elite + Certificat', col:'#9CA3AF' },
                { pos:'4e & 5e', reward:'50% de réduction sur le réabonnement + Badge Top 5', col:'#B45309' },
              ].map((r,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:'var(--rs)', background:'var(--bg2)', border:'1.5px solid var(--border-lt)' }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.82rem', fontWeight:700, color:r.col, width:80, flexShrink:0 }}>{r.pos}</div>
                  <div style={{ fontSize:'0.83rem', color:'var(--text-2)' }}>{r.reward}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── PALMARÈS ── */}
      {tab === 'palmares' && (
        <div className="card">
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:5 }}>Mon palmarès personnel</div>
          <div style={{ fontSize:'0.82rem', color:'var(--muted)', marginBottom:18 }}>Tes badges historiques — conservés à vie, même après les resets trimestriels.</div>
          {user?.palmares?.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {user.palmares.map((p,i) => (
                <div key={i} style={{ padding:'12px 14px', borderRadius:'var(--rs)', border:'1.5px solid var(--border-lt)', background:'var(--card-bg)' }}>
                  <div style={{ fontWeight:700, color:'var(--text)' }}>{p.saison}</div>
                  <div style={{ fontSize:'0.82rem', color:'var(--muted)' }}>Rang atteint : {p.rang} · {p.pts.toLocaleString('fr-SN')} pts</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'32px 0' }}>
              <div style={{ fontSize:'2rem', marginBottom:10 }}>🏛️</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:6 }}>Pas encore de palmarès</div>
              <div style={{ fontSize:'0.84rem', color:'var(--muted)' }}>Tes badges de saison apparaîtront ici à chaque fin de trimestre.</div>
            </div>
          )}
        </div>
      )}

      {/* ── HALL OF FAME ── */}
      {tab === 'halloffame' && (
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:5 }}>Vitrine historique — Hall of Fame</div>
            <div style={{ fontSize:'0.82rem', color:'var(--muted)', lineHeight:1.65 }}>Le Top 10 national est gravé ici à chaque semestre. Immortel. Dans 2 ans, tu pourras revenir montrer ta place à tes amis.</div>
          </div>
          {HALL_OF_FAME.map((s,i) => (
            <div key={i} className="card" style={{ marginBottom:14 }}>
              <div style={{ background:'var(--dark)', margin:'-20px -20px 16px', padding:'12px 18px', borderRadius:'12px 12px 0 0' }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.9rem', fontWeight:700, color:'#FDFCF8' }}>{s.saison}</div>
              </div>
              {s.top.map((r) => (
                <div key={r.pos} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border-lt)' }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.9rem', fontWeight:700, color: MEDALS[r.pos] || 'var(--muted)', width:28 }}>{r.pos === 1 ? '🥇' : r.pos === 2 ? '🥈' : '🥉'}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:'0.87rem', color:'var(--text)' }}>{r.nom}</div>
                    <div style={{ fontSize:'0.74rem', color:'var(--muted)' }}>{r.school}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.82rem', fontWeight:700, color:'var(--copper)' }}>{r.score.toLocaleString('fr-SN')} pts</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--muted)' }}>{r.rang}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div style={{ textAlign:'center', padding:'20px 0', color:'var(--muted)', fontSize:'0.84rem' }}>
            La Saison 2 sera gravée en décembre 2026.
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </Layout>
  );
}
