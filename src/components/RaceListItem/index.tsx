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
} from '@radix-ui/react-alert-dialog';
import { Trash2 } from 'lucide-react';
import { AlertDialogFooter, AlertDialogHeader } from '../ui/alert-dialog';

interface RaceListItemProps {
  race: Race;
  isActive: boolean;
  onSetCurrent: (id: string) => void;
  onDelete: (id: string) => void;
}

const RaceListItem = ({ race, isActive, onSetCurrent, onDelete }: RaceListItemProps) => {
  return (
    <div className="border rounded-md p-4 flex justify-between items-center">
      <div>
        <h3 className="font-medium">{race.name}</h3>
        <p className="text-sm text-muted-foreground">
          {race.date ? format(new Date(race.date), 'PPP') : 'No date'}
          {race.raceFormat ? ` • ${race.raceFormat.replace('-', ' ')}` : ''}
        </p>
        {isActive && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 mt-1">
            Current Race
          </span>
        )}
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
                Are you sure you want to delete &quot;{race.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(race.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default RaceListItem;
