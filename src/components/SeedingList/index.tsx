import { Racer, updatePersistedRacer } from '@/store/features/racersSlice';
import { IMaskInput } from 'react-imask';
import { Check, X, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { RaceClassStatus } from '@/store/features/racesSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { createBracket } from '@/store/features/bracketSlice';
import { toast } from 'sonner';

interface SeedingListProps {
  racers: Racer[];
  seedTimes: Record<string, string>;
  onSaveTime: (racerId: string, raceClass: string) => void;
  onClearTime: (racerId: string) => void;
  onAcceptTime: (racerId: string, value: string) => void;
  raceClass: string;
  status: RaceClassStatus;
  raceId: string;
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

  const handleCompleteSeeding = async () => {
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
            startingPosition: i + 1
          }
        };
        await dispatch(updatePersistedRacer(updatedRacer)).unwrap();
        updatedRacers.push(updatedRacer);
      }

      // Create the bracket with the updated racers
      await dispatch(createBracket({ 
        racers: updatedRacers,
        raceId,
        raceClass
      })).unwrap();
      
      toast.success('Starting positions assigned and bracket created successfully');
    } catch (error) {
      toast.error('Failed to complete seeding');
      console.error('Error completing seeding:', error);
    }
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
          className="flex items-center justify-between p-3 rounded-md transition-colors bg-muted/30"
        >
          <div className="flex items-center gap-4">
            <span className="font-medium text-primary">#{racer.bibNumber}</span>
            <span>{racer.name}</span>
            {status === RaceClassStatus.Created && racer.seedData?.time && (
              <span className="text-muted-foreground">Time: {racer.seedData.time}</span>
            )}
          </div>
          {status === RaceClassStatus.Seeding && (
            <div className="flex items-center gap-2">
              <IMaskInput
                name={`time-${racer.id}`}
                className="w-32 px-3 py-1 rounded-md border border-input bg-background"
                mask="00:00:000"
                definitions={{
                  '0': /[0-9]/,
                }}
                unmask={false}
                placeholder="00:00:000"
                value={seedTimes[racer.id] || ''}
                onAccept={value => onAcceptTime(racer.id, value)}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => onSaveTime(racer.id, raceClass)}
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
          )}
        </div>
      ))}
      <div className="flex justify-start mt-4">
        <Button
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4"
          onClick={handleCompleteSeeding}
        >
          <CheckCircle className="h-5 w-5" />
          Complete Seeding
        </Button>
      </div>
    </div>
  );
};

export default SeedingList;
