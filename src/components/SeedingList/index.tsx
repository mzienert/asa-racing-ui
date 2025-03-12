import { Racer, updatePersistedRacer } from '@/store/features/racersSlice';
import { IMaskInput } from 'react-imask';
import IMask from 'imask';
import { Check, X, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { RaceClassStatus, updatePersistedRace } from '@/store/features/racesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { createBracket } from '@/store/features/bracketSlice';
import { toast } from 'sonner';
import ConfirmationDialog from '../ConfirmationDialog';
import { useState } from 'react';

interface SeedingListProps {
  racers: Racer[];
  seedTimes: Record<string, string>;
  onSaveTime: (racerId: string, raceClass: string) => void;
  onClearTime: (racerId: string) => void;
  onAcceptTime: (racerId: string, value: string) => void;
  raceClass: string;
  status: RaceClassStatus;
  raceId: string;
  onStatusChange?: (status: RaceClassStatus) => void;
}

const SeedingList = ({
  racers,
  seedTimes,
  onSaveTime,
  onClearTime,
  onAcceptTime,
  raceClass,
  status,
  raceId,
}: SeedingListProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeRacerId, setActiveRacerId] = useState<string | null>(null);

  // Get the current race from the store
  const race = useSelector((state: RootState) => {
    return state.races.items.find(r => r.id === raceId);
  });

  const handleCompleteSeeding = async () => {
    setShowConfirmDialog(false);

    if (!race) {
      toast.error('Race not found');
      return;
    }

    // Get racers with seed times and sort them
    const racersWithTimes = racers
      .filter(racer => racer.seedData?.time)
      .sort((a, b) => {
        const timeA = a.seedData.time || '';
        const timeB = b.seedData.time || '';
        return timeA.localeCompare(timeB);
      });

    if (racersWithTimes.length === 0) {
      toast.error('No seed times have been saved');
      return;
    }

    try {
      // Update each racer with their starting position
      const updatedRacers = [];
      for (let i = 0; i < racersWithTimes.length; i++) {
        const racer = racersWithTimes[i];
        const updatedRacer: Racer = {
          ...racer,
          seedData: {
            ...racer.seedData,
            startingPosition: i + 1,
          },
        };
        await dispatch(updatePersistedRacer(updatedRacer)).unwrap();
        updatedRacers.push(updatedRacer);
      }

      // Create the bracket with the updated racers
      await dispatch(
        createBracket({
          racers: updatedRacers,
          raceId,
          raceClass,
        })
      ).unwrap();

      // Update the race class status to Racing
      const updatedRaceClasses = race.raceClasses.map(rc => {
        console.log('Checking race class:', rc.raceClass, 'against:', raceClass);
        return rc.raceClass === raceClass ? { ...rc, status: RaceClassStatus.Racing } : rc;
      });

      const updatedRace = {
        ...race,
        raceClasses: updatedRaceClasses,
      };

      await dispatch(updatePersistedRace(updatedRace)).unwrap();

      toast.success('Starting positions assigned and bracket created successfully');
    } catch (error) {
      console.error('Error in complete seeding:', error);
      toast.error('Failed to complete seeding');
    }
  };

  const handleRowClick = (racerId: string) => {
    setActiveRacerId(activeRacerId === racerId ? null : racerId);
  };

  if (racers.length === 0) {
    return (
      <div className="text-left text-muted-foreground bg-muted/20 p-6 rounded-md">
        <p>No racers in this class yet. Add your first racer below.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {racers.map(racer => (
        <div
          key={racer.id}
          className={`rounded-md transition-all duration-200 ${
            activeRacerId === racer.id ? 'bg-muted/50' : 'bg-muted/30'
          }`}
        >
          <div
            onClick={() => status === RaceClassStatus.Seeding && handleRowClick(racer.id)}
            className={`flex items-center justify-between p-3 ${
              status === RaceClassStatus.Seeding ? 'cursor-pointer hover:bg-muted/40' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="font-medium text-primary">#{racer.bibNumber}</span>
              <span>{racer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {status === RaceClassStatus.Seeding && (
                <>
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {racer.seedData?.time || 'Add time'}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      activeRacerId === racer.id ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
              {status !== RaceClassStatus.Seeding && racer.seedData?.time && (
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {racer.seedData.time}
                </span>
              )}
            </div>
          </div>

          {status === RaceClassStatus.Seeding && activeRacerId === racer.id && (
            <div className="p-3 pt-0 border-t border-muted/20">
              <div className="flex items-center gap-2">
                <IMaskInput
                  name={`time-${racer.id}`}
                  className="w-32 px-3 py-1 rounded-md border border-input bg-background"
                  mask={[
                    {
                      mask: '00:00:000',
                      blocks: {
                        mm: {
                          mask: IMask.MaskedRange,
                          from: 0,
                          to: 59,
                          maxLength: 2,
                        },
                        ss: {
                          mask: IMask.MaskedRange,
                          from: 0,
                          to: 59,
                          maxLength: 2,
                        },
                        ms: {
                          mask: IMask.MaskedRange,
                          from: 0,
                          to: 999,
                          maxLength: 3,
                        },
                      },
                      lazy: false,
                      pattern: 'mm:ss:ms',
                    },
                  ]}
                  unmask={false}
                  placeholder="00:00:000"
                  value={seedTimes[racer.id] || ''}
                  onAccept={value => onAcceptTime(racer.id, value)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => {
                    onSaveTime(racer.id, raceClass);
                    setActiveRacerId(null);
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onClearTime(racer.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {status === RaceClassStatus.Seeding && (
        <div className="flex justify-start mt-4">
          <Button
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4"
            onClick={() => setShowConfirmDialog(true)}
          >
            <CheckCircle className="h-5 w-5" />
            Complete Seeding
          </Button>
        </div>
      )}

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Complete Race Seeding"
        description="Are you sure you want to complete seeding? Racer times will be locked and the race will be set to Racing. This action cannot be undone."
        confirmText="Complete Seeding"
        onCancel={() => setShowConfirmDialog(false)}
        onConfirm={handleCompleteSeeding}
        variant="green"
      />
    </div>
  );
};

export default SeedingList;
