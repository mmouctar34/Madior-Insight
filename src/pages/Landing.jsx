import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RANGS } from '../data/constants';
import ThemeToggle from '../components/ui/ThemeToggle';
import Logo from '../components/ui/Logo';

const LB_DATA = {
  terminale:[
    {pos:1,init:'A',nom:'Aminata Diallo',  rang:'Titan',      pts:42800,col:'#C4621A'},
    {pos:2,init:'M',nom:'Moussa Koné',     rang:'Titan',      pts:39100,col:'#1D3557'},
    {pos:3,init:'M',nom:'Moustapha A.',    rang:'Mastermind', pts:28450,col:'#C4621A'},
    {pos:4,init:'F',nom:'Fatou Ndiaye',    rang:'Mastermind', pts:25320,col:'#7C3AED'},
    {pos:5,init:'O',nom:'Omar Ba',         rang:'Vanguard',   pts:19800,col:'#059669'},
    {pos:6,init:'R',nom:'Rokhaya Seck',    rang:'Vanguard',   pts:17650,col:'#DC2626'},
    {pos:7,init:'C',nom:'Cheikh Diop',     rang:'Pro-Mind',   pts:14200,col:'#0284C7'},
    {pos:8,init:'N',nom:'Ndéye Fall',      rang:'Pro-Mind',   pts:11800,col:'#92400E'},
    {pos:9,init:'I',nom:'Ibrahima Sarr',   rang:'Pro-Mind',   pts:9600, col:'#065F46'},
    {pos:10,init:'A',nom:'Awa Traoré',     rang:'Rising Star',pts:7200, col:'#9D174D'},
  ],
  premiere:[
    {pos:1,init:'C',nom:'Cheikh Diop',     rang:'Titan',      pts:38900,col:'#C4621A'},
    {pos:2,init:'N',nom:'Ndéye Fall',      rang:'Mastermind', pts:29400,col:'#1D3557'},
    {pos:3,init:'I',nom:'Ibrahima Sarr',   rang:'Mastermind', pts:24300,col:'#7C3AED'},
    {pos:4,init:'A',nom:'Aissatou Bah',    rang:'Vanguard',   pts:18600,col:'#059669'},
    {pos:5,init:'S',nom:'Samba Diallo',    rang:'Vanguard',   pts:15800,col:'#DC2626'},
  ],
  seconde:[
    {pos:1,init:'K',nom:'Khady Mbaye',     rang:'Mastermind', pts:24800,col:'#C4621A'},
    {pos:2,init:'P',nom:'Papa Diallo',     rang:'Vanguard',   pts:18600,col:'#1D3557'},
    {pos:3,init:'S',nom:'Sokhna Gueye',    rang:'Vanguard',   pts:16400,col:'#7C3AED'},
    {pos:4,init:'Y',nom:'Yaye Ndoye',      rang:'Pro-Mind',   pts:12200,col:'#059669'},
    {pos:5,init:'B',nom:'Boubacar Diallo', rang:'Pro-Mind',   pts:9800, col:'#DC2626'},
  ],
  universite:[
    {pos:1,init:'D',nom:'Demba Ndiaye',    rang:'Mythic',     pts:62100,col:'#C4621A'},
    {pos:2,init:'A',nom:'Aïcha Sy',        rang:'Titan',      pts:51800,col:'#1D3557'},
    {pos:3,init:'M',nom:'Malick Diop',     rang:'Titan',      pts:44200,col:'#7C3AED'},
    {pos:4,init:'F',nom:'Fatima Balde',    rang:'Mastermind', pts:31600,col:'#059669'},
    {pos:5,init:'O',nom:'Ousmane Sow',     rang:'Mastermind', pts:28400,col:'#DC2626'},
  ],
};

const MEDALS = {1:'#F59E0B',2:'#9CA3AF',3:'#B45309'};
const AV_COLORS = ['#C4621A','#1D3557','#C4621A','#7C3AED','#059669','#DC2626','#D97706','#0284C7','#9D174D','#065F46'];

