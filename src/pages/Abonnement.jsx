import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import PaiementModal from '../components/ui/PaiementModal';
import { PLANS_LYCEE, PLANS_UNIV, MATIERES } from '../data/constants';

/* Calculateur de moyenne */
const MATIERES_CALC_LYCEE = [
  { id:'comptabilite', label:'Comptabilité',  coeff:6, cours:true  },
  { id:'economie',     label:'Économie',      coeff:6, cours:true  },
  { id:'maths',        label:'Mathématiques', coeff:4, cours:true  },
  { id:'anglais',      label:'Anglais',       coeff:2, cours:true  },
  { id:'espagnol',     label:'Espagnol',      coeff:2, cours:true  },
  { id:'francais',     label:'Français',      coeff:3, cours:false },
  { id:'droit',        label:'Droit',         coeff:2, cours:false },
  { id:'management',   label:'Management',    coeff:2, cours:false },
  { id:'informatique', label:'Informatique',  coeff:2, cours:false },
  { id:'cmc',          label:'CMC',           coeff:2, cours:false },
  { id:'philosophie',  label:'Philosophie',   coeff:2, cours:false, niveaux:['terminale'] },
  { id:'eps',          label:'EPS',           coeff:1, cours:false },
];
const MATIERES_CALC_UNIV = [
  { id:'comptabilite',  label:'Comptabilité',   coeff:6, cours:true  },
  { id:'economie',      label:'Économie',       coeff:6, cours:true  },
  { id:'microeconomie', label:'Microéconomie',  coeff:4, cours:true  },
  { id:'maths',         label:'Mathématiques',  coeff:4, cours:true  },
  { id:'statistiques',  label:'Statistiques',   coeff:3, cours:true  },
  { id:'anglais',       label:'Anglais',        coeff:2, cours:true  },
  { id:'espagnol',      label:'Espagnol',       coeff:2, cours:true  },
  { id:'droit',         label:'Droit',          coeff:2, cours:false },
  { id:'management',    label:'Management',     coeff:2, cours:false },
  { id:'informatique',  label:'Informatique',   coeff:2, cours:false },
];

const PLAN_LABELS = { premium:'Premium', medium:'Medium', standard:'Standard', gratuit:'Visiteur', pro:'Pro', elite:'Elite' };
const HISTO = [
  { date:'01/08/2026', plan:'Premium', montant:30000, moyen:'Wave', statut:'Payé' },
  { date:'01/07/2026', plan:'Premium', montant:30000, moyen:'Orange Money', statut:'Payé' },
  { date:'01/06/2026', plan:'Medium',  montant:8000,  moyen:'Wave', statut:'Payé' },
];

