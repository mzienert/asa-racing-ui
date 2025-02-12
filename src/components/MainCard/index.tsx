"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const MainCard = () => {

  return (
    <div className="w-1/2 mt-48">
      <Card>
        <CardHeader>
          <CardTitle>Hello World</CardTitle>
          <CardDescription>
            Enter your tracking numbers below. One on each line.
          </CardDescription>
        </CardHeader>
        <CardContent>
          
         Hello World
        </CardContent>
        <CardFooter>
            Goodbye World
        </CardFooter>
      </Card>
    </div>
  );
};

export default MainCard;
