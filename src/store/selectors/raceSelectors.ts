import { RootState } from '../store';
import { Racer } from '../features/racersSlice';
import { createSelector } from '@reduxjs/toolkit';
import { findRaceClassById } from '@/helpers/racers';

export const selectRaces = (state: RootState) => state.races.items;

export const selectActiveRaceId = (state: RootState) => state.races.currentRaceId;

export const selectActiveRace = (state: RootState) => {
  const currentRaceId = state.races.currentRaceId;
  if (!currentRaceId) return null;

  return state.races.items.find(race => race.id === currentRaceId) || null;
};

export const selectHasActiveRace = (state: RootState) => !!state.races.currentRaceId;

export const selectFirstRace = (state: RootState) => {
  const races = selectRaces(state);
  return races.length > 0 ? races[0] : null;
};

export const selectRaceClasses = (state: RootState) => {
  // First try to get classes from active race
  const activeRace = selectActiveRace(state);
  if (activeRace?.raceClasses && activeRace.raceClasses.length > 0) {
    return activeRace.raceClasses;
  }

  // If no active race or no classes in active race, try the first race
  const firstRace = selectFirstRace(state);
  if (firstRace?.raceClasses && firstRace.raceClasses.length > 0) {
    return firstRace.raceClasses;
  }

  return [];
};

export const selectRacersByClass = (state: RootState, classId: string) => {
  if (!state.racers || !state.racers.items || !Array.isArray(state.racers.items)) {
    return [];
  }

  const racersInClass = state.racers.items.filter((racer: Racer) => racer.classId === classId);
  return racersInClass;
};

const selectRacersItems = (state: RootState) => state.racers?.items || [];

export const selectRacersByAllClasses = createSelector(
  [selectRaceClasses, selectRacersItems, selectActiveRaceId],
  (raceClasses, racers, activeRaceId): Record<string, Racer[]> => {
    if (!raceClasses.length || !activeRaceId) {
      return {};
    }

    // Initialize result object with empty arrays for each class
    const result: Record<string, Racer[]> = Object.fromEntries(
      raceClasses.map(rc => [rc.raceClass, []])
    );

    // Single pass through racers
    racers.forEach(racer => {
      if (racer.raceId === activeRaceId && result.hasOwnProperty(racer.classId)) {
        result[racer.classId].push(racer);
      }
    });

    return result;
  }
);

export const selectRacerById = (state: RootState, id: string) => {
  if (!state.racers || !state.racers.items || !Array.isArray(state.racers.items)) {
    return undefined;
  }
  return state.racers.items.find((racer: Racer) => racer.id === id);
};

export const selectRaceById = (state: RootState, id: string) => {
  const races = selectRaces(state);
  return races.find(race => race.id === id);
};

export const selectRaceClassById = createSelector(
  [selectRaceClasses, (_state: RootState, classId: string) => classId],
  (raceClasses, classId) => findRaceClassById(raceClasses, classId)
);

export const selectRacersByActiveRaceClass = createSelector(
  [selectRaceClasses, selectRacersItems, selectActiveRace],
  (raceClasses, racers, activeRace) => {
    const result: Record<string, Racer[]> = {};
    if (!activeRace) return result;

    raceClasses.forEach(raceClass => {
      result[raceClass.raceClass] = racers.filter(
        racer => racer.classId === raceClass.raceClass && racer.raceId === activeRace.id
      );
    });
    return result;
  }
);
