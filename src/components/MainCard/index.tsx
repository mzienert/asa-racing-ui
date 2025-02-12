"use client";

import React from "react";
import {
  Card,
  CardContent
} from "@/components/ui/card";
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
