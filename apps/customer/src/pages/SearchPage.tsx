import { StayList } from '../components/StayList';
import { StayDetail } from '../components/StayDetail';
import { useState } from 'react';
import type { Stay } from '@patana/types';

export function SearchPage() {
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);

  if (selectedStay) {
    return <StayDetail stay={selectedStay} onBack={() => setSelectedStay(null)} />;
  }

  return <StayList onSelectStay={setSelectedStay} />;
}

export default SearchPage;