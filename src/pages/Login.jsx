import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import ThemeToggle from '../components/ui/ThemeToggle';
import Logo from '../components/ui/Logo';
import { isRagConfigured } from '../lib/supabaseClient';

const NIVEAUX = [
  {val:'seconde',group:'lycee',label:'Seconde (2nde)'},
  {val:'premiere',group:'lycee',label:'Première (1ère)'},
  {val:'terminale',group:'lycee',label:'Terminale'},
  {val:'universite-l1',group:'univ',label:'Licence 1 (L1)'},
  {val:'universite-l2',group:'univ',label:'Licence 2 (L2)'},
  {val:'universite-l3',group:'univ',label:'Licence 3 (L3)'},
  {val:'universite-master',group:'univ',label:'Master'},
];

const PLANS_LYCEE = [
  {id:'gratuit',label:'Gratuit',prix:'0 FCFA',desc:'Aperçu : 1er chapitre de la 1re leçon d\'Économie et de Comptabilité · Pas de TD, ni quiz, ni boutique',gratuit:true},
  {id:'standard',label:'Standard',prix:'3 000 FCFA/mois',desc:'20 IN · 1 leçon + son TD au choix · 2 questions IA/jour'},
  {id:'medium',label:'Medium',prix:'8 000 FCFA/mois',desc:'120 IN · 6 leçons + leurs TD au choix · 10 questions IA/jour',featured:true},
  {id:'premium',label:'Premium',prix:'30 000 FCFA/mois',desc:'120 IN + 30 IS · IA illimitée · 3 bacs/mois · Coaching'},
];
const PLANS_UNIV = [
  {id:'pro',label:'Pro',prix:'À définir',desc:'Insights libres · RAG moyen · Toutes matières'},
  {id:'elite',label:'Elite',prix:'À définir',desc:'Plus d\'insights · RAG élevé · Accompagnement',featured:true},
];

