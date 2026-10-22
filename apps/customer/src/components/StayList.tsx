import { useStays, useStaySearch } from '../hooks/useAuth';
import { useState } from 'react';
import type { Stay } from '@patana/types';

interface StayListProps {
  onSelectStay: (stay: Stay) => void;
}

export function StayList({ onSelectStay }: StayListProps) {
  const [city, setCity] = useState('');
  const { data: stays, isLoading, isError } = useStays(city);
  const searchMutation = useStaySearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    try {
      const results = await searchMutation.mutateAsync(city);
      // Results are cached by useStays with the city key
    } catch {
      // Error handled by query
    }
  };

  return (
    <>
      <form onSubmit={handleSearch} className="search-form">
        <label>
          Destination
          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
        <button type="submit" disabled={searchMutation.isPending}>
          {searchMutation.isPending ? 'Searching…' : 'Search'}
        </button>
      </form>

      {isLoading && <p>Loading…</p>}
      {isError && <p>Could not load stays.</p>}
      {stays?.length === 0 && city && <p>No listings found.</p>}
      {stays && stays.length > 0 && (
        <div className="grid">
          {stays.map((stay) => (
            <article key={stay.id} className="card" onClick={() => onSelectStay(stay)}>
              <h3>{stay.name}</h3>
              <p>{stay.city} · {stay.address}</p>
              {stay.description && <p>{stay.description}</p>}
            </article>
          ))}
        </div>
      )}
    </>
  );
}