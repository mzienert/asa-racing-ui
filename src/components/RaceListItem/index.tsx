import { format } from 'date-fns';
import { Race } from '@/app/store/features/racesSlice';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogHeader,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import RaceStatusBadge, { RaceClassStatusBadge } from '@/components/RaceStatusBadge';
import CurrentRaceBadge from '@/components/CurrentRaceBadge';

interface RaceListItemProps {
  race: Race;
  isActive: boolean;
  onSetCurrent: (id: string) => void;
  onDelete: (id: string) => void;
}

const RaceListItem = ({ race, isActive, onSetCurrent, onDelete }: RaceListItemProps) => {
  return (
    <div className="border rounded-md p-4 flex justify-between items-start">
      <div>
        <h3 className="font-medium">{race.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {race.date ? format(new Date(race.date), 'PPP') : 'No date'}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {race.raceClasses.map(raceClass => (
            <div key={raceClass.raceClass} className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {raceClass.raceClass.replace('-', ' ')}:
              </span>
              <div className="h-[24px] flex items-center">
                <RaceClassStatusBadge status={raceClass.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <RaceStatusBadge status={race.status} size="sm" />
          <CurrentRaceBadge isActive={isActive} />
        </div>
      </div>
      <div className="flex space-x-2">
        {!isActive && (
          <Button variant="outline" size="sm" onClick={() => onSetCurrent(race.id)}>
            Set as Current
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Race</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{race.name}&quot;? This will also delete all
                racers in this race. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(race.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default RaceListItem;
