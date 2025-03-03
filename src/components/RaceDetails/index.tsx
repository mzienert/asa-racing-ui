import { RaceDetailsProps } from '@/app/admin/races/page';
import { format } from 'date-fns';
import { Trophy, CalendarIcon, ListTodo, Users, Flag, CheckCircle2, Settings, UserPlus, Timer } from 'lucide-react';
import { RaceStatus } from '@/app/store/features/racesSlice';

const RaceDetails = ({ race }: RaceDetailsProps) => {
  const getStatusIcon = (status: RaceStatus) => {
    switch (status) {
      case RaceStatus.Configuring:
        return <Settings className="h-4 w-4 mr-2" />;
      case RaceStatus.Seeding:
        return <UserPlus className="h-4 w-4 mr-2" />;
      case RaceStatus.Racing:
        return <Timer className="h-4 w-4 mr-2" />;
      case RaceStatus.Completed:
        return <CheckCircle2 className="h-4 w-4 mr-2" />;
      default:
        return <Settings className="h-4 w-4 mr-2" />;
    }
  };

  const getStatusColor = (status: RaceStatus) => {
    switch (status) {
      case RaceStatus.Configuring:
        return 'text-yellow-600';
      case RaceStatus.Seeding:
        return 'text-blue-600';
      case RaceStatus.Racing:
        return 'text-green-600';
      case RaceStatus.Completed:
        return 'text-purple-600';
      default:
        return 'text-yellow-600';
    }
  };

  const formatStatus = (status: RaceStatus): string => {
    // Convert enum value like 'CONFIGURING' to 'Configuring'
    return status.toLowerCase().replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
  };

  return (
    <div className="space-y-4 bg-muted/90 p-4 rounded-lg border border-muted/30">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
          <Trophy className="h-4 w-4 mr-2" /> Race Name:
        </h3>
        <p className="text-lg font-medium">{race.name}</p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" /> Date:
        </h3>
        <p className="text-lg">
          {race.date ? format(new Date(race.date), 'PPP') : 'Not set'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
          <ListTodo className="h-4 w-4 mr-2" /> Race Format:
        </h3>
        <p className="text-lg capitalize">
          {race.raceFormat?.replace('-', ' ') || 'Not set'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
          <Users className="h-4 w-4 mr-2" /> Race Classes:
        </h3>
        {race.raceClasses && race.raceClasses.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {race.raceClasses.map(raceClass => (
              <span
                key={raceClass}
                className="inline-block bg-muted/40 px-3 py-1 rounded-md text-sm capitalize"
              >
                {raceClass.replace('-', ' ')}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-lg">No classes selected</p>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
          <Flag className="h-4 w-4 mr-2" /> Status:
        </h3>
        <p className="text-lg">
          <span className={`font-medium flex items-center ${getStatusColor(race.status || RaceStatus.Configuring)}`}>
            {getStatusIcon(race.status || RaceStatus.Configuring)} {formatStatus(race.status || RaceStatus.Configuring)}
          </span>
        </p>
      </div>
    </div>
  );
};

export default RaceDetails;
