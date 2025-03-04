import { LucideIcon } from 'lucide-react';
import { CardHeader } from '../ui/card';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const PageHeader = ({ icon: Icon, title, description }: PageHeaderProps) => {
  return (
    <>
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold mb-2 flex items-center">
          <Icon className="h-5 w-5 mr-2 text-primary" /> {title}
        </h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <div className="px-6 mb-6">
        <hr className="border-t border-muted" />
      </div>
    </>
  );
};

export default PageHeader; 