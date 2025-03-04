import { LucideIcon } from 'lucide-react';
import { Card, CardHeader } from './ui/card';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold flex items-center">
          <Icon className="h-5 w-5 mr-2 text-primary" /> {title}
        </h2>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
    </Card>
  );
}
