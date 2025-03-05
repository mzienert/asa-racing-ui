'use client';
import { loadRacersFromStorage } from '@/store/features/racersSlice';
import {
  selectRaces,
  selectActiveRace,
  selectRacersByRaceId,
  selectRaceClassesByRaceId,
} from '@/store/selectors/raceSelectors';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectHasActiveRace } from '@/store/selectors/raceSelectors';
import { Card, CardContent } from '@/components/ui/card';
import type { AppDispatch } from '@/store/store';
import {
  loadRacesFromStorage,
  setCurrentRace,
} from '@/store/features/racesSlice';
import { Users } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { getActiveRaces } from '@/helpers/racers';
import NoRaceState from '@/components/NoRaceState';
import RaceTabsHeader from '@/components/RaceTabsHeader';
import PageHeader from '@/components/PageHeader';
import RacerContainer from '@/components/RacerContainer';
import { RootState } from '@/store/store';
import { Race } from '@/store/features/racesSlice';

interface RaceContentProps {
  race: Race;
}

const RaceContent = ({ race }: RaceContentProps) => {
  const classes = useSelector((state: RootState) => selectRaceClassesByRaceId(state, race.id));
  const racers = useSelector((state: RootState) => selectRacersByRaceId(state, race.id));

  return (
    <TabsContent key={race.id} value={race.id} className="mt-4 space-y-6">
      {classes.map((raceClass, index) => (
        <RacerContainer
          key={raceClass.raceClass}
          raceClass={raceClass}
          racersByClass={racers}
          showDivider={index > 0}
          selectedRaceId={race.id}
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
  
  const activeRaces = getActiveRaces(races);

  useEffect(() => {
    dispatch(loadRacesFromStorage());
    dispatch(loadRacersFromStorage());

    if (races.length > 0 && !hasRace) {
      dispatch(setCurrentRace(races[0].id));
    }
  }, [dispatch, races.length, hasRace]);

  useEffect(() => {
    setSelectedRaceId(activeRace?.id);
  }, [activeRace?.id]);

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
              <Tabs value={selectedRaceId} className="w-full">
                <RaceTabsHeader 
                  selectedRaceId={selectedRaceId}
                  onTabChange={setSelectedRaceId}
                />
                {activeRaces.map(race => (
                  <RaceContent key={race.id} race={race} />
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
