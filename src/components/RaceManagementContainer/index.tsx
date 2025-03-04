'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CurrentRace from '@/components/CurrentRace';
import RaceDetailsForm from '@/components/RaceDetailsForm';
import { RaceStatus, RaceClass } from '@/app/store/features/racesSlice';

interface RaceManagementContainerProps {
  activeRace: {
    id: string;
    name: string;
    date?: string;
    raceClasses?: RaceClass[];
    status: RaceStatus;
  } | null;
  isCreatingRace: boolean;
  isEditing: boolean;
  onStartNewRace: () => void;
  onEditRace: () => void;
  onDeleteRace: () => void;
  onSubmitForm: (formData: {
    name: string;
    date: string;
    raceClasses: RaceClass[];
    status: RaceStatus;
  }) => void;
  onCancelForm: () => void;
}

const RaceManagementContainer = ({
  activeRace,
  isCreatingRace,
  isEditing,
  onStartNewRace,
  onEditRace,
  onDeleteRace,
  onSubmitForm,
  onCancelForm,
}: RaceManagementContainerProps) => {
  return (
    <>
      {!activeRace && !isCreatingRace && (
        <div className="flex justify-start">
          <Button
            onClick={onStartNewRace}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" /> Start New Race
          </Button>
        </div>
      )}
      {activeRace && !isEditing && !isCreatingRace && (
        <CurrentRace
          race={activeRace}
          onEdit={onEditRace}
          onDelete={onDeleteRace}
          onCreateNew={onStartNewRace}
        />
      )}
      {(isCreatingRace || isEditing) && (
        <RaceDetailsForm
          isEditing={isEditing}
          initialData={isEditing && activeRace ? {
            name: activeRace.name,
            date: activeRace.date ? new Date(activeRace.date) : undefined,
            raceClasses: activeRace.raceClasses,
          } : undefined}
          onSubmit={onSubmitForm}
          onCancel={onCancelForm}
        />
      )}
    </>
  );
};

export default RaceManagementContainer; 