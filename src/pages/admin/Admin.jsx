import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Logo from '../../components/ui/Logo';
import { useToast } from '../../components/ui/Toast';
import {
  getSignalements, resoudreSignalement,
  getUtilisateursBloques, bloquerUtilisateur, debloquerUtilisateur,
  getEtatChat, bloquerChat, debloquerChat, onEtatChatChange,
} from '../../lib/moderationStore';
import { ROLES_ADMIN, LAISSEZ_PASSER, NIVEAUX_INSPECTION, profilInspection, getSessionAdmin, ouvrirSessionAdmin, journaliser, getHistorique } from '../../data/adminStore';
import { useAuth } from '../../context/AuthContext';

const STATS = {
  revenus: { semaine:285000, mois:1240000, moisPrec:980000, total:8750000,
    parPlan:{ premium:780000, medium:310000, standard:150000 } },
  eleves: { total:247, actifs:189, nouveaux:32,
    parNiveau:{ terminale:98, premiere:72, seconde:45, universite:32 },
    parPlan:{ premium:68, medium:87, standard:79, gratuit:13 } },
  ia:{ questions_jour:342, soumissions_attente:8 },
};

const ELEVES = [
  { nom:'Aminata Diallo',  prenom:'Aminata',  email:'aminata@gmail.com',    tel:'+221 77 123 45 67', niveau:'Terminale',   plan:'premium',  matricule:'MI-2026-0001', actif:true,  date:'01/08/2026' },
  { nom:'Moussa Koné',     prenom:'Moussa',   email:'moussa@gmail.com',     tel:'+221 76 234 56 78', niveau:'Terminale',   plan:'premium',  matricule:'MI-2026-0002', actif:true,  date:'03/08/2026' },
  { nom:'Khady Mbaye',     prenom:'Khady',    email:'khady@gmail.com',      tel:'+221 77 345 67 89', niveau:'2nde',        plan:'medium',   matricule:'MI-2026-0003', actif:true,  date:'05/08/2026' },
  { nom:'Cheikh Diop',     prenom:'Cheikh',   email:'cheikh@gmail.com',     tel:'+221 70 456 78 90', niveau:'1ère',        plan:'standard', matricule:'MI-2026-0004', actif:false, date:'07/08/2026' },
  { nom:'Ibrahima Sarr',   prenom:'Ibrahima', email:'ibrahima@gmail.com',   tel:'+221 77 567 89 01', niveau:'Terminale',   plan:'standard', matricule:'MI-2026-0005', actif:true,  date:'10/08/2026' },
  { nom:'Fatou Ndiaye',    prenom:'Fatou',    email:'fatou@gmail.com',      tel:'+221 76 678 90 12', niveau:'1ère',        plan:'medium',   matricule:'MI-2026-0006', actif:true,  date:'12/08/2026' },
  { nom:'Demba Ndiaye',    prenom:'Demba',    email:'demba@gmail.com',      tel:'+221 77 789 01 23', niveau:'L3',          plan:'premium',  matricule:'MI-2026-0007', actif:true,  date:'15/08/2026' },
  { nom:'Rokhaya Seck',    prenom:'Rokhaya',  email:'rokhaya@gmail.com',    tel:'+221 70 890 12 34', niveau:'2nde',        plan:'standard', matricule:'MI-2026-0008', actif:false, date:'18/08/2026' },
];

const SOUMISSIONS = [
  { eleve:'Aminata Diallo',  niveau:'Terminale', matiere:'Comptabilité', titre:'TD Amortissement',      statut:'attente', date:'29/08/2026' },
  { eleve:'Moussa Koné',     niveau:'1ère',      matiere:'Économie',     titre:'Exercice Équilibre',    statut:'attente', date:'28/08/2026' },
  { eleve:'Ibrahima Sarr',   niveau:'Terminale', matiere:'Maths',        titre:'Intérêts composés',     statut:'corrige', date:'27/08/2026' },
  { eleve:'Rokhaya Seck',    niveau:'2nde',      matiere:'Économie',     titre:'Marché du riz',         statut:'corrige', date:'26/08/2026' },
  { eleve:'Omar Ba',         niveau:'Terminale', matiere:'Comptabilité', titre:'Journal SYSCOHADA',     statut:'attente', date:'29/08/2026' },
  { eleve:'Fatou Ndiaye',    niveau:'1ère',      matiere:'Maths',        titre:'Dérivées — TD 2',       statut:'attente', date:'28/08/2026' },
];

