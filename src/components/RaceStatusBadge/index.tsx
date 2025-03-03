import { RaceStatus } from '@/app/store/features/racesSlice';
import { Settings, UserPlus, Timer, CheckCircle2 } from 'lucide-react';

interface RaceStatusBadgeProps {
  status: RaceStatus;
  size?: 'sm' | 'default';
}

const RaceStatusBadge = ({ status, size = 'default' }: RaceStatusBadgeProps) => {
  const getStatusIcon = (status: RaceStatus) => {
    switch (status) {
      case RaceStatus.Configuring:
        return <Settings className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />;
      case RaceStatus.Seeding:
        return <UserPlus className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />;
      case RaceStatus.Racing:
        return <Timer className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />;
      case RaceStatus.Completed:
        return <CheckCircle2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />;
      default:
        return <Settings className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />;
    }
  };

  const getStatusColor = (status: RaceStatus) => {
    switch (status) {
      case RaceStatus.Configuring:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20';
      case RaceStatus.Seeding:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-500/20';
      case RaceStatus.Racing:
        return 'text-green-600 bg-green-100 dark:bg-green-500/20';
      case RaceStatus.Completed:
        return 'text-purple-600 bg-purple-100 dark:bg-purple-500/20';
      default:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20';
    }
  };

  const formatStatus = (status: RaceStatus): string => {
    if (!status) return 'Configuring'; // Default fallback
    
    // Remove any underscores and convert to title case
    return status.toString()
      .replace('_', ' ')
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, char => char.toUpperCase());
  };

  return (
    <span className={`font-medium inline-flex items-center px-2.5 py-1 rounded-full ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{formatStatus(status)}</span>
    </span>
  );
};

export default RaceStatusBadge;