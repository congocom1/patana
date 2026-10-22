import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { AuthForm } from './components/AuthForm';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { useOwnerAuth } from './hooks/useOwner';
import './styles.css';

// Lazy-loaded pages for code splitting
const DashboardPageLazy = lazy(() => import('./pages/DashboardPage'));
const LoginPageLazy = lazy(() => import('./pages/LoginPage'));

function LoadingFallback() {
  return <div className="loading">Loading…</div>;
}

function OwnerApp() {
  const { token, logout } = useOwnerAuth();

  return (
    <>
      <Header onSignOut={logout} />
      <main>
        <span className="tag">OWNER WORKSPACE</span>
        <h1>Your place. Your business.</h1>
        <p>List properties, manage room rates and review incoming requests.</p>
        {!token && <AuthForm />}
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPageLazy />} />
            <Route path="/" element={<DashboardPageLazy />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <OwnerApp />
      </BrowserRouter>
    </AppProvider>
  );
}