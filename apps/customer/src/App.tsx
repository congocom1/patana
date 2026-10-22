import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { AuthForm } from './components/AuthForm';
import { useAuth } from './hooks/useAuth';
import './styles.css';

// Lazy-loaded pages for code splitting
const SearchPage = lazy(() => import('./pages/SearchPage'));
const TripsPage = lazy(() => import('./pages/TripsPage'));

function LoadingFallback() {
  return <div className="loading">Loading…</div>;
}

function CustomerApp() {
  const { token } = useAuth();

  return (
    <>
      <Header onNavigate={(screen) => {
        if (screen === 'search') window.history.pushState(null, '', '/');
        else window.history.pushState(null, '', '/trips');
      }} />
      <main>
        <span className="tag">FIND YOUR NEXT CHAPTER</span>
        <h1>Stay somewhere you'll remember.</h1>
        <p>Discover welcoming hotels and apartments. Know the costs before you request a stay.</p>
        {!token && <AuthForm />}
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/trips" element={<TripsPage />} />
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
        <CustomerApp />
      </BrowserRouter>
    </AppProvider>
  );
}