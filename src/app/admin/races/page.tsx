'use client';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Trash2,
  Trophy,
  Users,
  Edit,
  Plus,
  ListTodo,
  AlertCircle,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/app/store/store';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  persistRace,
  updatePersistedRace,
  loadRacesFromStorage,
  deletePersistedRace,
  setCurrentRace,
  RaceStatus,
} from '@/app/store/features/racesSlice';
import { Checkbox } from '@/components/ui/checkbox';
import {
  selectActiveRace,
  selectActiveRaceId,
  selectRaces,
} from '@/app/store/selectors/raceSelectors';
import RaceDetails from '@/components/RaceDetails';
import RaceListItem from '@/components/RaceListItem';

export interface RaceDetailsProps {
  race: {
    name: string;
    date?: string;
    raceFormat?: string;
    raceClasses?: string[];
    status: RaceStatus;
  };
}

export default function RacesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const activeRace = useSelector(selectActiveRace);
  const activeRaceId = useSelector(selectActiveRaceId);
  const allRaces = useSelector(selectRaces);
  const [isCreatingRace, setIsCreatingRace] = useState(false);
  const [date, setDate] = useState<Date>();
  const [raceName, setRaceName] = useState('');
  const [raceFormat, setRaceFormat] = useState('');
  const [raceClasses, setRaceClasses] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showSetCurrentRaceDialog, setShowSetCurrentRaceDialog] = useState(false);
  const newRaceRef = useRef<{ id: string } | null>(null);
  
  // Form validation states
  const [raceNameError, setRaceNameError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [raceFormatError, setRaceFormatError] = useState<string | null>(null);
  const [raceClassesError, setRaceClassesError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(loadRacesFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (isEditing && activeRace) {
      setRaceName(activeRace.name);
      setRaceFormat(activeRace.raceFormat || '');
      setDate(activeRace.date ? new Date(activeRace.date) : undefined);
      setRaceClasses(activeRace.raceClasses || []);
    }
  }, [isEditing, activeRace]);

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

  const validateRaceFormat = (format: string): boolean => {
    if (!format) {
      setRaceFormatError('Race format is required');
      return false;
    }
    setRaceFormatError(null);
    return true;
  };

  const validateRaceClasses = (classes: string[]): boolean => {
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

  const handleRaceFormatChange = (value: string) => {
    setRaceFormat(value);
    if (raceFormatError) {
      validateRaceFormat(value);
    }
  };

  const handleRaceClassChange = (checked: boolean | string, className: string) => {
    const newClasses = checked 
      ? [...raceClasses, className] 
      : raceClasses.filter(c => c !== className);
    
    setRaceClasses(newClasses);
    if (raceClassesError) {
      validateRaceClasses(newClasses);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const isNameValid = validateRaceName(raceName);
    const isDateValid = validateDate(date);
    const isFormatValid = validateRaceFormat(raceFormat);
    const areClassesValid = validateRaceClasses(raceClasses);

    if (!isNameValid || !isDateValid || !isFormatValid || !areClassesValid) {
      return;
    }

    const formData = {
      name: raceName,
      date: date!.toISOString(),
      raceFormat,
      raceClasses,
      status: RaceStatus.Configuring,
    };

    if (isEditing) {
      dispatch(updatePersistedRace({ ...formData, id: activeRace!.id }));

      // Reset form state
      setIsCreatingRace(false);
      setIsEditing(false);
      setRaceName('');
      setRaceFormat('');
      setDate(undefined);
      setRaceClasses([]);
    } else {
      dispatch(persistRace(formData)).then(action => {
        const newRace = action.payload as { id: string };
        if (newRace && newRace.id) {
          if (activeRaceId) {
            // If there's already an active race, show the dialog
            newRaceRef.current = newRace;
            setShowSetCurrentRaceDialog(true);
          } else {
            // If there's no active race, set this as the current race
            dispatch(setCurrentRace(newRace.id));
          }
        }

        // Reset form state
        setIsCreatingRace(false);
        setIsEditing(false);
        setRaceName('');
        setRaceFormat('');
        setDate(undefined);
        setRaceClasses([]);
      });
    }
  };

  const handleSetCurrentRace = () => {
    if (newRaceRef.current) {
      dispatch(setCurrentRace(newRaceRef.current.id));
    }
    setShowSetCurrentRaceDialog(false);
    newRaceRef.current = null;
  };

  const handleKeepCurrentRace = () => {
    setShowSetCurrentRaceDialog(false);
    newRaceRef.current = null;
  };

  const handleDeleteRace = () => {
    if (activeRace) {
      dispatch(deletePersistedRace(activeRace.id));
      setIsCreatingRace(false);
      setIsEditing(false);
      setRaceName('');
      setRaceFormat('');
      setDate(undefined);
      setRaceClasses([]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <AlertDialog open={showSetCurrentRaceDialog} onOpenChange={setShowSetCurrentRaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as Current Race?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to set the new race as your current race? This will replace your
              existing current race.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepCurrentRace}>Keep Current Race</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetCurrentRace}>Set as Current</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <Card className="shadow-md">
          <div className="flex flex-col">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold mb-2">Race Management</h2>
              <p className="text-muted-foreground text-sm">Manage your racing events here.</p>
            </CardHeader>
            <div className="px-6 mb-6">
              <hr className="border-t border-muted" />
            </div>
            <CardContent>
              {!activeRace && !isCreatingRace && (
                <div className="flex justify-start">
                  <Button
                    onClick={() => setIsCreatingRace(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" /> Start New Race
                  </Button>
                </div>
              )}
              {activeRace && !isEditing && !isCreatingRace && (
                <div className="w-full">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-4">
                    <div>
                      <h2 className="text-xl font-semibold flex items-center mb-2">
                        <Trophy className="h-5 w-5 mr-2 text-primary" /> Current Race
                      </h2>
                      <div className="h-1 w-20 bg-primary/70 rounded-full mt-2"></div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
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
                            <AlertDialogTitle>
                              Are you sure you want to delete this race?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the race
                              and remove all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteRace}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        onClick={() => {
                          setIsCreatingRace(true);
                          setRaceName('');
                          setRaceFormat('');
                          setDate(undefined);
                          setRaceClasses([]);
                        }}
                        variant="default"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Create New Race
                      </Button>
                    </div>
                  </div>
                  {activeRace && (
                    <RaceDetails race={activeRace} />
                  )}
                </div>
              )}
              {(isCreatingRace || isEditing) && (
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
                        <Calendar mode="single" selected={date} onSelect={handleDateChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    {dateError && (
                      <div className="flex items-center text-red-500 text-sm mt-1">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {dateError}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center">
                      <ListTodo className="h-4 w-4 mr-2" /> Race Format
                    </label>
                    <div className="relative">
                      <select
                        value={raceFormat}
                        onChange={(e) => handleRaceFormatChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md bg-background text-foreground appearance-none ${
                          raceFormatError ? 'border-red-500' : ''
                        }`}
                      >
                        <option value="" disabled>Select a race format</option>
                        <option value="single-elimination">Single Elimination</option>
                        <option value="double-elimination">Double Elimination</option>
                        <option value="head-to-head">Head to Head</option>
                        <option value="time-trial">Time Trial</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {raceFormatError && (
                      <div className="flex items-center text-red-500 text-sm mt-1">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {raceFormatError}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2" /> Race Classes
                    </label>
                    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${raceClassesError ? 'border border-red-500 p-2 rounded-md' : ''}`}>
                      <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-md">
                        <Checkbox
                          id="mens-open"
                          checked={raceClasses.includes('mens-open')}
                          onCheckedChange={(checked) => handleRaceClassChange(!!checked, 'mens-open')}
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
                          checked={raceClasses.includes('mens-amateur')}
                          onCheckedChange={(checked) => handleRaceClassChange(!!checked, 'mens-amateur')}
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
                          checked={raceClasses.includes('womens')}
                          onCheckedChange={(checked) => handleRaceClassChange(!!checked, 'womens')}
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
                      onClick={() => {
                        setIsCreatingRace(false);
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">{isEditing ? 'Update Race' : 'Create Race'}</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </div>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <h2 className="text-xl font-semibold flex items-center">
              <ListTodo className="h-5 w-5 mr-2 text-primary" /> All Races
            </h2>
            <div className="h-1 w-20 bg-primary/70 rounded-full mt-2"></div>
          </CardHeader>
          <CardContent>
            {allRaces.length === 0 ? (
              <div className="text-left text-muted-foreground bg-muted/20 p-6 rounded-md">
                <p>No races found. Create your first race above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allRaces.map(race => (
                  <RaceListItem
                    key={race.id}
                    race={race}
                    isActive={race.id === activeRaceId}
                    onSetCurrent={id => dispatch(setCurrentRace(id))}
                    onDelete={id => dispatch(deletePersistedRace(id))}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
