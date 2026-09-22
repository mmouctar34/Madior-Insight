import { useState } from 'react';
import { useToast } from './Toast';
import { creerPaiementWave, isWaveConfigured } from '../../lib/wavePayment';

/**
 * Modal de paiement — Wave est le seul moyen actif pour l'instant.
 * Orange Money, Free Money et Carte bancaire sont affichés grisés avec
 * la mention "Bientôt disponible", comme demandé.
 *
 * Props :
 * - open        : booléen d'affichage
 * - onClose     : fermeture
 * - titre       : ex. "Confirmer l'abonnement"
 * - label       : ex. "Plan Premium"
 * - montant     : en FCFA
 * - userId      : id de l'utilisateur (pour la session Wave)
 * - metadata    : { type:'abonnement'|'boutique', ... } transmis à l'Edge Function
 * - onSucces    : callback appelé quand le paiement est confirmé
 *                 (immédiatement en mode démo ; via redirection Wave sinon)
 */
export default function PaiementModal({ open, onClose, titre = 'Confirmer le paiement', label, montant, userId, metadata = {}, onSucces }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [etapeDemo, setEtapeDemo] = useState(null); // null | 'attente' | 'succes'

  if (!open) return null;

  const AUTRES_MOYENS = ['Orange Money', 'Free Money', 'Carte bancaire'];

  const payerAvecWave = async () => {
    setLoading(true);
    try {
      const resultat = await creerPaiementWave({
        montant,
        description: label,
        userId,
        metadata,
      });

      if (resultat.demo) {
        /* Simulation locale — pas d'Edge Function configurée */
        setEtapeDemo('attente');
        await new Promise(r => setTimeout(r, 1600));
        setEtapeDemo('succes');
        await new Promise(r => setTimeout(r, 700));
        onSucces?.();
        onClose();
        toast('Paiement Wave simulé — accès activé (mode démo).', 'success', 4500);
      } else {
        /* Vraie session Wave : on redirige l'élève vers l'app/le lien Wave.
           Le backend confirmera via webhook et débloquera l'accès. */
        window.location.href = resultat.wave_launch_url;
      }
    } catch (err) {
      toast(err.message || 'Le paiement Wave a échoué. Réessaie.', 'error');
      setEtapeDemo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(44,26,14,0.5)', backdropFilter:'blur(4px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--card-bg)', borderRadius:16, padding:26, maxWidth:420, width:'100%', boxShadow:'0 20px 60px rgba(44,26,14,0.25)' }}>

        {/* Étape démo : attente / succès */}
        {etapeDemo ? (
          <div style={{ textAlign:'center', padding:'24px 8px' }}>
            {etapeDemo === 'attente' ? (
              <>
                <div style={{ width:56, height:56, borderRadius:'50%', border:'3px solid var(--copper-bg)', borderTopColor:'var(--copper)', margin:'0 auto 18px', animation:'spin .8s linear infinite' }} />
                <div style={{ fontWeight:700, color:'var(--text)', marginBottom:4 }}>Confirmation du paiement Wave…</div>
                <div style={{ fontSize:'0.82rem', color:'var(--muted)' }}>Simulation — aucun débit réel en mode démo.</div>
              </>
            ) : (
              <>
                <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(22,163,74,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" width="26" height="26"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontWeight:700, color:'var(--success)' }}>Paiement confirmé !</div>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.15rem', fontWeight:700, color:'var(--text)', marginBottom:6 }}>{titre}</div>
              <div style={{ fontSize:'0.85rem', color:'var(--muted)' }}>{label}</div>
            </div>

            <div style={{ background:'var(--bg2)', borderRadius:'var(--rs)', padding:14, marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'0.83rem', color:'var(--muted)' }}>Montant</span>
              <span style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:'1.1rem', color:'var(--text)' }}>{montant?.toLocaleString('fr-SN')} FCFA</span>
            </div>

            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
              Choisir un moyen de paiement
            </div>

            {/* Wave — actif */}
            <button
              onClick={payerAvecWave}
              disabled={loading}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:12,
                padding:'13px 16px', borderRadius:12, marginBottom:9,
                border:'1.5px solid #1BA0E2', background:'rgba(27,160,226,0.07)',
                cursor: loading ? 'default' : 'pointer', transition:'all .15s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <div style={{ width:36, height:36, borderRadius:9, background:'#1BA0E2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="18" height="18"><path d="M2 12h20M2 12c0 5.5 4.5 10 10 10s10-4.5 10-10M2 12C2 6.5 6.5 2 12 2s10 4.5 10 10"/></svg>
              </div>
              <div style={{ flex:1, textAlign:'left' }}>
                <div style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text)' }}>Wave</div>
                <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{isWaveConfigured() ? "Paiement via l'app Wave" : 'Simulation — mode démo'}</div>
              </div>
              {loading ? (
                <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid #1BA0E2', borderTopColor:'transparent', animation:'spin .7s linear infinite' }} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#1BA0E2" strokeWidth="2" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
              )}
            </button>

            {/* Autres moyens — bientôt disponibles */}
            {AUTRES_MOYENS.map(m => (
              <div key={m} style={{
                width:'100%', display:'flex', alignItems:'center', gap:12,
                padding:'13px 16px', borderRadius:12, marginBottom:9,
                border:'1.5px solid var(--border-lt)', background:'var(--bg2)',
                opacity:0.6, cursor:'not-allowed',
              }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" width="16" height="16"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div style={{ flex:1, textAlign:'left' }}>
                  <div style={{ fontWeight:600, fontSize:'0.86rem', color:'var(--text-3)' }}>{m}</div>
                </div>
                <span style={{ fontSize:'0.66rem', fontWeight:700, background:'var(--bg3)', color:'var(--muted)', padding:'3px 9px', borderRadius:100, whiteSpace:'nowrap' }}>Bientôt disponible</span>
              </div>
            ))}

            <button onClick={onClose} disabled={loading} className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginTop:8 }}>
              Annuler
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
