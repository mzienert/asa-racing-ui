import { Racer } from '@/store/features/racersSlice';
import { Race, RaceClass, RaceStatus } from '@/store/features/racesSlice';

/**
 * Gets the number of racers in a specific race class
 * @param racers Array of racers for the class
 * @returns The count of racers, or 0 if the array is undefined
 */
export const getRacerCount = (racers: Racer[] | undefined): number => {
  return racers?.length || 0;
};

/**
 * Finds a race class by its ID from an array of race classes
 * @param raceClasses Array of race classes to search through
 * @param classId The ID of the race class to find
 * @returns The found race class or undefined
 */
export const findRaceClassById = (raceClasses: RaceClass[], classId: string): RaceClass | undefined => {
  return raceClasses.find(rc => rc.raceClass === classId);
};

/**
 * Filters races that are either configuring or in progress
 * @param races Array of races to filter
 * @returns Array of active races
 */
export const getActiveRaces = (races: Race[]): Race[] => {
  return races.filter(
    race => race.status === RaceStatus.Configuring || race.status === RaceStatus.In_Progress
  );
};