const FEATURES = [
  { icon:<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>, titre:'Cours complets', desc:'Cours structurés chapitre par chapitre, adaptés à ton niveau. Contenu progressif et points clés mis en avant.' },
  { icon:<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, titre:'Quiz interactif & aléatoire', desc:'Questions mélangées à chaque passage. Minuteur 20s. Score qui tient compte de la vitesse de réponse. Anti-triche intégré.' },
  { icon:<><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2-2V6"/><line x1="16" y1="8" x2="8" y2="8"/><line x1="16" y1="12" x2="8" y2="12"/></>, titre:'Actualité économique', desc:'Articles liés aux cours avec quiz associés. Chaque article lu rapporte des points. L\'actualité comme outil pédagogique.' },
  { icon:<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>, titre:'Classement en temps réel', desc:'Classement mis à jour en direct. Système de rangs compétitif. Saisons trimestrielles avec récompenses pour le Top 5.' },
  { icon:<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>, titre:'IA Tuteur personnalisé', desc:'Pose tes questions, soumets tes exercices. L\'IA explique les concepts et corrige étape par étape selon ton plan.' },
  { icon:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, titre:'Disponible pour chaque niveau', desc:'2nde, 1ère, Terminale et étudiants. Chaque niveau a son propre contenu adapté au programme officiel sénégalais.' },
];

const MATIERES = [
  {nom:'Comptabilité',  coeff:6, col:'#1D3557'},
  {nom:'Économie',      coeff:6, col:'#C4621A'},
  {nom:'Mathématiques', coeff:4, col:'#7C3AED'},
  {nom:'Anglais',       coeff:2, col:'#0284C7'},
  {nom:'Espagnol',      coeff:2, col:'#DC2626'},
];

const TEMOIGNAGES = [
  { init:'A', nom:'Aminata Diallo', niveau:'Terminale STEG', col:'#C4621A', texte:"Les quiz chronométrés m'ont vraiment poussée à réviser plus sérieusement. Mon classement m'a motivée chaque semaine." },
  { init:'M', nom:'Moussa Koné', niveau:'Première STEG', col:'#1D3557', texte:"L'IA tuteur m'explique la compta étape par étape, comme un prof particulier disponible 24h/24." },
  { init:'K', nom:'Khady Mbaye', niveau:'Seconde', col:'#7C3AED', texte:"J'aime pouvoir voir mes progrès sur le calculateur de moyenne avant même les résultats officiels." },
  { init:'D', nom:'Demba Ndiaye', niveau:'Université', col:'#059669', texte:"Enfin une plateforme adaptée au programme sénégalais, avec des exercices corrigés utiles pour mes partiels." },
];

const POURQUOI = [
  { titre:'Fait par nous, pour nous', desc:"Programme officiel Série STEG et cursus universitaires locaux, pas une adaptation générique." },
  { titre:'Résultats mesurables', desc:"Classement, points, moyenne calculée en direct : tu vois exactement où tu en es." },
  { titre:'IA + accompagnement humain', desc:"Un tuteur IA disponible à tout moment, complété par un vrai suivi pédagogique." },
  { titre:'Accessible à tous', desc:"Des plans adaptés aux lycéens comme aux étudiants, avec des moyens de paiement locaux." },
];

const PLANS_LYCEE = [
  {nom:'Standard', prix:'3 000', features:['20 Insights Normaux','1 Cours + 1 TD au choix','Anglais inclus','2 questions IA/jour','Quiz illimités']},
  {nom:'Medium',   prix:'8 000', features:['120 Insights Normaux','Tous les cours + TD','10 questions IA/jour','Quiz illimités','Exercices corrigés'], featured:true},
  {nom:'Premium',  prix:'30 000',features:['120 IN + 30 Insights Spéciaux','IA illimitée','3 bacs corrigés/mois','2h coaching/semaine','Soutenance disponible']},
];
const PLANS_UNIV = [
  {nom:'Pro',  prix:'—', features:['Insights libres pour vos cours','Quota RAG moyen','Toutes matières + Statistiques']},
  {nom:'Elite',prix:'—', features:['Plus d\'insights inclus','Quota RAG élevé','Accompagnement personnel','Quota heures mensuel'], featured:true},
];

export default function Landing() {
  const navigate = useNavigate();
  const [lbNiveau, setLbNiveau] = useState('terminale');
  const [planTab,  setPlanTab]  = useState('lycee');
  const plans = planTab === 'lycee' ? PLANS_LYCEE : PLANS_UNIV;
  const rows  = LB_DATA[lbNiveau] || [];

  const S = { /* styles partagés */
    section: (bg) => ({ padding:'88px 6%', background: bg || 'var(--card-bg)' }),
    inner:   { maxWidth:1080, margin:'0 auto' },
    label:   { fontSize:'0.72rem', fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--copper)', marginBottom:10, display:'block' },
    h2:      { fontFamily:"'Fredoka',sans-serif", fontSize:'2.2rem', fontWeight:700, color:'var(--text)', lineHeight:1.2, letterSpacing:'-0.02em', marginBottom:14 },
    muted:   { fontSize:'0.95rem', color:'var(--text-3)', lineHeight:1.75, maxWidth:560 },
  };

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:'var(--bg)', color:'var(--text)', lineHeight:1.6 }}>

      {/* ── NAV ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'var(--nav-bg)', backdropFilter:'blur(14px)', borderBottom:'1px solid var(--border-lt)', height:62, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <Logo size={34} rounded={9} />
          <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.15rem', fontWeight:700, color:'var(--text)' }}>Madior <span style={{ color:'var(--copper)' }}>Insight</span></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:26 }}>
          <a href="#apropos" style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-3)', textDecoration:'none', transition:'color .2s' }} onMouseOver={e=>e.target.style.color='var(--copper)'} onMouseOut={e=>e.target.style.color='var(--text-3)'}>À propos</a>
          <a href="#features" style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-3)', textDecoration:'none', transition:'color .2s' }} onMouseOver={e=>e.target.style.color='var(--copper)'} onMouseOut={e=>e.target.style.color='var(--text-3)'}>Fonctionnalités</a>
          <a href="#classement" style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-3)', textDecoration:'none', transition:'color .2s' }} onMouseOver={e=>e.target.style.color='var(--copper)'} onMouseOut={e=>e.target.style.color='var(--text-3)'}>Classement</a>
          <a href="#temoignages" style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-3)', textDecoration:'none', transition:'color .2s' }} onMouseOver={e=>e.target.style.color='var(--copper)'} onMouseOut={e=>e.target.style.color='var(--text-3)'}>Témoignages</a>
          <a href="#video" style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-3)', textDecoration:'none', transition:'color .2s' }} onMouseOver={e=>e.target.style.color='var(--copper)'} onMouseOut={e=>e.target.style.color='var(--text-3)'}>Vidéos</a>
          <a href="#plans" style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-3)', textDecoration:'none', transition:'color .2s' }} onMouseOver={e=>e.target.style.color='var(--copper)'} onMouseOut={e=>e.target.style.color='var(--text-3)'}>Tarifs</a>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <ThemeToggle size={34} />
          <button onClick={() => navigate('/login')} className="btn btn-ghost btn-sm">Se connecter</button>
          <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm">Commencer</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:'100vh', background:'linear-gradient(135deg,var(--dark) 0%,#3D2010 55%,#2C1A0E 100%)', display:'flex', alignItems:'center', padding:'80px 6% 60px' }}>
        <div style={{ maxWidth:1080, margin:'0 auto', width:'100%' }}>
          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(196,98,26,0.18)', border:'1px solid rgba(196,98,26,0.3)', borderRadius:100, padding:'5px 16px', fontSize:'0.78rem', fontWeight:600, color:'#D97732', marginBottom:28, letterSpacing:'0.03em' }}>
            Plateforme e-learning — Sénégal
          </div>

          {/* Titre hero */}
          <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'clamp(2.4rem,5vw,3.8rem)', fontWeight:700, color:'var(--cream)', lineHeight:1.08, marginBottom:12, letterSpacing:'-0.02em', maxWidth:800 }}>
            Réussir ton BAC Série STEG,<br/>
            <span style={{ color:'#D97732' }}>c'est possible.</span>
          </h1>
          <p style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'clamp(1.2rem,2.5vw,1.6rem)', fontWeight:400, color:'rgba(253,252,248,0.6)', marginBottom:36, letterSpacing:'0.01em' }}>
            L'excellence, une habitude.
          </p>

          {/* Features courtes */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:40 }}>
            {['Cours complets','Quiz interactif & aléatoire','Actualité économique','Classement en temps réel'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.83rem', color:'rgba(253,252,248,0.7)', fontWeight:500 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#D97732', flexShrink:0 }}/>
                {f}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:56 }}>
            <button onClick={() => navigate('/login')} className="btn btn-primary btn-lg">Commencer gratuitement →</button>
            <button onClick={() => document.getElementById('classement').scrollIntoView({behavior:'smooth'})} className="btn btn-lg" style={{ background:'rgba(255,255,255,0.08)', color:'rgba(253,252,248,0.85)', borderColor:'rgba(255,255,255,0.15)' }}>
              Voir le classement
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:0, flexWrap:'wrap', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:40 }}>
            {[['247+','Élèves actifs'],['5','Matières enseignées'],['500+','Questions en banque'],['3','Niveaux couverts + Université']].map(([v,l],i) => (
              <div key={i} style={{ flex:'1 1 160px', paddingRight:40, paddingBottom:10 }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'2rem', fontWeight:700, color:'#D97732', lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:'0.78rem', color:'rgba(253,252,248,0.45)', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={S.section('var(--bg2)')}>
        <div style={S.inner}>
          <span style={S.label}>Fonctionnalités</span>
          <h2 style={S.h2}>Tout ce qu'il faut pour réussir</h2>
          <p style={{ ...S.muted, marginBottom:48 }}>Une plateforme pensée pour les élèves en gestion, adaptée à chaque niveau et à chaque matière du programme Série STEG.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
            {FEATURES.map((f,i) => (
              <div key={i} className="card" style={{ padding:24 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'var(--copper-bg)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="1.8" width="21" height="21">{f.icon}</svg>
                </div>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:7 }}>{f.titre}</div>
                <div style={{ fontSize:'0.82rem', color:'var(--text-3)', lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POURQUOI MADIOR INSIGHT (À PROPOS) ── */}
      <section id="apropos" style={S.section('var(--card-bg)')}>
        <div style={S.inner}>
          <span style={S.label}>À propos</span>
          <h2 style={S.h2}>Pourquoi Madior Insight</h2>
          <p style={{ ...S.muted, marginBottom:40 }}>Une plateforme conçue au Sénégal, pour les élèves en gestion, avec un objectif simple : rendre les progrès visibles et concrets.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18 }}>
            {POURQUOI.map((p,i) => (
              <div key={i}>
                <div style={{ width:34, height:2, background:'var(--copper)', marginBottom:14 }}/>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.98rem', fontWeight:700, color:'var(--text)', marginBottom:8 }}>{p.titre}</div>
                <div style={{ fontSize:'0.82rem', color:'var(--text-3)', lineHeight:1.65 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MATIÈRES ── */}
      <section style={S.section('var(--card-bg)')}>
        <div style={S.inner}>
          <span style={S.label}>Matières enseignées</span>
          <h2 style={S.h2}>Les matières disponibles sur la plateforme</h2>
          <p style={{ ...S.muted, marginBottom:36 }}>Cours complets, quiz et exercices pour les 5 matières principales du programme Série STEG.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
            {MATIERES.map(m => (
              <div key={m.nom} className="card" style={{ textAlign:'center', padding:20, cursor:'default', borderColor:`${m.col}20` }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${m.col}10`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={m.col} strokeWidth="1.8" width="18" height="18"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </div>
                <div style={{ fontSize:'0.87rem', fontWeight:700, color:'var(--text)', marginBottom:4 }}>{m.nom}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--muted)', fontFamily:"'Space Mono',monospace" }}>Coeff. {m.coeff}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'var(--bg2)', borderRadius:12, padding:'14px 18px', fontSize:'0.83rem', color:'var(--text-3)', lineHeight:1.6, display:'flex', alignItems:'flex-start', gap:10 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="2" width="15" height="15" style={{ flexShrink:0, marginTop:2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>Les étudiants universitaires ont également accès à <strong style={{ color:'var(--text)' }}>Statistiques</strong> et <strong style={{ color:'var(--text)' }}>Microéconomie</strong> comme matières dédiées — en plus de toutes les autres matières du site. Le calculateur de moyenne inclut toutes les matières du programme (EPS, Droit, Management, etc.).</span>
          </div>
        </div>
      </section>

      {/* ── CLASSEMENT PUBLIC ── */}
      <section id="classement" style={S.section('var(--bg2)')}>
        <div style={S.inner}>
          <span style={S.label}>Classement en direct</span>
          <h2 style={S.h2}>Top 20 — Visible par tous</h2>
          <p style={{ ...S.muted, marginBottom:32 }}>Le classement est public. Inscris-toi pour y figurer et te battre pour le podium chaque trimestre.</p>

          {/* Filtres niveau */}
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {[['terminale','Terminale'],['premiere','Première'],['seconde','Seconde'],['universite','Université']].map(([n,l]) => (
              <button key={n} onClick={() => setLbNiveau(n)} className={lbNiveau===n?'btn btn-primary btn-sm':'btn btn-ghost btn-sm'}>{l}</button>
            ))}
          </div>

          <div style={{ background:'var(--card-bg)', borderRadius:16, overflow:'hidden', boxShadow:'var(--card-shadow)', border:'1px solid var(--border-lt)' }}>
            <div style={{ background:'var(--dark)', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'var(--cream)' }}>
                Classement — {({terminale:'Terminale',premiere:'Première',seconde:'Seconde',universite:'Université'}[lbNiveau])}
              </span>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.74rem', color:'rgba(253,252,248,0.45)' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--success)', animation:'pulse 2s infinite' }}/>
                En direct
              </div>
            </div>
            {rows.slice(0,10).map((r,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 20px', borderBottom:'1px solid var(--border-lt)', background:'var(--card-bg)', transition:'background .2s' }}
                onMouseOver={e => e.currentTarget.style.background='var(--bg2)'}
                onMouseOut={e => e.currentTarget.style.background='var(--card-bg)'}
              >
                <div style={{ width:28, textAlign:'center', fontFamily:"'Space Mono',monospace", fontSize:'0.8rem', fontWeight:700, color:MEDALS[r.pos]||'var(--muted)', flexShrink:0 }}>{r.pos}</div>
                <div style={{ width:34, height:34, borderRadius:'50%', background:AV_COLORS[i%AV_COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'#fff', fontSize:'0.85rem', flexShrink:0 }}>{r.init}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text)' }}>{r.nom}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:2 }}>{r.rang}</div>
                </div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.84rem', fontWeight:700, color:'var(--copper)' }}>{r.pts.toLocaleString('fr-SN')} pts</div>
              </div>
            ))}
            <div style={{ padding:'14px 20px', textAlign:'center', background:'var(--bg2)' }}>
              <button onClick={() => navigate('/login')} style={{ fontSize:'0.84rem', color:'var(--copper)', fontWeight:600, border:'none', background:'none', cursor:'pointer' }}>Rejoindre le classement →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDÉO YOUTUBE ── */}
      <section id="video" style={S.section('var(--card-bg)')}>
        <div style={S.inner}>
          <span style={S.label}>Chaîne YouTube</span>
          <h2 style={S.h2}>Découvre Madior Insight en vidéo</h2>
          <p style={{ ...S.muted, marginBottom:32 }}>Présentation de la plateforme, cours filmés et conseils de révision sur notre chaîne YouTube.</p>
          <a href="https://www.youtube.com/@MadiorInsight" target="_blank" rel="noopener noreferrer"
            style={{
              maxWidth:800, margin:'0 auto', borderRadius:16, overflow:'hidden',
              boxShadow:'0 8px 32px rgba(44,26,14,0.14)', border:'1px solid var(--border-lt)',
              aspectRatio:'16/9', background:'linear-gradient(135deg,var(--dark) 0%,#3D2010 100%)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              textDecoration:'none', gap:16, transition:'transform .2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform='scale(1.01)'}
            onMouseOut={e => e.currentTarget.style.transform='scale(1)'}
          >
            <div style={{ width:76, height:76, borderRadius:'50%', background:'#FF0000', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(255,0,0,0.35)' }}>
              <svg viewBox="0 0 24 24" fill="#fff" width="34" height="34"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.15rem', fontWeight:700, color:'var(--cream)', marginBottom:4 }}>
                @MadiorInsight sur YouTube
              </div>
              <div style={{ fontSize:'0.85rem', color:'rgba(253,252,248,0.6)' }}>
                Cliquer pour voir toutes nos vidéos →
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section id="temoignages" style={S.section('var(--bg2)')}>
        <div style={S.inner}>
          <span style={S.label}>Témoignages</span>
          <h2 style={S.h2}>Ce que disent les élèves</h2>
          <p style={{ ...S.muted, marginBottom:36 }}>Des retours d'élèves et d'étudiants qui utilisent la plateforme au quotidien.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {TEMOIGNAGES.map((t,i) => (
              <div key={i} className="card" style={{ padding:20, display:'flex', flexDirection:'column' }}>
                <svg viewBox="0 0 24 24" fill="var(--copper-bg)" width="26" height="26" style={{ marginBottom:12 }}><path d="M7 7h4v6a4 4 0 0 1-4 4H6v-2h1a2 2 0 0 0 2-2V9H7V7zm8 0h4v6a4 4 0 0 1-4 4h-1v-2h1a2 2 0 0 0 2-2V9h-2V7z"/></svg>
                <p style={{ fontSize:'0.83rem', color:'var(--text-2)', lineHeight:1.6, flex:1, marginBottom:16 }}>{t.texte}</p>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:t.col, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'#fff', fontSize:'0.8rem', flexShrink:0 }}>{t.init}</div>
                  <div>
                    <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text)' }}>{t.nom}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--muted)' }}>{t.niveau}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section id="plans" style={S.section('var(--card-bg)')}>
        <div style={S.inner}>
          <span style={S.label}>Tarifs</span>
          <h2 style={S.h2}>Choisissez votre plan</h2>
          <p style={{ ...S.muted, marginBottom:32 }}>Des offres adaptées aux lycéens Série STEG et aux étudiants universitaires.</p>

          {/* Toggle lycee/univ */}
          <div style={{ display:'flex', background:'var(--bg2)', borderRadius:10, padding:4, width:'fit-content', marginBottom:28, gap:4 }}>
            {[['lycee','Lycée Série STEG'],['univ','Université']].map(([t,l]) => (
              <button key={t} onClick={() => setPlanTab(t)} style={{ padding:'8px 20px', borderRadius:8, fontFamily:"'Inter',sans-serif", fontSize:'0.875rem', fontWeight:600, border:'none', cursor:'pointer', transition:'all .2s', background:planTab===t?'var(--card-bg)':'transparent', color:planTab===t?'var(--copper)':'var(--text-3)', boxShadow:planTab===t?'var(--card-shadow)':'none' }}>{l}</button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:`repeat(${plans.length},1fr)`, gap:18 }}>
            {plans.map(p => (
              <div key={p.nom} className="card" style={{ display:'flex', flexDirection:'column', borderColor:p.featured?'var(--copper)':'var(--border-lt)', borderWidth:p.featured?2:1, boxShadow:p.featured?'0 8px 30px rgba(196,98,26,0.12)':'var(--card-shadow)' }}>
                {p.featured && <div style={{ fontSize:'0.68rem', fontWeight:700, background:'var(--copper-bg)', color:'var(--copper)', padding:'3px 10px', borderRadius:100, display:'inline-block', marginBottom:14, alignSelf:'flex-start', letterSpacing:'0.04em', textTransform:'uppercase' }}>Recommandé</div>}
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.15rem', fontWeight:700, marginBottom:6 }}>{p.nom}</div>
                {p.prix !== '—' ? (
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.6rem', fontWeight:700, color:'var(--copper)', marginBottom:4 }}>
                    {p.prix} <span style={{ fontSize:'0.72rem', fontWeight:400, color:'var(--muted)' }}>FCFA/mois</span>
                  </div>
                ) : (
                  <div style={{ fontSize:'0.85rem', color:'var(--muted)', marginBottom:4 }}>Prix à définir</div>
                )}
                <div style={{ height:1, background:'var(--border-lt)', margin:'16px 0' }}/>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:9, marginBottom:20 }}>
                  {p.features.map((f,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9, fontSize:'0.83rem', color:'var(--text-2)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="14" height="14" style={{ flexShrink:0, marginTop:2 }}><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/login')} className={p.featured?'btn btn-primary':'btn btn-ghost'} style={{ justifyContent:'center', width:'100%' }}>
                  Choisir {p.nom} →
                </button>
              </div>
            ))}
          </div>

          {/* Modes de paiement */}
          <div style={{ marginTop:28, display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:'0.8rem', color:'var(--text-3)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="2" width="15" height="15" style={{ flexShrink:0 }}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              Paiement sécurisé via <strong style={{ color:'var(--text-2)' }}>Wave</strong>.
            </div>
            <div style={{ fontSize:'0.74rem', color:'var(--muted)', paddingLeft:25 }}>
              Orange Money, Free Money et carte bancaire — bientôt disponibles.
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background:'linear-gradient(135deg,var(--dark),#3D2010)', padding:'88px 6%', textAlign:'center' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'clamp(2rem,4vw,2.8rem)', fontWeight:700, color:'var(--cream)', marginBottom:14, lineHeight:1.15, letterSpacing:'-0.02em' }}>
            Rejoins les meilleurs élèves<br/>du Sénégal
          </div>
          <p style={{ fontSize:'0.95rem', color:'rgba(253,252,248,0.55)', marginBottom:36, lineHeight:1.8 }}>Inscription en 2 minutes. Commence dès aujourd'hui.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => navigate('/login')} className="btn btn-primary btn-lg">Créer mon compte</button>
            <button onClick={() => navigate('/login')} className="btn btn-lg" style={{ background:'rgba(255,255,255,0.08)', color:'rgba(253,252,248,0.85)', borderColor:'rgba(255,255,255,0.15)' }}>Se connecter</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'var(--dark)', padding:'32px 6%', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth:1080, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Logo size={36} rounded={9} />
            <div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.1rem', fontWeight:700, color:'var(--cream)' }}>Madior <span style={{ color:'#D97732' }}>Insight</span></div>
              <div style={{ fontSize:'0.76rem', color:'rgba(253,252,248,0.3)', marginTop:4 }}>© 2026 Madior Insight. Tous droits réservés.</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:24 }}>
            {['Conditions d\'utilisation','Confidentialité'].map(l => (
              <span key={l} style={{ fontSize:'0.82rem', color:'rgba(253,252,248,0.4)', cursor:'pointer' }}
                onMouseOver={e=>e.currentTarget.style.color='var(--cream)'} onMouseOut={e=>e.currentTarget.style.color='rgba(253,252,248,0.4)'}>
                {l}
              </span>
            ))}
            <span onClick={() => navigate('/admin')} style={{ fontSize:'0.82rem', color:'rgba(253,252,248,0.4)', cursor:'pointer' }}
              onMouseOver={e=>e.currentTarget.style.color='var(--cream)'} onMouseOut={e=>e.currentTarget.style.color='rgba(253,252,248,0.4)'}>
              Administration
            </span>
          </div>
        </div>
      </footer>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}
