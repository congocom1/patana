import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

export function AuthForm() {
  const { login, register, token } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      if (isRegister) {
        await register.mutateAsync({ name, email, password });
      } else {
        await login.mutateAsync({ email, password });
      }
      setPassword('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  if (token) return null;

  return (
    <form className="card auth" onSubmit={handleSubmit}>
      <h2>{isRegister ? 'Create your account' : 'Sign in to book'}</h2>
      {isRegister && (
        <input
          required
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
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
        minLength={isRegister ? 12 : 1}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={busy}>
        {isRegister ? 'Register' : 'Sign in'}
      </button>
      <button type="button" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Have an account? Sign in' : 'Create an account'}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}