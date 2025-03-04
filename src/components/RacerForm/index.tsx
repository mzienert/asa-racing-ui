import { persistRacer, Racer, updatePersistedRacer } from '@/store/features/racersSlice';
import { RaceClassStatus } from '@/store/features/racesSlice';
import { selectRaceClassById } from '@/store/selectors/raceSelectors';
import { AppDispatch, RootState } from '@/store/store';
import { AlertCircle, CheckCircle, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '../ui/button';
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
} from '../ui/alert-dialog';

interface RacerFormProps {
  classId: string;
  editRacer?: Racer | null;
  onCancelEdit?: () => void;
  onComplete?: () => void;
  showComplete?: boolean;
}

const RacerForm = ({
  classId,
  editRacer,
  onCancelEdit,
  onComplete,
  showComplete,
}: RacerFormProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState(editRacer?.name || '');
  const [bibNumber, setBibNumber] = useState(editRacer?.bibNumber || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [bibError, setBibError] = useState<string | null>(null);
  const raceClass = useSelector((state: RootState) => selectRaceClassById(state, classId));

  useEffect(() => {
    if (editRacer) {
      setName(editRacer.name);
      setBibNumber(editRacer.bibNumber);
    }
  }, [editRacer]);

  // If the race class is not in Configuring status, don't render the form
  if (raceClass?.status !== RaceClassStatus.CREATED) {
    return (
      <div className="flex items-center gap-2 p-4 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
        <AlertCircle className="h-5 w-5" />
        <p>
          Racer management is locked. This race class is now in {raceClass?.status.toLowerCase()}{' '}
          status.
        </p>
      </div>
    );
  }

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError('Racer name is required');
      return false;
    }
    setNameError(null);
    return true;
  };

  const validateBib = (value: string): boolean => {
    if (!value.trim()) {
      setBibError('Bib number is required');
      return false;
    }
    if (!/^\d+$/.test(value)) {
      setBibError('Bib number must be numeric');
      return false;
    }
    setBibError(null);
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (nameError) validateName(value);
  };

  const handleBibChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBibNumber(value);
    if (bibError) validateBib(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isNameValid = validateName(name);
    const isBibValid = validateBib(bibNumber);

    if (!isNameValid || !isBibValid) {
      return;
    }

    if (editRacer) {
      dispatch(updatePersistedRacer({ ...editRacer, name, bibNumber, classId }));
      toast.success(`Updated ${name} with Racer #${bibNumber}`);
      onCancelEdit?.();
    } else {
      const result = await dispatch(
        persistRacer({
          name,
          bibNumber,
          classId,
          raceClass: classId,
          seedData: {
            time: null,
            startingPosition: null,
          },
        })
      );
      if (result.type === 'racers/persistRacer/rejected') {
        const payload = result.payload as { existingRacer: Racer };
        toast.error(`Bib #${bibNumber} is already assigned to ${payload.existingRacer.name}`);
      } else {
        toast.success(`Added ${name} with Racer #${bibNumber}`);
      }
    }
    setName('');
    setBibNumber('');
  };

  const handleCancel = () => {
    setName('');
    setBibNumber('');
    onCancelEdit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-1/4">
          <label htmlFor="bibNumber" className="block text-sm font-medium mb-1">
            Racer Number
          </label>
          <input
            id="bibNumber"
            type="text"
            value={bibNumber}
            onChange={handleBibChange}
            onBlur={() => validateBib(bibNumber)}
            placeholder="Racer #"
            maxLength={3}
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              bibError ? 'border-red-500' : 'border-input'
            }`}
          />
          {bibError && (
            <div className="flex items-center text-red-500 text-sm mt-1">
              <AlertCircle className="h-4 w-4 mr-2" />
              {bibError}
            </div>
          )}
        </div>
        <div className="w-full sm:w-3/4">
          <label htmlFor="racerName" className="block text-sm font-medium mb-1">
            Racer Name
          </label>
          <input
            id="racerName"
            type="text"
            value={name}
            onChange={handleNameChange}
            onBlur={() => validateName(name)}
            placeholder="Racer Name"
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              nameError ? 'border-red-500' : 'border-input'
            }`}
          />
          {nameError && (
            <div className="flex items-center text-red-500 text-sm mt-1">
              <AlertCircle className="h-4 w-4 mr-2" />
              {nameError}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-start space-x-2 pt-2">
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          {editRacer ? 'Update Racer' : 'Add Racer'}
        </Button>
        {editRacer && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )}
        {showComplete && !editRacer && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete Racer Configuration?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will finalize racers for this class. You won&apos;t be able to add or modify
                  racers after this step.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                  Complete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
};

export default RacerForm;
