import { Racer } from '../features/racersSlice';
import { RootState } from '../store';
import { createSelector } from '@reduxjs/toolkit';

export const selectHasActiveRace = (state: RootState) => {
  return state.races.some(race => race.completed === false);
};

export const selectActiveRace = (state: RootState) => {
  return state.races.find(race => race.completed === false);
};

export const selectRaceClasses = (state: RootState) => {
  const activeRace = selectActiveRace(state);
  return activeRace?.raceClasses || [];
};

export const selectRacersByClass = (state: RootState, classId: string) => 
  state.racers.racers[classId] || [];

export const selectRacersByAllClasses = createSelector(
  [selectRaceClasses, (state) => state],
  (raceClasses, state) => 
    raceClasses.reduce((acc, classId) => ({
      ...acc,
      [classId]: selectRacersByClass(state, classId)
    }), {} as Record<string, Racer[]>)
);