function Countdown({ fin }) {
  const [txt, setTxt] = useState('—');
  useEffect(() => {
    if (!fin) return;
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
  return <span>{txt}</span>;
}

export default function Abonnement() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('plans');
  const [notes, setNotes] = useState({});
  const [moyenne, setMoyenne] = useState(null);
  const [paiementModal, setPaiementModal] = useState(null); // { planId, plan }

  if (!user) return null;

  const isUniv = user.type === 'universite';
  const plans  = isUniv ? PLANS_UNIV : PLANS_LYCEE;
  const matieres = isUniv ? MATIERES_CALC_UNIV : MATIERES_CALC_LYCEE.filter(m => !m.niveaux || m.niveaux.includes(user.niveau));

  const appliquerSouscription = (planId) => {
    const isUnivPlan = (user.niveau || '').startsWith('universite');
    const perdIS = planId === 'premium' && (user.niveau === 'seconde' || user.niveau === 'premiere');
    updateUser({
      plan: planId,
      /* Réabonnement lycée : on redéclenche la sélection obligatoire pour que
         le nouveau quota de jetons passe par la règle "1 leçon par matière".
         Les cours déjà débloqués restent acquis. Université : libre cours, jamais bloqué. */
      contenuChoisiConfirme: isUnivPlan ? true : false,
    });
    toast(
      perdIS
        ? `Plan ${PLAN_LABELS[planId]} activé ! (Insights Spéciaux réservés à partir de la Terminale)`
        : `Plan ${PLAN_LABELS[planId]} activé !`,
      'success', perdIS ? 5000 : undefined
    );
  };

  /* Ouvre le choix du moyen de paiement au lieu d'appliquer le plan directement */
  const souscrire = (planId) => {
    const p = plans[planId];
    if (!p?.prix) { appliquerSouscription(planId); return; } // plan "Contactez-nous" sans prix fixe
    setPaiementModal({ planId, plan: p });
  };

  const calculerMoyenne = (newNotes) => {
    let total = 0, coeffTotal = 0;
    matieres.forEach(m => {
      const n = parseFloat(newNotes[m.id]);
      if (!isNaN(n) && n >= 0 && n <= 20) { total += n * m.coeff; coeffTotal += m.coeff; }
    });
    setMoyenne(coeffTotal > 0 ? (total / coeffTotal).toFixed(2) : null);
  };

  const handleNote = (id, val) => {
    const n = { ...notes, [id]: val };
    setNotes(n);
    calculerMoyenne(n);
  };

  const resetCalc = () => { setNotes({}); setMoyenne(null); };

  const moyenneColor = moyenne >= 14 ? 'var(--success)' : moyenne >= 10 ? 'var(--warning)' : 'var(--danger)';
  const moyenneAvis  = moyenne >= 16 ? 'Très bien — Félicitations !'
    : moyenne >= 14 ? 'Bien — Continue comme ça !'
    : moyenne >= 12 ? 'Assez bien — Tu peux faire mieux !'
    : moyenne >= 10 ? 'Passable — Accroche-toi !'
    : 'Insuffisant — Plus de révisions s\'imposent.';

  const tabStyle = (t) => ({
    padding:'7px 16px', borderRadius:'var(--rs)', fontFamily:"'Fredoka',sans-serif",
    fontSize:'0.88rem', fontWeight:700, border:'1.5px solid var(--border-lt)',
    cursor:'pointer', transition:'all .2s',
    background: tab===t ? 'var(--copper)' : 'var(--card-bg)',
    color: tab===t ? '#fff' : 'var(--text-3)',
    borderColor: tab===t ? 'var(--copper)' : 'var(--border-lt)',
  });

  return (
    <Layout title="Mon abonnement">
      {/* Bannière actuelle */}
      <div style={{ background:'var(--dark)', borderRadius:12, padding:'18px 22px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div>
          <div style={{ fontSize:'0.7rem', fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(253,252,248,0.5)', marginBottom:4 }}>Abonnement actuel</div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.3rem', fontWeight:700, color:'#FDFCF8' }}>{PLAN_LABELS[user.plan] || user.plan}</div>
          <div style={{ fontSize:'0.76rem', color:'rgba(196,98,26,0.9)', fontFamily:"'Space Mono',monospace", marginTop:3 }}>
            <Countdown fin={user.abo_fin} />
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ textAlign:'center', background:'rgba(255,255,255,0.08)', borderRadius:'var(--rs)', padding:'8px 16px' }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.2rem', fontWeight:700, color:'#D97732' }}>{user.IN || 0}</div>
            <div style={{ fontSize:'0.65rem', color:'rgba(253,252,248,0.45)' }}>IN</div>
          </div>
          <div style={{ textAlign:'center', background:'rgba(255,255,255,0.08)', borderRadius:'var(--rs)', padding:'8px 16px' }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.2rem', fontWeight:700, color:'#C084FC' }}>{user.IS || 0}</div>
            <div style={{ fontSize:'0.65rem', color:'rgba(253,252,248,0.45)' }}>IS</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[['plans','Changer de plan'],['histo','Historique'],['calcul','Calculateur de moyenne']].map(([t,l]) => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {/* Plans */}
      {tab === 'plans' && (
        <div>
          {isUniv && (
            <div style={{ background:'var(--bg2)', borderRadius:'var(--rs)', padding:'10px 14px', marginBottom:16, fontSize:'0.83rem', color:'var(--text-2)' }}>
              Mode Université — Crédits libres pour acquérir les cours et documents de ton choix.
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
            {Object.entries(plans).map(([k, p]) => {
              const isCurrent = k === user.plan;
              return (
                <div key={k} className="card" style={{ display:'flex', flexDirection:'column', borderColor: isCurrent?'var(--copper)': p.featured?'var(--copper)':'var(--border-lt)', borderWidth: (isCurrent||p.featured)?2:1.5 }}>
                  {isCurrent && <div style={{ fontSize:'0.68rem', fontWeight:700, background:'var(--copper)', color:'#fff', padding:'3px 10px', borderRadius:100, display:'inline-block', marginBottom:10, alignSelf:'flex-start' }}>Plan actuel</div>}
                  {p.featured && !isCurrent && <div style={{ fontSize:'0.68rem', fontWeight:700, background:'var(--copper-bg)', color:'var(--copper)', padding:'3px 10px', borderRadius:100, display:'inline-block', marginBottom:10, alignSelf:'flex-start' }}>Recommandé</div>}
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.15rem', fontWeight:700, color:'var(--text)', marginBottom:6 }}>{p.label}</div>
                  {p.prix ? (
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.5rem', fontWeight:700, color:'var(--copper)', marginBottom:3 }}>
                      {p.prix.toLocaleString('fr-SN')} <span style={{ fontSize:'0.72rem', fontWeight:400, color:'var(--muted)' }}>FCFA/mois</span>
                    </div>
                  ) : (
                    <div style={{ fontSize:'0.85rem', color:'var(--muted)', marginBottom:3 }}>Prix à définir</div>
                  )}
                  <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:14, lineHeight:1.6 }}>{p.desc}</div>
                  <div style={{ height:1, background:'var(--border-lt)', marginBottom:14 }}/>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16, flex:1 }}>
                    {p.features.map((f,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:'0.82rem', color:'var(--text-2)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="14" height="14" style={{ flexShrink:0, marginTop:2 }}><polyline points="20 6 9 17 4 12"/></svg>
                        {f}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => !isCurrent && souscrire(k)}
                    className={isCurrent ? 'btn btn-ghost' : 'btn btn-primary'}
                    style={{ justifyContent:'center', width:'100%', opacity: isCurrent ? 0.6 : 1 }}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Plan actuel' : `S'abonner · ${p.prix ? p.prix.toLocaleString('fr-SN')+' FCFA' : 'Contactez-nous'}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historique */}
      {tab === 'histo' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.84rem' }}>
            <thead>
              <tr style={{ background:'var(--dark)' }}>
                {['Date','Plan','Montant','Moyen','Statut'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', color:'#FDFCF8', fontFamily:"'Fredoka',sans-serif", fontSize:'0.86rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTO.map((h,i) => (
                <tr key={i} style={{ background: i%2===0 ? 'var(--card-bg)' : 'var(--bg2)', borderBottom:'1px solid var(--border-lt)' }}>
                  <td style={{ padding:'10px 16px', color:'var(--muted)' }}>{h.date}</td>
                  <td style={{ padding:'10px 16px', fontWeight:700, color:'var(--text)' }}>{h.plan}</td>
                  <td style={{ padding:'10px 16px', fontFamily:"'Space Mono',monospace", color:'var(--copper)' }}>{h.montant.toLocaleString('fr-SN')} FCFA</td>
                  <td style={{ padding:'10px 16px', color:'var(--text-2)' }}>{h.moyen}</td>
                  <td style={{ padding:'10px 16px' }}>
                    <span style={{ background:'rgba(5,150,105,0.1)', color:'var(--success)', padding:'2px 8px', borderRadius:100, fontSize:'0.72rem', fontWeight:700 }}>{h.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Calculateur */}
      {tab === 'calcul' && (
        <div className="card" style={{ maxWidth:680 }}>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:5 }}>Calculateur de moyenne — {isUniv ? 'Université' : 'BAC Série STEG'}</div>
          <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:18, lineHeight:1.6 }}>Saisis tes notes pour calculer ta moyenne pondérée automatiquement.</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {matieres.map(m => (
              <div key={m.id} style={{ background:'var(--bg2)', borderRadius:'var(--rs)', padding:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                  <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text)' }}>{m.label}</div>
                  <span style={{ fontSize:'0.68rem', background:'var(--bg3)', color:'var(--muted)', padding:'2px 7px', borderRadius:100, fontWeight:700 }}>Coeff. {m.coeff}</span>
                </div>
                <input
                  type="number" min="0" max="20" step="0.5"
                  className="input"
                  value={notes[m.id] || ''}
                  onChange={e => handleNote(m.id, e.target.value)}
                  placeholder="Note /20"
                  style={{ padding:'8px 10px' }}
                />
              </div>
            ))}
          </div>
          {/* Résultat */}
          <div style={{ background:'var(--dark)', borderRadius:'var(--rs)', padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:'0.72rem', color:'rgba(253,252,248,0.5)', marginBottom:3 }}>Moyenne pondérée</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'2rem', fontWeight:700, color: moyenne ? '#FDFCF8' : 'rgba(253,252,248,0.3)' }}>
                {moyenne ? `${moyenne} / 20` : '—'}
              </div>
              {moyenne && <div style={{ fontSize:'0.76rem', color: moyenneColor, marginTop:3 }}>{moyenneAvis}</div>}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'0.72rem', color:'rgba(253,252,248,0.5)', marginBottom:3 }}>Total coefficients</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.1rem', fontWeight:700, color:'#D97732' }}>
                {matieres.reduce((s,m) => s+m.coeff, 0)}
              </div>
            </div>
          </div>
          <button onClick={resetCalc} className="btn btn-ghost btn-sm">Réinitialiser</button>
        </div>
      )}

      <PaiementModal
        open={!!paiementModal}
        onClose={() => setPaiementModal(null)}
        titre="Confirmer l'abonnement"
        label={`Plan ${paiementModal?.plan?.label || ''}`}
        montant={paiementModal?.plan?.prix}
        userId={user.id || user.email}
        metadata={{ type:'abonnement', plan: paiementModal?.planId }}
        onSucces={() => appliquerSouscription(paiementModal.planId)}
      />
    </Layout>
  );
}
