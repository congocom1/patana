import { useState, FormEvent } from 'react';
import { useBooking, useAuth } from '../hooks/useAuth';
import type { Stay, Unit } from '@patana/types';

interface StayDetailProps {
  stay: Stay;
  onBack: () => void;
}

export function StayDetail({ stay, onBack }: StayDetailProps) {
  const { token } = useAuth();
  const { mutateAsync: book } = useBooking();
  const [unitId, setUnitId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage('Sign in before making a booking request.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await book({ unitId, checkIn, checkOut, guests });
      setMessage('Booking request submitted. This is not a confirmed or paid reservation.');
      onBack();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not book');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <button onClick={onBack}>← Back to stays</button>
      <h2>{stay.name}</h2>
      <p>{stay.city} · {stay.address}</p>
      {stay.description && <p>{stay.description}</p>}

      <form className="card" onSubmit={handleSubmit}>
        <label>
          Room or apartment
          <select required value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            <option value="">Select a unit</option>
            {stay.units.map((unit: Unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} · {unit.capacity} guests · ${unit.pricePerNight}/night
              </option>
            ))}
          </select>
        </label>

        <div className="date-row">
          <label>
            Check-in
            <input
              type="date"
              required
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </label>
          <label>
            Check-out
            <input
              type="date"
              required
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </label>
        </div>

        <label>
          Guests
          <input
            type="number"
            min="1"
            max="100"
            required
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          />
        </label>

        <button type="submit" disabled={busy || !token}>
          {busy ? 'Booking…' : 'Request booking'}
        </button>

        {!token && <p className="hint">Sign in to book</p>}
        {message && <p role="status">{message}</p>}
      </form>
    </section>
  );
}