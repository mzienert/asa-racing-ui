'use client';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Trophy, CalendarIcon, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { RaceClass, RaceClassStatus, RaceStatus } from '@/app/store/features/racesSlice';
import ConfirmationDialog from '@/components/ConfirmationDialog';

interface RaceDetailsFormProps {
  isEditing?: boolean;
  initialData?: {
    name?: string;
    date?: Date;
    raceClasses?: RaceClass[];
  };
  hasActiveRace?: boolean;
  onSubmit: (formData: {
    name: string;
    date: string;
    raceClasses: RaceClass[];
    status: RaceStatus;
  }) => void;
  onSetCurrentRace: (id: string) => void;
  onCancel: () => void;
}

const RaceDetailsForm = ({
  isEditing = false,
  initialData,
  hasActiveRace = false,
  onSubmit,
  onSetCurrentRace,
  onCancel,
}: RaceDetailsFormProps) => {
  const [raceName, setRaceName] = useState(initialData?.name || '');
  const [date, setDate] = useState<Date | undefined>(initialData?.date);
  const [raceClasses, setRaceClasses] = useState<RaceClass[]>(initialData?.raceClasses || []);

  // Form validation states
  const [raceNameError, setRaceNameError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [raceClassesError, setRaceClassesError] = useState<string | null>(null);

  // Add state for dialog
  const [showSetCurrentRaceDialog, setShowSetCurrentRaceDialog] = useState(false);
  const newRaceRef = useRef<{ id: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      setRaceName(initialData.name || '');
      setDate(initialData.date);
      setRaceClasses(initialData.raceClasses || []);
    }
  }, [initialData]);

  const validateRaceName = (name: string): boolean => {
    if (!name.trim()) {
      setRaceNameError('Race name is required');
      return false;
    }
    if (name.length > 50) {
      setRaceNameError('Race name must be less than 50 characters');
      return false;
    }
    setRaceNameError(null);
    return true;
  };

  const validateDate = (selectedDate?: Date): boolean => {
    if (!selectedDate) {
      setDateError('Race date is required');
      return false;
    }
    setDateError(null);
    return true;
  };

  const validateRaceClasses = (classes: RaceClass[]): boolean => {
    if (classes.length === 0) {
      setRaceClassesError('At least one race class must be selected');
      return false;
    }
    setRaceClassesError(null);
    return true;
  };

  const handleRaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRaceName(value);
    if (raceNameError) {
      validateRaceName(value);
    }
  };

  const handleRaceNameBlur = () => {
    validateRaceName(raceName);
  };

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (dateError) {
      validateDate(selectedDate);
    }
  };

  const handleRaceClassChange = (checked: boolean | string, className: string) => {
    const newClasses = checked
      ? [...raceClasses, { raceClass: className, status: RaceClassStatus.CREATED }]
      : raceClasses.filter(c => c.raceClass !== className);

    setRaceClasses(newClasses);
    if (raceClassesError) {
      validateRaceClasses(newClasses);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const isNameValid = validateRaceName(raceName);
    const isDateValid = validateDate(date);
    const areClassesValid = validateRaceClasses(raceClasses);

    if (!isNameValid || !isDateValid || !areClassesValid) {
      return;
    }

    const formData = {
      name: raceName,
      date: date!.toISOString(),
      raceClasses,
      status: RaceStatus.Configuring,
    };

    if (!isEditing && hasActiveRace) {
      // Store the form data temporarily
      newRaceRef.current = formData;
      setShowSetCurrentRaceDialog(true);
    } else {
      onSubmit(formData);
    }
  };

  const handleSetCurrentRace = () => {
    if (newRaceRef.current) {
      onSubmit(newRaceRef.current);
      // onSetCurrentRace will be called by the parent after race creation
    }
    setShowSetCurrentRaceDialog(false);
    newRaceRef.current = null;
  };

  const handleKeepCurrentRace = () => {
    if (newRaceRef.current) {
      onSubmit(newRaceRef.current);
    }
    setShowSetCurrentRaceDialog(false);
    newRaceRef.current = null;
  };

  return (
    <>
      <ConfirmationDialog
        open={showSetCurrentRaceDialog}
        onOpenChange={setShowSetCurrentRaceDialog}
        title="Set as Current Race?"
        description="Would you like to set the new race as your current race? This will replace your existing current race."
        cancelText="Keep Current Race"
        confirmText="Set as Current"
        onCancel={handleKeepCurrentRace}
        onConfirm={handleSetCurrentRace}
      />

      <form onSubmit={handleSubmit} className="w-full space-y-4 max-w-2xl">
        <h3 className="text-lg font-medium mb-4">
          {isEditing ? 'Edit Race' : 'Create New Race'}
        </h3>
        <div>
          <label
            htmlFor="raceName"
            className="block text-sm font-medium mb-1 flex items-center"
          >
            <Trophy className="h-4 w-4 mr-2" /> Race Name
          </label>
          <input
            type="text"
            id="raceName"
            value={raceName}
            onChange={handleRaceNameChange}
            onBlur={handleRaceNameBlur}
            className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
              raceNameError ? 'border-red-500' : ''
            }`}
            placeholder="Enter race name"
          />
          {raceNameError && (
            <div className="flex items-center text-red-500 text-sm mt-1">
              <AlertCircle className="h-4 w-4 mr-2" />
              {raceNameError}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" /> Race Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-muted-foreground',
                  dateError && 'border-red-500'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {dateError && (
            <div className="flex items-center text-red-500 text-sm mt-1">
              <AlertCircle className="h-4 w-4 mr-2" />
              {dateError}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2" /> Race Classes
          </label>
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${raceClassesError ? 'border border-red-500 p-2 rounded-md' : ''}`}
          >
            <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-md">
              <Checkbox
                id="mens-open"
                checked={raceClasses.some(rc => rc.raceClass === 'mens-open')}
                onCheckedChange={checked => handleRaceClassChange(!!checked, 'mens-open')}
              />
              <label
                htmlFor="mens-open"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Men&apos;s Open
              </label>
            </div>
            <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-md">
              <Checkbox
                id="mens-amateur"
                checked={raceClasses.some(rc => rc.raceClass === 'mens-amateur')}
                onCheckedChange={checked =>
                  handleRaceClassChange(!!checked, 'mens-amateur')
                }
              />
              <label
                htmlFor="mens-amateur"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Men&apos;s Amateur
              </label>
            </div>
            <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-md">
              <Checkbox
                id="womens"
                checked={raceClasses.some(rc => rc.raceClass === 'womens')}
                onCheckedChange={checked => handleRaceClassChange(!!checked, 'womens')}
              />
              <label
                htmlFor="womens"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Women&apos;s
              </label>
            </div>
          </div>
          {raceClassesError && (
            <div className="flex items-center text-red-500 text-sm mt-1">
              <AlertCircle className="h-4 w-4 mr-2" />
              {raceClassesError}
            </div>
          )}
        </div>
        <div className="flex justify-start space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">{isEditing ? 'Update Race' : 'Create Race'}</Button>
        </div>
      </form>
    </>
  );
};

export default RaceDetailsForm; 