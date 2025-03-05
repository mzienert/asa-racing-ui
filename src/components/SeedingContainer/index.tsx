import { Racer } from '@/store/features/racersSlice';
import { RaceClassStatus, Race } from '@/store/features/racesSlice';
import { RaceClassHeader } from '../RaceClassHeader';
import { Lock } from 'lucide-react';
import SeedingList from '../SeedingList';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { updatePersistedRacer } from '@/store/features/racersSlice';
import { updatePersistedRace } from '@/store/features/racesSlice';
import { toast } from 'sonner';

interface SeedingContainerProps {
  raceClass: {
    raceClass: string;
    status: RaceClassStatus;
    raceId: string;
  };
  racersByClass: Record<string, Racer[]>;
  showDivider?: boolean;
}

interface SeedingWarningProps {
  message: string;
}

const SeedingWarning = ({ message }: SeedingWarningProps) => (
  <div className="flex items-center gap-2 p-4 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
    <Lock className="h-5 w-5" />
    <p>{message}</p>
  </div>
);

const SeedingContainer = ({
  raceClass,
  racersByClass,
  showDivider = true,
}: SeedingContainerProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [seedTimes, setSeedTimes] = useState<Record<string, string>>({});
  
  // Get the current race ID from the store
  const currentRaceId = useSelector((state: RootState) => state.races.currentRaceId);
  
  // Get the full race object from the store
  const race = useSelector((state: RootState) => 
    state.races.items.find(r => r.id === currentRaceId)
  );

  useEffect(() => {
    if (racersByClass[raceClass.raceClass]?.length > 0) {
      const initialSeedTimes: Record<string, string> = {};
      racersByClass[raceClass.raceClass].forEach(racer => {
        if (racer.seedData?.time) {
          initialSeedTimes[racer.id] = racer.seedData.time;
        }
      });
      setSeedTimes(initialSeedTimes);
    }
  }, [racersByClass, raceClass.raceClass]);

  // Early return if no currentRaceId
  if (!currentRaceId) {
    return null;
  }

  const handleStatusChange = async (newStatus: RaceClassStatus) => {
    if (!race) {
      toast.error('Race not found');
      return;
    }

    try {
      // Update the specific race class status within the race
      const updatedRaceClasses = race.raceClasses.map(rc => 
        rc.raceClass === raceClass.raceClass
          ? { ...rc, status: newStatus }
          : rc
      );

      const updatedRace: Race = {
        ...race,
        raceClasses: updatedRaceClasses
      };

      await dispatch(updatePersistedRace(updatedRace)).unwrap();
      toast.success('Race status updated successfully');
    } catch (error) {
      toast.error('Failed to update race status');
      console.error('Error updating race status:', error);
    }
  };

  const handleSaveTime = (racerId: string, raceClass: string) => {
    const racer = racersByClass[raceClass]?.find(r => r.id === racerId);
    if (!racer || !seedTimes[racerId]) return;

    const updatedRacer: Racer = {
      ...racer,
      seedData: {
        time: seedTimes[racerId],
        startingPosition: null,
      },
    };

    dispatch(updatePersistedRacer(updatedRacer))
      .unwrap()
      .then(() => {
        toast.success('Seed time saved successfully');
      })
      .catch((error: Error) => {
        toast.error('Failed to save seed time');
        console.error('Error saving seed time:', error);
      });
  };

  const handleClearTime = (racerId: string) => {
    setSeedTimes(prev => {
      const newTimes = { ...prev };
      delete newTimes[racerId];
      return newTimes;
    });
  };

  const handleAcceptTime = (racerId: string, value: string) => {
    setSeedTimes(prev => ({ ...prev, [racerId]: value }));
  };

  return (
    <div>
      {showDivider && <div className="h-px bg-border my-6" />}
      <div className="space-y-4">
        <RaceClassHeader raceClassName={raceClass.raceClass} status={raceClass.status} />
        <div className="space-y-4">
          {raceClass.status !== RaceClassStatus.Seeding && (
            <SeedingWarning message={
              raceClass.status === RaceClassStatus.Racing
                ? "Race seeding is locked. This race is now in progress."
                : "This race class cannot be seeded. Please complete the racers in this class in order to seed the race."
            } />
          )}
          <SeedingList
            racers={racersByClass[raceClass.raceClass] || []}
            seedTimes={seedTimes}
            onSaveTime={handleSaveTime}
            onClearTime={handleClearTime}
            onAcceptTime={handleAcceptTime}
            raceClass={raceClass.raceClass}
            status={raceClass.status}
            raceId={currentRaceId}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
};

export default SeedingContainer;
