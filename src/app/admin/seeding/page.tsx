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
import { getActiveRaces } from '@/helpers/racers';
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
  const activeRaces = getActiveRaces(races);
  const [selectedRaceId, setSelectedRaceId] = useState<string | undefined>(activeRace?.id);

  useEffect(() => {
    // Load both races and racers
    dispatch(loadRacesFromStorage());
    dispatch(loadRacersFromStorage());

    // If we have races but no active race, set the first race as active
    if (races.length > 0 && !hasRace) {
      dispatch(setCurrentRace(races[0].id));
    }
  }, [dispatch, races.length, hasRace]);

  useEffect(() => {
    setSelectedRaceId(activeRace?.id);
  }, [activeRace?.id]);

  if (!hasRace) {
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
                {activeRaces.map(race => (
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
