import { RaceStatus, RaceClassStatus } from '@/store/features/racesSlice';
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
      case RaceStatus.In_Progress:
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
      case RaceStatus.In_Progress:
        return 'text-green-600 bg-green-100 dark:bg-green-500/20';
      case RaceStatus.Completed:
        return 'text-purple-600 bg-purple-100 dark:bg-purple-500/20';
      default:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20';
    }
  };

  const formatStatus = (status: RaceStatus): string => {
    if (!status) return 'Configuring';
    return status
      .toString()
      .replace('_', ' ')
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, char => char.toUpperCase());
  };

  return (
    <span
      className={`font-medium inline-flex items-center px-2.5 py-1 rounded-full ${getStatusColor(status)}`}
    >
      {getStatusIcon(status)}
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{formatStatus(status)}</span>
    </span>
  );
};

interface RaceClassStatusBadgeProps {
  status: RaceClassStatus;
  size?: 'sm' | 'default';
}

export const RaceClassStatusBadge = ({ status, size = 'default' }: RaceClassStatusBadgeProps) => {
  const getStatusIcon = (status: RaceClassStatus) => {
    switch (status) {
      case RaceClassStatus.Created:
        return <Settings className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />;
      case RaceClassStatus.Seeding:
        return <UserPlus className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />;
      case RaceClassStatus.Racing:
        return <Timer className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />;
      case RaceClassStatus.Completed:
        return <CheckCircle2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />;
      default:
        return <Settings className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />;
    }
  };

  const getStatusColor = (status: RaceClassStatus) => {
    switch (status) {
      case RaceClassStatus.Created:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20';
      case RaceClassStatus.Seeding:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-500/20';
      case RaceClassStatus.Racing:
        return 'text-green-600 bg-green-100 dark:bg-green-500/20';
      case RaceClassStatus.Completed:
        return 'text-purple-600 bg-purple-100 dark:bg-purple-500/20';
      default:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20';
    }
  };

  return (
    <span
      className={`font-medium inline-flex items-center px-2.5 py-1 rounded-full ${getStatusColor(status)}`}
    >
      {getStatusIcon(status)}
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{status}</span>
    </span>
  );
};

export default RaceStatusBadge;
