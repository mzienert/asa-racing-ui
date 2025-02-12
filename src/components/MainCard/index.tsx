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
import { setUser } from "@/app/store/features/authSlice";
import { useAppDispatch } from "@/app/store/hooks";

const MainCard = () => {
  const dispatch = useAppDispatch();

  const handleLogin = () => {
    dispatch(
      setUser({
        id: '1',
        email: 'user@example.com',
      })
    )
  }
  
  return (
    <div className="w-1/2 mt-48">
      <Card>
        <CardContent>
          
        <button onClick={handleLogin}>Login</button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MainCard;
