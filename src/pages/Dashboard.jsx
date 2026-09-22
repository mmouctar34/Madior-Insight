import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getRang, RANGS, MATIERES, peutVoirCours } from '../data/constants';
import { COURS_CATALOGUE } from '../data/coursCatalogue';
import QuizModal from '../components/quiz/QuizModal';

function useCountdown(fin) {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    if (!fin) { setTxt('—'); return; }
    const update = () => {
      const diff = new Date(fin) - new Date();
      if (diff <= 0) { setTxt('Expiré'); return; }
      const j = Math.floor(diff/86400000);
      const h = Math.floor((diff%86400000)/3600000);
      const m = Math.floor((diff%3600000)/60000);
      setTxt(j > 0 ? `${j}j ${h}h restants` : `${h}h ${m}m restants`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [fin]);
  return txt;
}

/* Aperçu "Reprendre mes cours" — tiré du VRAI catalogue de cours (pas de
   contenu fictif). La progression (prog) reste illustrative tant que le
   suivi réel n'est pas branché au backend, mais les titres, matières et
   couleurs sont authentiques et respectent les règles d'accès par niveau. */
function getApercuCours(userNiveau) {
  const progsDemo = [40, 100, 0]; // valeurs illustratives, dans l'ordre des cours choisis
  return COURS_CATALOGUE
    .filter(c => peutVoirCours(userNiveau, c.niveau))
    .sort((a,b) => (a.niveau === userNiveau ? 0 : 1) - (b.niveau === userNiveau ? 0 : 1) || a.ordre - b.ordre)
    .slice(0, 3)
    .map((c, i) => ({
      id: c.id,
      mat: MATIERES[c.mat]?.label || c.mat,
      titre: c.titre,
      prog: progsDemo[i] ?? 0,
      col: MATIERES[c.mat]?.color || 'var(--copper)',
    }));
}

const PLAN_LABELS = { premium:'Premium', medium:'Medium', standard:'Standard', gratuit:'Visiteur', pro:'Pro', elite:'Elite' };

const LB_MINI = [
  {pos:1,init:'A',nom:'Aminata D.',pts:42800,me:false,col:'#C4621A'},
  {pos:2,init:'M',nom:'Moussa K.', pts:39100,me:false,col:'#1D3557'},
  {pos:3,init:'M',nom:'Moustapha A.',pts:28450,me:true, col:'#C4621A'},
  {pos:4,init:'F',nom:'Fatou N.',  pts:25320,me:false,col:'#7C3AED'},
  {pos:5,init:'O',nom:'Omar B.',   pts:19800,me:false,col:'#059669'},
];

function StatCard({ value, label, sub, color }) {
  return (
    <div className="card fade-up" style={{ padding:'20px 22px' }}>
      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.8rem', fontWeight:700, color, lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text)', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:'0.75rem', color:'var(--success)', fontWeight:500 }}>{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const countdown = useCountdown(user?.abo_fin);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizMat, setQuizMat] = useState('economie');

  if (!user) { navigate('/login'); return null; }

  const rang = getRang(user.points || 0);
  const niveauKey = user.niveau?.startsWith('universite') ? 'universite' : (user.niveau || 'terminale');
  const cours = getApercuCours(niveauKey);
  const rangIdx = RANGS.findIndex(r => r.id === rang.id);
  const nextRang = RANGS[rangIdx + 1];
  const pctRang = nextRang ? Math.round(((user.points||0) - rang.min) / (nextRang.min - rang.min) * 100) : 100;

  const handleQuizEnd = (score, pct) => {
    const gain = Math.round(score / 2);
    updateUser({ IN:(user.IN||0)+gain, points:(user.points||0)+score });
    toast(`+${gain} IN gagnés !`, 'success');
  };

  return (
    <Layout title="Tableau de bord">

      {/* ── Salutation ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em', marginBottom:4 }}>
          Bonjour, {user.prenom} 👋
        </div>
        <div style={{ fontSize:'0.9rem', color:'var(--text-3)', fontWeight:400 }}>
          Continuons là où tu t'es arrêté. Tu progresses bien !
        </div>
      </div>

      {/* ── Abonnement banner ── */}
      <div style={{ background:'var(--dark)', borderRadius:16, padding:'18px 24px', marginBottom:28, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(196,98,26,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#D97732" strokeWidth="2" width="20" height="20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.1rem', fontWeight:700, color:'var(--cream)' }}>{PLAN_LABELS[user.plan] || user.plan}</div>
            <div style={{ fontSize:'0.78rem', color:'rgba(253,252,248,0.55)', marginTop:2 }}>{countdown}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'center', background:'rgba(255,255,255,0.07)', borderRadius:10, padding:'8px 16px' }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.3rem', fontWeight:700, color:'#D97732' }}>{user.IN || 0}</div>
            <div style={{ fontSize:'0.65rem', color:'rgba(253,252,248,0.4)', letterSpacing:'0.05em' }}>IN</div>
          </div>
          <div style={{ textAlign:'center', background:'rgba(255,255,255,0.07)', borderRadius:10, padding:'8px 16px' }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.3rem', fontWeight:700, color:'#C084FC' }}>{user.IS || 0}</div>
            <div style={{ fontSize:'0.65rem', color:'rgba(253,252,248,0.4)', letterSpacing:'0.05em' }}>IS</div>
          </div>
          <button onClick={() => navigate('/abonnement')} style={{ padding:'8px 18px', background:'rgba(255,255,255,0.1)', color:'var(--cream)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, cursor:'pointer', fontSize:'0.83rem', fontWeight:600, transition:'all .2s' }}
            onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.18)'}
            onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
          >Gérer →</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        <StatCard value={(user.points||0).toLocaleString('fr-SN')} label="Points totaux" sub={`Rang ${rang.label}`} color={rang.color} />
        <StatCard value="3/12" label="Cours terminés" sub="25% de progression" color="#16A34A" />
        <StatCard value={`${user.streak || 6}j`} label="Jours de suite" sub="Continue !" color="#D97706" />
        <StatCard value="87%" label="Moy. quiz" sub="14 quiz effectués" color="#A855F7" />
      </div>

      {/* ── Rang progress ── */}
      <div className="card fade-up" style={{ padding:'18px 22px', marginBottom:28, borderColor:rang.color, borderWidth:1.5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:rang.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={rang.color} strokeWidth="1.8" width="24" height="24">
              <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div>
                <span style={{ fontWeight:700, color:'var(--text)', fontSize:'0.95rem' }}>{rang.label}</span>
                <span style={{ fontSize:'0.8rem', color:'var(--muted)', marginLeft:8 }}>{(user.points||0).toLocaleString('fr-SN')} pts</span>
              </div>
              {nextRang && <span style={{ fontSize:'0.78rem', color:'var(--muted)' }}>{(nextRang.min-(user.points||0)).toLocaleString('fr-SN')} pts → {nextRang.label}</span>}
            </div>
            <div style={{ height:6, background:'var(--bg2)', borderRadius:100, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pctRang}%`, background:rang.color, borderRadius:100, transition:'width .6s ease' }}/>
            </div>
          </div>
        </div>
      </div>

      {/* ── Deux colonnes ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.55fr 1fr', gap:18, marginBottom:28 }}>

        {/* Cours */}
        <div className="card fade-up">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text)', letterSpacing:'-0.01em' }}>Reprendre mes cours</div>
            <button onClick={() => navigate('/cours')} style={{ fontSize:'0.8rem', color:'var(--copper)', fontWeight:600, border:'none', background:'none', cursor:'pointer' }}>Voir tout →</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {cours.map((c,i) => (
              <div key={i} onClick={() => navigate('/cours')} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', borderRadius:12, border:'1px solid var(--border-lt)', cursor:'pointer', transition:'all .2s', background:'var(--card-bg)' }}
                onMouseOver={e => { e.currentTarget.style.borderColor=c.col; e.currentTarget.style.background=`${c.col}06`; }}
                onMouseOut={e => { e.currentTarget.style.borderColor='var(--border-lt)'; e.currentTarget.style.background='var(--card-bg)'; }}
              >
                <div style={{ width:40, height:40, borderRadius:10, background:`${c.col}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={c.col} strokeWidth="1.8" width="18" height="18"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text)', marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.titre}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:4, background:'var(--bg2)', borderRadius:100, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${c.prog}%`, background:c.col, borderRadius:100 }}/>
                    </div>
                    <span style={{ fontSize:'0.7rem', color:'var(--muted)', flexShrink:0 }}>{c.prog === 100 ? 'Terminé ✓' : `${c.prog}%`}</span>
                  </div>
                </div>
                <span style={{ fontSize:'0.78rem', color:c.col, fontWeight:600, flexShrink:0 }}>{c.prog===100?'Revoir':c.prog>0?'Continuer →':'Commencer'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activité */}
        <div className="card fade-up">
          <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text)', marginBottom:18, letterSpacing:'-0.01em' }}>Activité récente</div>
          {[
            { icon:'✓', label:'Quiz Comptabilité validé', pts:'+12 pts', time:'Il y a 2h', col:'var(--success)' },
            { icon:'📖', label:'Cours SYSCOHADA terminé', pts:'+5 IN', time:'Hier', col:'var(--copper)' },
            { icon:'🏆', label:'Rang Mastermind atteint', pts:'', time:'Hier', col:'#F59E0B' },
          ].map((a,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:i<2?'1px solid var(--border-lt)':'none' }}>
              <div style={{ width:34, height:34, borderRadius:10, background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', flexShrink:0 }}>{a.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.83rem', fontWeight:500, color:'var(--text)' }}>{a.label}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:2 }}>{a.time}</div>
              </div>
              {a.pts && <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.72rem', fontWeight:700, color:'var(--copper)', flexShrink:0 }}>{a.pts}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Quiz rapide + Classement ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

        {/* Quiz rapide */}
        <div className="card fade-up">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text)', letterSpacing:'-0.01em' }}>Quiz rapide</div>
            <button onClick={() => navigate('/quiz')} style={{ fontSize:'0.8rem', color:'var(--copper)', fontWeight:600, border:'none', background:'none', cursor:'pointer' }}>Voir tout →</button>
          </div>
          <p style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:16 }}>5 questions · 20s/question · bonus rapidité</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[['economie','Économie','#C4621A'],['comptabilite','Comptabilité','#1D3557'],['maths','Mathématiques','#7C3AED']].map(([id,label,col]) => (
              <button key={id} onClick={() => { setQuizMat(id); setQuizOpen(true); }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderRadius:10, border:'1px solid var(--border-lt)', background:'var(--card-bg)', cursor:'pointer', transition:'all .2s', fontFamily:"'Inter',sans-serif" }}
                onMouseOver={e => { e.currentTarget.style.borderColor=col; e.currentTarget.style.background=`${col}08`; }}
                onMouseOut={e => { e.currentTarget.style.borderColor='var(--border-lt)'; e.currentTarget.style.background='var(--card-bg)'; }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:`${col}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:col }}/>
                  </div>
                  <span style={{ fontWeight:600, color:'var(--text)', fontSize:'0.87rem' }}>{label}</span>
                </div>
                <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>5 questions →</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mini classement */}
        <div className="card fade-up" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border-lt)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text)', letterSpacing:'-0.01em' }}>Classement</div>
            <button onClick={() => navigate('/classement')} style={{ fontSize:'0.8rem', color:'var(--copper)', fontWeight:600, border:'none', background:'none', cursor:'pointer' }}>Voir tout →</button>
          </div>
          {LB_MINI.map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom:i<LB_MINI.length-1?'1px solid var(--border-lt)':'none', background:r.me?'var(--copper-bg)':'var(--card-bg)', transition:'background .2s' }}>
              <div style={{ width:22, fontFamily:"'Space Mono',monospace", fontSize:'0.78rem', fontWeight:700, textAlign:'center', color:i===0?'#F59E0B':i===1?'#9CA3AF':i===2?'#B45309':'var(--muted)' }}>{r.pos}</div>
              <div style={{ width:30, height:30, borderRadius:'50%', background:r.col, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'#fff', fontSize:'0.82rem', flexShrink:0 }}>{r.init}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'0.83rem', fontWeight:600, color:'var(--text)' }}>
                  {r.nom}
                  {r.me && <span style={{ marginLeft:6, fontSize:'0.6rem', background:'var(--copper)', color:'#fff', padding:'1px 6px', borderRadius:100 }}>Toi</span>}
                </div>
              </div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.78rem', fontWeight:700, color:r.me?'var(--copper)':'var(--text)' }}>{r.pts.toLocaleString('fr-SN')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz modal */}
      {quizOpen && (
        <QuizModal matiere={quizMat} nbQuestions={5} onClose={() => setQuizOpen(false)} onEnd={handleQuizEnd} pointsType="quiz_infini" />
      )}
    </Layout>
  );
}
