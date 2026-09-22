import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ size = 36 }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      style={{
        width: size, height: size, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--border)', background: 'var(--card-bg)',
        cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0,
        transition: 'all .2s',
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--copper)'; e.currentTarget.style.color = 'var(--copper)'; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
    >
      {isDark ? (
        /* Icône soleil — cliquer pour repasser en clair */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
          <circle cx="12" cy="12" r="4"/>
          <line x1="12" y1="2" x2="12" y2="4"/>
          <line x1="12" y1="20" x2="12" y2="22"/>
          <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
          <line x1="2" y1="12" x2="4" y2="12"/>
          <line x1="20" y1="12" x2="22" y2="12"/>
          <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/>
          <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
        </svg>
      ) : (
        /* Icône lune — cliquer pour passer en sombre */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}
