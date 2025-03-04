'use client';
import { updatePersistedRacer, loadRacersFromStorage } from '@/app/store/features/racersSlice';
import {
  selectRaceClasses,
  selectRacersByClass,
  selectRaces,
  selectActiveRace,
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
import { IMaskInput } from 'react-imask';
import {
  loadRacesFromStorage,
  setCurrentRace,
  RaceStatus,
  RaceClassStatus,
} from '@/app/store/features/racesSlice';
import { Users, Plus, Lock, Check, X } from 'lucide-react';
import RaceStatusBadge, { RaceClassStatusBadge } from '@/components/RaceStatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CurrentRaceBadge from '@/components/CurrentRaceBadge';

const Racers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [editingRacer, setEditingRacer] = useState<Racer | null>(null);
  const [seedTimes, setSeedTimes] = useState<Record<string, string>>({});
  const hasRace = useSelector(selectHasActiveRace);
  const races = useSelector(selectRaces);
  const activeRace = useSelector(selectActiveRace);

  // Get race classes
  const raceClasses = useSelector(selectRaceClasses);

  // Get racers by class
  const racersByClass = useSelector((state: RootState) => {
    const result: Record<string, Racer[]> = {};
    raceClasses.forEach(raceClass => {
      result[raceClass.raceClass] = selectRacersByClass(state, raceClass.raceClass);
    });
    return result;
  });

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
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          <Card className="shadow-md">
            <div className="flex flex-col">
              <CardHeader className="pb-2">
                <h2 className="text-xl font-semibold flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" /> Racer Management
                </h2>
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
                <Users className="h-5 w-5 mr-2 text-primary" /> Race Seeding
              </h2>
              <p className="text-muted-foreground text-sm">Seed your races here.</p>
            </CardHeader>
            <div className="px-6 mb-6">
              <hr className="border-t border-muted" />
            </div>
            <CardContent>
              <Tabs defaultValue={activeRace?.id} className="w-full">
                <TabsList className="w-full justify-start">
                  {races
                    .filter(
                      race =>
                        race.status === RaceStatus.Configuring ||
                        race.status === RaceStatus.In_Progress
                    )
                    .map(race => (
                      <TabsTrigger
                        key={race.id}
                        value={race.id}
                        className="flex items-center gap-2"
                      >
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
                                  {raceClass.raceClass.replace('-', ' ')}
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
