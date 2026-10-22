import { useOwnerAuth } from '../hooks/useOwner';

interface HeaderProps {
  onSignOut: () => void;
}

export function Header({ onSignOut }: HeaderProps) {
  return (
    <header>
      <span className="brand">✳ Patana · Owner</span>
      <button onClick={onSignOut}>Sign out</button>
    </header>
  );
}