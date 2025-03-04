import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Race, RaceStatus } from '@/store/features/racesSlice';
import RaceStatusBadge from '@/components/RaceStatusBadge';
import CurrentRaceBadge from '@/components/CurrentRaceBadge';

interface RaceTabsHeaderProps {
  races: Race[];
  activeRaceId?: string;
  filterStatus?: boolean;
}

export const RaceTabsHeader = ({ races: initialRaces, activeRaceId, filterStatus = false }: RaceTabsHeaderProps) => {
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
        >
          <div className="flex items-center gap-2">
            {race.name}
            <div className="flex items-center gap-1">
              <RaceStatusBadge status={race.status} size="sm" />
              <CurrentRaceBadge
                className="ml-1"
                isActive={race.id === activeRaceId}
              />
            </div>
          </div>
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

export default RaceTabsHeader; 