import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const colors = {
    success: { bg: '#059669', border: '#047857' },
    error:   { bg: '#DC2626', border: '#B91C1C' },
    warning: { bg: '#D97706', border: '#B45309' },
    info:    { bg: '#C4621A', border: '#A85118' },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:9999, display:'flex', flexDirection:'column', gap:8, alignItems:'center', pointerEvents:'none' }}>
        {toasts.map(t => {
          const c = colors[t.type] || colors.info;
          return (
            <div key={t.id} style={{
              background: c.bg,
              borderLeft: `4px solid ${c.border}`,
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 600,
              maxWidth: '90vw',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              animation: 'fadeInUp 0.3s ease',
            }}>
              {t.msg}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
