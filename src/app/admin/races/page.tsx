'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store/store';

import {
  loadRacesFromStorage,
  deletePersistedRace,
  setCurrentRace,
  RaceStatus,
  RaceClass,
} from '@/store/features/racesSlice';
import { selectActiveRace, selectRaces } from '@/store/selectors/raceSelectors';
import RaceManagementContainer from '@/components/RaceManagementContainer';
import RaceListContainer from '@/components/RaceListContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import NoRaceState from '@/components/NoRaceState';

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
            <PageHeader
              icon={Trophy}
              title="Race Management"
              description="Manage your racing events here."
            />
            <CardContent>
              <RaceManagementContainer
                activeRace={activeRace}
                hasActiveRace={!!activeRace}
                onDeleteRace={handleDeleteRace}
                onSetCurrentRace={id => dispatch(setCurrentRace(id))}
              />
            </CardContent>
          </div>
        </Card>

        {/* Only show RaceListContainer when there are races */}
        {allRaces.length > 0 && (
          <RaceListContainer
            races={allRaces}
            activeRaceId={activeRace?.id || null}
            onSetCurrent={id => dispatch(setCurrentRace(id))}
            onDelete={id => dispatch(deletePersistedRace(id))}
          />
        )}
      </div>
    </div>
  );
}
