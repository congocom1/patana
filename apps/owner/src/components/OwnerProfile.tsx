import { useOwnerAuth, useOwnerProfile } from '../hooks/useOwner';
import { useState, FormEvent } from 'react';

export function OwnerProfile() {
  const { token, isAuthenticated, registerOwner } = useOwnerAuth();
  const { data: profile, isLoading, isError } = useOwnerProfile(token ?? undefined);
  const [business, setBusiness] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated) return null;
  if (isLoading) return <p>Loading host profile…</p>;
  if (isError) return <p>Could not load profile.</p>;

  if (!profile) {
    return (
      <form className="card" onSubmit={async (e) => {
        e.preventDefault();
        if (!business.trim()) return;
        setBusy(true);
        try {
          await registerOwner.mutateAsync(business);
          setMessage('Host profile created successfully!');
        } catch (err) {
          setMessage(err instanceof Error ? err.message : 'Failed to create host profile');
        } finally {
          setBusy(false);
        }
      }}>
        <h2>Become a host</h2>
        <input
          required
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          placeholder="Business name"
        />
        <button type="submit" disabled={busy}>
          Create host profile
        </button>
        {message && <p role="status">{message}</p>}
      </form>
    );
  }

  return (
    <>
      <div className="grid">
        <div className="card">
          <h2>{profile.businessName}</h2>
          <p>Verification: {profile.verificationStatus}</p>
        </div>
      </div>
    </>
  );
}