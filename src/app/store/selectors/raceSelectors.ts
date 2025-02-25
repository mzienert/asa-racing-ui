import { RootState } from '../store';

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