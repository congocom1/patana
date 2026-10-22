import { Trips } from '../components/Trips';
import { useAuth } from '../hooks/useAuth';

export function TripsPage() {
  const { token } = useAuth();
  return <Trips token={token ?? undefined} />;
}

export default TripsPage;