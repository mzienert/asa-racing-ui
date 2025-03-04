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
import RaceTabsHeader from '@/components/RaceTabsHeader/RaceTabsHeader';
import PageHeader from '@/components/PageHeader';
import RacerContainer from '@/components/RacerContainer';

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
                      <RacerContainer
                        key={raceClass.raceClass}
                        raceClass={raceClass}
                        racersByClass={racersByClass}
                        editingRacer={editingRacer}
                        onSetEditingRacer={setEditingRacer}
                        onDeleteRacer={(id, classId) => dispatch(deletePersistedRacer({ id, classId }))}
                        onCompleteClass={handleCompleteClass}
                        showDivider={index > 0}
                      />
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