export default function Login() {
  const { login, connexionReelle, inscriptionReelle } = useAuth();
  const toast  = useToast();
  const navigate = useNavigate();
  const backendActif = isRagConfigured();
  const [chargement, setChargement] = useState(false);

  const [tab,         setTab]         = useState('connexion');
  const [step,        setStep]        = useState(1);
  const [form,        setForm]        = useState({email:'',tel:'',password:'',prenom:'',nom:'',niveau:'',lycee:'',parrain:'',plan:'gratuit'});
  const [otpSent,     setOtpSent]     = useState(false);
  const [otp,         setOtp]         = useState(['','','','']);
  const [parrainOk,   setParrainOk]   = useState(null);
  const [showPass,    setShowPass]    = useState(false);

  const isUniv = form.niveau.startsWith('universite');
  const plans  = isUniv ? PLANS_UNIV : PLANS_LYCEE;
  const p_premiumChoisiSansIS = form.plan === 'premium' && (form.niveau === 'seconde' || form.niveau === 'premiere');

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handleOtp = (val,i) => {
    const n=[...otp]; n[i]=val.slice(-1); setOtp(n);
    if(val && i<3) document.getElementById(`otp${i+1}`)?.focus();
  };

  const validerParrain = (code) => {
    if(/^MI-[A-Z]{2,4}-\d{4}$/.test(code.toUpperCase())) setParrainOk(true);
    else if(code.length>0) setParrainOk(false);
    else setParrainOk(null);
  };

  const handleConnexion = async (e) => {
    e.preventDefault();
    if(!form.email&&!form.tel){toast('Email ou téléphone requis.','error');return;}
    if(!form.password){toast('Mot de passe requis.','error');return;}

    if (backendActif) {
      if (!form.email) { toast('La connexion réelle nécessite un email (téléphone bientôt disponible).','error'); return; }
      setChargement(true);
      try {
        await connexionReelle({ email: form.email, password: form.password });
        toast('Connexion réussie !','success');
        navigate('/dashboard');
      } catch (err) {
        toast(err.message,'error');
      } finally {
        setChargement(false);
      }
      return;
    }

    /* Mode démo — aucune vérification réelle */
    login({prenom:'Moustapha',nom:'Aïdara',email:form.email||'demo@madiorinsight.sn',plan:'premium',niveau:'terminale',type:'lycee'});
    toast('Connexion réussie !','success');
    navigate('/dashboard');
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    if(!form.prenom||!form.nom){toast('Prénom et nom requis.','error');return;}
    if(!form.email&&!form.tel){toast('Email ou téléphone requis.','error');return;}
    if(backendActif && !form.email){toast('La création de compte réelle nécessite un email (téléphone bientôt disponible).','error');return;}
    if(!form.password||form.password.length<6){toast('Mot de passe : 6 caractères minimum.','error');return;}
    if(!form.niveau){toast('Sélectionne ton niveau.','error');return;}
    setStep(2);
  };

  const handleSendOtp = () => {
    setOtpSent(true);
    toast('Code OTP envoyé ! (démo : 1 2 3 4)','info',4000);
  };

  const handleInscription = async () => {
    const type = form.niveau.startsWith('universite')?'universite':'lycee';
    /* Les étudiants d'université ont libre cours : pas de sélection de contenu
       obligatoire, ils accèdent tout de suite au tableau de bord. */
    const isUnivInscription = type === 'universite';
    /* Compte gratuit : aucune sélection de contenu (il n'a pas d'IN à dépenser),
       il entre directement sur le site avec son aperçu limité. */
    const estGratuit = form.plan === 'gratuit';
    const sautSelection = isUnivInscription || estGratuit;

    if (backendActif) {
      setChargement(true);
      try {
        const { session } = await inscriptionReelle({
          email: form.email, password: form.password,
          profil: { prenom:form.prenom, nom:form.nom, tel:form.tel, niveau:form.niveau, type, lycee:form.lycee },
        });
        /* Le compte démarre toujours en gratuit : un plan payant choisi ici
           doit être réglé depuis la page Abonnement. */
        if (session && !estGratuit) {
          toast(`Bienvenue ${form.prenom} ! Finalise ton abonnement ${form.plan} pour l'activer.`,'success',6000);
          navigate('/abonnement');
        } else if (session) {
          toast(`Bienvenue ${form.prenom} !`,'success');
          navigate('/dashboard');
        } else {
          toast('Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.','success',6000);
          setTab('connexion');
        }
      } catch (err) {
        toast(err.message,'error');
      } finally {
        setChargement(false);
      }
      return;
    }

    /* Mode démo — OTP fictif */
    if(otp.join('').length<4){toast('Entre les 4 chiffres reçus.','error');return;}
    login({prenom:form.prenom,nom:form.nom,email:form.email,tel:form.tel,niveau:form.niveau,type,plan:form.plan,lycee:form.lycee,contenuDebloque:[],contenuChoisiConfirme:sautSelection});
    toast(`Bienvenue ${form.prenom} !`,'success');
    navigate(sautSelection ? '/dashboard' : '/choisir-contenu');
  };

  /* ─── STYLES ─── */
  const INPUT = { width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:10, fontSize:'0.875rem', fontFamily:"'Inter',sans-serif", color:'var(--text)', outline:'none', transition:'border .2s, box-shadow .2s', background:'var(--card-bg)' };
  const LABEL = { fontSize:'0.8rem', fontWeight:600, color:'var(--text-3)', display:'block', marginBottom:6 };
  const FIELD = { marginBottom:16 };

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ position:'fixed', top:16, right:16, zIndex:10 }}>
        <ThemeToggle size={36} />
      </div>

      {/* ── Côté gauche — brand ── */}
      <div style={{ flex:'0 0 45%', background:'linear-gradient(160deg,var(--dark) 0%,#3D2010 60%,#2C1A0E 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 48px', position:'relative', overflow:'hidden' }}>
        {/* Décoration géométrique */}
        <div style={{ position:'absolute', top:-60, right:-60, width:300, height:300, borderRadius:'50%', background:'rgba(196,98,26,0.08)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, left:-40, width:200, height:200, borderRadius:'50%', background:'rgba(196,98,26,0.06)', pointerEvents:'none' }}/>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:48 }}>
          <Logo size={52} rounded={14} />
          <div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.6rem', fontWeight:700, color:'var(--cream)', lineHeight:1 }}>Madior <span style={{ color:'#D97732' }}>Insight</span></div>
            <div style={{ fontSize:'0.72rem', color:'rgba(253,252,248,0.45)', marginTop:4, letterSpacing:'0.04em' }}>Plateforme BAC Série STEG</div>
          </div>
        </div>

        {/* Message principal */}
        <div style={{ textAlign:'center', maxWidth:340 }}>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'2rem', fontWeight:700, color:'var(--cream)', lineHeight:1.2, marginBottom:14 }}>
            Réussir ton BAC Série STEG,<br/><span style={{ color:'#D97732' }}>c'est possible.</span>
          </div>
          <div style={{ fontSize:'0.95rem', color:'rgba(253,252,248,0.55)', lineHeight:1.75, marginBottom:36 }}>
            L'excellence, une habitude.
          </div>
          {/* Features */}
          {['Cours complets par niveau','Quiz interactif & aléatoire','Classement en temps réel','IA Tuteur personnalisé'].map((f,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, textAlign:'left' }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(196,98,26,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#D97732" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontSize:'0.84rem', color:'rgba(253,252,248,0.7)', fontWeight:500 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Côté droit — formulaire ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 48px', background:'var(--bg)', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:420 }}>

          {/* Tabs */}
          <div style={{ display:'flex', background:'var(--bg2)', borderRadius:12, padding:4, marginBottom:28, gap:4 }}>
            {[['connexion','Se connecter'],['inscription','Créer un compte']].map(([t,l]) => (
              <button key={t} style={{ flex:1, padding:'9px', borderRadius:9, fontFamily:"'Inter',sans-serif", fontSize:'0.875rem', fontWeight:600, border:'none', cursor:'pointer', transition:'all .2s', background:tab===t?'var(--card-bg)':'transparent', color:tab===t?'var(--copper)':'var(--text-3)', boxShadow:tab===t?'0 1px 4px rgba(0,0,0,0.08)':'none' }}
                onClick={() => { setTab(t); setStep(1); setOtpSent(false); setOtp(['','','','']); }}>
                {l}
              </button>
            ))}
          </div>

          {/* ── CONNEXION ── */}
          {tab === 'connexion' && (
            <form onSubmit={handleConnexion}>
              <div style={FIELD}>
                <label style={LABEL}>Email ou téléphone</label>
                <input style={INPUT} value={form.email} onChange={e=>set('email',e.target.value)} placeholder="votre@email.com ou +221 77…"
                  onFocus={e=>{e.target.style.borderColor='var(--copper)';e.target.style.boxShadow='0 0 0 3px rgba(196,98,26,0.1)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                />
              </div>
              <div style={FIELD}>
                <label style={LABEL}>Mot de passe</label>
                <div style={{ position:'relative' }}>
                  <input style={{...INPUT,paddingRight:44}} type={showPass?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="••••••••"
                    onFocus={e=>{e.target.style.borderColor='var(--copper)';e.target.style.boxShadow='0 0 0 3px rgba(196,98,26,0.1)'}}
                    onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                  />
                  <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',border:'none',background:'none',cursor:'pointer',color:'var(--muted)',padding:4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">{showPass?<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
                  </button>
                </div>
                <div style={{ textAlign:'right', marginTop:6 }}>
                  <span style={{ fontSize:'0.78rem', color:'var(--copper)', cursor:'pointer', fontWeight:500 }}>Mot de passe oublié ?</span>
                </div>
              </div>
              <button type="submit" disabled={chargement} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px', fontSize:'0.95rem', marginBottom:12, opacity:chargement?0.7:1 }}>
                {chargement ? 'Connexion…' : 'Se connecter →'}
              </button>
              {!backendActif && (
                <button type="button" onClick={() => { login({prenom:'Moustapha',nom:'Aïdara',plan:'premium',niveau:'terminale',type:'lycee'}); navigate('/dashboard'); }} className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', fontSize:'0.83rem' }}>
                  Continuer en mode démo
                </button>
              )}
            </form>
          )}

          {/* ── INSCRIPTION étape 1 ── */}
          {tab === 'inscription' && step === 1 && (
            <form onSubmit={handleStep1}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div>
                  <label style={LABEL}>Prénom</label>
                  <input style={INPUT} value={form.prenom} onChange={e=>set('prenom',e.target.value)} placeholder="Aminata"
                    onFocus={e=>{e.target.style.borderColor='var(--copper)';e.target.style.boxShadow='0 0 0 3px rgba(196,98,26,0.1)'}}
                    onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                  />
                </div>
                <div>
                  <label style={LABEL}>Nom</label>
                  <input style={INPUT} value={form.nom} onChange={e=>set('nom',e.target.value)} placeholder="Diallo"
                    onFocus={e=>{e.target.style.borderColor='var(--copper)';e.target.style.boxShadow='0 0 0 3px rgba(196,98,26,0.1)'}}
                    onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                  />
                </div>
              </div>
              {[
                {label:'Email',type:'email',key:'email',placeholder:'votre@email.com'},
                {label:'Téléphone',type:'tel',key:'tel',placeholder:'+221 77 000 00 00'},
              ].map(f => (
                <div key={f.key} style={FIELD}>
                  <label style={LABEL}>{f.label}</label>
                  <input style={INPUT} type={f.type} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder}
                    onFocus={e=>{e.target.style.borderColor='var(--copper)';e.target.style.boxShadow='0 0 0 3px rgba(196,98,26,0.1)'}}
                    onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                  />
                </div>
              ))}
              <div style={FIELD}>
                <label style={LABEL}>Mot de passe</label>
                <input style={INPUT} type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="6 caractères minimum"
                  onFocus={e=>{e.target.style.borderColor='var(--copper)';e.target.style.boxShadow='0 0 0 3px rgba(196,98,26,0.1)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                />
              </div>
              <div style={FIELD}>
                <label style={LABEL}>Niveau scolaire</label>
                <select style={{...INPUT,cursor:'pointer'}} value={form.niveau} onChange={e=>{set('niveau',e.target.value);set('plan',e.target.value.startsWith('universite')?'pro':'gratuit');}}>
                  <option value="">— Sélectionner —</option>
                  <optgroup label="Lycée — Série STEG">{NIVEAUX.filter(n=>n.group==='lycee').map(n=><option key={n.val} value={n.val}>{n.label}</option>)}</optgroup>
                  <optgroup label="Université">{NIVEAUX.filter(n=>n.group==='univ').map(n=><option key={n.val} value={n.val}>{n.label}</option>)}</optgroup>
                </select>
              </div>
              <div style={FIELD}>
                <label style={LABEL}>Établissement</label>
                <input style={INPUT} value={form.lycee} onChange={e=>set('lycee',e.target.value)} placeholder="Lycée Blaise Diagne, Dakar"
                  onFocus={e=>{e.target.style.borderColor='var(--copper)';e.target.style.boxShadow='0 0 0 3px rgba(196,98,26,0.1)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                />
              </div>
              <div style={FIELD}>
                <label style={LABEL}>Code parrain (optionnel)</label>
                <input style={{...INPUT,borderColor:parrainOk===true?'var(--success)':parrainOk===false?'var(--danger)':''}} value={form.parrain}
                  onChange={e=>{set('parrain',e.target.value);validerParrain(e.target.value);}} placeholder="MI-XXX-0000"
                  onFocus={e=>{if(!parrainOk){e.target.style.borderColor='var(--copper)';e.target.style.boxShadow='0 0 0 3px rgba(196,98,26,0.1)'}}}
                  onBlur={e=>{if(!parrainOk){e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}}
                />
                {parrainOk===true && <div style={{fontSize:'0.74rem',color:'var(--success)',marginTop:5,fontWeight:500}}>✓ Code valide — 15 jours offerts !</div>}
                {parrainOk===false && <div style={{fontSize:'0.74rem',color:'var(--danger)',marginTop:5}}>Format invalide (ex: MI-DIA-3421)</div>}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px', fontSize:'0.95rem' }}>
                Choisir mon plan →
              </button>
            </form>
          )}

          {/* ── INSCRIPTION étape 2 — plans + OTP ── */}
          {tab === 'inscription' && step === 2 && (
            <div>
              <button onClick={()=>setStep(1)} style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.82rem',color:'var(--muted)',border:'none',background:'none',cursor:'pointer',marginBottom:20}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Retour
              </button>

              <div style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-3)',marginBottom:14}}>Choisis ton plan :</div>
              <div style={{display:'flex',flexDirection:'column',gap:9,marginBottom:8}}>
                {plans.map(p => (
                  <div key={p.id} onClick={()=>set('plan',p.id)} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'13px 15px',borderRadius:12,border:`1.5px solid ${form.plan===p.id?'var(--copper)':'var(--border)'}`,background:form.plan===p.id?'var(--copper-bg)':'var(--card-bg)',cursor:'pointer',transition:'all .2s'}}>
                    <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${form.plan===p.id?'var(--copper)':'var(--border)'}`,background:form.plan===p.id?'var(--copper)':'transparent',flexShrink:0,marginTop:2,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {form.plan===p.id&&<div style={{width:6,height:6,borderRadius:'50%',background:'var(--card-bg)'}}/>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:'0.9rem',color:'var(--text)'}}>{p.label}{p.featured&&<span style={{marginLeft:7,fontSize:'0.65rem',background:'var(--copper)',color:'#fff',padding:'1px 7px',borderRadius:100}}>Recommandé</span>}</div>
                      <div style={{fontSize:'0.76rem',color:'var(--muted)',marginTop:2}}>{p.desc}</div>
                    </div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.78rem',fontWeight:700,color:'var(--copper)',flexShrink:0,textAlign:'right'}}>{p.prix}</div>
                  </div>
                ))}
              </div>

              {p_premiumChoisiSansIS && (
                <div style={{background:'rgba(217,119,50,0.08)',border:'1px solid rgba(217,119,50,0.2)',borderRadius:10,padding:'10px 14px',fontSize:'0.78rem',color:'var(--text-2)',marginBottom:16,display:'flex',gap:8}}>
                  <span>ℹ️</span>
                  <span>Les <strong>Insights Spéciaux</strong> sont réservés aux élèves de <strong>Terminale</strong> et aux étudiants d'université. En {form.niveau==='seconde'?'Seconde':'Première'}, tu gardes le cours + TD au choix et l'IA illimitée du plan Premium, mais sans les IS.</span>
                </div>
              )}

              <div style={{background:'rgba(22,163,74,0.06)',border:'1px solid rgba(22,163,74,0.15)',borderRadius:10,padding:'10px 14px',fontSize:'0.79rem',color:'var(--text-2)',marginBottom:18}}>
                1 PDF offert par matière à l'inscription.
              </div>

              {backendActif ? (
                <button onClick={handleInscription} disabled={chargement} className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'13px',fontSize:'0.95rem',opacity:chargement?0.7:1}}>
                  {chargement ? 'Création du compte…' : 'Créer mon compte →'}
                </button>
              ) : !otpSent ? (
                <button onClick={handleSendOtp} className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'13px',fontSize:'0.95rem'}}>
                  Valider et recevoir mon code OTP →
                </button>
              ) : (
                <div>
                  <div style={{fontSize:'0.82rem',color:'var(--muted)',textAlign:'center',marginBottom:16}}>Code OTP envoyé — saisis les 4 chiffres</div>
                  <div style={{display:'flex',gap:10,justifyContent:'center',marginBottom:20}}>
                    {otp.map((v,i)=>(
                      <input key={i} id={`otp${i}`} style={{width:52,height:60,border:'2px solid var(--border)',borderRadius:12,textAlign:'center',fontFamily:"'Space Mono',monospace",fontSize:'1.5rem',fontWeight:700,outline:'none',transition:'all .2s'}} maxLength={1} value={v} onChange={e=>handleOtp(e.target.value,i)}
                        onFocus={e=>{e.target.style.borderColor='var(--copper)';e.target.style.boxShadow='0 0 0 3px rgba(196,98,26,0.1)'}}
                        onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                      />
                    ))}
                  </div>
                  <button onClick={handleInscription} className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'13px',fontSize:'0.95rem',marginBottom:10}}>
                    Créer mon compte →
                  </button>
                  <button onClick={handleSendOtp} className="btn btn-ghost" style={{width:'100%',justifyContent:'center',fontSize:'0.82rem'}}>
                    Renvoyer le code
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{textAlign:'center',marginTop:28,fontSize:'0.78rem',color:'var(--muted)'}}>
            En continuant, tu acceptes les{' '}
            <span style={{color:'var(--copper)',cursor:'pointer',fontWeight:500}}>Conditions d'utilisation</span>
            {' '}et la{' '}
            <span style={{color:'var(--copper)',cursor:'pointer',fontWeight:500}}>Politique de confidentialité</span>
          </div>
        </div>
      </div>
    </div>
  );
}
