'use client';
import { loadRacersFromStorage, deletePersistedRacer } from '@/store/features/racersSlice';
import {
  selectRaceClasses,
  selectRaces,
  selectActiveRace,
  selectRacersByActiveRaceClass,
} from '@/store/selectors/raceSelectors';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectHasActiveRace } from '@/store/selectors/raceSelectors';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { Racer } from '@/store/features/racersSlice';
import type { AppDispatch } from '@/store/store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  loadRacesFromStorage,
  setCurrentRace,
  updatePersistedRace,
  RaceClassStatus,
} from '@/store/features/racesSlice';
import { Users, Edit, Trash2, AlertCircle } from 'lucide-react';
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
import { RaceClassStatusBadge } from '@/components/RaceStatusBadge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import RacerForm from '@/components/RacerForm';
import { getActiveRaces } from '@/helpers/racers';
import NoRaceState from '@/components/NoRaceState';
import RaceTabsHeader from '@/components/RaceTabsHeader';
import PageHeader from '@/components/PageHeader';

const Racers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [editingRacer, setEditingRacer] = useState<Racer | null>(null);
  const hasRace = useSelector(selectHasActiveRace);
  const races = useSelector(selectRaces);
  const activeRace = useSelector(selectActiveRace);
  const raceClasses = useSelector(selectRaceClasses);
  const racersByClass = useSelector(selectRacersByActiveRaceClass);

  const activeRaces = getActiveRaces(races);

  useEffect(() => {
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
      toast.success(`${classId?.replace('-', ' ') || classId} is now ready for seeding`);
    }
  };

  if (!hasRace) {
    return (
      <NoRaceState
        title="Racer Management"
        description="Manage your racers here."
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <Card className="shadow-md">
          <div className="flex flex-col">
            <PageHeader
              icon={Users}
              title="Racer Management"
              description="Manage your racers here."
            />
            <CardContent>
              <Tabs defaultValue={activeRace?.id} className="w-full">
                <RaceTabsHeader 
                  races={activeRaces}
                  activeRaceId={activeRace?.id}
                />
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
