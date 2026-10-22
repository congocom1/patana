import { OwnerProfile } from '../components/OwnerProfile';
import { Properties } from '../components/Properties';
import { Bookings } from '../components/Bookings';

export function DashboardPage() {
  return (
    <>
      <OwnerProfile />
      <Properties />
      <Bookings />
    </>
  );
}

export default DashboardPage;