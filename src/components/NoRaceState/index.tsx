import { Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';

interface NoRaceStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const NoRaceState = ({ title, description, icon = <Users className="h-5 w-5 mr-2 text-primary" /> }: NoRaceStateProps) => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-4">
        <Card className="shadow-md">
          <div className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold flex items-center">
                  {icon} {title}
                </h2>
              </div>
              <p className="text-muted-foreground">{description}</p>
              <div className="h-1 w-20 bg-primary/70 rounded-full mt-2"></div>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <p className="text-muted-foreground mb-4">Please create a race first</p>
              <Link href="/admin/races/create">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" /> Create Race
                </Button>
              </Link>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NoRaceState; 