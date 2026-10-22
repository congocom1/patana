import { useAuth } from '../hooks/useAuth';

export function Header({ onNavigate }: { onNavigate: (screen: 'search' | 'trips') => void }) {
  const { token, logout } = useAuth();

  return (
    <header>
      <span className="brand">✳ Patana <span className="tag"> · Customer</span></span>
      <nav>
        <button onClick={() => onNavigate('search')}>Explore</button>
        <button onClick={() => onNavigate('trips')}>My trips</button>
        {token && <button onClick={logout}>Sign out</button>}
      </nav>
    </header>
  );
}