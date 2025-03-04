import React from 'react';
import { Racer } from '@/store/features/racersSlice';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RacerItem } from './RacerItem'; // We'll create this separately

interface RaceMatchProps {
  raceNumber: number;
  position?: 'left' | 'right';
  racers: Racer[];
}

export const RaceMatch: React.FC<RaceMatchProps> = ({
  raceNumber,
  //position = 'left',
  racers = [],
}) => {
  return (
    <div className="relative border rounded-md p-2 w-[220px] bg-white shadow-sm">
      <div className="text-sm font-medium mb-2">Race {raceNumber}</div>
      <SortableContext items={racers.map(racer => racer.id)} strategy={verticalListSortingStrategy}>
        {racers.map(racer => (
          <RacerItem key={racer.id} racer={racer} />
        ))}
      </SortableContext>
    </div>
  );
};
