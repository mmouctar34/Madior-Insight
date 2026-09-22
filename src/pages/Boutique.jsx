import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import PaiementModal from '../components/ui/PaiementModal';
import { peutAccederBoutique } from '../data/constants';
import { enregistrerAchat, getAchats, onAchatsChanged } from '../data/boutiqueCatalogue';
import { useNavigate } from 'react-router-dom';

const CATALOGUE = {
  jetons: [
    { id:'j1', label:'10 Insights Normaux', desc:'Jetons libres — débloque n\'importe quelle leçon, même une 2ᵉ dans la même matière', prix:2000, gain_in:10, gain_is:0 },
    { id:'j2', label:'20 Insights Normaux', desc:'Pack économique · jetons libres — valeur 4 000 FCFA', prix:3500, gain_in:20, gain_is:0, promo:true },
    { id:'j3', label:'10 Insights Spéciaux', desc:'Pour sujets BAC et crédits IA premium', prix:3000, gain_in:0, gain_is:10 },
    { id:'j4', label:'25 Insights Spéciaux', desc:'Pack avantageux — valeur 7 500 FCFA', prix:6000, gain_in:0, gain_is:25, promo:true },
  ],
  documents: [
    { id:'d1', label:'Fascicule Économie Série STEG', desc:'68 pages · Cours complets + exercices résolus', prix_in:30, matiere:'Économie' },
    { id:'d2', label:'Fascicule Comptabilité SYSCOHADA', desc:'84 pages · Plan comptable, journal, bilan, amortissements', prix_in:35, matiere:'Comptabilité' },
    { id:'d3', label:'Fascicule Mathématiques', desc:'72 pages · Dérivées, variations, intérêts, annuités', prix_in:30, matiere:'Mathématiques' },
    { id:'d4', label:'TD Corrigés — Économie (10 TD)', desc:'10 travaux dirigés corrigés étape par étape', prix_in:20, matiere:'Économie' },
    { id:'d5', label:'TD Corrigés — Comptabilité (10 TD)', desc:'10 travaux dirigés corrigés SYSCOHADA', prix_in:20, matiere:'Comptabilité' },
    { id:'d6', label:'PDF Offert — Économie (aperçu)', desc:'Extrait gratuit pour découvrir la qualité', prix_in:0, matiere:'Économie', gratuit:true },
  ],
  bacs: [
    { id:'b1', label:'Sujet BAC 2023 — Économie + Correction', desc:'Sujet officiel avec correction complète', prix_is:10, annee:2023, matiere:'Économie' },
    { id:'b2', label:'Sujet BAC 2023 — Comptabilité + Correction', desc:'Sujet officiel avec correction détaillée', prix_is:10, annee:2023, matiere:'Comptabilité' },
    { id:'b3', label:'Sujet BAC 2022 — Économie + Correction', desc:'Sujet officiel BAC 2022 avec correction', prix_is:10, annee:2022, matiere:'Économie' },
    { id:'b4', label:'Sujet BAC 2022 — Comptabilité + Correction', desc:'Correction SYSCOHADA révisé', prix_is:10, annee:2022, matiere:'Comptabilité' },
    { id:'b5', label:'Pack 3 BAC corrigés — ton choix', desc:'3 sujets parmi toute la collection', prix_fcfa:7500, pack:true },
    { id:'b6', label:'Pack 8 BAC corrigés — collection complète', desc:'8 sujets BAC corrigés — meilleur rapport qualité/prix', prix_fcfa:15000, pack:true, bestseller:true },
    { id:'b7', label:'Sujet spécial 2nde — Économie', desc:'Niveau adapté avec correction (non BAC)', prix_is:5, matiere:'Économie', special:true },
    { id:'b8', label:'Sujet spécial 1ère — Comptabilité', desc:'Niveau adapté avec correction détaillée', prix_is:5, matiere:'Comptabilité', special:true },
  ],
  soutenance: [
    { id:'s1', label:'Rapport de soutenance personnalisé', desc:'Ton tuteur rédige intégralement ton rapport selon ton thème. Livraison 5-7 jours.', prix_fcfa:25000, delai:'5-7 jours', inclus:['Rapport complet (15-25 pages)','Plan détaillé','Introduction et conclusion','Bibliographie','1 révision incluse'] },
    { id:'s2', label:'Coaching soutenance (2h)', desc:'Séance individuelle pour préparer ta présentation orale. Sur rendez-vous WhatsApp.', prix_fcfa:15000, delai:'Sur RDV', inclus:['2h de coaching individuel','Simulation de soutenance','Corrections des points faibles','Conseils de présentation'] },
    { id:'s3', label:'Pack complet soutenance', desc:'Rapport + Coaching 2h + 2 révisions. Tout pour réussir.', prix_fcfa:35000, delai:'7-10 jours', inclus:['Rapport complet personnalisé','2h de coaching individuel','2 révisions incluses','Support WhatsApp illimité'], bestseller:true },
  ],
};

