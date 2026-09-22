import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import QuizModal from '../components/quiz/QuizModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { BANQUE } from '../data/questions';

const MATIERES_QUIZ = [
  { id:'economie',    label:'Économie',      color:'#C4621A', bg:'rgba(196,98,26,0.09)',  desc:'Offre, demande, PIB, BCEAO, politique monétaire…' },
  { id:'comptabilite',label:'Comptabilité',  color:'#1D3557', bg:'rgba(29,53,87,0.09)',   desc:'SYSCOHADA, journal, bilan, amortissements, analyse…' },
  { id:'maths',       label:'Mathématiques', color:'#7C3AED', bg:'rgba(124,58,237,0.09)', desc:'Dérivées, variations, intérêts, annuités, probabilités…' },
  { id:'anglais',     label:'Anglais',       color:'#0284C7', bg:'rgba(2,132,199,0.09)',  desc:'Economic vocabulary, comprehension, business texts…' },
  { id:'espagnol',    label:'Espagnol',      color:'#DC2626', bg:'rgba(220,38,38,0.09)',  desc:'Vocabulario económico, comprensión lectora…' },
  { id:'culture',     label:'Culture générale', color:'#065F46', bg:'rgba(6,95,70,0.09)', desc:'Capitales, organisations, FMI, BAD, UEMOA, histoire…' },
];

/* Propres aux étudiants d'université — en plus de toutes les matières
   ci-dessus, auxquelles ils ont aussi accès (2nde → Terminale + Université). */
const MATIERES_QUIZ_UNIV = [
  { id:'statistiques',  label:'Statistiques',  color:'#0E7490', bg:'rgba(14,116,144,0.09)', desc:'Moyenne, médiane, variance, écart-type, quartiles…' },
  { id:'microeconomie', label:'Microéconomie', color:'#B45309', bg:'rgba(180,83,9,0.09)',   desc:'Utilité, choix du consommateur, coûts, structures de marché…' },
];

