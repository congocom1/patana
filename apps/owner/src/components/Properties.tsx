import { useOwnerAuth, useOwnerProperties, useCreateProperty } from '../hooks/useOwner';
import { useState, FormEvent } from 'react';

export function Properties() {
  const { token, isAuthenticated } = useOwnerAuth();
  const { data: properties, isLoading, isError } = useOwnerProperties(token ?? undefined);
  const createProperty = useCreateProperty(token!);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [kind, setKind] = useState('apartment');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      await createProperty.mutateAsync({ name, city, address, type: kind });
      setName(''); setCity(''); setAddress('');
      setMessage('Property created successfully!');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create property');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="grid">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Add property</h2>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Property name" />
        <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
        <input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="apartment">Apartment</option>
          <option value="hotel">Hotel</option>
        </select>
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Add property'}
        </button>
        {message && <p role="status">{message}</p>}
      </form>

      {isLoading && <p>Loading…</p>}
      {isError && <p>Could not load properties.</p>}
      {properties?.map((p) => (
        <div key={p.id} className="card">
          <h3>{p.name}</h3>
          <p>{p.city} · {p.address}</p>
        </div>
      ))}
    </section>
  );
}