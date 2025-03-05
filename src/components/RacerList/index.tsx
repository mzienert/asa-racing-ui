import type { Racer } from '@/store/features/racersSlice';
import { RaceClassStatus } from '@/store/features/racesSlice';
import { RacerRow } from '@/components/RacerRow';
import { useState } from 'react';

interface RacerListProps {
  racers: Racer[];
  raceClassStatus: RaceClassStatus;
  raceClass: string;
  onEditingStateChange?: (isEditing: boolean, racer: Racer | null) => void;
}

export const RacerList = ({
  racers,
  raceClassStatus,
  onEditingStateChange,
}: RacerListProps) => {
  const [editingRacer, setEditingRacer] = useState<Racer | null>(null);

  const handleSetEditingRacer = (racer: Racer | null) => {
    setEditingRacer(racer);
    onEditingStateChange?.(!!racer, racer);
  };

  if (!racers?.length) {
    return (
      <div className="text-left text-muted-foreground bg-muted/20 p-6 rounded-md">
        <p>No racers in this class yet. Add your first racer below.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {racers.map(racer => (
        <RacerRow
          key={racer.id}
          racer={racer}
          raceClassStatus={raceClassStatus}
          editingRacer={editingRacer}
          onSetEditingRacer={handleSetEditingRacer}
        />
      ))}
    </div>
  );
}; 