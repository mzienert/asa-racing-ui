'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MainCardProps {
  children: React.ReactNode;
  title: string;
}

const MainCard: React.FC<MainCardProps> = ({ children, title }) => {
  return (
    <div className="w-1/2">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
};

export default MainCard;
