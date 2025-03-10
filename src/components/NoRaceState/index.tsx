import { Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface NoRaceStateProps {
  title: string;
  description: string;
}

const NoRaceState = ({ title, description }: NoRaceStateProps) => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Trophy className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground">
              {description}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NoRaceState; 