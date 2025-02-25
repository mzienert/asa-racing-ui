import React from 'react';
import { Racer } from '@/app/store/features/racersSlice';
import { organizeFirstRoundPairs, getRacerDisplayName } from '@/helpers/races';

interface BracketViewProps {
  racers: Racer[];
}

interface RaceMatchProps {
  raceNumber: number;
  position: 'left' | 'right';
  racers?: Racer[];
}

const RaceMatch: React.FC<RaceMatchProps> = ({ raceNumber, position, racers = [] }) => {
  return (
    <div className="relative flex flex-col border rounded-md p-2 w-[220px] bg-card shadow-sm">
      <div className="text-sm text-muted-foreground mb-1 font-medium">Race {raceNumber}</div>
      <div className="flex flex-col">
        {racers.map((racer, index) => (
          <div
            key={racer?.id || index}
            className={`text-sm border-b py-1.5 px-2 ${
              index % 2 === 0 ? 'bg-muted/10' : 'bg-muted/5'
            } ${index === 0 ? 'rounded-t-sm' : ''} ${
              index === racers.length - 1 ? 'rounded-b-sm border-b-0' : ''
            } truncate`}
          >
            {getRacerDisplayName(racer)}
          </div>
        ))}
      </div>
    </div>
  );
};

const BracketView: React.FC<BracketViewProps> = ({ racers }) => {
  const firstRoundPairs = organizeFirstRoundPairs(racers);

  return (
    <div className="overflow-x-auto w-full h-full">
      <div className="flex gap-24 p-8 pb-16 min-w-[1200px] min-h-[900px]">
        {/* Second Chance Column */}
        <div className="flex flex-col gap-8 flex-1">
          <h3 className="text-xl font-semibold text-foreground/90 mb-4">Second Chance</h3>
          <div className="flex flex-col gap-24">
            <RaceMatch raceNumber={firstRoundPairs.length + 1} position="left" />
          </div>
        </div>

        {/* First Round Column */}
        <div className="flex flex-col gap-4 flex-1">
          <h3 className="text-xl font-semibold text-foreground/90 mb-2">First Round</h3>
          <div className="flex flex-col gap-8">
            {firstRoundPairs.map((racers, index) => (
              <RaceMatch 
                key={index}
                raceNumber={index + 1} 
                position="left" 
                racers={racers}
              />
            ))}
          </div>
        </div>

        {/* Round of 8 Column */}
        <div className="flex flex-col gap-8 flex-1">
          <h3 className="text-xl font-semibold text-foreground/90 mb-4">Round of 8</h3>
          <div className="flex flex-col gap-24">
            <RaceMatch raceNumber={firstRoundPairs.length + 2} position="right" />
            <RaceMatch raceNumber={firstRoundPairs.length + 3} position="right" />
          </div>
        </div>

        {/* Finals Column */}
        <div className="flex flex-col gap-8 flex-1">
          <h3 className="text-xl font-semibold text-foreground/90 mb-4">Finals</h3>
          <div className="flex flex-col gap-24">
            <RaceMatch raceNumber={firstRoundPairs.length + 4} position="right" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BracketView; 