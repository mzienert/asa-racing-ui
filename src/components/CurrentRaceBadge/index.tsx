import { Badge } from '../ui/badge';

interface CurrentRaceBadgeProps {
  className?: string;
  isActive?: boolean;
}

export const CurrentRaceBadge = ({ className, isActive }: CurrentRaceBadgeProps) => {
  if (!isActive) return null;

  return (
    <Badge
      className={`bg-green-100 hover:bg-green-100 text-green-700 rounded-full border-0 ${className}`}
    >
      Current Race
    </Badge>
  );
};

export default CurrentRaceBadge;
