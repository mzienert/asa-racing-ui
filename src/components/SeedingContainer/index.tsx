import { Racer } from '@/store/features/racersSlice';
import { RaceClassStatus } from '@/store/features/racesSlice';
import { RaceClassHeader } from '../RaceClassHeader';
import { Lock } from 'lucide-react';
import SeedingList from '../SeedingList';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { updatePersistedRacer } from '@/store/features/racersSlice';
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

  return (
    <div>
      {showDivider && <div className="h-px bg-border my-6" />}
      <div className="space-y-4">
        <RaceClassHeader raceClassName={raceClass.raceClass} status={raceClass.status} />
        <div className="space-y-4">
          {raceClass.status !== RaceClassStatus.Seeding && (
            <SeedingWarning message="This race class cannot be seeded. Please complete the racers in this class in order to seed the race." />
          )}
          <SeedingList
            racers={racersByClass[raceClass.raceClass] || []}
            seedTimes={seedTimes}
            onSaveTime={handleSaveTime}
            onClearTime={handleClearTime}
            onAcceptTime={handleAcceptTime}
            raceClass={raceClass.raceClass}
            status={raceClass.status}
            raceId={raceClass.raceId}
          />
        </div>
      </div>
    </div>
  );
};

export default SeedingContainer;
