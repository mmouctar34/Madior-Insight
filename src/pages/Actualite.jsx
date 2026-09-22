import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { shuffle } from '../data/questions';
import { POINTS } from '../data/constants';
import { supabase, isRagConfigured } from '../lib/supabaseClient';

const ARTICLES = [
  { id:'a1', source:'RFI Économie', date:'21 août 2026', lu:false, type:'pure', inGain:20,
    titre:'Le Sénégal maintient sa croissance à 6,8%',
    extrait:"Le FMI confirme ses prévisions : le Sénégal affiche l'une des plus fortes croissances d'Afrique subsaharienne, portée par Sangomar et le PSE.",
    contenu:"Le FMI a confirmé une croissance de 6,8% pour le Sénégal en 2026. Les moteurs : production pétrolière de Sangomar, investissements PSE, résilience agricole. L'inflation reste à 4,2%, au-dessus de la cible UEMOA de 3%.",
    tags:['PIB','Croissance','FMI'],
    quiz:[
      { q:"Quel est le taux de croissance prévu pour le Sénégal en 2026 ?", opts:["4,2%","6,8%","3,5%","8,0%"], correct:1, exp:"Le FMI confirme 6,8% de croissance pour 2026." },
      { q:"Quel champ pétrolier contribue à cette croissance ?", opts:["Jubilee","Sangomar","Taoudenni","Agadem"], correct:1, exp:"Sangomar, en production depuis 2024, booste les exportations." },
      { q:"PIB = C + I + G + ?", opts:["T−S","X−M","M−X","X+M"], correct:1, exp:"PIB = C + I + G + (Exports − Imports)." },
    ]},
  { id:'a2', source:'BCEAO', date:'20 août 2026', lu:false, type:'pure', inGain:15,
    titre:'BCEAO maintient le taux directeur à 3,5%',
    extrait:"Le Comité de Politique Monétaire a décidé à l'unanimité de maintenir le taux directeur à 3,5%.",
    contenu:"La BCEAO maintient son taux directeur à 3,5%. L'inflation dans l'UEMOA est à 3,1%, proche de la cible de 3%. La banque reste vigilante face aux risques externes.",
    tags:['BCEAO','Politique monétaire','Taux'],
    quiz:[
      { q:"Quel est le taux directeur maintenu par la BCEAO ?", opts:["2,5%","3,0%","3,5%","4,0%"], correct:2, exp:"Le taux directeur est maintenu à 3,5%." },
      { q:"La BCEAO est la banque centrale de combien de pays ?", opts:["5","6","8","12"], correct:2, exp:"BCEAO = banque centrale des 8 pays de l'UEMOA." },
      { q:"Politique restrictive → la BCEAO :", opts:["Baisse le taux","Hausse le taux","Distribue des FCFA","Baisse les impôts"], correct:1, exp:"Restrictive = hausse taux → crédit plus cher → freine inflation." },
    ]},
  { id:'a3', source:'Agence Ecofin', date:'19 août 2026', lu:false, type:'liee', inGain:20, cours:'Offre & Demande',
    titre:"Sangomar bouleverse l'offre pétrolière régionale",
    extrait:"L'entrée en production de Sangomar illustre un choc d'offre positif. Analyse économique complète.",
    contenu:"Depuis Sangomar, le Sénégal exporte ~100 000 barils/jour. Cela déplace la courbe d'offre vers la droite : P* baisse, Q* augmente. Exemple concret de la loi de l'offre.",
    tags:['Offre','Pétrole','Sangomar'],
    quiz:[
      { q:"Un choc d'offre positif fait :", opts:["Monter P*","Baisser P*","Stabiliser P*","Doubler Q*"], correct:1, exp:"Offre augmente → P* baisse, Q* monte." },
      { q:"Sangomar représente un :", opts:["Choc demande négatif","Choc offre négatif","Choc offre positif","Choc demande positif"], correct:2, exp:"Production de pétrole = augmentation de l'offre." },
      { q:"Si Qo augmente à P constant, il se crée :", opts:["Pénurie","Surplus","Équilibre","Rien"], correct:1, exp:"Offre augmente → Qo > Qd → surplus temporaire → P* baisse." },
    ]},
];

