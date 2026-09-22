import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';

import Landing     from './pages/Landing';
import Login       from './pages/Login';
import SelectionContenu from './pages/SelectionContenu';
import Dashboard   from './pages/Dashboard';
import Cours       from './pages/Cours';
import Quiz        from './pages/Quiz';
import Exercices   from './pages/Exercices';
import Actualite   from './pages/Actualite';
import Classement  from './pages/Classement';
import IA          from './pages/IA';
import Boutique    from './pages/Boutique';
import MesDocuments from './pages/MesDocuments';
import Messages    from './pages/Messages';
import Communaute  from './pages/Communaute';
import Abonnement  from './pages/Abonnement';
import Profil      from './pages/Profil';
import Admin       from './pages/admin/Admin';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg2)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.2rem', fontWeight:700, color:'var(--copper)', marginBottom:8 }}>Madior Insight</div>
        <div style={{ fontSize:'0.84rem', color:'var(--muted)' }}>Chargement…</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  /* Tant que la sélection de cours + TD n'est pas confirmée, on bloque l'accès
     au reste du site (sauf la page de sélection elle-même). */
  if (!user.contenuChoisiConfirme) return <Navigate to="/choisir-contenu" replace />;
  return children;
}

/* La page de sélection est elle-même protégée par la connexion, mais accessible
   même si contenuChoisiConfirme est encore false (c'est justement son rôle). */
function ProtectedSansContenu({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

/* L'admin doit être connecté ET marqué is_admin — sinon retour au dashboard
   (ou au login s'il n'est même pas connecté). Sans cette garde, n'importe
   qui pouvait atteindre /admin directement par l'URL. */
function AdminProtected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"           element={<Landing />} />
      <Route path="/login"      element={<Login />} />
      <Route path="/choisir-contenu" element={<ProtectedSansContenu><SelectionContenu /></ProtectedSansContenu>} />
      <Route path="/dashboard"  element={<Protected><Dashboard /></Protected>} />
      <Route path="/cours"      element={<Protected><Cours /></Protected>} />
      <Route path="/quiz"       element={<Protected><Quiz /></Protected>} />
      <Route path="/exercices"  element={<Protected><Exercices /></Protected>} />
      <Route path="/actualite"  element={<Protected><Actualite /></Protected>} />
      <Route path="/classement" element={<Protected><Classement /></Protected>} />
      <Route path="/ia"         element={<Protected><IA /></Protected>} />
      <Route path="/mes-documents" element={<Protected><MesDocuments /></Protected>} />
      <Route path="/boutique"   element={<Protected><Boutique /></Protected>} />
      <Route path="/messages"   element={<Protected><Messages /></Protected>} />
      <Route path="/communaute" element={<Protected><Communaute /></Protected>} />
      <Route path="/abonnement" element={<Protected><Abonnement /></Protected>} />
      <Route path="/profil"     element={<Protected><Profil /></Protected>} />
      <Route path="/admin"      element={<AdminProtected><Admin /></AdminProtected>} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
