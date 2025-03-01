'use client';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  persistRace,
  updatePersistedRace,
  loadRacesFromStorage,
  deletePersistedRace,
  setCurrentRace,
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
    completed?: boolean;
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

  useEffect(() => {
    dispatch(loadRacesFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (isEditing && activeRace) {
      setRaceName(activeRace.name);
      setRaceFormat(activeRace.raceFormat || '');
      setDate(activeRace.date ? new Date(activeRace.date) : undefined);
    }
  }, [isEditing, activeRace]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const formData = {
      name: raceName,
      date: date.toISOString(),
      raceFormat,
      raceClasses,
      completed: false,
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
    <div>
      <h1 className="text-3xl font-bold mb-6">Race Management</h1>

      {/* Set Current Race Dialog */}
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

      <div className="space-y-4">
        <Card>
          <div className="flex flex-col">
            <CardHeader>
              <p className="text-muted-foreground">Manage your racing events here.</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {!activeRace && !isCreatingRace && (
                <button
                  onClick={() => setIsCreatingRace(true)}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Start New Race
                </button>
              )}
              {activeRace && !isEditing && !isCreatingRace && (
                <div className="w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Current Race</h2>
                    <div className="flex space-x-2">
                      <Button onClick={() => setIsEditing(true)} variant="outline">
                        Edit Race
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
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
                      >
                        Create New Race
                      </Button>
                    </div>
                  </div>
                  {activeRace && <RaceDetails race={activeRace} />}
                </div>
              )}
              {(isCreatingRace || isEditing) && (
                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                  <div>
                    <label htmlFor="raceName" className="block text-sm font-medium mb-1">
                      Race Name
                    </label>
                    <input
                      type="text"
                      id="raceName"
                      value={raceName}
                      onChange={e => setRaceName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                      placeholder="Enter race name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Race Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Race Format</label>
                    <Select onValueChange={setRaceFormat} value={raceFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a race format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-elimination">Single Elimination</SelectItem>
                        <SelectItem value="double-elimination">Double Elimination</SelectItem>
                        <SelectItem value="head-to-head">Head to Head</SelectItem>
                        <SelectItem value="time-trial">Time Trial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium">Race Classes</label>
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="mens-open"
                          checked={raceClasses.includes('mens-open')}
                          onCheckedChange={checked => {
                            setRaceClasses(prev =>
                              checked ? [...prev, 'mens-open'] : prev.filter(c => c !== 'mens-open')
                            );
                          }}
                        />
                        <label
                          htmlFor="mens-open"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Men&apos;s Open
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="mens-amateur"
                          checked={raceClasses.includes('mens-amateur')}
                          onCheckedChange={checked => {
                            setRaceClasses(prev =>
                              checked
                                ? [...prev, 'mens-amateur']
                                : prev.filter(c => c !== 'mens-amateur')
                            );
                          }}
                        />
                        <label
                          htmlFor="mens-amateur"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Men&apos;s Amateur
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="womens"
                          checked={raceClasses.includes('womens')}
                          onCheckedChange={checked => {
                            setRaceClasses(prev =>
                              checked ? [...prev, 'womens'] : prev.filter(c => c !== 'womens')
                            );
                          }}
                        />
                        <label
                          htmlFor="womens"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Women&apos;s
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
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
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">All Races</h2>
          </CardHeader>
          <CardContent>
            {allRaces.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No races found. Create your first race above.
              </p>
            ) : (
              <div className="space-y-4">
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
