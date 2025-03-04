'use client';
import {
  persistRacer,
  updatePersistedRacer,
  loadRacersFromStorage,
  deletePersistedRacer,
} from '@/app/store/features/racersSlice';
import {
  selectRaceClasses,
  selectRaces,
  selectActiveRace,
  selectRacersByActiveRaceClass,
} from '@/app/store/selectors/raceSelectors';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { selectHasActiveRace } from '@/app/store/selectors/raceSelectors';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { Racer } from '@/app/store/features/racersSlice';
import type { AppDispatch } from '@/app/store/store';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  loadRacesFromStorage,
  setCurrentRace,
  updatePersistedRace,
  RaceStatus,
  RaceClassStatus,
} from '@/app/store/features/racesSlice';
import { Users, Edit, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';
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
import RaceStatusBadge, { RaceClassStatusBadge } from '@/components/RaceStatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CurrentRaceBadge from '@/components/CurrentRaceBadge';

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
  const raceClass = useSelector((state: RootState) =>
    selectRaceClasses(state).find(rc => rc.raceClass === classId)
  );

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
      const result = await dispatch(persistRacer({ 
        name, 
        bibNumber, 
        classId,
        raceClass: classId,
        seedData: {
          time: null,
          startingPosition: null
        }
      }));
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

const Racers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [editingRacer, setEditingRacer] = useState<Racer | null>(null);
  const hasRace = useSelector(selectHasActiveRace);
  const races = useSelector(selectRaces);
  const activeRace = useSelector(selectActiveRace);
  const activeRaces = races.filter(
    race => race.status === RaceStatus.Configuring || race.status === RaceStatus.In_Progress
  );

  // Get race classes
  const raceClasses = useSelector(selectRaceClasses);

  // Get racers by class using memoized selector
  const racersByClass = useSelector(selectRacersByActiveRaceClass);

  useEffect(() => {
    // Load both races and racers
    dispatch(loadRacesFromStorage());
    dispatch(loadRacersFromStorage());

    // If we have races but no active race, set the first race as active
    if (races.length > 0 && !hasRace) {
      dispatch(setCurrentRace(races[0].id));
    }
  }, [dispatch, races.length, hasRace]);

  const handleCompleteClass = (classId: string) => {
    if (activeRace) {
      const updatedRaceClasses = activeRace.raceClasses.map(rc =>
        rc.raceClass === classId ? { ...rc, status: RaceClassStatus.Seeding } : rc
      );

      dispatch(
        updatePersistedRace({
          ...activeRace,
          raceClasses: updatedRaceClasses,
        })
      );
      toast.success(`${classId.replace('-', ' ')} is now ready for seeding`);
    }
  };

  if (!hasRace) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          <Card className="shadow-md">
            <div className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" /> Racer Management
                  </h2>
                </div>
                <p className="text-muted-foreground">Manage your racers here.</p>
                <div className="h-1 w-20 bg-primary/70 rounded-full mt-2"></div>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <p className="text-muted-foreground mb-4">Please create a race first</p>
                <Link href="/admin/races/create">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" /> Create Race
                  </Button>
                </Link>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <Card className="shadow-md">
          <div className="flex flex-col">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" /> Racer Management
              </h2>
              <p className="text-muted-foreground text-sm">Manage your racers here.</p>
            </CardHeader>
            <div className="px-6 mb-6">
              <hr className="border-t border-muted" />
            </div>
            <CardContent>
              <Tabs defaultValue={activeRace?.id} className="w-full">
                <TabsList className="w-full justify-start">
                  {activeRaces.map(race => (
                    <TabsTrigger key={race.id} value={race.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        {race.name}
                        <div className="flex items-center gap-1">
                          <RaceStatusBadge status={race.status} size="sm" />
                          <CurrentRaceBadge
                            className="ml-1"
                            isActive={race.id === activeRace?.id}
                          />
                        </div>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {activeRaces.map(race => (
                  <TabsContent key={race.id} value={race.id} className="mt-4 space-y-6">
                    {raceClasses.map((raceClass, index) => (
                      <div key={raceClass.raceClass}>
                        {index > 0 && <div className="h-px bg-border my-6" />}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-2xl font-semibold flex items-center">
                                <Users className="h-5 w-5 mr-2 text-primary" />
                                {raceClass.raceClass.replace('-', ' ')}
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
                                          onClick={() => setEditingRacer(racer)}
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
                                                  dispatch(
                                                    deletePersistedRacer({
                                                      id: racer.id,
                                                      classId: racer.classId,
                                                    })
                                                  );
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
                                onCancelEdit={() => setEditingRacer(null)}
                                onComplete={() => handleCompleteClass(raceClass.raceClass)}
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
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Racers;
