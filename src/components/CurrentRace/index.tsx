'use client';
import { Trophy, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import RaceDetails from '@/components/RaceDetails';
import { RaceStatus, RaceClass } from '@/app/store/features/racesSlice';

interface CurrentRaceProps {
  race: {
    id: string;
    name: string;
    date: string;
    raceClasses: RaceClass[];
    status: RaceStatus;
  };
  onEdit: () => void;
  onDelete: () => void;
  onCreateNew: () => void;
}

const CurrentRace = ({ race, onEdit, onDelete, onCreateNew }: CurrentRaceProps) => {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center mb-2">
            <Trophy className="h-5 w-5 mr-2 text-primary" /> Current Race
          </h2>
          <div className="h-1 w-20 bg-primary/70 rounded-full mt-2"></div>
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <Button onClick={onEdit} variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" /> Edit Race
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this race?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the race and remove all
                  associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={onCreateNew} variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" /> Create New Race
          </Button>
        </div>
      </div>
      <RaceDetails race={race} />
    </div>
  );
};

export default CurrentRace;