export default function Quiz() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [histo, setHisto] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mi_quiz_histo') || '[]'); } catch { return []; }
  });
  const [total, setTotal] = useState(() => parseInt(localStorage.getItem('mi_quiz_total') || '0'));

  const lancerQuiz = (matId) => setActiveQuiz(matId);

  const handleEnd = (score, pct) => {
    const gain = Math.round(score / 2);
    updateUser({ IN: (user.IN||0)+gain, points: (user.points||0)+score });
    toast(`+${gain} IN gagnés !`, 'success');
    const entry = { mat:activeQuiz, score, pct, ts:Date.now() };
    const newHisto = [entry, ...histo].slice(0, 20);
    setHisto(newHisto);
    localStorage.setItem('mi_quiz_histo', JSON.stringify(newHisto));
    const newTotal = total + 1;
    setTotal(newTotal);
    localStorage.setItem('mi_quiz_total', newTotal);
    setActiveQuiz(null);
  };

  const bestScore = (matId) => {
    const done = histo.filter(h => h.mat === matId);
    return done.length ? Math.max(...done.map(h => h.pct)) : null;
  };

  const effacerHisto = () => {
    setHisto([]); setTotal(0);
    localStorage.removeItem('mi_quiz_histo');
    localStorage.removeItem('mi_quiz_total');
    toast('Historique effacé.', 'success');
  };

  const matLabels = Object.fromEntries([...MATIERES_QUIZ, ...MATIERES_QUIZ_UNIV].map(m => [m.id, m.label]));
  const estUniv = user?.niveau?.startsWith('universite');
  const matieresAffichees = estUniv ? [...MATIERES_QUIZ, ...MATIERES_QUIZ_UNIV] : MATIERES_QUIZ;

  return (
    <Layout title="Quiz">
      {/* Header */}
      <div style={{ background:'var(--dark)', borderRadius:12, padding:'18px 22px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.05rem', fontWeight:700, color:'#FDFCF8', marginBottom:4 }}>Quiz aléatoires — Toutes matières</div>
          <div style={{ fontSize:'0.8rem', color:'rgba(253,252,248,0.55)' }}>Questions mélangées à chaque passage · 20s par question · Bonus rapidité</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'var(--rs)', padding:'10px 16px', textAlign:'center' }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.2rem', fontWeight:700, color:'#D97732' }}>{total}</div>
          <div style={{ fontSize:'0.72rem', color:'rgba(253,252,248,0.5)' }}>Quiz effectués</div>
        </div>
      </div>

      {/* Avertissement anti-triche */}
      <div style={{ background:'rgba(217,119,6,0.08)', border:'1.5px solid rgba(217,119,6,0.2)', borderRadius:'var(--rs)', padding:'10px 14px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span style={{ fontSize:'0.82rem', color:'var(--text-2)' }}>
          Les quiz sont chronométrés (20s/question). Copier-coller désactivé. Changer d'onglet marque la question incorrecte. Le score tient compte de la vitesse.
        </span>
      </div>

      {/* Grille matières */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:14 }}>Choisir une matière</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {matieresAffichees.map(m => {
            const best = bestScore(m.id);
            const nb   = BANQUE[m.id]?.length || 0;
            return (
              <div key={m.id} className="card" style={{ cursor:'pointer', transition:'all .2s' }}
                onClick={() => lancerQuiz(m.id)}
                onMouseOver={e => { e.currentTarget.style.borderColor=m.color; e.currentTarget.style.boxShadow=`0 4px 20px ${m.color}20`; }}
                onMouseOut={e => { e.currentTarget.style.borderColor='var(--border-lt)'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:m.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  {best !== null ? (
                    <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--success)', background:'rgba(5,150,105,0.08)', padding:'2px 8px', borderRadius:100 }}>Meilleur : {best}%</span>
                  ) : (
                    <span style={{ fontSize:'0.72rem', color:'var(--muted)', background:'var(--bg2)', padding:'2px 8px', borderRadius:100 }}>Jamais tenté</span>
                  )}
                </div>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:4 }}>{m.label}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:10, lineHeight:1.5 }}>{m.desc}</div>
                <div style={{ fontSize:'0.73rem', color:'var(--muted)', marginBottom:12 }}>{nb} questions en banque</div>
                <button
                  className="btn btn-sm btn-primary"
                  style={{ width:'100%', justifyContent:'center', background:m.color, borderColor:m.color }}
                  onClick={e => { e.stopPropagation(); lancerQuiz(m.id); }}
                >
                  Lancer le quiz · 10 questions
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historique */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)' }}>Mes derniers scores</div>
          {histo.length > 0 && (
            <button onClick={effacerHisto} className="btn btn-ghost btn-sm">Réinitialiser</button>
          )}
        </div>
        {histo.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--muted)', fontSize:'0.86rem' }}>
            Aucun quiz effectué encore. Lance ton premier quiz !
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {histo.slice(0,8).map((h,i) => {
              const d   = new Date(h.ts);
              const col = h.pct>=80?'var(--success)':h.pct>=60?'var(--warning)':'var(--danger)';
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 12px', borderRadius:'var(--rs)', border:'1.5px solid var(--border-lt)', background:'var(--card-bg)' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.84rem', fontWeight:700, color:'var(--text)' }}>{matLabels[h.mat] || h.mat}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{d.toLocaleDateString('fr-SN')} à {d.toLocaleTimeString('fr-SN',{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.9rem', fontWeight:700, color:col }}>{h.pct}%</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>{h.score} pts</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal quiz */}
      {activeQuiz && (
        <QuizModal
          matiere={activeQuiz}
          nbQuestions={10}
          titre={`Quiz ${matLabels[activeQuiz] || activeQuiz}`}
          onClose={() => setActiveQuiz(null)}
          onEnd={handleEnd}
          pointsType="quiz_infini"
        />
      )}
    </Layout>
  );
}