export default function Actualite() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [articles, setArticles] = useState(ARTICLES);
  const [filtre, setFiltre] = useState('tout');
  const [ouvert, setOuvert] = useState(null);
  const [quiz, setQuiz] = useState(null); // { questions, step, score, answered, selected, timeLeft, phase }
  const [chargementQuiz, setChargementQuiz] = useState(false);

  /* Actualités réelles (flux RSS) en plus des articles de démonstration,
     dès que Supabase est configuré — voir RAG_SETUP.md. */
  useEffect(() => {
    if (!isRagConfigured()) return;
    (async () => {
      /* On déclenche un rafraîchissement des flux (sans bloquer l'affichage),
         puis on lit ce qui est déjà en base pour un chargement rapide. */
      supabase.functions.invoke('fetch-actualites').catch(() => {});
      const { data } = await supabase
        .from('actualites')
        .select('*')
        .order('publie_le', { ascending: false })
        .limit(20);
      if (data?.length) {
        const reelles = data.map(row => ({
          id: `reel-${row.id}`,
          source: row.source,
          date: new Date(row.publie_le).toLocaleDateString('fr-SN', { day:'numeric', month:'long', year:'numeric' }),
          lu: false,
          type: 'pure',
          inGain: 15,
          titre: row.titre,
          extrait: row.resume,
          contenu: row.resume,
          lien: row.lien,
          tags: [],
          quiz: null, /* généré à la demande via l'IA — voir lancerQuiz() */
          reel: true,
        }));
        setArticles(prev => [...reelles, ...prev]);
      }
    })();
  }, []);

  const filtered = articles.filter(a => filtre === 'tout' || a.type === filtre);
  const nonLus = articles.filter(a => !a.lu).length;

  const ouvrirArticle = (id) => {
    const art = articles.find(a => a.id === id);
    if (!art.lu) {
      setArticles(prev => prev.map(a => a.id === id ? { ...a, lu: true } : a));
      updateUser({ IN: (user.IN||0) + 5 });
      toast('+5 IN gagnés pour avoir lu l\'article !', 'success');
    }
    setOuvert(id);
    setQuiz(null);
  };

  const lancerQuiz = async (art) => {
    if (art.quiz) {
      /* Article de démonstration : quiz déjà écrit à la main */
      setQuiz({ questions: shuffle(art.quiz), step:0, score:0, answered:false, selected:null, phase:'quiz' });
      return;
    }
    /* Article réel (flux RSS) : pas de quiz pré-écrit, on le génère via l'IA */
    if (!isRagConfigured()) {
      toast('Le quiz sur les actualités réelles nécessite le backend IA (voir RAG_SETUP.md).', 'error', 5000);
      return;
    }
    setChargementQuiz(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz-actualite', {
        body: { titre: art.titre, resume: art.contenu, articleId: art.id },
      });
      if (error || !data?.questions?.length) throw new Error(data?.error || 'Génération impossible');
      setQuiz({ questions: data.questions, step:0, score:0, answered:false, selected:null, phase:'quiz' });
    } catch (err) {
      toast("Impossible de générer le quiz pour cet article. Réessaie dans un instant.", 'error');
    } finally {
      setChargementQuiz(false);
    }
  };

  const repondre = (idx) => {
    if (!quiz || quiz.answered) return;
    const art = articles.find(a => a.id === ouvert);
    const q = quiz.questions[quiz.step];
    const correct = idx === q.correct;
    const pts = correct ? POINTS.quiz_actualite : 0;
    const newScore = quiz.score + pts;
    setQuiz(prev => ({ ...prev, answered:true, selected:idx, score:newScore }));
    setTimeout(() => {
      if (quiz.step + 1 >= quiz.questions.length) {
        setQuiz(prev => ({ ...prev, phase:'result' }));
        /* Le gain réel est calé sur l'IN promis à l'article (art.inGain) :
           score parfait = exactement art.inGain, score partiel = proportionnel.
           Avant ce correctif, le gain réel (score/2) ne correspondait jamais
           au "+X IN" annoncé sur la carte de l'article. */
        const maxScorePossible = quiz.questions.length * POINTS.quiz_actualite;
        const gain = Math.round(art.inGain * (newScore / maxScorePossible));
        updateUser({ IN: (user.IN||0)+gain, points:(user.points||0)+newScore });
        toast(`+${gain} IN gagnés !`, 'success');
      } else {
        setQuiz(prev => ({ ...prev, step:prev.step+1, answered:false, selected:null }));
      }
    }, 1800);
  };

  /* Vue article ouvert */
  if (ouvert) {
    const art = articles.find(a => a.id === ouvert);
    const LETTERS = ['A','B','C','D'];
    return (
      <Layout title={art.titre}>
        <div style={{ maxWidth:700 }}>
          <button onClick={() => { setOuvert(null); setQuiz(null); }} className="btn btn-ghost btn-sm" style={{ marginBottom:16 }}>← Retour</button>
          <div style={{ fontSize:'0.65rem', fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', marginBottom:6 }}>{art.source} · {art.date}</div>
          <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.5rem', fontWeight:700, marginBottom:10, lineHeight:1.25 }}>{art.titre}</h1>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:18 }}>
            {art.tags.map(t => <span key={t} style={{ fontSize:'0.72rem', fontWeight:700, background:'var(--bg2)', color:'var(--muted)', padding:'2px 8px', borderRadius:100 }}>{t}</span>)}
            {art.type === 'liee' && <span style={{ fontSize:'0.72rem', fontWeight:700, background:'var(--copper-bg)', color:'var(--copper)', padding:'2px 8px', borderRadius:100 }}>Cours : {art.cours}</span>}
          </div>
          <div style={{ fontSize:'0.93rem', color:'var(--text-2)', lineHeight:1.9, marginBottom:8 }}>{art.contenu}</div>

          {art.reel && art.lien && (
            <a href={art.lien} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:'0.82rem', color:'var(--copper)', fontWeight:600, textDecoration:'none', marginBottom:20 }}>
              Lire l'article complet sur {art.source}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          )}
          {!art.reel && <div style={{ marginBottom:20 }} />}

          {/* Quiz */}
          {!quiz ? (
            <div style={{ background:'var(--copper-bg)', border:'1.5px solid var(--border)', borderRadius:'var(--rs)', padding:16, textAlign:'center' }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:5 }}>Quiz lié à cet article</div>
              <div style={{ fontSize:'0.82rem', color:'var(--muted)', marginBottom:12 }}>
                <strong style={{ color:'var(--copper)' }}>+{art.inGain} IN</strong> si tu valides{art.quiz ? ` · ${art.quiz.length} questions` : ' · questions générées pour cet article'}
              </div>
              <button onClick={() => lancerQuiz(art)} className="btn btn-primary" disabled={chargementQuiz} style={{ opacity: chargementQuiz ? 0.7 : 1 }}>
                {chargementQuiz ? 'Génération du quiz…' : 'Faire le quiz →'}
              </button>
            </div>
          ) : quiz.phase === 'quiz' ? (
            <div className="card quiz-zone">
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:'0.78rem', color:'var(--muted)' }}>Question {quiz.step+1}/{quiz.questions.length}</span>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--copper)' }}>Score : {quiz.score}</span>
              </div>
              <div style={{ height:4, background:'var(--bg3)', borderRadius:100, overflow:'hidden', marginBottom:14 }}>
                <div style={{ height:'100%', width:`${(quiz.step/quiz.questions.length)*100}%`, background:'var(--copper)', borderRadius:100 }}/>
              </div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.05rem', fontWeight:700, color:'var(--text)', marginBottom:14 }}>
                {quiz.questions[quiz.step].q}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {quiz.questions[quiz.step].opts.map((opt, i) => {
                  const q = quiz.questions[quiz.step];
                  let cls = 'quiz-opt';
                  if (quiz.answered) { if (i===q.correct) cls='quiz-opt correct'; else if (i===quiz.selected) cls='quiz-opt wrong'; }
                  return (
                    <button key={i} className={cls} onClick={() => repondre(i)} disabled={quiz.answered}>
                      <span style={{ width:24, height:24, borderRadius:'50%', background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, flexShrink:0 }}>{LETTERS[i]}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {quiz.answered && (
                <div style={{ marginTop:10, padding:'10px 14px', borderRadius:'var(--rs)', borderLeft:'3px solid', fontSize:'0.86rem',
                  ...(quiz.selected===quiz.questions[quiz.step].correct
                    ? { borderLeftColor:'var(--success)', background:'rgba(5,150,105,0.08)', color:'var(--success)' }
                    : { borderLeftColor:'var(--danger)', background:'rgba(220,38,38,0.08)', color:'var(--danger)' })
                }}>
                  <strong>{quiz.selected===quiz.questions[quiz.step].correct?'Correct !':'Incorrect.'}</strong>{' '}{quiz.questions[quiz.step].exp}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding:'28px 20px' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:10 }}>{quiz.score >= quiz.questions.length*POINTS.quiz_actualite*0.6 ? '🏆' : '💪'}</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.3rem', fontWeight:700, marginBottom:5 }}>{quiz.score} pts</div>
              <div style={{ fontSize:'0.84rem', color:'var(--muted)', marginBottom:18 }}>
                {quiz.score >= quiz.questions.length*POINTS.quiz_actualite*0.6 ? 'Bien joué ! Tu as bien lu l\'article.' : 'Relis l\'article et réessaie !'}
              </div>
              <div style={{ display:'flex', gap:9, justifyContent:'center' }}>
                <button onClick={() => setQuiz(null)} className="btn btn-ghost btn-sm">Fermer</button>
                <button onClick={() => { setOuvert(null); setQuiz(null); }} className="btn btn-primary btn-sm">Retour aux actus →</button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Actualité économique">
      <div style={{ background:'var(--dark)', borderRadius:12, padding:'16px 20px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'#FDFCF8', marginBottom:3 }}>Actualité économique</div>
          <div style={{ fontSize:'0.78rem', color:'rgba(253,252,248,0.55)' }}>Lire → +5 IN · Quiz → jusqu'à +20 IN</div>
        </div>
        <span style={{ fontSize:'0.72rem', fontWeight:700, background:'var(--copper-bg)', color:'#D97732', padding:'3px 10px', borderRadius:100 }}>{nonLus} non lus</span>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:18 }}>
        {[['tout','Tout'],['pure','Actualités'],['liee','Liées aux cours']].map(([f,l]) => (
          <button key={f} onClick={() => setFiltre(f)} className={filtre===f?'btn btn-primary btn-sm':'btn btn-ghost btn-sm'}>{l}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {filtered.map(a => (
          <div key={a.id} className="card" style={{ cursor:'pointer', transition:'all .2s', borderColor: !a.lu?'var(--copper)':'var(--border-lt)', borderWidth: !a.lu?2:1.5 }}
            onClick={() => ouvrirArticle(a.id)}
            onMouseOver={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(196,98,26,0.12)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow='none'; }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {!a.lu && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--copper)', flexShrink:0 }}/>}
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.62rem', textTransform:'uppercase', color:'var(--muted)' }}>{a.source}</span>
              </div>
              <span style={{ fontSize:'0.7rem', color:'var(--muted)' }}>{a.date}</span>
            </div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:6, lineHeight:1.3 }}>{a.titre}</div>
            <div style={{ fontSize:'0.79rem', color:'var(--muted)', marginBottom:10, lineHeight:1.55 }}>{a.extrait.substring(0,90)}…</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
              {a.tags.map(t => <span key={t} style={{ fontSize:'0.68rem', background:'var(--bg2)', color:'var(--muted)', padding:'2px 7px', borderRadius:100 }}>{t}</span>)}
              {a.type==='liee' && <span style={{ fontSize:'0.68rem', background:'var(--copper-bg)', color:'var(--copper)', padding:'2px 7px', borderRadius:100, fontWeight:700 }}>Cours lié</span>}
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid var(--border-lt)', paddingTop:8 }}>
              <span style={{ fontSize:'0.75rem', color:'var(--copper)', fontWeight:700 }}>+{a.inGain} IN si quiz validé</span>
              <span style={{ fontSize:'0.78rem', color:'var(--muted)' }}>{a.lu ? 'Lu ✓' : 'Lire →'}</span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
