import { useState, FormEvent } from 'react';
import { useOwnerAuth } from '../hooks/useOwner';

export function AuthForm() {
  const { login, token } = useOwnerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      await login.mutateAsync({ email, password });
      setPassword('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  if (token) return null;

  return (
    <form className="card auth" onSubmit={handleSubmit}>
      <h2>Host sign in</h2>
      <input
        required
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        required
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={busy}>
        Sign in
      </button>
      <small>
        Create a customer account in the customer app first, then register a host profile here.
      </small>
      {message && <p role="status">{message}</p>}
    </form>
  );
}