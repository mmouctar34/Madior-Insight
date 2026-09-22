import { useState, useRef, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase, isRagConfigured } from '../lib/supabaseClient';

const QUOTA = { standard:2, medium:10, premium:999, gratuit:0, pro:15, elite:50 };

const REPONSES = {
  comptabilite: {
    standard: "Méthode — Journal SYSCOHADA\n\n1. Identifier la nature de l'opération\n2. Sélectionner les comptes (classes 1 à 7)\n3. Débiter ce qui entre / Créditer ce qui sort\n4. Vérifier : Total Débit = Total Crédit\n\nExemple : Achat crédit 300 000 FCFA\n→ 601 Achats | 300 000 / 401 Fournisseurs | 300 000",
    premium:  "Correction complète — Journal SYSCOHADA\n\nÉtape 1 — Nature : achat de marchandises à crédit\n\nÉtape 2 — Comptes :\n601 Achats (charge → Débit)\n401 Fournisseurs (dette → Crédit)\n\nÉtape 3 — Écriture :\n601 Achats | 450 000 | —\n  à 401 Fournisseurs | — | 450 000\n\nVérification : 450 000 = 450 000 ✓\n\nRègle : Achat crédit → 601 Débit / 401 Crédit",
  },
  economie: {
    standard: "Méthode — Équilibre du marché\n\n1. Poser Qd = Qo\n2. Résoudre en P → P*\n3. Substituer → Q*\n4. Vérifier dans les deux équations\n\nExemple : Qd=100−2P / Qo=3P−25\nP* = 25 / Q* = 50",
    premium:  "Correction complète — Équilibre du marché\n\nDonnées : Qd = 120 − 3P / Qo = 2P − 30\n\nÉtape 1 — Équilibre : Qd = Qo\n120 − 3P = 2P − 30\n\nÉtape 2 — Résolution\n150 = 5P → P* = 30\n\nÉtape 3 — Quantité\nQ* = 120 − 3×30 = 30 unités\nVérif Qo : 2×30−30 = 30 ✓\n\nRègle : Toujours vérifier dans les deux équations.",
  },
  maths: {
    standard: "Méthode — Dérivée et variations\n\n1. Calculer f'(x)\n2. Résoudre f'(x) = 0\n3. Étudier le signe de f'(x)\n4. Dresser le tableau de variations\n\nf'(x) > 0 → croissante / f'(x) < 0 → décroissante",
    premium:  "Correction complète — f(x) = 2x³ − 9x² + 12x − 4\n\nÉtape 1 — f'(x) = 6x² − 18x + 12\n\nÉtape 2 — Zéros : 6x²−18x+12=0\n÷6 : x²−3x+2=0 → (x−1)(x−2)=0\nx₁=1 / x₂=2\n\nÉtape 3 — Signe de f'(x)\nx<1 → + → croissante\n1<x<2 → − → décroissante\nx>2 → + → croissante\n\nExtréma :\nf(1) = 1 (MAX local)\nf(2) = 0 (MIN local)",
  },
};

function detectMatiere(q) {
  const t = q.toLowerCase();
  if (/journal|syscohada|d[eé]bit|cr[eé]dit|bilan|fournisseur|amort/.test(t)) return 'comptabilite';
  if (/offre|demande|[eé]quilibre|pib|bceao|inflation|croissance/.test(t)) return 'economie';
  if (/d[eé]riv[eé]e|f\(x\)|variation|int[eé]r[eê]t|annuit/.test(t)) return 'maths';
  return 'economie';
}

