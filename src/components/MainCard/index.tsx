"use client";

import React from "react";
import {
  Card,
  CardContent
} from "@/components/ui/card";

interface MainCardProps {
  children: React.ReactNode;
}

const MainCard: React.FC<MainCardProps> = ({ children }) => {
  return (
    <div className="w-1/2 mt-48">
      <Card>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

export default MainCard;
