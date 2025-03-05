import { Users } from 'lucide-react';
import { RaceClassStatusBadge } from '@/components/RaceStatusBadge';
import { RaceClassStatus } from '@/store/features/racesSlice';

interface RaceClassHeaderProps {
  className?: string;
  raceClassName: string;
  status: RaceClassStatus;
}

export const RaceClassHeader = ({ className = '', raceClassName, status }: RaceClassHeaderProps) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h2 className="text-2xl font-semibold flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary" />
          {raceClassName?.replace('-', ' ') || raceClassName}
        </h2>
        <div className="h-1 w-20 bg-primary/70 rounded-full mt-2"></div>
      </div>
      <RaceClassStatusBadge status={status} size="sm" />
    </div>
  );
}; 