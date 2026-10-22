import { useTrips } from '../hooks/useAuth';

interface TripsProps {
  token?: string;
}

export function Trips({ token }: TripsProps) {
  const { data: trips, isLoading, isError } = useTrips(token);

  if (!token) return <p>Sign in to view your trips.</p>;
  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p>Could not load bookings.</p>;

  return (
    <section>
      <h2>My reservations</h2>
      {trips?.length ? (
        <div className="grid">
          {trips.map((booking) => (
            <article key={booking.id} className="card">
              <h3>{booking.unit?.property.name}</h3>
              <p>{booking.unit?.name}</p>
              <p>{booking.checkIn.slice(0, 10)} – {booking.checkOut.slice(0, 10)}</p>
              <strong>${booking.totalPrice} · {booking.status}</strong>
            </article>
          ))}
        </div>
      ) : (
        <p>No reservations yet.</p>
      )}
    </section>
  );
}