const SECTIONS = [
  { id:'jetons',     label:'Acheter des jetons' },
  { id:'documents',  label:'Documents & TD' },
  { id:'bacs',       label:'Sujets BAC' },
  { id:'soutenance', label:'Soutenance' },
];

export default function Boutique() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [section, setSection] = useState('jetons');
  const [achatModal, setAchatModal] = useState(null);
  const [paiementModal, setPaiementModal] = useState(null);
  const [achetes, setAchetes] = useState(getAchats);
  useEffect(() => onAchatsChanged(() => setAchetes(getAchats())), []);

  if (!user) return null;

  /* La boutique exige au minimum un abonnement Standard : un compte gratuit
     ne peut rien acheter tant qu'il n'a pas souscrit. */
  if (!peutAccederBoutique(user.plan)) {
    return (
      <Layout title="Boutique">
        <div className="card" style={{ maxWidth:520, margin:'40px auto', textAlign:'center', padding:'36px 28px' }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'var(--copper-bg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="1.8" width="26" height="26"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.2rem', fontWeight:700, color:'var(--text)', marginBottom:10 }}>
            La boutique nécessite un abonnement
          </div>
          <p style={{ fontSize:'0.88rem', color:'var(--text-3)', lineHeight:1.7, marginBottom:22 }}>
            Ton compte est gratuit : tu peux consulter le site et lire l'aperçu de deux leçons,
            mais les achats (jetons, documents, sujets du BAC) demandent au minimum
            un abonnement <strong style={{ color:'var(--text)' }}>Standard</strong>.
          </p>
          <button onClick={() => navigate('/abonnement')} className="btn btn-primary" style={{ justifyContent:'center' }}>
            Voir les abonnements →
          </button>
        </div>
      </Layout>
    );
  }

  const appliquerAchat = (item) => {
    const updates = {};
    if (item.prix_in > 0) {
      const surIN = Math.min(user.IN||0, item.prix_in);
      const surBoutique = item.prix_in - surIN;
      updates.IN = (user.IN||0) - surIN;
      updates.INBoutique = (user.INBoutique||0) - surBoutique;
    }
    if (item.prix_is > 0) updates.IS = (user.IS||0) - item.prix_is;
    /* Les IN achetés vont dans un pool séparé (INBoutique) : argent réel,
       donc libres d'utilisation, sans la règle "1 leçon par matière" du plan. */
    if (item.gain_in > 0) updates.INBoutique = (user.INBoutique||0) + item.gain_in;
    if (item.gain_is > 0) updates.IS = (user.IS||0) + item.gain_is;
    if (Object.keys(updates).length) updateUser(updates);
    if (!item.gain_in && !item.gain_is) {
      enregistrerAchat(item.id);
    }
    if (section === 'soutenance') toast('Commande envoyée ! Le tuteur te contactera sous 24h sur WhatsApp.','success',4000);
    else toast('Achat réussi !','success');
  };

  /* Achats en jetons (IN/IS) — pas d'argent réel, modal de confirmation simple */
  const confirmerAchat = () => {
    if (!achatModal) return;
    const item = achatModal;
    const soldeINTotal = (user.IN||0) + (user.INBoutique||0);
    if (item.prix_in > 0 && soldeINTotal < item.prix_in) { toast('Pas assez d\'Insights Normaux.','error'); setAchatModal(null); return; }
    if (item.prix_is > 0 && (user.IS || 0) < item.prix_is) { toast('Pas assez d\'Insights Spéciaux.','error'); setAchatModal(null); return; }
    appliquerAchat(item);
    setAchatModal(null);
  };

  /* Déclenché par le clic "Débloquer/Acheter" — dirige vers le bon modal
     selon que l'article se paie en FCFA (Wave) ou en jetons (IN/IS). */
  const handleAcheterClick = (item) => {
    if (item.gratuit) { appliquerAchat(item); return; }
    if (item.prix > 0 || item.prix_fcfa > 0) { setPaiementModal(item); return; }
    setAchatModal(item);
  };

  const prixAffiche = (item) => {
    if (item.gratuit) return 'Gratuit';
    if (item.prix) return `${item.prix.toLocaleString('fr-SN')} FCFA`;
    if (item.prix_fcfa) return `${item.prix_fcfa.toLocaleString('fr-SN')} FCFA`;
    if (item.prix_in > 0) return `${item.prix_in} IN`;
    if (item.prix_is > 0) return `${item.prix_is} IS`;
    return '—';
  };

  const gainAffiche = (item) => {
    if (item.gain_in > 0) return `+${item.gain_in} IN`;
    if (item.gain_is > 0) return `+${item.gain_is} IS`;
    return null;
  };

  const items = CATALOGUE[section] || [];

  return (
    <Layout title="Boutique">
      {/* Solde */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        <div className="card" style={{ borderColor:'var(--copper)', borderWidth:2, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'var(--copper-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.5rem', fontWeight:700, color:'var(--copper)' }}>{user.IN || 0}</div>
            <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>Insights Normaux</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-3)', marginTop:1 }}>Gagnés par effort</div>
            {(user.INBoutique||0) > 0 && (
              <div style={{ fontSize:'0.72rem', color:'var(--success)', marginTop:3, fontWeight:600 }}>+{user.INBoutique} achetés en boutique (libres)</div>
            )}
          </div>
        </div>
        <div className="card" style={{ borderColor:'#A855F7', borderWidth:2, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(168,85,247,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.5rem', fontWeight:700, color:'#A855F7' }}>{user.IS || 0}</div>
            <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>Insights Spéciaux</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-3)', marginTop:1 }}>Obtenus à l'abonnement</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.id}
            onClick={() => setSection(s.id)}
            className={section===s.id ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          >{s.label}</button>
        ))}
      </div>

      {/* Soutenance notice */}
      {section === 'soutenance' && (
        <div style={{ background:'var(--bg2)', border:'1.5px solid var(--border-lt)', borderRadius:'var(--rs)', padding:'12px 16px', marginBottom:16, fontSize:'0.83rem', color:'var(--text-2)', lineHeight:1.65 }}>
          Ce service est réalisé par un <strong>tuteur humain</strong>, pas par une IA. Tu fournis ton thème et ta classe, le tuteur rédige intégralement selon les normes académiques sénégalaises.
        </div>
      )}

      {/* Grille items */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:14 }}>
        {items.map(item => {
          const deja = achetes.includes(item.id);
          const gain = gainAffiche(item);
          return (
            <div key={item.id} className="card" style={{ display:'flex', flexDirection:'column', borderColor: item.bestseller||item.promo?'var(--copper)':'var(--border-lt)', borderWidth: item.bestseller||item.promo?2:1.5 }}>
              {item.bestseller && <div style={{ fontSize:'0.68rem', fontWeight:700, background:'var(--copper)', color:'#fff', padding:'3px 10px', borderRadius:100, display:'inline-block', marginBottom:10, alignSelf:'flex-start' }}>Meilleur choix</div>}
              {item.promo && <div style={{ fontSize:'0.68rem', fontWeight:700, background:'rgba(196,98,26,0.12)', color:'var(--copper)', padding:'3px 10px', borderRadius:100, display:'inline-block', marginBottom:10, alignSelf:'flex-start' }}>Promo</div>}
              {item.special && <div style={{ fontSize:'0.68rem', fontWeight:700, background:'rgba(5,150,105,0.1)', color:'var(--success)', padding:'3px 10px', borderRadius:100, display:'inline-block', marginBottom:10, alignSelf:'flex-start' }}>Niveau adapté</div>}
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.97rem', fontWeight:700, color:'var(--text)', marginBottom:5 }}>{item.label}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:10, lineHeight:1.55, flex:1 }}>{item.desc}</div>
              {item.inclus && (
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                  {item.inclus.map((inc,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', color:'var(--text-2)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                      {inc}
                    </div>
                  ))}
                </div>
              )}
              {item.delai && (
                <div style={{ fontSize:'0.74rem', color:'var(--muted)', marginBottom:12 }}>Délai : {item.delai}</div>
              )}
              {item.annee && (
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--muted)', marginBottom:8 }}>BAC {item.annee} · {item.matiere}</div>
              )}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                <div>
                  {gain && <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1rem', fontWeight:700, color: item.gain_in>0?'var(--copper)':'#A855F7' }}>{gain}</div>}
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize: gain?'0.78rem':'1rem', fontWeight:700, color: gain?'var(--text)':'var(--copper)' }}>{prixAffiche(item)}</div>
                </div>
                {deja ? (
                  <button className="btn btn-sm" style={{ background:'rgba(5,150,105,0.1)', color:'var(--success)', border:'1.5px solid rgba(5,150,105,0.2)' }}>Télécharger</button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => handleAcheterClick(item)}>
                    {item.gratuit ? 'Obtenir' : section==='soutenance' ? 'Commander' : 'Acheter'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal confirmation */}
      {achatModal && (
        <div onClick={e => { if (e.target===e.currentTarget) setAchatModal(null); }} style={{ position:'fixed', inset:0, background:'rgba(44,26,14,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'var(--card-bg)', borderRadius:16, padding:28, maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(44,26,14,0.25)' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.2rem', fontWeight:700, color:'var(--text)', marginBottom:6 }}>Confirmer l'achat</div>
              <div style={{ fontSize:'0.85rem', color:'var(--muted)' }}>{achatModal.label}</div>
            </div>
            <div style={{ background:'var(--bg2)', borderRadius:'var(--rs)', padding:14, marginBottom:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:'0.83rem', color:'var(--muted)' }}>Prix</span>
                <span style={{ fontWeight:700, color:'var(--text)' }}>{prixAffiche(achatModal)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:'0.83rem', color:'var(--muted)' }}>Paiement</span>
                <span style={{ fontSize:'0.83rem', fontWeight:700, color:'var(--copper)' }}>Débit de jetons</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:9 }}>
              <button onClick={() => setAchatModal(null)} className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }}>Annuler</button>
              <button onClick={confirmerAchat} className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}>Confirmer →</button>
            </div>
          </div>
        </div>
      )}

      <PaiementModal
        open={!!paiementModal}
        onClose={() => setPaiementModal(null)}
        titre="Confirmer l'achat"
        label={paiementModal?.label || ''}
        montant={paiementModal?.prix || paiementModal?.prix_fcfa}
        userId={user.id || user.email}
        metadata={{ type:'boutique', item_id: paiementModal?.id, gain_in: paiementModal?.gain_in || 0, gain_is: paiementModal?.gain_is || 0 }}
        onSucces={() => appliquerAchat(paiementModal)}
      />
    </Layout>
  );
}
