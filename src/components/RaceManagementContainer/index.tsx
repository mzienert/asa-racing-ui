'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CurrentRace from '@/components/CurrentRace';
import RaceDetailsForm from '@/components/RaceDetailsForm';
import { Race } from '@/store/features/racesSlice';

interface RaceManagementContainerProps {
  activeRace: Race | null;
  hasActiveRace: boolean;
  onDeleteRace: () => void;
  onSetCurrentRace: (id: string) => void;
}

const RaceManagementContainer = ({
  activeRace,
  hasActiveRace,
  onDeleteRace,
  onSetCurrentRace,
}: RaceManagementContainerProps) => {
  const [isCreatingRace, setIsCreatingRace] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCancelForm = () => {
    setIsCreatingRace(false);
    setIsEditing(false);
  };

  if (!activeRace && !isCreatingRace) {
    return (
      <div className="flex justify-start">
        <Button
          onClick={() => setIsCreatingRace(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" /> Start New Race
        </Button>
      </div>
    );
  }

  if (activeRace && !isEditing && !isCreatingRace) {
    return (
      <CurrentRace
        race={activeRace}
        onEdit={() => setIsEditing(true)}
        onDelete={onDeleteRace}
        onCreateNew={() => setIsCreatingRace(true)}
      />
    );
  }

  return (
    <RaceDetailsForm
      isEditing={isEditing}
      initialData={isEditing && activeRace ? {
        id: activeRace.id,
        name: activeRace.name,
        date: activeRace.date ? new Date(activeRace.date) : undefined,
        raceClasses: activeRace.raceClasses,
      } : undefined}
      hasActiveRace={hasActiveRace}
      onSetCurrentRace={onSetCurrentRace}
      onCancel={handleCancelForm}
    />
  );
};

export default RaceManagementContainer;