export default function IA() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([
    { from:'bot', text:"Bonjour ! Je suis Madior IA, ton tuteur pour le BAC Série STEG.\n\nPose-moi une question sur la comptabilité, l'économie ou les mathématiques. Tu peux aussi uploader un document pour que je l'analyse." }
  ]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [docCharge, setDocCharge]   = useState(false);
  const [docNom, setDocNom]         = useState('');
  const [ragUsed, setRagUsed]       = useState(() => parseInt(localStorage.getItem('mi_ia_today')||'0'));
  const messagesEndRef              = useRef(null);
  const quota = QUOTA[user?.plan] || 0;
  const isPremium = user?.plan === 'premium' || user?.plan === 'medium' || user?.plan === 'elite';

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const addMsg = (from, text, extra = {}) => setMessages(prev => [...prev, { from, text, ...extra }]);

  const envoyer = async () => {
    if (!input.trim()) return;
    if (quota === 0) { toast('Plan Standard requis pour l\'IA.','error'); return; }
    if (quota !== 999 && ragUsed >= quota) { toast(`Quota atteint (${quota} questions/jour). Reset à minuit.`,'error'); return; }
    const q = input.trim();
    setInput('');
    addMsg('user', q);
    setLoading(true);

    const mat = detectMatiere(q);

    /* Mémoire conversationnelle : on envoie les derniers échanges pour que
       l'IA se souvienne du fil de la discussion, comme demandé. */
    const historique = messages.slice(-6).map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', contenu: m.text }));

    /* RAG réel si Supabase est configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY),
       sinon on retombe sur les réponses simulées pour ne jamais bloquer la démo. */
    if (isRagConfigured()) {
      try {
        const { data, error } = await supabase.functions.invoke('ask-ia', {
          body: { question: q, matiere: mat, userId: user?.id || null, historique },
        });
        if (error) throw error;
        addMsg('bot', data.reponse, { sources: data.sources, horsCours: data.hors_cours });
      } catch (err) {
        console.error('Erreur RAG, repli sur réponse simulée :', err);
        const rep = REPONSES[mat] || REPONSES.economie;
        addMsg('bot', isPremium ? rep.premium : rep.standard);
      } finally {
        setLoading(false);
        const newUsed = ragUsed + 1;
        setRagUsed(newUsed);
        localStorage.setItem('mi_ia_today', newUsed);
      }
      return;
    }

    setTimeout(() => {
      const rep = REPONSES[mat] || REPONSES.economie;
      const txt = isPremium ? rep.premium : rep.standard;
      addMsg('bot', txt);
      setLoading(false);
      const newUsed = ragUsed + 1;
      setRagUsed(newUsed);
      localStorage.setItem('mi_ia_today', newUsed);
    }, 1000 + Math.random()*800);
  };

  const simulerUpload = () => {
    if (quota === 0) { toast('Plan Standard requis.','error'); return; }
    const docs = ['cours_compta.pdf','exercice_eco.pdf','photo_maths.jpg','bilan_terminale.pdf'];
    const nom = docs[Math.floor(Math.random()*docs.length)];
    setDocNom(nom); setDocCharge(true);
    addMsg('bot', `Document reçu : ${nom}\n\nJe l'ai analysé. Que veux-tu que je fasse ?\n• Fiche de révision\n• Résumé structuré\n• Générer un quiz\n• Corriger l'exercice`);
  };

  const demanderAnalyse = (type) => {
    if (!docCharge) { toast('Upload d\'abord un document.','error'); return; }
    const labels = { fiche:`Génère une fiche de révision pour : ${docNom}`, resume:`Résumé de : ${docNom}`, quiz:`Quiz sur : ${docNom}`, correction:`Correction de : ${docNom}` };
    setInput(labels[type] || docNom);
  };

  const ragPct = quota === 999 ? 5 : Math.min(100, (ragUsed/quota)*100);

  return (
    <Layout title="Assistant IA">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:18, alignItems:'start' }}>

        {/* Chat */}
        <div>
          <div style={{ background:'var(--dark)', borderRadius:12, padding:'14px 18px', marginBottom:14 }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, color:'#FDFCF8', marginBottom:3 }}>Madior IA — Tuteur BAC Série STEG</div>
            <div style={{ fontSize:'0.78rem', color:'rgba(253,252,248,0.55)' }}>
              {isPremium ? 'Correction complète étape par étape' : 'Méthode + exemple · Passe en Premium pour la correction complète'}
              {isRagConfigured() ? ' · RAG connecté à tes cours' : ' · Mode démo (RAG non connecté)'}
            </div>
          </div>

          <div style={{ background:'var(--card-bg)', border:'1.5px solid var(--border-lt)', borderRadius:12, overflow:'hidden' }}>
            {/* Messages */}
            <div style={{ height:420, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
              {messages.map((m,i) => (
                <div key={i} style={{ display:'flex', flexDirection:'column', maxWidth:'85%', alignSelf: m.from==='user'?'flex-end':'flex-start' }}>
                  <div style={{
                    padding:'10px 14px', borderRadius:10, fontSize:'0.87rem', lineHeight:1.7, whiteSpace:'pre-line',
                    background: m.from==='user' ? 'var(--copper)' : 'var(--bg2)',
                    color: m.from==='user' ? '#fff' : 'var(--text-2)',
                    border: m.from==='bot' ? '1.5px solid var(--border-lt)' : 'none',
                    borderBottomRightRadius: m.from==='user' ? 3 : 10,
                    borderBottomLeftRadius:  m.from==='bot'  ? 3 : 10,
                  }}>{m.text}</div>
                  {m.from==='bot' && m.horsCours === true && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5, fontSize:'0.68rem', color:'var(--warning)', background:'rgba(217,119,6,0.08)', padding:'3px 8px', borderRadius:100, alignSelf:'flex-start' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      Connaissance générale — hors programme
                    </div>
                  )}
                  {m.from==='bot' && m.horsCours === false && m.sources?.length > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5, fontSize:'0.68rem', color:'var(--success)', background:'rgba(5,150,105,0.08)', padding:'3px 8px', borderRadius:100, alignSelf:'flex-start' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                      Basé sur : {m.sources.join(', ')}
                    </div>
                  )}
                  <div style={{ fontSize:'0.66rem', color:'var(--muted)', marginTop:3, alignSelf: m.from==='user'?'flex-end':'flex-start' }}>
                    {m.from==='user' ? 'Toi' : 'Madior IA'}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf:'flex-start' }}>
                  <div style={{ padding:'10px 14px', background:'var(--bg2)', border:'1.5px solid var(--border-lt)', borderRadius:'10px 10px 10px 3px', display:'flex', gap:5, alignItems:'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--copper)', animation:`pulse 1.2s ${i*0.2}s infinite` }}/>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}/>
            </div>

            {/* Input */}
            <div style={{ borderTop:'1.5px solid var(--border-lt)', padding:12, display:'flex', gap:8, alignItems:'flex-end' }}>
              <textarea
                className="input"
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                placeholder="Pose ta question en comptabilité, économie, maths…"
                style={{ flex:1, resize:'none', padding:'10px 12px' }}
              />
              <button onClick={envoyer} className="btn btn-primary" style={{ padding:'10px 16px', height:'fit-content' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Upload */}
          <div className="card">
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.9rem', fontWeight:700, color:'var(--text)', marginBottom:12 }}>Soumettre un document</div>
            {quota === 0 ? (
              <>
                <div style={{ background:'rgba(217,119,6,0.08)', borderRadius:'var(--rs)', padding:'10px 12px', fontSize:'0.82rem', color:'var(--text-2)', marginBottom:10 }}>Plan Standard requis pour l'IA.</div>
                <a href="/abonnement" className="btn btn-primary btn-sm" style={{ justifyContent:'center', display:'flex' }}>Voir les plans →</a>
              </>
            ) : !docCharge ? (
              <div
                onClick={simulerUpload}
                style={{ border:'2px dashed var(--border)', borderRadius:'var(--r)', padding:18, textAlign:'center', cursor:'pointer', transition:'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor='var(--copper)'; e.currentTarget.style.background='var(--copper-bg)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='transparent'; }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="2" width="24" height="24" style={{ margin:'0 auto 8px', display:'block' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div style={{ fontSize:'0.83rem', fontWeight:700, color:'var(--text)', marginBottom:3 }}>Clique pour uploader</div>
                <div style={{ fontSize:'0.74rem', color:'var(--muted)' }}>PDF, photo, texte — max 10 Mo</div>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'rgba(5,150,105,0.08)', border:'1.5px solid rgba(5,150,105,0.15)', borderRadius:'var(--rs)', marginBottom:10, fontSize:'0.83rem', color:'var(--success)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  {docNom}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {[['fiche','Fiche de révision'],['resume','Résumé structuré'],['quiz','Générer un quiz'],['correction','Corriger l\'exercice']].map(([t,l]) => (
                    <button key={t} onClick={() => demanderAnalyse(t)} className="btn btn-ghost btn-sm" style={{ justifyContent:'flex-start' }}>{l}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quota */}
          <div className="card">
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.9rem', fontWeight:700, color:'var(--text)', marginBottom:10 }}>Quota questions IA</div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:5 }}>
              <span style={{ color:'var(--muted)' }}>Utilisé aujourd'hui</span>
              <span style={{ fontWeight:700, color:'var(--copper)' }}>{ragUsed} / {quota === 999 ? '∞' : quota}</span>
            </div>
            <div style={{ height:6, background:'var(--bg3)', borderRadius:100, overflow:'hidden', marginBottom:7 }}>
              <div style={{ height:'100%', width:`${ragPct}%`, background:'var(--copper)', borderRadius:100, transition:'width .4s' }}/>
            </div>
            <div style={{ fontSize:'0.74rem', color:'var(--muted)' }}>Reset à minuit chaque jour</div>
          </div>

          {/* Matières */}
          <div className="card">
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.9rem', fontWeight:700, color:'var(--text)', marginBottom:10 }}>Matières disponibles</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {['Comptabilité SYSCOHADA','Économie','Mathématiques','Anglais','Espagnol'].map(m => (
                <div key={m} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem', color:'var(--text-2)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </Layout>
  );
}
