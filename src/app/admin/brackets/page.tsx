'use client';
import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { 
  selectHasActiveRace, 
  selectRaceClasses,
  selectRacersByAllClasses,
} from '@/app/store/selectors/raceSelectors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRacerCount } from "@/helpers/racers";
import BracketView from './BracketView';

export default function BracketsPage() {
  //const dispatch = useDispatch<AppDispatch>();
  const hasRace = useSelector(selectHasActiveRace);
  const raceClasses = useSelector(selectRaceClasses);
  const racersByClass = useSelector(selectRacersByAllClasses);
  
  if (!hasRace) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Bracket Management</h1>
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col">
              <CardHeader>
                <p className="text-muted-foreground">Manage your race brackets here.</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <p className="text-muted-foreground">Please create a race first</p>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    );
  }


  

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Bracket Management</h1>
      <Tabs defaultValue={raceClasses[0]} className="w-full">
        <TabsList className="w-full justify-start">
          {raceClasses.map((raceClass) => (
            <TabsTrigger key={raceClass} value={raceClass}>
              {raceClass} ({getRacerCount(racersByClass[raceClass])})
            </TabsTrigger>
          ))}
        </TabsList>
        {raceClasses.map((raceClass) => (
          <TabsContent key={raceClass} value={raceClass}>
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-semibold">{raceClass} Bracket</h2>
              </CardHeader>
              <CardContent>
                <BracketView racers={racersByClass[raceClass]} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
