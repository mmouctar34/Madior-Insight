import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getRang } from '../data/constants';

const NIVEAUX_LABEL = {
  seconde:'Seconde (2nde)', premiere:'Première (1ère)', terminale:'Terminale',
  'universite-l1':'Licence 1', 'universite-l2':'Licence 2',
  'universite-l3':'Licence 3', 'universite-master':'Master',
};
const PLAN_LABELS = { premium:'Premium', medium:'Medium', standard:'Standard', gratuit:'Visiteur', pro:'Pro', elite:'Elite' };

export default function Profil() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ prenom: user?.prenom || '', nom: user?.nom || '', lycee: user?.lycee || '' });

  if (!user) return null;
  const rang = getRang(user.points || 0);

  const sauvegarder = () => {
    if (!form.prenom || !form.nom) { toast('Prénom et nom requis.', 'error'); return; }
    updateUser({ prenom: form.prenom, nom: form.nom, lycee: form.lycee });
    setEditMode(false);
    toast('Profil mis à jour !', 'success');
  };

  const copierCode = () => {
    navigator.clipboard.writeText(user.parrain_code || 'MI-AID-3421').then(
      () => toast('Code copié !', 'success'),
      () => toast(`Code : ${user.parrain_code}`, 'info', 5000)
    );
  };

  const StatCard = ({ val, label, color }) => (
    <div style={{ background:'var(--bg2)', borderRadius:'var(--rs)', padding:'12px', textAlign:'center' }}>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.1rem', fontWeight:700, color }}>{val}</div>
      <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:2 }}>{label}</div>
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-lt)' }}>
      <span style={{ fontSize:'0.8rem', color:'var(--muted)' }}>{label}</span>
      <span style={{ fontSize:'0.84rem', fontWeight:700, color:'var(--text)' }}>{value}</span>
    </div>
  );

  return (
    <Layout title="Mon profil">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, alignItems:'start' }}>

        {/* Colonne gauche */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Carte identité */}
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--copper)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontSize:'1.8rem', fontWeight:700, color:'#fff', flexShrink:0 }}>
                {(user.prenom || 'M')[0]}
              </div>
              <div>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.2rem', fontWeight:700, color:'var(--text)', marginBottom:4 }}>
                  {user.prenom} {user.nom}
                </div>
                <span style={{ fontSize:'0.72rem', fontWeight:700, background:'var(--copper-bg)', color:'var(--copper)', padding:'2px 8px', borderRadius:100 }}>
                  {PLAN_LABELS[user.plan] || user.plan}
                </span>
              </div>
            </div>

            {!editMode ? (
              <>
                <InfoRow label="Niveau" value={NIVEAUX_LABEL[user.niveau] || user.niveau || '—'} />
                <InfoRow label="Établissement" value={user.lycee || '—'} />
                <InfoRow label="Email" value={user.email || '—'} />
                <InfoRow label="Téléphone" value={user.tel || '—'} />
                <InfoRow label="Membre depuis" value="1 août 2026" />
                <button onClick={() => setEditMode(true)} className="btn btn-ghost btn-sm" style={{ marginTop:14 }}>
                  Modifier mes informations
                </button>
              </>
            ) : (
              <>
                <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:14 }}>
                  <div>
                    <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:5 }}>Prénom</label>
                    <input className="input" value={form.prenom} onChange={e => setForm(f=>({...f,prenom:e.target.value}))} />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:5 }}>Nom</label>
                    <input className="input" value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))} />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:5 }}>Établissement</label>
                    <input className="input" value={form.lycee} onChange={e => setForm(f=>({...f,lycee:e.target.value}))} />
                  </div>
                </div>
                <div style={{ display:'flex', gap:9 }}>
                  <button onClick={() => setEditMode(false)} className="btn btn-ghost btn-sm">Annuler</button>
                  <button onClick={sauvegarder} className="btn btn-primary btn-sm">Sauvegarder</button>
                </div>
              </>
            )}
          </div>

          {/* Statistiques */}
          <div className="card">
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, color:'var(--text)', marginBottom:14 }}>Mes statistiques</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <StatCard val={(user.points||0).toLocaleString('fr-SN')} label="Points totaux" color="var(--copper)" />
              <StatCard val={`${rang.label}`} label="Rang actuel" color={rang.color} />
              <StatCard val="3/12" label="Cours terminés" color="var(--success)" />
              <StatCard val={`🔥 ${user.streak||0}`} label="Jours de suite" color="var(--warning)" />
              <StatCard val={user.IN||0} label="Insights Normaux" color="var(--copper)" />
              <StatCard val={user.IS||0} label="Insights Spéciaux" color="#A855F7" />
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Matricule */}
          <div className="card">
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, color:'var(--text)', marginBottom:5 }}>Matricule élève</div>
            <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:12 }}>Ton identifiant unique sur Madior Insight. Communique-le si tu contactes le support.</div>
            <div style={{ background:'var(--bg2)', borderRadius:'var(--rs)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'1rem', fontWeight:700, color:'var(--text)', letterSpacing:'0.06em' }}>{user.matricule || 'MI-2026-0001'}</span>
              <button onClick={() => { navigator.clipboard.writeText(user.matricule || 'MI-2026-0001'); toast('Matricule copié !','success'); }} className="btn btn-ghost btn-sm">Copier</button>
            </div>
          </div>

          {/* Code parrainage */}
          <div className="card">
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, color:'var(--text)', marginBottom:5 }}>Code de parrainage</div>
            <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:14 }}>
              Partage ce code — chaque ami qui s'abonne te rapporte +50 IN et lui offre 15 jours Standard.
            </div>
            <div style={{ background:'var(--dark)', borderRadius:'var(--rs)', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.1rem', fontWeight:700, color:'#D97732', letterSpacing:'0.06em' }}>{user.parrain_code || 'MI-AID-3421'}</span>
              <button onClick={copierCode} className="btn btn-sm" style={{ background:'rgba(255,255,255,0.1)', color:'#FDFCF8', border:'1px solid rgba(255,255,255,0.2)' }}>Copier</button>
            </div>
            <div style={{ background:'rgba(5,150,105,0.08)', border:'1.5px solid rgba(5,150,105,0.15)', borderRadius:'var(--rs)', padding:'10px 14px', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:'0.82rem', color:'var(--text-2)' }}>Amis parrainés</span>
              <span style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, color:'var(--success)' }}>3 amis</span>
            </div>
          </div>

          {/* Filigrane */}
          <div className="card">
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, color:'var(--text)', marginBottom:5 }}>Code filigrane</div>
            <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:12 }}>Ce code est intégré à tes documents téléchargés. Il identifie toute copie non autorisée.</div>
            <div style={{ background:'rgba(220,38,38,0.06)', border:'1.5px solid rgba(220,38,38,0.12)', borderRadius:'var(--rs)', padding:'12px 16px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.88rem', fontWeight:700, color:'var(--danger)', letterSpacing:'0.15em' }}>{user.filigrane || 'MIAB3X7K2P'}</div>
              <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:4 }}>Identifiant unique — Ne pas partager</div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="card">
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, color:'var(--text)', marginBottom:14 }}>Sécurité du compte</div>
            <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:16 }}>
              {[
                { label:'Compte mono-utilisateur', sub:`Lié au : ${user.tel || '+221 77 000 00 00'}`, ok:true },
                { label:'Vérification OTP', sub:'Code envoyé par SMS à l\'inscription', ok:true },
              ].map((s,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'var(--bg2)', borderRadius:'var(--rs)' }}>
                  <div>
                    <div style={{ fontSize:'0.84rem', fontWeight:700, color:'var(--text)' }}>{s.label}</div>
                    <div style={{ fontSize:'0.74rem', color:'var(--muted)' }}>{s.sub}</div>
                  </div>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, background:'rgba(5,150,105,0.1)', color:'var(--success)', padding:'2px 8px', borderRadius:100 }}>Actif</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { if (confirm('Se déconnecter de Madior Insight ?')) { logout(); window.location.href = '/login'; } }}
              className="btn btn-sm"
              style={{ background:'rgba(220,38,38,0.08)', color:'var(--danger)', border:'1.5px solid rgba(220,38,38,0.15)', width:'100%', justifyContent:'center' }}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
