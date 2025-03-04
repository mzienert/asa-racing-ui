import { Users } from 'lucide-react';
import { RaceClassStatus } from '@/store/features/racesSlice';
import { RaceClassStatusBadge } from '@/components/RaceStatusBadge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, AlertCircle } from 'lucide-react';
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
import RacerForm from '@/components/RacerForm';
import type { Racer } from '@/store/features/racersSlice';
import { toast } from 'sonner';

interface RacerContainerProps {
  raceClass: {
    raceClass: string;
    status: RaceClassStatus;
  };
  racersByClass: Record<string, Racer[]>;
  editingRacer: Racer | null;
  onSetEditingRacer: (racer: Racer | null) => void;
  onDeleteRacer: (id: string, classId: string) => void;
  onCompleteClass: (classId: string) => void;
  showDivider?: boolean;
}

export const RacerContainer = ({
  raceClass,
  racersByClass,
  editingRacer,
  onSetEditingRacer,
  onDeleteRacer,
  onCompleteClass,
  showDivider = true,
}: RacerContainerProps) => {
  return (
    <div>
      {showDivider && <div className="h-px bg-border my-6" />}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              {raceClass.raceClass?.replace('-', ' ') || raceClass.raceClass}
            </h2>
            <div className="h-1 w-20 bg-primary/70 rounded-full mt-2"></div>
          </div>
          <RaceClassStatusBadge status={raceClass.status} size="sm" />
        </div>

        <div className="space-y-4">
          {racersByClass[raceClass.raceClass]?.length > 0 ? (
            <div className="space-y-2">
              {racersByClass[raceClass.raceClass].map(racer => (
                <div
                  key={racer.id}
                  className={`flex items-center justify-between p-3 rounded-md transition-colors
                    ${
                      editingRacer?.id === racer.id
                        ? 'bg-primary/5 border border-primary/20'
                        : 'bg-muted/30'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-primary">
                      #{racer.bibNumber}
                    </span>
                    <span>{racer.name}</span>
                  </div>
                  {raceClass.status === RaceClassStatus.CREATED && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onSetEditingRacer(racer)}
                        variant="ghost"
                        size="sm"
                        className={`p-2 rounded-full transition-colors
                          ${
                            editingRacer?.id === racer.id
                              ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                              : 'hover:bg-muted'
                          }`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 rounded-full transition-colors hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure you want to delete this racer?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently
                              delete the racer from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                onDeleteRacer(racer.id, racer.classId);
                                toast.success(
                                  `Removed ${racer.name} with bib #${racer.bibNumber}`
                                );
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-left text-muted-foreground bg-muted/20 p-6 rounded-md">
              <p>No racers in this class yet. Add your first racer below.</p>
            </div>
          )}

          {raceClass.status === RaceClassStatus.CREATED ? (
            <RacerForm
              classId={raceClass.raceClass}
              editRacer={
                editingRacer?.classId === raceClass.raceClass
                  ? editingRacer
                  : null
              }
              onCancelEdit={() => onSetEditingRacer(null)}
              onComplete={() => onCompleteClass(raceClass.raceClass)}
              showComplete={true}
            />
          ) : (
            <div className="flex items-center gap-2 p-4 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <AlertCircle className="h-5 w-5" />
              <p>
                Racers for this class are now locked. This race class is in{' '}
                {raceClass.status.toLowerCase()} status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RacerContainer; 