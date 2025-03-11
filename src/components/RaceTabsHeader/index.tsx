import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RaceStatus } from '@/store/features/racesSlice';
import RaceStatusBadge from '@/components/RaceStatusBadge';
import CurrentRaceBadge from '@/components/CurrentRaceBadge';
import { useSelector } from 'react-redux';
import { selectRaces, selectActiveRace } from '@/store/selectors/raceSelectors';

interface RaceTabsHeaderProps {
  filterStatus?: boolean;
  selectedRaceId?: string;
  onTabChange: (raceId: string) => void;
}

export const RaceTabsHeader = ({ filterStatus = false, onTabChange }: RaceTabsHeaderProps) => {
  const allRaces = useSelector(selectRaces);
  const activeRace = useSelector(selectActiveRace);
  
  // Only filter if filterStatus is true, otherwise show all races
  const races = filterStatus
    ? allRaces.filter(
        race =>
          race.status === RaceStatus.Configuring ||
          race.status === RaceStatus.In_Progress
      )
    : allRaces;

  // Sort races to show active race first, then by status (completed last)
  const sortedRaces = [...races].sort((a, b) => {
    // Active race always comes first
    if (a.id === activeRace?.id) return -1;
    if (b.id === activeRace?.id) return 1;
    
    // Then sort by status (completed last)
    if (a.status === ('completed' as RaceStatus) && b.status !== ('completed' as RaceStatus)) return 1;
    if (a.status !== ('completed' as RaceStatus) && b.status === ('completed' as RaceStatus)) return -1;
    
    // Finally sort by name
    return a.name.localeCompare(b.name);
  });

  return (
    <TabsList className="w-full justify-start">
      {sortedRaces.map(race => (
        <TabsTrigger
          key={race.id}
          value={race.id}
          className="flex items-center gap-2"
          onClick={() => onTabChange(race.id)}
        >
          <div className="flex items-center gap-2">
            {race.name}
            <div className="flex items-center gap-1">
              <RaceStatusBadge status={race.status} size="sm" />
              <CurrentRaceBadge
                className="ml-1"
                isActive={race.id === activeRace?.id}
              />
            </div>
          </div>
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

export default RaceTabsHeader; 