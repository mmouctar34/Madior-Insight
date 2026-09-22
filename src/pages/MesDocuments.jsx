import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getMesDocuments, onAchatsChanged } from '../data/boutiqueCatalogue';
import { peutAccederBoutique } from '../data/constants';

const COULEURS_MAT = {
  'Économie':      ['#C4621A', 'rgba(196,98,26,0.1)'],
  'Comptabilité':  ['#1D3557', 'rgba(29,53,87,0.1)'],
  'Mathématiques': ['#7C3AED', 'rgba(124,58,237,0.1)'],
};

function IconeDoc({ couleur }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="1.8" width="20" height="20">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

export default function MesDocuments() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [docs, setDocs] = useState(getMesDocuments);
  const [filtre, setFiltre] = useState('tout');

  useEffect(() => {
    const rafraichir = () => setDocs(getMesDocuments());
    return onAchatsChanged(rafraichir);
  }, []);

  if (!user) return null;

  const fascicules = docs.filter(d => d.section === 'documents');
  const sujetsBac  = docs.filter(d => d.section === 'bacs');

  const visibles = filtre === 'documents' ? fascicules
                 : filtre === 'bacs'      ? sujetsBac
                 : docs;

  const telecharger = (doc) => {
    /* Le fichier réel sera servi depuis Google Drive une fois le backend
       connecté (voir RAG_SETUP.md). En attendant, on informe l'élève. */
    toast(`« ${doc.label} » — le téléchargement sera disponible dès la mise en ligne des fichiers.`, 'info', 4500);
  };

  return (
    <Layout title="Mes documents">

      {/* En-tête */}
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:'0.9rem', color:'var(--text-3)', lineHeight:1.7 }}>
          Retrouve ici tous les fascicules, TD corrigés et sujets du BAC que tu as achetés
          dans la Boutique. Ils restent accessibles en permanence.
        </div>
      </div>

      {/* Compteurs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14, marginBottom:22 }}>
        {[
          { val:fascicules.length, lbl:'Fascicules & TD achetés', col:'var(--copper)' },
          { val:sujetsBac.length,  lbl:'Sujets du BAC achetés',   col:'#7C3AED' },
        ].map((k,i) => (
          <div key={i} className="card" style={{ textAlign:'center', padding:'18px' }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.7rem', fontWeight:700, color:k.col }}>{k.val}</div>
            <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginTop:3 }}>{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      {docs.length > 0 && (
        <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
          {[['tout','Tout'],['documents','Fascicules & TD'],['bacs','Sujets du BAC']].map(([f,l]) => (
            <button key={f} onClick={() => setFiltre(f)} className={filtre===f?'btn btn-primary btn-sm':'btn btn-ghost btn-sm'}>{l}</button>
          ))}
        </div>
      )}

      {/* Liste */}
      {visibles.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'40px 28px' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <IconeDoc couleur="var(--muted)" />
          </div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.05rem', fontWeight:700, color:'var(--text)', marginBottom:8 }}>
            Aucun document pour le moment
          </div>
          <p style={{ fontSize:'0.86rem', color:'var(--text-3)', lineHeight:1.7, marginBottom:20, maxWidth:420, margin:'0 auto 20px' }}>
            {peutAccederBoutique(user.plan)
              ? 'Les fascicules, TD corrigés et sujets du BAC que tu achèteras dans la Boutique apparaîtront automatiquement ici.'
              : 'La Boutique nécessite au minimum un abonnement Standard. Une fois abonné, tes achats apparaîtront ici.'}
          </p>
          <button
            onClick={() => navigate(peutAccederBoutique(user.plan) ? '/boutique' : '/abonnement')}
            className="btn btn-primary"
            style={{ justifyContent:'center' }}
          >
            {peutAccederBoutique(user.plan) ? 'Aller à la Boutique →' : 'Voir les abonnements →'}
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
          {visibles.map(doc => {
            const [col, bg] = COULEURS_MAT[doc.matiere] || ['var(--copper)', 'var(--copper-bg)'];
            return (
              <div key={doc.id} className="card" style={{ display:'flex', alignItems:'center', gap:14, padding:'15px 18px' }}>
                <div style={{ width:42, height:42, borderRadius:11, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <IconeDoc couleur={col} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:4 }}>
                    <span style={{ fontSize:'0.66rem', fontWeight:700, background: doc.section==='bacs' ? 'rgba(124,58,237,0.1)' : bg, color: doc.section==='bacs' ? '#7C3AED' : col, padding:'2px 9px', borderRadius:100 }}>
                      {doc.section === 'bacs' ? 'Sujet BAC' : 'Fascicule / TD'}
                    </span>
                    {doc.matiere && (
                      <span style={{ fontSize:'0.66rem', fontWeight:600, background:'var(--bg2)', color:'var(--muted)', padding:'2px 9px', borderRadius:100 }}>{doc.matiere}</span>
                    )}
                    {doc.annee && (
                      <span style={{ fontSize:'0.66rem', fontWeight:600, background:'var(--bg2)', color:'var(--muted)', padding:'2px 9px', borderRadius:100 }}>{doc.annee}</span>
                    )}
                  </div>
                  <div style={{ fontWeight:700, fontSize:'0.92rem', color:'var(--text)', marginBottom:2 }}>{doc.label}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>{doc.desc}</div>
                </div>
                <button onClick={() => telecharger(doc)} className="btn btn-ghost btn-sm" style={{ flexShrink:0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Télécharger
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
