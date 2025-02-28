import { Racer } from '../features/racersSlice';
import { RootState } from '../store';
import { createSelector } from '@reduxjs/toolkit';

export const selectHasActiveRace = (state: RootState) => {
  return state.races.races.some(race => race.status !== 'completed');
};

export const selectActiveRace = (state: RootState) => {
  return state.races.races.find(race => race.status !== 'completed');
};

export const selectRaceClasses = (state: RootState) => {
  const activeRace = selectActiveRace(state);
  return activeRace?.classes || [];
};

export const selectRacersByClass = (state: RootState, classId: string) => 
  state.racers.racers[classId] || [];

export const selectRacersByAllClasses = createSelector(
  [selectRaceClasses, (state) => state],
  (raceClasses, state) => 
    raceClasses.reduce((acc: Record<string, Racer[]>, classId: string) => ({
      ...acc,
      [classId]: selectRacersByClass(state, classId)
    }), {} as Record<string, Racer[]>)
);