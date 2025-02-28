import React, { useState } from 'react';
import { Racer } from '@/app/store/features/racersSlice';
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDispatch } from 'react-redux';
import { updatePersistedRacer } from '@/app/store/features/racersSlice';
import type { AppDispatch } from '@/app/store/store';
import { RaceMatch } from './RaceMatch';

interface BracketViewProps {
  racers: Racer[];
}

interface RoundGroupProps {
  groups: Racer[][];
  roundIndex: number;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface RaceMatchProps {
  raceNumber: number;
  position: 'left' | 'right';
  racers?: Racer[];
}

interface RacerItemProps {
  racer: Racer;
}

// Draggable racer component
function RacerItem({ racer }: RacerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: racer.id });

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
      className="p-2 bg-white border rounded shadow-sm mb-2 cursor-move"
    >
      {racer.name}
    </div>
  );
}

// Component for a round (group of 4 racers / 2 races)
/* eslint-disable @typescript-eslint/no-unused-vars */
const RoundGroup: React.FC<RoundGroupProps> = ({ groups, roundIndex }) => {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-gray-50">
      <div className="text-sm font-semibold mb-2">Round {roundIndex + 1}</div>
      <div className="flex gap-4">
        {groups.map((group, groupIndex) => (
          <div 
            key={groupIndex}
            className="p-4 border rounded bg-white"
          >
            <div className="text-sm font-semibold mb-2">Race {roundIndex * 2 + groupIndex + 1}</div>
            <SortableContext
              items={group.map(racer => racer.id)}
              strategy={verticalListSortingStrategy}
            >
              {group.map((racer) => (
                <RacerItem key={racer.id} racer={racer} />
              ))}
            </SortableContext>
          </div>
        ))}
      </div>
    </div>
  );
};

const BracketView: React.FC<BracketViewProps> = ({ racers }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeRacer, setActiveRacer] = useState<Racer | null>(null);
  
  // Initialize first round groups (4 racers per group)
  const [firstRoundGroups, setFirstRoundGroups] = useState(() => {
    const groups: Racer[][] = [];
    for (let i = 0; i < racers.length; i += 4) {
      groups.push(racers.slice(i, i + 4));
    }
    return groups;
  });

  // Calculate number of races needed for subsequent rounds
  const numFirstRoundRaces = firstRoundGroups.length;
  const numSemiFinalRaces = Math.ceil(numFirstRoundRaces / 2);
  const numSecondChanceRaces = Math.floor(numFirstRoundRaces / 2);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [semiFinalGroups, setSemiFinalGroups] = useState<Racer[][]>(
    Array(numSemiFinalRaces).fill([])
  );
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [finalGroup, setFinalGroup] = useState<Racer[]>([]);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [secondChanceGroups, setSecondChanceGroups] = useState<Racer[][]>(
    Array(numSecondChanceRaces).fill([])
  );
  /* eslint-disable @typescript-eslint/no-unused-vars */ 
  const [secondChanceFinal, setSecondChanceFinal] = useState<Racer[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeGroup = firstRoundGroups.find(group => 
      group.some(racer => racer.id === active.id)
    );
    const draggedRacer = activeGroup?.find(racer => racer.id === active.id);
    if (draggedRacer) {
      setActiveRacer(draggedRacer);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveRacer(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeGroupIndex = firstRoundGroups.findIndex(group => 
      group.some(racer => racer.id === activeId)
    );
    const overGroupIndex = firstRoundGroups.findIndex(group => 
      group.some(racer => racer.id === overId)
    );

    if (activeGroupIndex === -1 || overGroupIndex === -1) return;

    setFirstRoundGroups(prevGroups => {
      const newGroups = JSON.parse(JSON.stringify(prevGroups));
      const activeGroup = newGroups[activeGroupIndex];
      const overGroup = newGroups[overGroupIndex];

      if (activeGroupIndex === overGroupIndex) {
        // Same group logic remains unchanged
        const oldIndex = activeGroup.findIndex((racer: Racer) => racer.id === activeId);
        const newIndex = activeGroup.findIndex((racer: Racer) => racer.id === overId);
        
        const [movedRacer] = activeGroup.splice(oldIndex, 1);
        activeGroup.splice(newIndex, 0, movedRacer);
      } else {
        // Remove from active group
        const movedRacerIndex = activeGroup.findIndex((racer: Racer) => racer.id === activeId);
        const [movedRacer] = activeGroup.splice(movedRacerIndex, 1);
        
        // Add to over group
        const overIndex = overGroup.findIndex((racer: Racer) => racer.id === overId);
        overGroup.splice(overIndex, 0, movedRacer);

        // If over group now has more than 4 racers, move the last one back
        if (overGroup.length > 4) {
          const excessRacer = overGroup.pop()!;
          activeGroup.push(excessRacer);
        }
      }

      // Update positions for all affected groups
      [activeGroup, overGroup].forEach((group: Racer[]) => {
        group.forEach((racer: Racer, idx: number) => {
          racer.position = idx + 1;
          dispatch(updatePersistedRacer(racer));
        });
      });
      
      return newGroups;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-8">
        {/* Second Chance Column */}
        <div className="w-[250px]">
          <h3 className="text-lg font-semibold mb-4">Second Chance</h3>
          <div className="space-y-8">
            <div className="space-y-4">
              {secondChanceGroups.map((group, index) => (
                <RaceMatch
                  key={`second-chance-${index}`}
                  raceNumber={numFirstRoundRaces + index + 1}
                  racers={group}
                  position="left"
                />
              ))}
            </div>
            {numSecondChanceRaces > 0 && (
              <div>
                <RaceMatch
                  raceNumber={numFirstRoundRaces + numSecondChanceRaces + numSemiFinalRaces + 1}
                  racers={secondChanceFinal}
                  position="left"
                />
              </div>
            )}
          </div>
        </div>

        {/* Main Bracket Column */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-4">First Round</h3>
          <div className="space-y-4">
            {firstRoundGroups.map((group, index) => (
              <RaceMatch
                key={`first-round-${index}`}
                raceNumber={index + 1}
                racers={group}
              />
            ))}
          </div>
        </div>

        {/* Elimination Column */}
        <div className="w-[250px]">
          <h3 className="text-lg font-semibold mb-4">Eliminations</h3>
          <div className="space-y-8">
            <div className="space-y-4">
              {semiFinalGroups.map((group, index) => (
                <RaceMatch
                  key={`semi-final-${index}`}
                  raceNumber={numFirstRoundRaces + numSecondChanceRaces + index + 1}
                  racers={group}
                  position="right"
                />
              ))}
            </div>
            {numSemiFinalRaces > 0 && (
              <div>
                <RaceMatch
                  raceNumber={numFirstRoundRaces + numSecondChanceRaces + numSemiFinalRaces + 2}
                  racers={finalGroup}
                  position="right"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeRacer ? (
          <div className="p-2 bg-white border rounded shadow-sm cursor-move flex justify-between items-center">
            <span>{activeRacer.name}</span>
            <span className="text-gray-500 text-sm">#{activeRacer.bibNumber}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BracketView; 