'use client';
import { loadRacersFromStorage } from '@/store/features/racersSlice';
import {
  selectRaces,
  selectActiveRace,
  selectRaceClassesByRaceId,
  selectRacersByRaceId,
} from '@/store/selectors/raceSelectors';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectHasActiveRace } from '@/store/selectors/raceSelectors';
import { Card, CardContent } from '@/components/ui/card';
import type { AppDispatch } from '@/store/store';
import { loadRacesFromStorage, setCurrentRace } from '@/store/features/racesSlice';
import { Users } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import RaceTabsHeader from '@/components/RaceTabsHeader';
import NoRaceState from '@/components/NoRaceState';
import PageHeader from '@/components/PageHeader';
import { RootState } from '@/store/store';
import type { Race } from '@/store/features/racesSlice';
import SeedingContainer from '@/components/SeedingContainer';

interface SeedingContentProps {
  race: Race;
}

const SeedingContent = ({ race }: SeedingContentProps) => {
  const selectedRaceClasses = useSelector((state: RootState) =>
    selectRaceClassesByRaceId(state, race.id)
  );
  const racersByClass = useSelector((state: RootState) => selectRacersByRaceId(state, race.id));

  // Add check for empty racers
  const hasRacers = Object.values(racersByClass).some(classRacers => classRacers.length > 0);

  if (!hasRacers) {
    return (
      <TabsContent key={race.id} value={race.id} className="mt-4">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Racers Added</h3>
            <p className="text-muted-foreground">
              Add racers in the Racer Management section before starting seeding.
            </p>
          </div>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent key={race.id} value={race.id} className="mt-4 space-y-6">
      {selectedRaceClasses.map((raceClass, index) => (
        <SeedingContainer
          key={raceClass.raceClass}
          raceClass={{ ...raceClass, raceId: race.id }}
          racersByClass={racersByClass}
          showDivider={index > 0}
        />
      ))}
    </TabsContent>
  );
};

const Racers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const hasRace = useSelector(selectHasActiveRace);
  const races = useSelector(selectRaces);
  const activeRace = useSelector(selectActiveRace);
  const [selectedRaceId, setSelectedRaceId] = useState<string | undefined>(activeRace?.id);

  useEffect(() => {
    dispatch(loadRacesFromStorage());
    dispatch(loadRacersFromStorage());
  }, [dispatch]);

  useEffect(() => {
    // If we have races but no active race, set the first race as active
    if (races.length > 0 && !hasRace) {
      dispatch(setCurrentRace(races[0].id));
    }
  }, [dispatch, races, hasRace]);

  useEffect(() => {
    setSelectedRaceId(activeRace?.id);
  }, [activeRace?.id]);

  // Add check for no races
  if (races.length === 0) {
    return (
      <NoRaceState
        title="Race Seeding"
        description="Create a race in Race Management to start seeding."
      />
    );
  }

  // Only check if we have a currentRaceId
  if (!races.find(race => race.id === selectedRaceId)) {
    return <NoRaceState title="Race Seeding" description="Seed your races here." />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <Card className="shadow-md">
          <div className="flex flex-col">
            <PageHeader icon={Users} title="Race Seeding" description="Seed your races here." />
            <CardContent>
              <Tabs value={selectedRaceId} className="w-full">
                <RaceTabsHeader selectedRaceId={selectedRaceId} onTabChange={setSelectedRaceId} />
                {races.map(race => (
                  <SeedingContent key={race.id} race={race} />
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
