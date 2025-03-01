import { RaceDetailsProps } from '@/app/admin/races/page';

const RaceDetails = ({ race }: RaceDetailsProps) => {
  return (
    <div className="space-y-3 border rounded-lg p-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Race Name:</span>
        <span className="font-medium">{race.name}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Date:</span>
        <span className="font-medium">
          {race.date ? new Date(race.date).toLocaleDateString() : 'Not set'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Race Format:</span>
        <span className="font-medium">{race.raceFormat || 'Not set'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Race Classes:</span>
        <span className="font-medium">
          {race.raceClasses?.length ? race.raceClasses.join(', ') : 'None selected'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Status:</span>
        <span className="font-medium">{race.completed ? 'Completed' : 'In Progress'}</span>
      </div>
    </div>
  );
};

export default RaceDetails;
