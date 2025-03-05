import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { Racer } from '@/store/features/racersSlice';
import { RaceClassStatus } from '@/store/features/racesSlice';
import { toast } from 'sonner';
import { useState } from 'react';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { useDispatch } from 'react-redux';
import { deletePersistedRacer } from '@/store/features/racersSlice';
import type { AppDispatch } from '@/store/store';

interface RacerRowProps {
  racer: Racer;
  raceClassStatus: RaceClassStatus;
  editingRacer: Racer | null;
  onSetEditingRacer: (racer: Racer | null) => void;
}

export const RacerRow = ({
  racer,
  raceClassStatus,
  editingRacer,
  onSetEditingRacer,
}: RacerRowProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    dispatch(deletePersistedRacer({ id: racer.id, raceClass: racer.raceClass }));
    toast.success(`Removed ${racer.name} with bib #${racer.bibNumber}`);
    setShowDeleteDialog(false);
  };

  return (
    <div
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
      {raceClassStatus === RaceClassStatus.Created && (
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
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full transition-colors hover:bg-red-100"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )}

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Are you sure you want to delete this racer?"
        description="This action cannot be undone. This will permanently delete the racer from the system."
        confirmText="Delete"
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}; 