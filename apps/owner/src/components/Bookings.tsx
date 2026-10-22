import { useOwnerAuth, useOwnerBookings } from '../hooks/useOwner';

export function Bookings() {
  const { token, isAuthenticated } = useOwnerAuth();
  const { data: bookings, isLoading, isError } = useOwnerBookings(token ?? undefined);

  if (!isAuthenticated) return null;

  return (
    <section>
      <h2>Incoming reservations</h2>
      {isLoading && <p>Loading…</p>}
      {isError && <p>Could not load bookings.</p>}
      {bookings?.length ? (
        <div className="grid">
          {bookings.map((b) => (
            <article key={b.id} className="card">
              <h3>{b.unit?.property.name}</h3>
              <p>{b.unit?.name}</p>
              <p>{b.checkIn.slice(0, 10)} – {b.checkOut.slice(0, 10)}</p>
              <strong>${b.totalPrice} · {b.status}</strong>
            </article>
          ))}
        </div>
      ) : (
        <p>No reservations yet.</p>
      )}
    </section>
  );
}