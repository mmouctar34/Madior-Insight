import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRang } from '../../data/constants';
import { getTotalNonLus, onMessagesChanged } from '../../data/messagesStore';
import Logo from '../ui/Logo';

const PLAN_LABELS = { premium:'Premium', medium:'Medium', standard:'Standard', gratuit:'Visiteur', pro:'Pro', elite:'Elite' };

function SvgIcon({ children, size=16 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={size} height={size} style={{ flexShrink:0 }}>
      {children}
    </svg>
  );
}

const NAV = [
  { to:'/dashboard',  label:'Tableau de bord', icon: <SvgIcon><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></SvgIcon> },
  { to:'/cours',      label:'Mes cours',        icon: <SvgIcon><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></SvgIcon> },
  { to:'/quiz',       label:'Quiz',             icon: <SvgIcon><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></SvgIcon> },
  { to:'/mes-documents', label:'Mes documents', icon: <SvgIcon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></SvgIcon> },
  { to:'/exercices',  label:'Exercices & TD',   icon: <SvgIcon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></SvgIcon> },
  { to:'/actualite',  label:'Actualité éco',    icon: <SvgIcon><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2-2V6"/><line x1="16" y1="8" x2="8" y2="8"/><line x1="16" y1="12" x2="8" y2="12"/></SvgIcon> },
  { to:'/classement', label:'Classement',       icon: <SvgIcon><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></SvgIcon> },
  { to:'/communaute', label:'Communauté',       icon: <SvgIcon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></SvgIcon> },
  { to:'/ia',         label:'Assistant IA',     icon: <SvgIcon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></SvgIcon> },
];

const COMPTE = [
  { to:'/choisir-contenu', label:'Débloquer des cours', icon: <SvgIcon><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></SvgIcon> },
  { to:'/boutique',   label:'Boutique',      icon: <SvgIcon><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></SvgIcon> },
  { to:'/messages',   label:'Messages',      icon: <SvgIcon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></SvgIcon> },
  { to:'/abonnement', label:'Abonnement',    icon: <SvgIcon><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></SvgIcon> },
  { to:'/profil',     label:'Mon profil',    icon: <SvgIcon><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgIcon> },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const rang = user ? getRang(user.points || 0) : null;
  const [nonLus, setNonLus] = useState(0);

  useEffect(() => {
    setNonLus(getTotalNonLus());
    return onMessagesChanged(() => setNonLus(getTotalNonLus()));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const linkCls = ({ isActive }) => `snav${isActive ? ' active' : ''}`;
  /* Sur mobile, on referme le menu après un clic ; sur desktop, il reste ouvert */
  const handleNavClick = () => { if (window.innerWidth <= 900) onClose(); };

  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:49, background:'rgba(0,0,0,0.2)', backdropFilter:'blur(2px)' }} className="sb-overlay"/>}
      <aside className={`sb${open ? ' sb-open' : ''}`} style={{
        width:252, flexShrink:0, height:'100vh',
        position:'fixed', top:0, left:0,
        background:'var(--card-bg)', borderRight:'1px solid var(--border-lt)',
        display:'flex', flexDirection:'column', zIndex:50,
      }}>
        {/* Logo */}
        <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid var(--border-lt)', display:'flex', alignItems:'center', gap:11 }}>
          <Logo size={38} rounded={10} />
          <div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.2rem', fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em', lineHeight:1.1 }}>
              Madior <span style={{ color:'var(--copper)' }}>Insight</span>
            </div>
            <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:2 }}>Plateforme BAC Série STEG</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex:1, overflowY:'auto', padding:'12px 10px' }}>
          <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', padding:'4px 12px 8px' }}>Principal</div>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} className={linkCls} onClick={handleNavClick} style={{ textDecoration:'none' }}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', padding:'16px 12px 8px' }}>Compte</div>
          {COMPTE.map(item => {
            const badge = item.to === '/messages' ? nonLus : item.badge;
            return (
            <NavLink key={item.to} to={item.to} className={linkCls} onClick={handleNavClick} style={{ textDecoration:'none' }}>
              {item.icon}
              <span style={{ flex:1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{ minWidth:20, height:20, borderRadius:100, background:'var(--copper)', color:'#fff', fontSize:'0.65rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 6px' }}>
                  {badge}
                </span>
              )}
            </NavLink>
            );
          })}
        </nav>

        {/* User card */}
        {user && (
          <div style={{ margin:'10px', padding:'12px 14px', borderRadius:12, background:'var(--bg)', border:'1px solid var(--border-lt)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--copper)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, fontSize:'1rem', flexShrink:0 }}>
              {(user.prenom || 'M')[0]}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'0.84rem', fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user.prenom} {user.nom?.[0]}.
              </div>
              <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginTop:1 }}>
                {PLAN_LABELS[user.plan] || user.plan}
                {rang && <span style={{ color:'var(--copper)', marginLeft:4, fontWeight:600 }}>· {rang.label}</span>}
              </div>
            </div>
            <button onClick={handleLogout} title="Déconnexion" style={{ width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', border:'1px solid var(--border-lt)', background:'var(--card-bg)', cursor:'pointer', transition:'all .2s', flexShrink:0 }}
              onMouseOver={e => { e.currentTarget.style.borderColor='var(--danger)'; e.currentTarget.style.color='var(--danger)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor='var(--border-lt)'; e.currentTarget.style.color='var(--muted)'; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
