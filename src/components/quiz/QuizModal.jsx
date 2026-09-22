import { useState, useEffect, useRef, useCallback } from 'react';
import { getQuestions, shuffle } from '../../data/questions';
import { POINTS } from '../../data/constants';

const LETTERS = ['A','B','C','D'];

export default function QuizModal({ matiere, nbQuestions = 5, titre, onClose, onEnd, pointsType = 'quiz_infini' }) {
  const [questions, setQuestions] = useState([]);
  const [step, setStep]           = useState(0);
  const [score, setScore]         = useState(0);
  const [answered, setAnswered]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [timeLeft, setTimeLeft]   = useState(20);
  const [totalTime, setTotalTime] = useState(0);
  const [phase, setPhase]         = useState('quiz'); /* quiz | result */
  const timerRef  = useRef(null);
  const startRef  = useRef(Date.now());
  const MAX_TIME  = 20;

  /* Init questions */
  useEffect(() => {
    const qs = getQuestions(matiere, nbQuestions);
    setQuestions(qs);
  }, [matiere, nbQuestions]);

  /* Anti-triche : désactiver copy/paste/contextmenu */
  useEffect(() => {
    const block = e => e.preventDefault();
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    document.addEventListener('contextmenu', block);
    return () => {
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('contextmenu', block);
    };
  }, []);

  /* Anti-triche : changement d'onglet */
  useEffect(() => {
    if (phase !== 'quiz') return;
    const handleVisibility = () => {
      if (document.hidden && phase === 'quiz') {
        repondre(-2); // -2 = sortie détectée
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase, step, answered]);

  /* Minuteur */
  useEffect(() => {
    if (phase !== 'quiz' || answered || questions.length === 0) return;
    setTimeLeft(MAX_TIME);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); repondre(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [step, questions, phase]);

  const repondre = useCallback((idx) => {
    if (answered) return;
    clearInterval(timerRef.current);
    const elapsed = (Date.now() - startRef.current) / 1000;
    setTotalTime(t => t + elapsed);
    setAnswered(true);
    setSelected(idx);
    const q = questions[step];
    const correct = idx === q?.correct;
    const bonus = correct ? Math.max(0, Math.round(POINTS.bonus_vitesse * (1 - elapsed / MAX_TIME))) : 0;
    const pts = correct ? (POINTS[pointsType] || 10) + bonus : 0;
    setScore(s => s + pts);
    setTimeout(() => {
      if (step + 1 >= questions.length) {
        setPhase('result');
      } else {
        setStep(s => s + 1);
        setAnswered(false);
        setSelected(null);
      }
    }, 1800);
  }, [answered, questions, step, pointsType]);

  if (questions.length === 0) return null;

  const q       = questions[step];
  const total   = questions.length;
  const maxScore = total * (POINTS[pointsType] || 10) + total * POINTS.bonus_vitesse;
  const pct     = phase === 'result' ? Math.round(score / maxScore * 100) : Math.round(step / total * 100);
  const tMoyen  = phase === 'result' ? Math.round(totalTime / total) : 0;
  const timerPct = (timeLeft / MAX_TIME) * 100;
  const timerColor = timeLeft <= 5 ? 'var(--danger)' : timeLeft <= 10 ? 'var(--warning)' : 'var(--success)';

  const getOptClass = (i) => {
    if (!answered) return 'quiz-opt';
    if (i === q.correct) return 'quiz-opt correct';
    if (i === selected && i !== q.correct) return 'quiz-opt wrong';
    return 'quiz-opt';
  };

  const resultEmoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪';
  const resultMsg   = pct >= 80 ? 'Excellent ! Tu maîtrises bien ce sujet.'
    : pct >= 60 ? 'Bien ! Continue à réviser.'
    : 'Révise et réessaie — tu vas progresser !';

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(44,26,14,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
    >
      <div
        className="quiz-zone"
        onContextMenu={e => e.preventDefault()}
        style={{ background:'var(--card-bg)', borderRadius:16, padding:28, maxWidth:560, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(44,26,14,0.25)', animation:'modalIn .25s ease', userSelect:'none', WebkitUserSelect:'none' }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:'0.68rem', fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', marginBottom:4 }}>
              {titre || `Quiz — ${matiere}`}
            </div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.05rem', fontWeight:700, color:'var(--text)' }}>
              {phase === 'quiz' ? `Question ${step + 1} / ${total}` : 'Résultat final'}
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'1.5px solid var(--border)', background:'var(--card-bg)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--muted)', fontSize:'1rem' }}>×</button>
        </div>

        {/* Phase QUIZ */}
        {phase === 'quiz' && (
          <>
            {/* Progress + score */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
              <span style={{ fontSize:'0.73rem', color:'var(--muted)' }}>{pct}% complété</span>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:'0.73rem', color:'var(--copper)', fontWeight:700 }}>Score : {score}</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.85rem', fontWeight:700, color:timerColor, minWidth:24, textAlign:'right' }}>{timeLeft}</span>
              </div>
            </div>
            <div className="timer-bar" style={{ marginBottom:5 }}>
              <div className="timer-fill" style={{ width:`${pct}%`, background:'var(--copper)' }}/>
            </div>
            <div className="timer-bar" style={{ marginBottom:18 }}>
              <div className="timer-fill" style={{ width:`${timerPct}%`, background:timerColor }}/>
            </div>

            {/* Question */}
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.05rem', fontWeight:700, color:'var(--text)', marginBottom:14, lineHeight:1.4 }}>
              {q.q}
            </div>

            {/* Options */}
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {q.opts.map((opt, i) => (
                <button
                  key={i}
                  id={`opt-${i}`}
                  className={getOptClass(i)}
                  onClick={() => !answered && repondre(i)}
                  disabled={answered}
                  style={{ fontFamily:"'Nunito',sans-serif" }}
                >
                  <span style={{ width:24, height:24, borderRadius:'50%', background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, flexShrink:0 }}>{LETTERS[i]}</span>
                  {opt}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {answered && selected !== null && (
              <div style={{
                marginTop:12, padding:'10px 14px', borderRadius:'var(--rs)',
                borderLeft:'3px solid',
                ...(selected === -1 || selected === -2
                  ? { borderLeftColor:'var(--warning)', background:'rgba(217,119,6,0.08)', color:'var(--warning)' }
                  : selected === q.correct
                  ? { borderLeftColor:'var(--success)', background:'rgba(5,150,105,0.08)', color:'var(--success)' }
                  : { borderLeftColor:'var(--danger)',  background:'rgba(220,38,38,0.08)',  color:'var(--danger)' }),
                fontSize:'0.86rem', lineHeight:1.65,
              }}>
                <strong>
                  {selected === -2 ? 'Changement d\'onglet détecté !' : selected === -1 ? 'Temps écoulé !' : selected === q.correct ? 'Correct !' : 'Incorrect.'}
                </strong>{' '}
                {q.exp}
              </div>
            )}
          </>
        )}

        {/* Phase RESULT */}
        {phase === 'result' && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:'3rem', marginBottom:12 }}>{resultEmoji}</div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.5rem', fontWeight:700, color:'var(--text)', marginBottom:6 }}>
              {score} pts / {maxScore} ({pct}%)
            </div>
            <div style={{ fontSize:'0.86rem', color:'var(--muted)', marginBottom:5, lineHeight:1.65 }}>{resultMsg}</div>
            <div style={{ fontSize:'0.76rem', color:'var(--muted)', marginBottom:20 }}>
              Temps moyen : {tMoyen}s / question
            </div>
            {/* Bonus 95% */}
            {pct >= 95 && (
              <div style={{ background:'rgba(5,150,105,0.08)', border:'1.5px solid rgba(5,150,105,0.2)', borderRadius:'var(--rs)', padding:'10px 14px', marginBottom:16, fontSize:'0.85rem', color:'var(--success)', fontWeight:700 }}>
                Score ≥ 95% — +{POINTS.bonus_95} Insights Normaux bonus !
              </div>
            )}
            <div style={{ display:'flex', gap:9, justifyContent:'center', flexWrap:'wrap' }}>
              <button
                onClick={() => { setStep(0); setScore(0); setAnswered(false); setSelected(null); setTotalTime(0); setPhase('quiz'); const qs = getQuestions(matiere, nbQuestions); setQuestions(qs); }}
                className="btn btn-ghost btn-sm"
              >
                Rejouer
              </button>
              <button onClick={() => { onEnd && onEnd(score, pct); onClose(); }} className="btn btn-primary btn-sm">
                Terminer →
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
