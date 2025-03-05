import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RaceStatus } from '@/store/features/racesSlice';
import RaceStatusBadge from '@/components/RaceStatusBadge';
import CurrentRaceBadge from '@/components/CurrentRaceBadge';
import { useSelector } from 'react-redux';
import { selectRaces, selectActiveRace } from '@/store/selectors/raceSelectors';
import { getActiveRaces } from '@/helpers/racers';

interface RaceTabsHeaderProps {
  filterStatus?: boolean;
  selectedRaceId?: string;
  onTabChange: (raceId: string) => void;
}

export const RaceTabsHeader = ({ filterStatus = false, onTabChange }: RaceTabsHeaderProps) => {
  const allRaces = useSelector(selectRaces);
  const activeRace = useSelector(selectActiveRace);
  const initialRaces = getActiveRaces(allRaces);
  
  const races = filterStatus
    ? initialRaces.filter(
        race =>
          race.status === RaceStatus.Configuring ||
          race.status === RaceStatus.In_Progress
      )
    : initialRaces;

  return (
    <TabsList className="w-full justify-start">
      {races.map(race => (
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