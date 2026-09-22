import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MATIERES } from '../data/constants';
import { COURS_CATALOGUE } from '../data/coursCatalogue';

const EXO_DATA = [
  { id:'e1', matiere:'economie', mat:'Économie', titre:"Calcul de l'élasticité-prix", niveau:'Intermédiaire', acces:'standard', duree:'20 min', pts:50,
    enonce:"Sur le marché du riz à Dakar, le prix passe de 400 à 480 FCFA/kg.\nLa demande passe de 80 000 kg à 72 000 kg.\n\n1. Calculer l'élasticité-prix de la demande.\n2. Interpréter le résultat.\n3. Le producteur qui hausse son prix voit-il ses recettes augmenter ?",
    correction:"1. ΔP = +80 → +20% / ΔQd = −8000 → −10%\n   E = −10%/+20% = −0,5\n\n2. |E|=0,5 < 1 → demande INÉLASTIQUE.\n   Le riz est un aliment de base, peu substituable.\n\n3. Recettes avant : 400×80 000 = 32 000 000 FCFA\n   Recettes après : 480×72 000 = 34 560 000 FCFA\n   → Recettes AUGMENTENT. Règle : si |E|<1, ↑Prix → ↑Recettes."
  },
  { id:'e2', matiere:'economie', mat:'Économie', titre:"Équilibre du marché", niveau:'Débutant', acces:'gratuit', duree:'15 min', pts:30,
    enonce:"Sur le marché de la tomate à Dakar :\nQd = 150 − 3P / Qo = 2P − 25 (P en milliers FCFA)\n\n1. Calculer P* et Q*.\n2. Interpréter.\n3. Prix plafond à 25 000 FCFA : quelle situation ?",
    correction:"1. 150−3P=2P−25 → 175=5P → P*=35\n   Q*=150−105=45 tonnes ✓\n\n2. À 35 000 FCFA, 45 tonnes s'échangent. Ni surplus ni pénurie.\n\n3. Plafond 25 < P* 35 :\n   Qd=75 / Qo=25 → Pénurie = 50 tonnes."
  },
  { id:'e3', matiere:'comptabilite', mat:'Comptabilité', titre:"Journal SYSCOHADA — 5 opérations", niveau:'Débutant', acces:'gratuit', duree:'20 min', pts:40,
    enonce:"Entreprise DIALLO & Fils — Août 2026 :\n05/08 : Achat marchises crédit chez Seck : 650 000 FCFA\n08/08 : Vente marchises crédit à Ndiaye : 900 000 FCFA\n12/08 : Règlement virement à Seck\n15/08 : Encaissement chèque Ndiaye\n20/08 : Paiement salaires virement : 480 000 FCFA\n\nPasser ces opérations au journal SYSCOHADA.",
    correction:"05/08 : 601 Achats | 650 000 / 401 Fourn.Seck | 650 000\n08/08 : 411 Clients Ndiaye | 900 000 / 701 Ventes | 900 000\n12/08 : 401 Fourn.Seck | 650 000 / 521 Banque | 650 000\n15/08 : 521 Banque | 900 000 / 411 Clients Ndiaye | 900 000\n20/08 : 661 Rémunérations | 480 000 / 521 Banque | 480 000\nVérif : Débit=Crédit pour chaque écriture ✓"
  },
  { id:'e4', matiere:'comptabilite', mat:'Comptabilité', titre:"Tableau d'amortissement linéaire", niveau:'Intermédiaire', acces:'standard', duree:'25 min', pts:60,
    enonce:"FALL TECH acquiert le 01/01/2025 un véhicule :\nPrix : 4 800 000 FCFA — Durée : 4 ans — Méthode : linéaire\n\n1. Calculer taux et annuité.\n2. Dresser le tableau complet.\n3. Écriture au 31/12/2025.\n4. VNC au 31/12/2026 ?",
    correction:"1. Taux=25% / Annuité=1 200 000 FCFA\n\n2. 2025: 4 800 000 | 1 200 000 | 1 200 000 | 3 600 000\n   2026: 4 800 000 | 1 200 000 | 2 400 000 | 2 400 000\n   2027: 4 800 000 | 1 200 000 | 3 600 000 | 1 200 000\n   2028: 4 800 000 | 1 200 000 | 4 800 000 | 0\n\n3. 681 Dotations|1 200 000 / 2845 Amort.véhicule|1 200 000\n\n4. VNC=4 800 000−2 400 000=2 400 000 FCFA"
  },
  { id:'e5', matiere:'maths', mat:'Mathématiques', titre:"Intérêts composés — placement", niveau:'Intermédiaire', acces:'standard', duree:'20 min', pts:55,
    enonce:"Mamadou place 2 000 000 FCFA à 7%/an composé.\n[(1,07)⁵=1,4026]\n\n1. Capital après 5 ans.\n2. Intérêts produits.\n3. Comparer avec intérêts simples 5 ans.\n4. Quand dépasse 3 000 000 FCFA ?",
    correction:"1. C₅=2 000 000×1,4026=2 805 200 FCFA\n\n2. I=805 200 FCFA\n\n3. Simples : I=700 000 / Avantage composé : 105 200 FCFA\n\n4. (1,07)⁶=1,5007 → C₆=3 001 400 > 3 000 000 ✓\n   Réponse : au bout de 6 ans."
  },
  { id:'e6', matiere:'maths', mat:'Mathématiques', titre:"Étude de fonction complète", niveau:'Avancé', acces:'medium', duree:'30 min', pts:80,
    enonce:"f(x) = x³ − 6x² + 9x + 1 sur ℝ\n\n1. Calculer f'(x).\n2. Résoudre f'(x)=0.\n3. Dresser le tableau de variations.\n4. Calculer f(1) et f(3).",
    correction:"1. f'(x)=3x²−12x+9\n\n2. 3x²−12x+9=0 → (x−1)(x−3)=0\n   x₁=1 et x₂=3\n\n3. x<1 → + → croissante\n   1<x<3 → − → décroissante\n   x>3 → + → croissante\n\n4. f(1)=1−6+9+1=5 (MAX local)\n   f(3)=27−54+27+1=1 (MIN local)"
  },
];

