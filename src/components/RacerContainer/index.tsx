import { RaceClassStatus, updatePersistedRace } from '@/store/features/racesSlice';
import { AlertCircle } from 'lucide-react';
import RacerForm from '@/components/RacerForm';
import type { Racer } from '@/store/features/racersSlice';
import { RaceClassHeader } from '@/components/RaceClassHeader';
import { RacerList } from '@/components/RacerList';
import { useDispatch, useSelector } from 'react-redux';
import { selectActiveRace, selectRaceClassByRaceId } from '@/store/selectors/raceSelectors';
import { toast } from 'sonner';
import type { AppDispatch, RootState } from '@/store/store';
import { useState } from 'react';

interface RacerContainerProps {
  raceClass: {
    raceClass: string;
    status: RaceClassStatus;
  };
  racersByClass: Record<string, Racer[]>;
  showDivider?: boolean;
  selectedRaceId: string;
}

export const RacerContainer = ({
  raceClass,
  racersByClass,
  showDivider = true,
  selectedRaceId,
}: RacerContainerProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const activeRace = useSelector(selectActiveRace);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRacer, setEditingRacer] = useState<Racer | null>(null);

  const selectedRaceClass = useSelector((state: RootState) =>
    selectRaceClassByRaceId(state, selectedRaceId, raceClass.raceClass)
  );

  const currentStatus = selectedRaceClass?.status || RaceClassStatus.Created;

  const handleCompleteClass = (raceClass: string) => {
    if (activeRace) {
      const updatedRaceClasses = activeRace.raceClasses.map(rc =>
        rc.raceClass === raceClass ? { ...rc, status: RaceClassStatus.Seeding } : rc
      );

      dispatch(
        updatePersistedRace({
          ...activeRace,
          raceClasses: updatedRaceClasses,
        })
      );
      toast.success(`${raceClass?.replace('-', ' ') || raceClass} is now ready for seeding`);
    }
  };

  const handleEditingStateChange = (isEditing: boolean, racer: Racer | null = null) => {
    setIsEditing(isEditing);
    setEditingRacer(racer);
  };

  return (
    <div>
      {showDivider && <div className="h-px bg-border my-6" />}
      <div className="space-y-4">
        <RaceClassHeader raceClassName={raceClass.raceClass} status={currentStatus} />

        <div className="space-y-4">
          <RacerList
            racers={racersByClass[raceClass.raceClass] || []}
            raceClassStatus={currentStatus}
            raceClass={raceClass.raceClass}
            onEditingStateChange={(isEditing, racer) => handleEditingStateChange(isEditing, racer)}
          />

          {currentStatus === RaceClassStatus.Created ? (
            <RacerForm
              raceClass={raceClass.raceClass}
              raceId={selectedRaceId}
              onComplete={() => handleCompleteClass(raceClass.raceClass)}
              showComplete={!isEditing}
              editingRacer={editingRacer}
              onEditComplete={() => handleEditingStateChange(false)}
            />
          ) : (
            <div className="flex items-center gap-2 p-4 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <AlertCircle className="h-5 w-5" />
              <p>
                Racers for this class are now locked. This race class is in{' '}
                {currentStatus.toLowerCase()} status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RacerContainer;