const COURS_ADMIN = [
  { matiere:'Comptabilité', titre:'Introduction SYSCOHADA', eleves:189, taux:78, statut:'publié' },
  { matiere:'Économie',     titre:'Offre et Demande',       eleves:201, taux:82, statut:'publié' },
  { matiere:'Maths',        titre:'Intérêts composés',      eleves:134, taux:70, statut:'publié' },
  { matiere:'Comptabilité', titre:'Analyse financière',     eleves:89,  taux:45, statut:'brouillon' },
  { matiere:'Philosophie',  titre:'Liberté et déterminisme',eleves:72,  taux:55, statut:'publié' },
];

const fmt = (n) => n?.toLocaleString('fr-SN') || '0';

export default function Admin() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState('accueil');
  const [search, setSearch] = useState('');
  const [soumissions, setSoumissions] = useState(SOUMISSIONS);
  const [maintenance, setMaintenance] = useState({ ia:true, classement:true, boutique:true, actualite:true });
  const [eleves, setEleves] = useState(ELEVES);
  const [signalements, setSignalements] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [etatChat, setEtatChat] = useState(getEtatChat);
  const [adminActif, setAdminActif] = useState(() => getSessionAdmin() || ROLES_ADMIN.admin1);
  const [passModal, setPassModal] = useState(false);
  const [niveauInspection, setNiveauInspection] = useState('terminale');
  const { login } = useAuth();

  const chargerModeration = async () => {
    const [sig, blq] = await Promise.all([getSignalements(), getUtilisateursBloques()]);
    setSignalements(sig);
    setBloques(blq);
  };

  useEffect(() => {
    chargerModeration();
    return onEtatChatChange(() => setEtatChat(getEtatChat()));
  }, []);

  /* ── Laissez-passer : se connecter en tant qu'élève ──
     L'administrateur devient un élève ordinaire au niveau choisi, pour
     inspecter le site et interagir normalement (cours, quiz, classement). */
  const activerLaissezPasser = () => {
    const profil = profilInspection({ niveau: niveauInspection, admin: adminActif });
    journaliser(adminActif.id, 'laissez-passer', `Connexion élève — niveau ${niveauInspection}`);
    login(profil);
    toast(`Laissez-passer activé — tu navigues en tant qu'élève (${niveauInspection}).`, 'success', 4500);
    navigate('/dashboard');
  };

  const basculerBlocageChat = (dureeHeures) => {
    if (etatChat.actif) {
      debloquerChat();
      journaliser(adminActif.id, 'chat', 'Réouverture de la communauté');
      toast('Communauté rouverte.', 'success');
    } else {
      bloquerChat({ dureeHeures, par: adminActif.label });
      journaliser(adminActif.id, 'chat', dureeHeures ? `Fermeture ${dureeHeures}h` : 'Fermeture indéfinie');
      toast(dureeHeures ? `Communauté fermée pour ${dureeHeures}h.` : 'Communauté fermée indéfiniment.', 'success');
    }
    setEtatChat(getEtatChat());
  };

  /* Export des utilisateurs — ouvre une vue imprimable que le navigateur
     peut enregistrer en PDF (aucune dépendance externe nécessaire). */
  const exporterUtilisateursPDF = () => {
    const lignes = eleves.map(e => `
      <tr>
        <td>${e.prenom} ${e.nom}</td><td>${e.matricule}</td><td>${e.email}</td>
        <td>${e.tel}</td><td>${e.niveau}</td><td>${e.plan}</td>
        <td>${e.date}</td><td>${e.actif ? 'Actif' : 'Inactif'}</td>
      </tr>`).join('');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
      <title>Madior Insight — Utilisateurs</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:28px;color:#111}
        h1{font-size:18px;margin:0 0 4px} .sub{font-size:12px;color:#666;margin-bottom:18px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:#2C1A0E;color:#fff;text-align:left;padding:7px}
        td{padding:6px 7px;border-bottom:1px solid #eee}
        tr:nth-child(even) td{background:#fafafa}
      </style></head><body>
      <h1>Madior Insight — Liste des utilisateurs</h1>
      <div class="sub">Export du ${new Date().toLocaleString('fr-SN')} · ${eleves.length} utilisateurs · Généré par ${adminActif.label}</div>
      <table><thead><tr>
        <th>Élève</th><th>Matricule</th><th>Email</th><th>Téléphone</th>
        <th>Niveau</th><th>Plan</th><th>Inscrit</th><th>Statut</th>
      </tr></thead><tbody>${lignes}</tbody></table>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast("Autorise les fenêtres pop-up pour lancer l'export.", 'error'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
    journaliser(adminActif.id, 'export', `Export PDF de ${eleves.length} utilisateurs`);
  };

  const nbSignalementsAttente = signalements.filter(s => s.statut === 'attente').length;

  const toggleBlocageEleve = async (e) => {
    const id = e.matricule; // sert d'identifiant stable pour la démo
    const dejaBloque = bloques.some(b => b.user_id === id);
    if (dejaBloque) {
      await debloquerUtilisateur(id);
      toast(`${e.prenom} débloqué.`, 'success');
    } else {
      await bloquerUtilisateur({ userId:id, prenom:e.prenom, raison:'Bloqué depuis la fiche élève' });
      toast(`${e.prenom} bloqué de la communauté.`, 'success');
    }
    chargerModeration();
  };

  const traiterSignalement = async (id, statut) => {
    await resoudreSignalement(id, statut);
    chargerModeration();
    toast(statut === 'traite' ? 'Signalement traité.' : 'Signalement ignoré.', 'success');
  };

  const bloquerDepuisSignalement = async (s) => {
    await bloquerUtilisateur({ userId:s.user_id, prenom:s.prenom, raison:`Message signalé : "${s.texte?.slice(0,60)}"` });
    await resoudreSignalement(s.id, 'traite');
    chargerModeration();
    toast(`${s.prenom} bloqué de la communauté.`, 'success');
  };

  const NAV = [
    { id:'accueil',     label:'Dashboard',       icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { id:'eleves',      label:'Élèves',           icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id:'revenus',     label:'Revenus',          icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { id:'soumissions', label:'Soumissions',      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { id:'cours',       label:'Cours & Contenu',  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { id:'moderation',  label:'Modération',       badge: nbSignalementsAttente || null, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
    { id:'maintenance', label:'Maintenance',      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M20 12h-2M6 12H4M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 20v-2M12 6V4"/></svg> },
  ];

  const croissance = Math.round((STATS.revenus.mois - STATS.revenus.moisPrec) / STATS.revenus.moisPrec * 100);
  const filteredEleves = eleves.filter(e => !search || e.nom.toLowerCase().includes(search.toLowerCase()) || e.matricule.includes(search) || e.email.includes(search));

  const marquerCorrige = (idx) => {
    setSoumissions(prev => prev.map((s,i) => i===idx ? {...s, statut:'corrige'} : s));
  };

  const S = {
    sidebar:{ width:240, flexShrink:0, height:'100vh', position:'fixed', top:0, left:0, background:'var(--dark)', display:'flex', flexDirection:'column', zIndex:50 },
    navItem:(active)=>({ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:'var(--rs)', fontSize:'0.84rem', fontWeight:600, color: active?'#D97732':'rgba(253,252,248,0.6)', background: active?'rgba(196,98,26,0.18)':'transparent', border:'none', cursor:'pointer', width:'100%', textAlign:'left', transition:'all .2s' }),
    main:{ flex:1, marginLeft:240, display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg2)' },
    topbar:{ height:56, background:'var(--card-bg)', borderBottom:'1.5px solid var(--border-lt)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', position:'sticky', top:0, zIndex:40 },
    content:{ padding:22, maxWidth:1200, margin:'0 auto', width:'100%' },
    kpiGrid:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10 }}>
          <Logo size={32} rounded={8} />
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.1rem', fontWeight:700, color:'#FDFCF8', lineHeight:1.15 }}>
            Madior <span style={{ color:'#D97732' }}>Insight</span>
            <span style={{ fontSize:'0.62rem', background:'var(--copper)', color:'#fff', padding:'2px 7px', borderRadius:100, marginLeft:6, display:'inline-block' }}>ADMIN</span>
          </div>
        </div>
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {NAV.map(n => (
            <button key={n.id} style={S.navItem(page===n.id)} onClick={() => setPage(n.id)}>
              {n.icon}{n.label}
              {n.badge ? (
                <span style={{ marginLeft:'auto', minWidth:18, height:18, borderRadius:100, background:'var(--danger)', color:'#fff', fontSize:'0.65rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 5px' }}>{n.badge}</span>
              ) : null}
            </button>
          ))}
          <div style={{ marginTop:'auto', paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.08)', marginTop:16 }}>
            <button onClick={() => navigate('/dashboard')} style={S.navItem(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Voir le site élève
            </button>
          </div>
        </nav>

        {/* ── Outils administrateur ── */}
        <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(253,252,248,0.35)', padding:'4px 12px 8px' }}>Outils</div>

          {/* Passerelle directe vers la boutique côté élève */}
          <button style={S.navItem(false)} onClick={() => { journaliser(adminActif.id, 'navigation', 'Accès boutique'); navigate('/boutique'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Boutique
          </button>

          {/* Laissez-passer : naviguer en tant qu'élève */}
          <button style={S.navItem(false)} onClick={() => setPassModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            Laissez-passer
          </button>
        </div>

        {/* ── Identité de l'administrateur connecté ── */}
        <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(253,252,248,0.35)', marginBottom:8 }}>Connecté en tant que</div>
          <div style={{ display:'flex', gap:6 }}>
            {Object.values(ROLES_ADMIN).map(a => (
              <button key={a.id}
                onClick={() => { ouvrirSessionAdmin(a.id); setAdminActif(a); toast(`Basculé sur ${a.label}.`, 'success'); }}
                title={a.description}
                style={{
                  flex:1, padding:'7px 4px', borderRadius:8, cursor:'pointer',
                  fontSize:'0.68rem', fontWeight:700, transition:'all .15s',
                  border:`1.5px solid ${adminActif.id === a.id ? 'var(--copper)' : 'rgba(255,255,255,0.12)'}`,
                  background: adminActif.id === a.id ? 'rgba(196,98,26,0.2)' : 'transparent',
                  color: adminActif.id === a.id ? '#D97732' : 'rgba(253,252,248,0.5)',
                }}>
                {a.role === 'support' ? 'Support' : 'Technicien'}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={S.main}>
        <header style={S.topbar}>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)' }}>
            {NAV.find(n=>n.id===page)?.label || 'Dashboard'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ThemeToggle size={32} />
            <span style={{ fontSize:'0.78rem', color:'var(--muted)' }}>Admin · Madior Insight</span>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--copper)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, color:'#fff' }}>A</div>
          </div>
        </header>

        <div style={S.content}>

          {/* ── DASHBOARD ── */}
          {page === 'accueil' && (
            <>
              <div style={S.kpiGrid}>
                {[
                  { val:`${fmt(STATS.revenus.mois)} FCFA`, lbl:'Revenus ce mois', trend:`+${croissance}% vs mois dernier`, up:true, col:'var(--copper)', bg:'var(--copper-bg)' },
                  { val:STATS.eleves.actifs, lbl:'Élèves actifs', trend:`+${STATS.eleves.nouveaux} nouveaux`, up:true, col:'var(--success)', bg:'rgba(5,150,105,0.08)' },
                  { val:STATS.ia.soumissions_attente, lbl:'Soumissions à corriger', trend:'À traiter', up:false, col:'var(--warning)', bg:'rgba(217,119,6,0.08)' },
                  { val:STATS.ia.questions_jour, lbl:'Questions IA/jour', trend:'+12% vs hier', up:true, col:'#A855F7', bg:'rgba(168,85,247,0.08)' },
                ].map((k,i) => (
                  <div key={i} className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:k.bg, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.5rem', fontWeight:700, color:k.col, lineHeight:1 }}>{k.val}</div>
                      <div style={{ fontSize:'0.74rem', color:'var(--muted)', marginTop:2 }}>{k.lbl}</div>
                      <div style={{ fontSize:'0.72rem', color:k.up?'var(--success)':'var(--warning)', marginTop:1 }}>{k.trend}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Répartition par plan */}
              <div className="card" style={{ marginBottom:16 }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, marginBottom:14 }}>Élèves par plan</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                  {Object.entries(STATS.eleves.parPlan).map(([p,n]) => {
                    const cols = { premium:'var(--copper)', medium:'#A855F7', standard:'#1D3557', gratuit:'var(--muted)' };
                    return (
                      <div key={p} style={{ background:'var(--bg2)', borderRadius:'var(--rs)', padding:'12px', textAlign:'center' }}>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.3rem', fontWeight:700, color:cols[p] }}>{n}</div>
                        <div style={{ fontSize:'0.76rem', color:'var(--muted)', marginTop:2, textTransform:'capitalize' }}>{p}</div>
                        <div style={{ fontSize:'0.68rem', color:'var(--muted)' }}>{Math.round(n/STATS.eleves.total*100)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Soumissions récentes */}
              <div className="card">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700 }}>Soumissions récentes</div>
                  <button onClick={() => setPage('soumissions')} className="btn btn-primary btn-sm">Voir tout →</button>
                </div>
                <TableSoum data={soumissions.slice(0,4)} onCorrige={marquerCorrige} offset={0} />
              </div>
            </>
          )}

          {/* ── ÉLÈVES ── */}
          {page === 'eleves' && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1.5px solid var(--border-lt)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700 }}>Tous les élèves ({eleves.length})</div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher nom, matricule, email…" style={{ width:240, padding:'7px 10px' }} />
                  <button onClick={exporterUtilisateursPDF} className="btn btn-ghost btn-sm" title="Ouvre une vue imprimable — choisis « Enregistrer au format PDF »">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Exporter en PDF
                  </button>
                </div>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
                  <thead>
                    <tr style={{ background:'var(--bg2)' }}>
                      {['Élève','Matricule','Email','Téléphone','Niveau','Plan','Inscrit','Statut','Communauté'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'0.8rem', color:'var(--muted)', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEleves.map((e,i) => {
                      const estBloqueChat = bloques.some(b => b.user_id === e.matricule);
                      return (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border-lt)', background: i%2===0?'var(--card-bg)':'var(--bg2)' }}>
                        <td style={{ padding:'10px 14px', fontWeight:700, color:'var(--text)', whiteSpace:'nowrap' }}>{e.prenom} {e.nom}</td>
                        <td style={{ padding:'10px 14px', fontFamily:"'Space Mono',monospace", fontSize:'0.76rem', color:'var(--copper)', whiteSpace:'nowrap' }}>{e.matricule}</td>
                        <td style={{ padding:'10px 14px', color:'var(--muted)', fontSize:'0.78rem' }}>{e.email}</td>
                        <td style={{ padding:'10px 14px', fontFamily:"'Space Mono',monospace", fontSize:'0.75rem', color:'var(--muted)', whiteSpace:'nowrap' }}>{e.tel}</td>
                        <td style={{ padding:'10px 14px', color:'var(--text-2)', whiteSpace:'nowrap' }}>{e.niveau}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ fontSize:'0.72rem', fontWeight:700, background:'var(--copper-bg)', color:'var(--copper)', padding:'2px 8px', borderRadius:100 }}>{e.plan}</span>
                        </td>
                        <td style={{ padding:'10px 14px', color:'var(--muted)', whiteSpace:'nowrap' }}>{e.date}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ fontSize:'0.72rem', fontWeight:700, background: e.actif?'rgba(5,150,105,0.1)':'var(--bg3)', color: e.actif?'var(--success)':'var(--muted)', padding:'2px 8px', borderRadius:100 }}>
                            {e.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <button onClick={() => toggleBlocageEleve(e)}
                            style={{ fontSize:'0.72rem', fontWeight:700, padding:'4px 10px', borderRadius:100, border:'1.5px solid', cursor:'pointer', whiteSpace:'nowrap',
                              background: estBloqueChat ? 'rgba(220,38,38,0.08)' : 'var(--bg2)',
                              color: estBloqueChat ? 'var(--danger)' : 'var(--text-3)',
                              borderColor: estBloqueChat ? 'rgba(220,38,38,0.2)' : 'var(--border)' }}
                          >
                            {estBloqueChat ? 'Débloquer' : 'Bloquer'}
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REVENUS ── */}
          {page === 'revenus' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14, marginBottom:18 }}>
                {[
                  { lbl:'Cette semaine', val:`${fmt(STATS.revenus.semaine)} FCFA`, col:'var(--copper)' },
                  { lbl:'Ce mois', val:`${fmt(STATS.revenus.mois)} FCFA`, col:'var(--success)' },
                  { lbl:'Mois précédent', val:`${fmt(STATS.revenus.moisPrec)} FCFA`, col:'var(--muted)' },
                  { lbl:'Total cumulé', val:`${fmt(STATS.revenus.total)} FCFA`, col:'var(--text)' },
                ].map((k,i) => (
                  <div key={i} className="card" style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.4rem', fontWeight:700, color:k.col }}>{k.val}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginTop:4 }}>{k.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:700, marginBottom:16 }}>Revenus par plan</div>
                {Object.entries(STATS.revenus.parPlan).map(([p,v]) => {
                  const pct = Math.round(v/STATS.revenus.mois*100);
                  const labels = { premium:'Premium', medium:'Medium', standard:'Standard' };
                  return (
                    <div key={p} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:'0.84rem' }}>
                        <span style={{ fontWeight:700 }}>{labels[p]}</span>
                        <span style={{ fontFamily:"'Space Mono',monospace", color:'var(--copper)', fontWeight:700 }}>{fmt(v)} FCFA ({pct}%)</span>
                      </div>
                      <div style={{ height:8, background:'var(--bg3)', borderRadius:100, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:'var(--copper)', borderRadius:100 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── SOUMISSIONS ── */}
          {page === 'soumissions' && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1.5px solid var(--border-lt)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700 }}>Toutes les soumissions</div>
                <div style={{ display:'flex', gap:8 }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, background:'rgba(217,119,6,0.1)', color:'var(--warning)', padding:'3px 10px', borderRadius:100 }}>
                    {soumissions.filter(s=>s.statut==='attente').length} en attente
                  </span>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, background:'rgba(5,150,105,0.1)', color:'var(--success)', padding:'3px 10px', borderRadius:100 }}>
                    {soumissions.filter(s=>s.statut==='corrige').length} corrigées
                  </span>
                </div>
              </div>
              <TableSoum data={soumissions} onCorrige={marquerCorrige} offset={0} />
            </div>
          )}

          {/* ── COURS ── */}
          {page === 'cours' && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1.5px solid var(--border-lt)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700 }}>Gestion des cours</div>
                <button className="btn btn-primary btn-sm">+ Nouveau cours</button>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
                  <thead>
                    <tr style={{ background:'var(--bg2)' }}>
                      {['Matière','Titre','Élèves actifs','Complétion','Statut','Actions'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'0.8rem', color:'var(--muted)', fontWeight:700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COURS_ADMIN.map((c,i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border-lt)', background: i%2===0?'var(--card-bg)':'var(--bg2)' }}>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ fontSize:'0.72rem', fontWeight:700, background:'var(--copper-bg)', color:'var(--copper)', padding:'2px 8px', borderRadius:100 }}>{c.matiere}</span>
                        </td>
                        <td style={{ padding:'10px 14px', fontWeight:700, color:'var(--text)' }}>{c.titre}</td>
                        <td style={{ padding:'10px 14px', fontFamily:"'Space Mono',monospace", color:'var(--text-2)' }}>{c.eleves}</td>
                        <td style={{ padding:'10px 14px', minWidth:140 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flex:1, height:5, background:'var(--bg3)', borderRadius:100, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${c.taux}%`, background:'var(--copper)', borderRadius:100 }}/>
                            </div>
                            <span style={{ fontSize:'0.76rem', color:'var(--muted)', flexShrink:0 }}>{c.taux}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ fontSize:'0.72rem', fontWeight:700, background: c.statut==='publié'?'rgba(5,150,105,0.1)':'var(--bg3)', color: c.statut==='publié'?'var(--success)':'var(--muted)', padding:'2px 8px', borderRadius:100 }}>{c.statut}</span>
                        </td>
                        <td style={{ padding:'10px 14px', display:'flex', gap:6 }}>
                          <button className="btn btn-ghost btn-sm">Éditer</button>
                          <button className="btn btn-ghost btn-sm">{c.statut==='publié'?'Dépublier':'Publier'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MODÉRATION ── */}
          {page === 'moderation' && (
            <>
              {/* Fermeture globale de la communauté */}
              <div className="card" style={{ marginBottom:18, borderColor: etatChat.actif ? 'var(--warning)' : 'var(--border-lt)', borderWidth: etatChat.actif ? 1.5 : 1 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:260 }}>
                    <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, marginBottom:5 }}>
                      Communauté — {etatChat.actif ? 'fermée' : 'ouverte'}
                    </div>
                    <div style={{ fontSize:'0.8rem', color:'var(--muted)', lineHeight:1.6 }}>
                      {etatChat.actif ? (
                        <>Fermée par {etatChat.par || 'un administrateur'}.{' '}
                        {etatChat.jusqu_a
                          ? `Réouverture automatique le ${new Date(etatChat.jusqu_a).toLocaleString('fr-SN', { dateStyle:'short', timeStyle:'short' })}.`
                          : 'Fermeture indéfinie — réouverture manuelle requise.'}</>
                      ) : (
                        'Les élèves peuvent écrire. Tu peux fermer le chat temporairement ou indéfiniment.'
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                    {etatChat.actif ? (
                      <button onClick={() => basculerBlocageChat(null)} className="btn btn-primary btn-sm">Rouvrir la communauté</button>
                    ) : (
                      <>
                        <button onClick={() => basculerBlocageChat(1)}  className="btn btn-ghost btn-sm">Fermer 1h</button>
                        <button onClick={() => basculerBlocageChat(24)} className="btn btn-ghost btn-sm">Fermer 24h</button>
                        <button onClick={() => basculerBlocageChat(null)} className="btn btn-sm" style={{ background:'rgba(217,119,6,0.1)', color:'var(--warning)', border:'1.5px solid rgba(217,119,6,0.25)' }}>
                          Fermer indéfiniment
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:18 }}>
                {[
                  { val:signalements.filter(s=>s.statut==='attente').length, lbl:'Signalements en attente', col:'var(--warning)', bg:'rgba(217,119,6,0.08)' },
                  { val:signalements.filter(s=>s.statut==='traite').length,  lbl:'Signalements traités',    col:'var(--success)', bg:'rgba(5,150,105,0.08)' },
                  { val:bloques.length,                                     lbl:'Utilisateurs bloqués',     col:'var(--danger)',  bg:'rgba(220,38,38,0.08)' },
                ].map((k,i) => (
                  <div key={i} className="card" style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.6rem', fontWeight:700, color:k.col }}>{k.val}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginTop:4 }}>{k.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Signalements */}
              <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
                <div style={{ padding:'14px 18px', borderBottom:'1.5px solid var(--border-lt)' }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700 }}>Messages signalés — Communauté</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginTop:2 }}>Filtrage automatique actif (grossièretés, spam, liens) — voici les signalements manuels des élèves.</div>
                </div>
                {signalements.length === 0 ? (
                  <div style={{ padding:'32px 18px', textAlign:'center', color:'var(--muted)', fontSize:'0.85rem' }}>Aucun signalement pour le moment.</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {signalements.map(s => (
                      <div key={s.id} style={{ padding:'14px 18px', borderBottom:'1px solid var(--border-lt)', display:'flex', gap:14, alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap' }}>
                        <div style={{ flex:1, minWidth:240 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                            <span style={{ fontWeight:700, fontSize:'0.87rem', color:'var(--text)' }}>{s.prenom}</span>
                            <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'2px 8px', borderRadius:100,
                              background: s.statut==='attente' ? 'rgba(217,119,6,0.1)' : s.statut==='traite' ? 'rgba(5,150,105,0.1)' : 'var(--bg2)',
                              color: s.statut==='attente' ? 'var(--warning)' : s.statut==='traite' ? 'var(--success)' : 'var(--muted)' }}>
                              {s.statut==='attente' ? 'En attente' : s.statut==='traite' ? 'Traité' : 'Ignoré'}
                            </span>
                            <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>signalé par {s.signale_par}</span>
                          </div>
                          <div style={{ fontSize:'0.85rem', color:'var(--text-2)', background:'var(--bg2)', padding:'8px 12px', borderRadius:8, marginBottom:5 }}>
                            "{s.texte}"
                          </div>
                          <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{s.raison} · {new Date(s.created_at).toLocaleString('fr-SN')}</div>
                        </div>
                        {s.statut === 'attente' && (
                          <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                            <button onClick={() => bloquerDepuisSignalement(s)} className="btn btn-sm" style={{ background:'rgba(220,38,38,0.08)', color:'var(--danger)', border:'1.5px solid rgba(220,38,38,0.2)' }}>Bloquer l'élève</button>
                            <button onClick={() => traiterSignalement(s.id,'traite')} className="btn btn-ghost btn-sm">Marquer traité</button>
                            <button onClick={() => traiterSignalement(s.id,'ignore')} className="btn btn-ghost btn-sm">Ignorer</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Utilisateurs bloqués */}
              <div className="card" style={{ padding:0, overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', borderBottom:'1.5px solid var(--border-lt)' }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700 }}>Utilisateurs bloqués de la Communauté</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginTop:2 }}>Ils gardent accès au site mais ne peuvent plus écrire dans le chat communautaire.</div>
                </div>
                {bloques.length === 0 ? (
                  <div style={{ padding:'32px 18px', textAlign:'center', color:'var(--muted)', fontSize:'0.85rem' }}>Personne n'est bloqué actuellement.</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {bloques.map(b => (
                      <div key={b.user_id} style={{ padding:'12px 18px', borderBottom:'1px solid var(--border-lt)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'0.87rem', color:'var(--text)' }}>{b.prenom}</div>
                          <div style={{ fontSize:'0.74rem', color:'var(--muted)' }}>{b.raison || 'Aucune raison précisée'} · bloqué le {new Date(b.created_at).toLocaleDateString('fr-SN')}</div>
                        </div>
                        <button onClick={async () => { await debloquerUtilisateur(b.user_id); chargerModeration(); toast(`${b.prenom} débloqué.`,'success'); }} className="btn btn-ghost btn-sm">Débloquer</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── MAINTENANCE ── */}
          {page === 'maintenance' && (
            <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:18 }}>
              <div style={{ padding:'14px 18px', borderBottom:'1.5px solid var(--border-lt)' }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700 }}>Historique des connexions</div>
                <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginTop:2 }}>
                  Chaque administrateur a son propre historique, même si le tableau de bord est partagé.
                </div>
              </div>
              {getHistorique().length === 0 ? (
                <div style={{ padding:'28px 18px', textAlign:'center', color:'var(--muted)', fontSize:'0.85rem' }}>Aucune action enregistrée pour le moment.</div>
              ) : (
                <div style={{ maxHeight:280, overflowY:'auto' }}>
                  {getHistorique().slice(0, 40).map((h, i) => (
                    <div key={i} style={{ padding:'10px 18px', borderBottom:'1px solid var(--border-lt)', display:'flex', alignItems:'center', gap:12, fontSize:'0.82rem' }}>
                      <span style={{ fontSize:'0.66rem', fontWeight:700, padding:'2px 8px', borderRadius:100, whiteSpace:'nowrap',
                        background: h.admin_id === 'admin1' ? 'var(--copper-bg)' : 'rgba(124,58,237,0.1)',
                        color: h.admin_id === 'admin1' ? 'var(--copper)' : '#7C3AED' }}>
                        {ROLES_ADMIN[h.admin_id]?.label || h.admin_id}
                      </span>
                      <span style={{ flex:1, color:'var(--text-2)' }}>
                        <strong>{h.action}</strong>{h.detail ? ` — ${h.detail}` : ''}
                      </span>
                      <span style={{ color:'var(--muted)', fontSize:'0.75rem', whiteSpace:'nowrap' }}>
                        {new Date(h.date).toLocaleString('fr-SN', { dateStyle:'short', timeStyle:'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {page === 'maintenance' && (
            <div>
              <div className="card" style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'0.95rem', fontWeight:700, marginBottom:5 }}>Gestion de la maintenance</div>
                <div style={{ fontSize:'0.83rem', color:'var(--muted)', marginBottom:18 }}>Active ou désactive des sections du site. Les pages désactivées affichent un message de maintenance aux élèves.</div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {Object.entries(maintenance).map(([key, active]) => {
                    const labels = { ia:'Assistant IA', classement:'Classement', boutique:'Boutique', actualite:'Actualité économique' };
                    return (
                      <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'var(--bg2)', borderRadius:'var(--rs)', border:'1.5px solid var(--border-lt)' }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'0.87rem', color:'var(--text)' }}>{labels[key]}</div>
                          <div style={{ fontSize:'0.74rem', color:'var(--muted)' }}>Page /{key}</div>
                        </div>
                        <button
                          onClick={() => setMaintenance(prev => ({ ...prev, [key]: !prev[key] }))}
                          style={{ padding:'6px 16px', borderRadius:'var(--rs)', fontWeight:700, fontSize:'0.82rem', border:'1.5px solid', cursor:'pointer', transition:'all .2s',
                            background: active ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.08)',
                            color: active ? 'var(--success)' : 'var(--danger)',
                            borderColor: active ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.15)',
                          }}
                        >
                          {active ? 'En ligne' : 'En maintenance'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function TableSoum({ data, onCorrige, offset }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
        <thead>
          <tr style={{ background:'var(--bg2)' }}>
            {['Élève','Niveau','Matière','Exercice','Date','Statut','Action'].map(h => (
              <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'0.8rem', color:'var(--muted)', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((s,i) => (
            <tr key={i} style={{ borderBottom:'1px solid var(--border-lt)', background: i%2===0?'var(--card-bg)':'var(--bg2)' }}>
              <td style={{ padding:'10px 14px', fontWeight:700, color:'var(--text)', whiteSpace:'nowrap' }}>{s.eleve}</td>
              <td style={{ padding:'10px 14px', color:'var(--text-2)', whiteSpace:'nowrap' }}>{s.niveau}</td>
              <td style={{ padding:'10px 14px', color:'var(--text-2)' }}>{s.matiere}</td>
              <td style={{ padding:'10px 14px', color:'var(--muted)' }}>{s.titre}</td>
              <td style={{ padding:'10px 14px', color:'var(--muted)', whiteSpace:'nowrap' }}>{s.date}</td>
              <td style={{ padding:'10px 14px' }}>
                <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'2px 8px', borderRadius:100,
                  background: s.statut==='attente'?'rgba(217,119,6,0.1)':'rgba(5,150,105,0.1)',
                  color: s.statut==='attente'?'var(--warning)':'var(--success)' }}>
                  {s.statut==='attente'?'En attente':'Corrigée'}
                </span>
              </td>
              <td style={{ padding:'10px 14px' }}>
                {s.statut==='attente'
                  ? <button className="btn btn-primary btn-sm" onClick={() => onCorrige(offset+i)}>Corriger</button>
                  : <button className="btn btn-ghost btn-sm">Renvoyer</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
