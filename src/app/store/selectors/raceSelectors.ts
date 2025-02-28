import { RootState } from '../store';
import { Race } from '../features/racesSlice';
import { Racer } from '../features/racersSlice';

export const selectRaces = (state: RootState) => {
  return state.races?.items || [];
};

export const selectActiveRace = (state: RootState) => {
  return state.races?.currentRace || null;
};

export const selectHasActiveRace = (state: RootState) => {
  return !!state.races?.currentRace;
};

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
  if (!state.racers || !state.racers.racers || !Array.isArray(state.racers.racers)) {
    return [];
  }
  
  const racersInClass = state.racers.racers.filter((racer: Racer) => racer.classId === classId);
  return racersInClass;
};

export const selectRacersByAllClasses = (state: RootState) => {
  const raceClasses = selectRaceClasses(state);
  const result: Record<string, Racer[]> = {};
  
  raceClasses.forEach(classId => {
    result[classId] = selectRacersByClass(state, classId);
  });
  
  return result;
};

export const selectRacerById = (state: RootState, id: string) => {
  if (!state.racers || !state.racers.racers || !Array.isArray(state.racers.racers)) {
    return undefined;
  }
  return state.racers.racers.find((racer: Racer) => racer.id === id);
};

export const selectRaceById = (state: RootState, id: string) => {
  const races = selectRaces(state);
  return races.find(race => race.id === id);
};