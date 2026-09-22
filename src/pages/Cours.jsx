import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import QuizModal from '../components/quiz/QuizModal';
import { peutVoirCours, MATIERES, PLAN_LABELS, getNiveauIndex, estCoursApercuGratuit, estPlanPayant } from '../data/constants';
import { COURS_CATALOGUE } from '../data/coursCatalogue';
import { IMAGES_COURS } from '../data/imagesCours';

/* ─── Composant rendu Markdown simplifié ─── */
function MarkdownContent({ text, noTranslate = false }) {
  const lines = text.split('\n');
  return (
    /* translate="no" : indispensable pour les cours d'anglais et d'espagnol —
       sans cela, le navigateur traduit les exemples et les règles de grammaire
       en français, ce qui détruit complètement la leçon. */
    <div translate={noTranslate ? 'no' : undefined} className={noTranslate ? 'notranslate' : undefined}
      style={{ fontSize:'0.9rem', color:'var(--text-2)', lineHeight:1.85 }}>
      {lines.map((line, i) => {
        /* Image : ![légende](cle_image) — la clé pointe vers IMAGES_COURS */
        const imgMatch = line.match(/^!\[(.*)\]\((.*)\)$/);
        if (imgMatch) {
          const [, legende, cle] = imgMatch;
          const src = IMAGES_COURS[cle];
          if (!src) return null;
          return (
            <figure key={i} style={{ margin:'16px 0', textAlign:'center' }}>
              <img src={src} alt={legende} style={{ maxWidth:'100%', borderRadius:12, border:'1px solid var(--border-lt)', boxShadow:'var(--card-shadow)' }}/>
              {legende && <figcaption style={{ fontSize:'0.78rem', color:'var(--muted)', marginTop:8, fontStyle:'italic' }}>{legende}</figcaption>}
            </figure>
          );
        }
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return <div key={i} style={{ fontWeight:700, color:'var(--text)', marginTop:14, marginBottom:4 }}>{line.replace(/\*\*/g,'')}</div>;
        }
        if (line.startsWith('• ')) {
          return <div key={i} style={{ display:'flex', gap:8, marginBottom:4, paddingLeft:8 }}><span style={{ color:'var(--copper)', flexShrink:0, marginTop:2 }}>•</span><span>{line.slice(2)}</span></div>;
        }
        if (line.trim() === '') return <div key={i} style={{ height:6 }}/>;
        return <div key={i} style={{ marginBottom:2 }}>{line}</div>;
      })}
    </div>
  );
}

