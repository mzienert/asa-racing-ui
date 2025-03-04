import { Racer } from '@/app/store/features/racersSlice';

export function organizeFirstRoundPairs(racers: Racer[]): Racer[][] {
  const firstRoundGroups: Racer[][] = [];
  for (let i = 0; i < racers.length; i += 4) {
    const group = racers.slice(i, i + 4).filter(racer => racer != null);
    if (group.length > 0) {
      firstRoundGroups.push(group);
    }
  }
  return firstRoundGroups;
}

export function getRacerDisplayName(racer: Racer | null | undefined): string {
  return racer?.name || '';
}
