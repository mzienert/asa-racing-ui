'use client';
import { ListTodo } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import RaceListItem from '@/components/RaceListItem';
import { RaceStatus, RaceClass } from '@/app/store/features/racesSlice';

type Race = {
  id: string;
  name: string;
  date: string;
  raceClasses: RaceClass[];
  status: RaceStatus;
};

interface RaceListContainerProps {
  races: Race[];
  activeRaceId: string | null;
  onSetCurrent: (id: string) => void;
  onDelete: (id: string) => void;
}

const RaceListContainer = ({
  races,
  activeRaceId,
  onSetCurrent,
  onDelete,
}: RaceListContainerProps) => {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold flex items-center">
          <ListTodo className="h-5 w-5 mr-2 text-primary" /> All Races
        </h2>
        <div className="h-1 w-20 bg-primary/70 rounded-full mt-2"></div>
      </CardHeader>
      <CardContent>
        {races.length === 0 ? (
          <div className="text-left text-muted-foreground bg-muted/20 p-6 rounded-md">
            <p>No races found. Create your first race above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {races.map(race => (
              <RaceListItem
                key={race.id}
                race={race}
                isActive={race.id === activeRaceId}
                onSetCurrent={onSetCurrent}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RaceListContainer; 