const MAT_COLORS = { economie:['#C4621A','rgba(196,98,26,0.1)'], comptabilite:['#1D3557','rgba(29,53,87,0.1)'], maths:['#7C3AED','rgba(124,58,237,0.1)'], anglais:['#0284C7','rgba(2,132,199,0.1)'], espagnol:['#DC2626','rgba(220,38,38,0.1)'], statistiques:['#0E7490','rgba(14,116,144,0.1)'], microeconomie:['#B45309','rgba(180,83,9,0.1)'] };
const NIVEAU_COLORS = { Débutant:'var(--success)', Intermédiaire:'var(--warning)', Avancé:'var(--danger)' };

/* Découpe le champ `td` d'un cours (texte brut) en énoncé + correction,
   en cherchant le marqueur "**Correction" (parfois "**Correction :**",
   parfois "**Correction Exercice 1 :**" pour les TD à plusieurs parties). */
function splitTd(texte) {
  const idx = texte.search(/\*\*Correction/);
  if (idx === -1) return { enonce: texte.trim(), correction: '' };
  return { enonce: texte.slice(0, idx).trim(), correction: texte.slice(idx).replace(/\*\*/g,'').trim() };
}

/* Première ligne du TD (souvent "**TD — Titre**") utilisée comme titre affiché. */
function extraireTitreTd(texte, fallback) {
  const m = texte.match(/\*\*(TD[^*]*)\*\*/);
  return m ? m[1].trim() : fallback;
}