export default function Cours() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch]         = useState('');
  const [filtreNiveau, setFiltreNiv]= useState('tout');
  const [filtreMat, setFiltreMat]   = useState('tout');
  const [coursOuvert, setCoursOuvert] = useState(null);
  const [chapActif, setChapActif]   = useState(0);
  const [quizOpen, setQuizOpen]     = useState(false);
  const [tdVisible, setTdVisible]   = useState(false);
  const [corrVisible, setCorrVisible]= useState(false);

  if (!user) return null;

  const userNiveau = user.niveau?.startsWith('universite') ? 'universite' : (user.niveau || 'terminale');

  /* Filtrer selon accès niveau */
  const coursVisibles = COURS_CATALOGUE.filter(c => peutVoirCours(userNiveau, c.niveau));

  /* Filtrer selon recherche et filtres */
  const coursFiltres = coursVisibles.filter(c => {
    const mat = MATIERES[c.mat];
    const okSearch = !search || c.titre.toLowerCase().includes(search.toLowerCase()) || mat?.label?.toLowerCase().includes(search.toLowerCase());
    const okNiveau = filtreNiveau === 'tout' || c.niveau === filtreNiveau;
    const okMat    = filtreMat === 'tout' || c.mat === filtreMat;
    return okSearch && okNiveau && okMat;
  });

  const hasAcces = (acces) => {
    const planOrder = { gratuit:0, standard:1, medium:2, premium:3, pro:1, elite:2 };
    return (planOrder[user.plan] || 0) >= (planOrder[acces] || 0);
  };

  const estDebloque = (coursId) => (user.contenuDebloque || []).includes(coursId);

  /* ── Compte gratuit : aperçu limité ──
     Un élève sans abonnement peut ouvrir la 1re leçon d'Économie et de
     Comptabilité, mais uniquement son 1er chapitre, et sans TD ni quiz.
     Les étudiants d'université ne bénéficient pas de cet aperçu. */
  const estCompteGratuit = !estPlanPayant(user.plan);
  const estLyceen = !user.niveau?.startsWith('universite');
  const aDroitApercu = (cours) =>
    estCompteGratuit && estLyceen && estCoursApercuGratuit(cours, COURS_CATALOGUE);

  const handleQuizEnd = (score, pct) => {
    const gain = Math.round(score / 2);
    const bonusIN = pct >= 95 ? 5 : 0;
    updateUser({ IN:(user.IN||0)+gain+bonusIN, points:(user.points||0)+score });
    toast(`Quiz terminé ! +${gain} IN${bonusIN ? ` +${bonusIN} IN bonus (≥95%)` : ''}`, 'success', 4000);
    setQuizOpen(false);
  };

  /* ── Vue cours ouvert ── */
  if (coursOuvert) {
    const c = COURS_CATALOGUE.find(x => x.id === coursOuvert);
    if (!c) { setCoursOuvert(null); return null; }
    const mat = MATIERES[c.mat] || { label:c.mat, color:'var(--copper)', bg:'var(--copper-bg)' };
    const chap = c.chapitres[chapActif];
    /* Mode aperçu : compte gratuit → 1er chapitre seulement, pas de TD ni quiz */
    const modeApercu = aDroitApercu(c) && !estDebloque(c.id);
    /* Les cours de langue ne doivent jamais être traduits par le navigateur :
       les exemples et règles de grammaire perdraient tout leur sens. */
    const estCoursDeLangue = c.mat === 'anglais' || c.mat === 'espagnol';
    const isLast = chapActif === c.chapitres.length - 1;

    return (
      <Layout title={c.titre}>
        <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:20, alignItems:'start' }}>

          {/* ── Sidebar chapitres ── */}
          <div className="card" style={{ padding:0, overflow:'hidden', position:'sticky', top:80 }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border-lt)', background:'var(--bg2)' }}>
              <div style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)' }}>Chapitres</div>
            </div>
            {c.chapitres.map((ch, i) => {
              const done = i < chapActif;
              const active = i === chapActif;
              const verrouApercu = modeApercu && i > 0;
              return (
                <div key={i}
                  onClick={() => !verrouApercu && i <= chapActif && setChapActif(i)}
                  style={{ padding:'11px 16px', borderBottom:'1px solid var(--border-lt)', display:'flex', alignItems:'center', gap:10, cursor: (!verrouApercu && i <= chapActif) ? 'pointer' : 'default', background: active ? 'var(--copper-bg)' : 'var(--card-bg)', transition:'background .2s', opacity: (verrouApercu || i > chapActif) ? 0.45 : 1 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: done ? 'var(--success)' : active ? 'var(--copper)' : 'var(--bg2)', border: !done && !active ? '1.5px solid var(--border)' : 'none' }}>
                    {done ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <span style={{ fontSize:'0.7rem', fontWeight:700, color: active ? '#fff' : 'var(--muted)' }}>{i+1}</span>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.8rem', fontWeight: active ? 700 : 500, color: active ? 'var(--copper)' : 'var(--text-2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ch.titre.split('—')[0].trim()}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginTop:1 }}>{ch.duree}</div>
                  </div>
                </div>
              );
            })}
            {/* Quiz + TD — ou invitation à s'abonner en mode aperçu */}
            <div style={{ padding:12, borderTop:'1px solid var(--border-lt)', display:'flex', flexDirection:'column', gap:7 }}>
              {modeApercu ? (
                <>
                  <div style={{ fontSize:'0.76rem', color:'var(--text-3)', lineHeight:1.6, marginBottom:4 }}>
                    Tu lis un aperçu gratuit : seul le 1<sup>er</sup> chapitre est ouvert. Le reste de la leçon, son TD et le quiz nécessitent un abonnement.
                  </div>
                  <button onClick={() => navigate('/abonnement')} className="btn btn-primary btn-sm" style={{ justifyContent:'center', width:'100%' }}>
                    Voir les abonnements →
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setQuizOpen(true)} className="btn btn-primary btn-sm" style={{ justifyContent:'center', width:'100%', opacity: chapActif < c.chapitres.length - 1 ? 0.5 : 1 }} disabled={chapActif < c.chapitres.length - 1}>
                    Quiz de validation
                  </button>
                  <button onClick={() => setTdVisible(v => !v)} className="btn btn-ghost btn-sm" style={{ justifyContent:'center', width:'100%' }}>
                    {tdVisible ? 'Masquer TD' : 'Voir TD'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Contenu principal ── */}
          <div>
            <button onClick={() => { setCoursOuvert(null); setChapActif(0); setTdVisible(false); setCorrVisible(false); }} className="btn btn-ghost btn-sm" style={{ marginBottom:18 }}>
              ← Retour aux cours
            </button>

            {/* En-tête cours */}
            <div style={{ marginBottom:22 }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10, alignItems:'center' }}>
                <span style={{ fontSize:'0.72rem', fontWeight:700, background:mat.bg, color:mat.color, padding:'3px 10px', borderRadius:100 }}>{mat.label}</span>
                {c.rubrique && (
                  <span style={{ fontSize:'0.72rem', fontWeight:600, background:'transparent', color:mat.color, border:`1px solid ${mat.color}40`, padding:'2px 9px', borderRadius:100 }}>{c.rubrique}</span>
                )}
                <span style={{ fontSize:'0.72rem', color:'var(--muted)', background:'var(--bg2)', padding:'3px 10px', borderRadius:100 }}>⏱ {c.duree}</span>
                <span style={{ fontSize:'0.72rem', color:'var(--copper)', background:'var(--copper-bg)', padding:'3px 10px', borderRadius:100, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>+{c.pts} pts</span>
                <span style={{ fontSize:'0.72rem', color:'var(--muted)', background:'var(--bg2)', padding:'3px 10px', borderRadius:100, textTransform:'capitalize' }}>{c.niveau}</span>
              </div>
              <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.7rem', fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1.2 }}>{c.titre}</h1>
            </div>

            {/* Carte chapitre actif */}
            <div className="card" style={{ marginBottom:18, borderColor: mat.color+'30', borderWidth:1.5 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:'0.68rem', fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)', marginBottom:5 }}>
                    Chapitre {chapActif+1} / {c.chapitres.length} · {chap.duree}
                  </div>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.15rem', fontWeight:700, color:'var(--text)' }}>{chap.titre}</div>
                </div>
              </div>
              <div style={{ height:1, background:'var(--border-lt)', marginBottom:18 }}/>
              <MarkdownContent text={chap.contenu} noTranslate={estCoursDeLangue} />
            </div>

            {/* Navigation chapitres */}
            <div style={{ display:'flex', gap:10, marginBottom:18 }}>
              {chapActif > 0 && (
                <button onClick={() => setChapActif(v => v-1)} className="btn btn-ghost btn-sm">
                  ← Chapitre précédent
                </button>
              )}
              {modeApercu ? (
                <button onClick={() => navigate('/abonnement')} className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }}>
                  Débloquer la suite de la leçon →
                </button>
              ) : !isLast ? (
                <button onClick={() => setChapActif(v => v+1)} className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }}>
                  Chapitre suivant →
                </button>
              ) : (
                <button onClick={() => setQuizOpen(true)} className="btn btn-primary" style={{ marginLeft:'auto' }}>
                  Valider avec le quiz →
                </button>
              )}
            </div>

            {/* TD */}
            {tdVisible && (
              <div className="card" style={{ marginBottom:18 }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:14 }}>
                  Travaux Dirigés (TD)
                </div>
                <MarkdownContent text={c.td.split('**Correction')[0].trim()} noTranslate={estCoursDeLangue} />
                <div style={{ marginTop:16 }}>
                  <button onClick={() => setCorrVisible(v => !v)} style={{ padding:'10px 16px', borderRadius:10, border:'1.5px solid rgba(22,163,74,0.2)', background:'rgba(22,163,74,0.05)', color:'var(--success)', fontWeight:600, fontSize:'0.85rem', cursor:'pointer', width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points={corrVisible?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
                    {corrVisible ? 'Masquer la correction' : 'Voir la correction'}
                  </button>
                  {corrVisible && (
                    <div style={{ padding:'16px', marginTop:0, border:'1.5px solid rgba(22,163,74,0.15)', borderTop:'none', borderRadius:'0 0 10px 10px', background:'rgba(22,163,74,0.02)' }}>
                      <MarkdownContent text={'**Correction\n' + c.td.split('**Correction')[1]} noTranslate={estCoursDeLangue} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info quiz */}
            <div style={{ background:'rgba(217,119,6,0.06)', border:'1.5px solid rgba(217,119,6,0.15)', borderRadius:12, padding:'12px 16px', fontSize:'0.82rem', color:'var(--text-2)', display:'flex', alignItems:'center', gap:10 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Score ≥ 50% requis pour valider ce cours · Score ≥ 95% : +5 IN bonus
            </div>
          </div>
        </div>

        {quizOpen && (
          <QuizModal matiere={c.quiz_mat} nbQuestions={10}
            titre={`Quiz — ${c.titre}`}
            onClose={() => setQuizOpen(false)}
            onEnd={handleQuizEnd}
            pointsType="quiz_cours"
          />
        )}
      </Layout>
    );
  }

  /* ── Vue liste des cours ── */
  const NIVEAUX_DISPO = ['seconde','premiere','terminale','universite'].filter(n => peutVoirCours(userNiveau, n));

  /* Matières proposées dans les filtres : uniquement celles qui ont au
     moins un cours visible pour ce niveau (évite d'afficher un filtre
     "Microéconomie" à un lycéen, ou d'oublier une matière ajoutée plus tard). */
  const matieresDisponibles = [...new Set(coursVisibles.map(c => c.mat))]
    .sort((a,b) => (MATIERES[a]?.label||a).localeCompare(MATIERES[b]?.label||b));

  return (
    <Layout title="Mes cours">

      {/* Barre de recherche */}
      <div style={{ position:'relative', marginBottom:20 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" width="15" height="15" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un cours, une matière…" style={{ paddingLeft:40 }}/>
      </div>

      {/* Filtres niveau + matière */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <button onClick={() => setFiltreNiv('tout')} className={filtreNiveau==='tout'?'btn btn-primary btn-sm':'btn btn-ghost btn-sm'}>Tous niveaux</button>
        {NIVEAUX_DISPO.map(n => (
          <button key={n} onClick={() => setFiltreNiv(n)} className={filtreNiveau===n?'btn btn-primary btn-sm':'btn btn-ghost btn-sm'} style={{ textTransform:'capitalize' }}>
            {n === 'universite' ? 'Université' : n === 'premiere' ? '1ère' : n === 'seconde' ? '2nde' : 'Terminale'}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        <button onClick={() => setFiltreMat('tout')} className={filtreMat==='tout'?'btn btn-primary btn-sm':'btn btn-ghost btn-sm'}>Toutes matières</button>
        {matieresDisponibles.map(m => (
          <button key={m} onClick={() => setFiltreMat(m)} className={filtreMat===m?'btn btn-primary btn-sm':'btn btn-ghost btn-sm'}>
            {MATIERES[m]?.label}
          </button>
        ))}
      </div>

      {/* Info accès */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border-lt)', borderRadius:10, padding:'10px 16px', marginBottom:22, fontSize:'0.82rem', color:'var(--text-3)', display:'flex', gap:10, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="2" width="14" height="14" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>
            {userNiveau === 'seconde' && 'Tu as accès aux cours de 2nde.'}
            {userNiveau === 'premiere' && 'Tu as accès aux cours de 2nde et 1ère.'}
            {userNiveau === 'terminale' && 'Tu as accès aux cours de 2nde, 1ère et Terminale.'}
            {userNiveau === 'universite' && 'Tu as accès à tous les cours (2nde → Terminale + Université).'}
            {' '}Débloque un cours + son TD avec tes Insights Normaux (IN).
          </span>
        </div>
        <button onClick={() => navigate('/choisir-contenu')} className="btn btn-ghost btn-sm">Débloquer plus de cours →</button>
      </div>

      {/* Grille cours */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {coursFiltres.map(c => {
          const mat = MATIERES[c.mat] || { label:c.mat, color:'var(--copper)', bg:'var(--copper-bg)' };
          const apercu = aDroitApercu(c);
          const ok  = (hasAcces(c.acces) && estDebloque(c.id)) || apercu;
          const niveauLabel = { seconde:'2nde', premiere:'1ère', terminale:'Terminale', universite:'Université' }[c.niveau] || c.niveau;
          return (
            <div key={c.id} className="card"
              style={{ display:'flex', flexDirection:'column', cursor: ok ? 'pointer' : 'default', transition:'all .2s', opacity: ok ? 1 : 0.65 }}
              onClick={() => ok && (setCoursOuvert(c.id), setChapActif(0), setTdVisible(false), setCorrVisible(false))}
              onMouseOver={e => { if(ok){ e.currentTarget.style.borderColor=mat.color; e.currentTarget.style.boxShadow=`0 4px 20px ${mat.color}18`; }}}
              onMouseOut={e => { e.currentTarget.style.borderColor='var(--border-lt)'; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, background:mat.bg, color:mat.color, padding:'2px 9px', borderRadius:100 }}>{mat.label}</span>
                  <span style={{ fontSize:'0.7rem', fontWeight:600, background:'var(--bg2)', color:'var(--muted)', padding:'2px 9px', borderRadius:100 }}>{niveauLabel}</span>
                  {c.rubrique && (
                    <span style={{ fontSize:'0.7rem', fontWeight:600, background:'transparent', color:mat.color, border:`1px solid ${mat.color}40`, padding:'1px 8px', borderRadius:100 }}>{c.rubrique}</span>
                  )}
                </div>
                {apercu && (
                  <span style={{ fontSize:'0.66rem', fontWeight:700, background:'rgba(22,163,74,0.12)', color:'var(--success)', padding:'2px 9px', borderRadius:100, whiteSpace:'nowrap' }}>
                    Aperçu gratuit
                  </span>
                )}
                {!ok && (
                  <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.68rem', color:'var(--muted)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    {hasAcces(c.acces) ? 'Non débloqué' : PLAN_LABELS[c.acces]}
                  </div>
                )}
              </div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.05rem', fontWeight:700, color:'var(--text)', marginBottom:5, flex:1 }}>{c.titre}</div>
              <div style={{ display:'flex', gap:10, fontSize:'0.75rem', color:'var(--muted)', marginBottom:14 }}>
                <span>⏱ {c.duree}</span>
                <span>·</span>
                <span>{c.chapitres.length} chapitres</span>
                <span>·</span>
                <span style={{ color:'var(--copper)', fontFamily:"'Space Mono',monospace", fontWeight:700 }}>+{c.pts} pts</span>
              </div>
              <div style={{ borderTop:'1px solid var(--border-lt)', paddingTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                {ok ? (
                  <span style={{ fontSize:'0.8rem', color:mat.color, fontWeight:600 }}>Commencer →</span>
                ) : hasAcces(c.acces) ? (
                  <span style={{ fontSize:'0.78rem', color:'var(--muted)' }}>À choisir dans « Sélection de contenu »</span>
                ) : (
                  <span style={{ fontSize:'0.78rem', color:'var(--muted)' }}>Plan {PLAN_LABELS[c.acces]} requis</span>
                )}
                <div style={{ display:'flex', gap:4 }}>
                  {c.chapitres.map((_,i) => (
                    <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:i===0?mat.color:'var(--bg3)' }}/>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {coursFiltres.length === 0 && (
        <div style={{ textAlign:'center', padding:'48px 0', color:'var(--muted)' }}>
          <div style={{ fontSize:'2rem', marginBottom:10 }}>📚</div>
          <div style={{ fontSize:'0.9rem' }}>Aucun cours trouvé{search ? ` pour "${search}"` : ''}.</div>
        </div>
      )}
    </Layout>
  );
}
