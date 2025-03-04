'use client';
import { updatePersistedRacer, loadRacersFromStorage } from '@/store/features/racersSlice';
import {
  selectRaceClasses,
  selectRaces,
  selectActiveRace,
  selectRacersByAllClasses,
} from '@/store/selectors/raceSelectors';
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectHasActiveRace } from '@/store/selectors/raceSelectors';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { Racer } from '@/store/features/racersSlice';
import type { AppDispatch } from '@/store/store';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IMaskInput } from 'react-imask';
import {
  loadRacesFromStorage,
  setCurrentRace,
  RaceStatus,
  RaceClassStatus,
} from '@/store/features/racesSlice';
import { Users, Plus, Lock, Check, X } from 'lucide-react';
import { RaceClassStatusBadge } from '@/components/RaceStatusBadge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import RaceTabsHeader from '@/components/RaceTabsHeader';
import NoRaceState from '@/components/NoRaceState';
import PageHeader from '@/components/PageHeader';

const Racers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [seedTimes, setSeedTimes] = useState<Record<string, string>>({});
  const hasRace = useSelector(selectHasActiveRace);
  const races = useSelector(selectRaces);
  const activeRace = useSelector(selectActiveRace);
  const raceClasses = useSelector(selectRaceClasses);
  const racersByClassResult = useSelector(selectRacersByAllClasses);
  
  const racersByClass = useMemo(() => racersByClassResult, [racersByClassResult]);

  const handleSaveTime = (racerId: string, raceClass: string) => {
    const racer = racersByClass[raceClass]?.find(r => r.id === racerId);
    if (!racer || !seedTimes[racerId]) return;

    const updatedRacer: Racer = {
      ...racer,
      seedData: {
        time: seedTimes[racerId],
        startingPosition: null,
      },
    };

    dispatch(updatePersistedRacer(updatedRacer))
      .unwrap()
      .then(() => {
        toast.success('Seed time saved successfully');
      })
      .catch(error => {
        toast.error('Failed to save seed time');
        console.error('Error saving seed time:', error);
      });
  };

  const handleClearTime = (racerId: string) => {
    console.log('Clearing time for racer:', racerId);
    setSeedTimes(prev => {
      const newTimes = { ...prev };
      delete newTimes[racerId];
      return newTimes;
    });
  };

  useEffect(() => {
    // Load both races and racers
    dispatch(loadRacesFromStorage());
    dispatch(loadRacersFromStorage());

    // If we have races but no active race, set the first race as active
    if (races.length > 0 && !hasRace) {
      dispatch(setCurrentRace(races[0].id));
    }
  }, [dispatch, races.length, hasRace]);

  // Separate effect to handle seed time initialization
  useEffect(() => {
    // Only initialize if we have racer data
    if (Object.keys(racersByClass).length > 0) {
      const initialSeedTimes: Record<string, string> = {};
      Object.values(racersByClass)
        .flat()
        .forEach(racer => {
          if (racer.seedData?.time) {
            initialSeedTimes[racer.id] = racer.seedData.time;
          }
        });
      setSeedTimes(initialSeedTimes);
    }
  }, [racersByClass]);

  if (!hasRace) {
    return (
      <NoRaceState
        title="Race Seeding"
        description="Seed your races here."
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
              title="Race Seeding"
              description="Seed your races here."
            />
            <CardContent>
              <Tabs defaultValue={activeRace?.id} className="w-full">
                <RaceTabsHeader 
                  races={races}
                  activeRaceId={activeRace?.id}
                  filterStatus={true}
                />
                {races
                  .filter(
                    race =>
                      race.status === RaceStatus.Configuring ||
                      race.status === RaceStatus.In_Progress
                  )
                  .map(race => (
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
                              {raceClass.status !== RaceClassStatus.Seeding && (
                                <div className="flex items-center gap-2 p-4 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                  <Lock className="h-5 w-5" />
                                  <p>
                                    This race class cannot be seeded. Please complete the racers in
                                    this class in order to seed the race.
                                  </p>
                                </div>
                              )}
                              {racersByClass[raceClass.raceClass]?.length > 0 ? (
                                <div className="space-y-2">
                                  {racersByClass[raceClass.raceClass].map(racer => (
                                    <div
                                      key={racer.id}
                                      className="flex items-center justify-between p-3 rounded-md transition-colors bg-muted/30"
                                    >
                                      <div className="flex items-center gap-4">
                                        <span className="font-medium text-primary">
                                          #{racer.bibNumber}
                                        </span>
                                        <span>{racer.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <IMaskInput
                                          name={`time-${racer.id}`}
                                          className="w-32 px-3 py-1 rounded-md border border-input bg-background"
                                          mask="00:00:000"
                                          definitions={{
                                            '0': /[0-9]/,
                                          }}
                                          unmask={false}
                                          placeholder="00:00:000"
                                          value={seedTimes[racer.id] || ''}
                                          onAccept={value =>
                                            setSeedTimes(prev => ({ ...prev, [racer.id]: value }))
                                          }
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={() =>
                                            handleSaveTime(racer.id, raceClass.raceClass)
                                          }
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => handleClearTime(racer.id)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-left text-muted-foreground bg-muted/20 p-6 rounded-md">
                                  <p>No racers in this class yet. Add your first racer below.</p>
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
