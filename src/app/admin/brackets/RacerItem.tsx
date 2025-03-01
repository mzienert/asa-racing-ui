import React from 'react';
import { Racer } from '@/app/store/features/racersSlice';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RacerItemProps {
  racer: Racer;
}

export const RacerItem: React.FC<RacerItemProps> = ({ racer }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: racer.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-2 bg-white border-b last:border-b-0 cursor-move hover:bg-gray-50 flex justify-between items-center"
    >
      <span>{racer.name}</span>
      <span className="text-gray-500 text-sm">#{racer.bibNumber}</span>
    </div>
  );
};
