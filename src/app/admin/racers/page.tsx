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

  if (classes.length === 0) {
    return (
      <TabsContent key={race.id} value={race.id} className="mt-4">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Race Classes</h3>
            <p className="text-muted-foreground">
              Create race classes in the Race Management section before adding racers.
            </p>
          </div>
        </Card>
      </TabsContent>
    );
  }

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
  const races = useSelector(selectRaces);
  const hasRace = useSelector(selectHasActiveRace);
  const activeRace = useSelector(selectActiveRace);
  const [selectedRaceId, setSelectedRaceId] = useState<string | undefined>(activeRace?.id);
  
  useEffect(() => {
    dispatch(loadRacesFromStorage());
    dispatch(loadRacersFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (races.length > 0 && !hasRace && !activeRace) {
      dispatch(setCurrentRace(races[0].id));
    }
  }, [dispatch, hasRace, activeRace, races]);

  useEffect(() => {
    setSelectedRaceId(activeRace?.id);
  }, [activeRace?.id]);

  if (races.length === 0) {
    return (
      <NoRaceState 
        title="Racer Management" 
        description="Create a race in Race Management before adding racers." 
      />
    );
  }

  if (!races.find(race => race.id === selectedRaceId)) {
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
                {races.map(race => (
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
