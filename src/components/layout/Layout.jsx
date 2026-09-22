import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

export default function Layout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 900 : true
  );
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main — marge fixe desktop */}
      <div className={`main-area${sidebarOpen ? ' with-sidebar' : ''}`} style={{ flex:1, display:'flex', flexDirection:'column', minHeight:'100vh', transition:'margin .28s' }}>

        {/* Topbar */}
        <header style={{
          height:60, background:'var(--nav-bg)', backdropFilter:'blur(12px)',
          borderBottom:'1px solid var(--border-lt)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 28px', position:'sticky', top:0, zIndex:40,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Hamburger — ouvre/ferme la sidebar */}
            <button
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Menu"
              style={{ width:36, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)', background:'var(--card-bg)', cursor:'pointer', color:'var(--text-3)', flexShrink:0, transition:'all .2s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor='var(--copper)'; e.currentTarget.style.color='var(--copper)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-3)'; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <line x1="3" y1="7" x2="21" y2="7"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="17" x2="21" y2="17"/>
              </svg>
            </button>

            {/* Titre page */}
            <h1 style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>{title}</h1>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ThemeToggle size={34} />
            {/* Jetons */}
            {user && (
              <button
                onClick={() => navigate('/abonnement')}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:100, cursor:'pointer', transition:'all .2s', fontSize:'0.8rem', fontWeight:600 }}
                onMouseOver={e => { e.currentTarget.style.borderColor='var(--copper)'; e.currentTarget.style.background='var(--copper-bg)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--card-bg)'; }}
              >
                <span style={{ color:'var(--copper)' }}>{user.IN || 0} IN</span>
                <span style={{ width:1, height:12, background:'var(--border)', display:'inline-block' }}/>
                <span style={{ color:'#A855F7' }}>{user.IS || 0} IS</span>
              </button>
            )}
            {/* Avatar */}
            {user && (
              <button
                onClick={() => navigate('/profil')}
                style={{ width:34, height:34, borderRadius:'50%', background:'var(--copper)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:700, fontSize:'0.9rem', border:'none', cursor:'pointer', boxShadow:'0 2px 6px rgba(196,98,26,0.3)', flexShrink:0 }}
              >
                {(user.prenom || 'M')[0]}
              </button>
            )}
          </div>
        </header>

        {/* Contenu */}
        <main style={{ flex:1, padding:'28px', maxWidth:1100, width:'100%', margin:'0 auto' }}>
          {children}
        </main>
      </div>

      {/* Sur mobile, la sidebar est toujours en overlay : jamais de marge */}
      <style>{`
        @media(max-width:900px){
          .main-area{margin-left:0 !important;}
        }
      `}</style>
    </div>
  );
}
