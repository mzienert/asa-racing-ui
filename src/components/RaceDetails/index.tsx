import { RaceDetailsProps } from '@/app/admin/races/page';
import { format } from 'date-fns';
import { Trophy, CalendarIcon, ListTodo, Users, Flag, CheckCircle2, Clock } from 'lucide-react';

const RaceDetails = ({ race }: RaceDetailsProps) => {
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
          {race.completed ? (
            <span className="text-green-600 font-medium flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Completed
            </span>
          ) : (
            <span className="text-blue-600 font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" /> In Progress
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default RaceDetails;
