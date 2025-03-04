'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/app/store/store';

import {
  loadRacesFromStorage,
  deletePersistedRace,
  setCurrentRace,
  RaceStatus,
  RaceClass,
} from '@/app/store/features/racesSlice';
import {
  selectActiveRace,
  selectRaces,
} from '@/app/store/selectors/raceSelectors';
import RaceManagementContainer from '@/components/RaceManagementContainer';
import RaceListContainer from '@/components/RaceListContainer';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export interface RaceDetailsProps {
  race: {
    name: string;
    date: string;
    raceClasses: RaceClass[];
    status: RaceStatus;
  };
}

export default function RacesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const activeRace = useSelector(selectActiveRace);
  const allRaces = useSelector(selectRaces);

  useEffect(() => {
    dispatch(loadRacesFromStorage());
  }, [dispatch]);

  const handleDeleteRace = () => {
    if (activeRace) {
      dispatch(deletePersistedRace(activeRace.id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <Card className="shadow-md">
          <div className="flex flex-col">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-primary" /> Race Management
              </h2>
              <p className="text-muted-foreground text-sm">Manage your racing events here.</p>
            </CardHeader>
            <div className="px-6 mb-6">
              <hr className="border-t border-muted" />
            </div>
            <CardContent>
              <RaceManagementContainer
                activeRace={activeRace}
                hasActiveRace={!!activeRace}
                onDeleteRace={handleDeleteRace}
                onSetCurrentRace={(id) => dispatch(setCurrentRace(id))}
              />
            </CardContent>
          </div>
        </Card>

        <RaceListContainer
          races={allRaces}
          activeRaceId={activeRace?.id || null}
          onSetCurrent={(id) => dispatch(setCurrentRace(id))}
          onDelete={(id) => dispatch(deletePersistedRace(id))}
        />
      </div>
    </div>
  );
}
