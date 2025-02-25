import { Racer } from "@/app/store/features/racersSlice";

/**
 * Gets the number of racers in a specific race class
 * @param racers Array of racers for the class
 * @returns The count of racers, or 0 if the array is undefined
 */
export const getRacerCount = (racers: Racer[] | undefined): number => {
    return racers?.length || 0;
};