/* Construit la liste des TD issus des cours (Cours.jsx), un par cours ayant un champ `td`. */
function getTdDepuisCours() {
  return COURS_CATALOGUE.filter(c => c.td).map(c => {
    const { enonce, correction } = splitTd(c.td);
    return {
      id: `td-${c.id}`,
      coursId: c.id,
      matiere: c.mat,
      mat: MATIERES[c.mat]?.label || c.mat,
      titre: extraireTitreTd(c.td, `TD — ${c.titre}`),
      niveau: 'Intermédiaire',
      duree: '25 min',
      pts: Math.round((c.pts || 100) * 0.4),
      enonce, correction,
      depuisCours: true,
    };
  });
}

export default function Exercices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filtre, setFiltre] = useState('tout');
  const [ouvert, setOuvert] = useState(null);
  const [corrVisible, setCorrVisible] = useState(false);

  /* TD liés aux cours débloqués par l'élève (achetés avec ses IN dans "Sélection de contenu") */
  const tdDebloquesIds = new Set(user?.contenuDebloque || []);
  const tdDeCours = getTdDepuisCours().filter(td => tdDebloquesIds.has(td.coursId));

  const TOUS_LES_ITEMS = [...EXO_DATA, ...tdDeCours];

  const filtered = TOUS_LES_ITEMS.filter(e => filtre === 'tout' || e.matiere === filtre);

  /* Matières proposées dans les filtres : uniquement celles réellement
     présentes parmi les exercices/TD visibles pour cet élève (mêmes
     principes que le filtre matière de la page Cours). */
  const matieresDisponibles = [...new Set(TOUS_LES_ITEMS.map(e => e.matiere))]
    .sort((a,b) => (MATIERES[a]?.label||a).localeCompare(MATIERES[b]?.label||b));

  const ouvrirExo = (id) => { setOuvert(id); setCorrVisible(false); };

  if (ouvert) {
    const e = TOUS_LES_ITEMS.find(x => x.id === ouvert);
    const [col] = MAT_COLORS[e.matiere] || ['var(--copper)'];
    return (
      <Layout title={e.titre}>
        <div style={{ maxWidth:720 }}>
          <button onClick={() => setOuvert(null)} className="btn btn-ghost btn-sm" style={{ marginBottom:16 }}>
            ← Retour aux exercices
          </button>
          <div style={{ fontSize:'0.7rem', fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:'0.1em', color:col, marginBottom:6 }}>{e.mat} · {e.niveau}</div>
          <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.5rem', fontWeight:700, marginBottom:10, lineHeight:1.25 }}>{e.titre}</h1>
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.72rem', fontWeight:700, background:'var(--bg2)', color:'var(--muted)', padding:'3px 10px', borderRadius:100 }}>⏱ {e.duree}</span>
            <span style={{ fontSize:'0.72rem', fontWeight:700, background:'var(--copper-bg)', color:'var(--copper)', padding:'3px 10px', borderRadius:100 }}>+{e.pts} pts</span>
            <span style={{ fontSize:'0.72rem', fontWeight:700, background:`${NIVEAU_COLORS[e.niveau]}15`, color:NIVEAU_COLORS[e.niveau], padding:'3px 10px', borderRadius:100 }}>{e.niveau}</span>
          </div>
          <div style={{ background:'var(--bg2)', border:'1.5px solid var(--border-lt)', borderRadius:'var(--rs)', padding:16, marginBottom:16 }}>
            <div style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)', marginBottom:8 }}>Énoncé</div>
            <div style={{ fontSize:'0.88rem', color:'var(--text-2)', lineHeight:1.85, whiteSpace:'pre-line' }}>{e.enonce}</div>
          </div>
          <div style={{ marginBottom:16 }}>
            <button
              onClick={() => setCorrVisible(v => !v)}
              style={{ width:'100%', padding:'12px 16px', borderRadius:'var(--rs)', border:'1.5px solid rgba(5,150,105,0.2)', background:'rgba(5,150,105,0.06)', color:'var(--success)', fontWeight:700, fontSize:'0.87rem', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points={corrVisible?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
              {corrVisible ? 'Masquer la correction' : 'Voir la correction complète'}
            </button>
            {corrVisible && (
              <div style={{ padding:16, border:'1.5px solid rgba(5,150,105,0.15)', borderTop:'none', borderRadius:'0 0 var(--rs) var(--rs)', fontSize:'0.87rem', color:'var(--text-2)', lineHeight:1.85, whiteSpace:'pre-line', background:'rgba(5,150,105,0.02)' }}>
                {e.correction}
              </div>
            )}
          </div>
          <div style={{ background:'var(--copper-bg)', border:'1.5px solid var(--border)', borderRadius:'var(--rs)', padding:'14px 16px' }}>
            <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--copper)', marginBottom:6 }}>Soumettre ta copie pour correction personnalisée</div>
            <p style={{ fontSize:'0.82rem', color:'var(--text-3)', marginBottom:12 }}>L'IA ou ton tuteur corrigera ta copie individuellement.</p>
            <button onClick={() => navigate('/ia')} className="btn btn-primary btn-sm">Aller à l'Assistant IA →</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Exercices & TD">
      <div style={{ background:'var(--dark)', borderRadius:12, padding:'16px 20px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'#FDFCF8', marginBottom:3 }}>Exercices & TD corrigés</div>
          <div style={{ fontSize:'0.78rem', color:'rgba(253,252,248,0.55)' }}>Lis l'énoncé · Tente ta solution · Révèle la correction</div>
        </div>
        <button onClick={() => navigate('/ia')} className="btn btn-sm" style={{ background:'var(--copper)', color:'#fff', border:'none' }}>Soumettre ma copie à l'IA →</button>
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        <button onClick={() => setFiltre('tout')} className={filtre==='tout'?'btn btn-primary btn-sm':'btn btn-ghost btn-sm'}>Tous</button>
        {matieresDisponibles.map(m => (
          <button key={m} onClick={() => setFiltre(m)} className={filtre===m?'btn btn-primary btn-sm':'btn btn-ghost btn-sm'}>{MATIERES[m]?.label || m}</button>
        ))}
      </div>

      {tdDeCours.length === 0 && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border-lt)', borderRadius:10, padding:'10px 16px', marginBottom:18, fontSize:'0.82rem', color:'var(--text-3)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
          <span>Débloque tes cours pour voir apparaître leurs TD ici.</span>
          <button onClick={() => navigate('/choisir-contenu')} className="btn btn-ghost btn-sm">Choisir mes cours →</button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {filtered.map(e => {
          const [col, bg] = MAT_COLORS[e.matiere] || ['var(--copper)','var(--copper-bg)'];
          return (
            <div key={e.id} className="card" style={{ display:'flex', flexDirection:'column', cursor:'pointer', transition:'all .2s' }}
              onClick={() => ouvrirExo(e.id)}
              onMouseOver={ev => { ev.currentTarget.style.borderColor=col; ev.currentTarget.style.boxShadow=`0 4px 16px ${col}18`; }}
              onMouseOut={ev => { ev.currentTarget.style.borderColor='var(--border-lt)'; ev.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:'0.72rem', fontWeight:700, background:bg, color:col, padding:'2px 9px', borderRadius:100 }}>{e.mat}</span>
                {e.depuisCours
                  ? <span style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--success)' }}>TD de cours</span>
                  : <span style={{ fontSize:'0.7rem', fontWeight:700, color:NIVEAU_COLORS[e.niveau] }}>{e.niveau}</span>}
              </div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.97rem', fontWeight:700, color:'var(--text)', marginBottom:6, flex:1 }}>{e.titre}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>⏱ {e.duree}</span>
                <span style={{ fontSize:'0.72rem', color:'var(--copper)', fontWeight:700 }}>+{e.pts} pts</span>
              </div>
              <div style={{ padding:'9px 0', borderTop:'1.5px solid var(--border-lt)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'0.78rem', color:'var(--muted)' }}>Voir l'exercice</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="2" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
