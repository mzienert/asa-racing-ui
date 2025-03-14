'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import NoRaceState from '@/components/NoRaceState';
import { selectActiveRace } from '@/store/selectors/raceSelectors';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy } from 'lucide-react';
import { createSelector } from 'reselect';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BracketRacer {
  id: string;
  name: string;
  bibNumber: string;
  seedData?: {
    startingPosition?: number;
  };
}

interface BracketRace {
  raceNumber: number;
  winners?: string[];
  losers?: string[];
  racers: BracketRacer[];
  bracketType: 'winners' | 'losers' | 'final';
  round: number;
  status: 'pending' | 'completed';
  position: number;
  raceClass: string;
  disqualifiedRacers?: string[];
  finalRankings?: {
    first?: string;
    second?: string;
    third?: string;
    fourth?: string;
  };
}

interface BracketRound {
  roundNumber: number;
  races: BracketRace[];
  raceId: string;
  raceClass: string;
  bracketType: 'winners' | 'losers' | 'final';
}

interface RaceResult {
  position: number;
  riderNumber: number;
  name: string;
  class: string;
  lapTime: string;
  totalTime: string;
  status: 'finished' | 'DNF' | 'DNS';
}

// Add ClassTabsHeader component
interface ClassTabsHeaderProps {
  raceClasses: Array<{ raceClass: string }>;
  onTabChange: (raceClass: string) => void;
}

const ClassTabsHeader = ({ raceClasses, onTabChange }: ClassTabsHeaderProps) => {
  return (
    <TabsList className="w-full justify-start border-b border-b-[1px] border-input">
      {raceClasses.map(({ raceClass }) => (
        <TabsTrigger
          key={raceClass}
          value={raceClass}
          className="flex items-center gap-2 rounded-none rounded-t-lg"
          onClick={() => onTabChange(raceClass)}
        >
          {raceClass}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

// Add ResultsContent component
interface ResultsContentProps {
  race: {
    id: string;
    raceClasses: Array<{ raceClass: string }>;
  };
  selectedClass: string;
}

// Add helper function to find third place finisher
const findThirdPlaceFinisher = (brackets: BracketRound[]): string | undefined => {
  console.log('Finding third place finisher...');

  // Look for Race 4 in the second chance bracket (second round)
  const secondChanceRounds = brackets.filter(round => round.bracketType === 'losers' && round.roundNumber === 2);
  console.log('Second chance finals round:', secondChanceRounds);

  // Find race 4 specifically
  for (const round of secondChanceRounds) {
    const race4 = round.races.find(race => race.raceNumber === 4);
    if (race4) {
      console.log('Found race 4:', {
        raceNumber: race4.raceNumber,
        winners: race4.winners,
        losers: race4.losers,
      });

      if (race4.losers && race4.losers.length > 0) {
        console.log('Found third place from race 4:', race4.losers[0]);
        return race4.losers[0];
      }
    }
  }

  // If race 4 isn't found or doesn't have a loser, log the error and return undefined
  console.log('No third place finisher found - race 4 not found or no loser');
  return undefined;
};

// Create a memoized selector for brackets
const selectBracketsByRaceAndClass = createSelector(
  [
    (state: RootState) => state.brackets.entities,
    (_: RootState, raceId: string) => raceId,
    (_: RootState, __: string, selectedClass: string) => selectedClass,
  ],
  (entities, raceId, selectedClass) =>
    Object.values(entities[raceId]?.[selectedClass] || {}) as BracketRound[]
);

const ResultsContent = ({ race, selectedClass }: ResultsContentProps) => {
  const brackets = useSelector((state: RootState) =>
    selectBracketsByRaceAndClass(state, race.id, selectedClass)
  );

  console.log('Processing brackets:', brackets);

  // Get final results from completed brackets
  const results: RaceResult[] = brackets
    .filter(round => {
      console.log('Checking round:', round);
      return round.bracketType === 'final';
    })
    .flatMap(round =>
      round.races
        .filter(race => {
          console.log('Checking race:', race);
          return race.status === 'completed';
        })
        .flatMap(race => {
          console.log('Processing race for results:', race);
          const raceResults: RaceResult[] = [];

          if (race.finalRankings) {
            // Find third place if not set in finalRankings
            let thirdPlaceId = race.finalRankings.third;
            if (!thirdPlaceId && race.finalRankings.first && race.finalRankings.second) {
              thirdPlaceId = findThirdPlaceFinisher(brackets);
              console.log('Found third place ID:', thirdPlaceId);
            }

            [
              { position: 1, key: 'first' },
              { position: 2, key: 'second' },
              { position: 3, id: thirdPlaceId },
              { position: 4, key: 'fourth' },
            ].forEach(({ position, key, id }) => {
              const racerId =
                id ||
                (key ? race.finalRankings![key as keyof typeof race.finalRankings] : undefined);
              if (racerId) {
                // Look for the racer in all brackets to ensure we find them
                let racer: BracketRacer | undefined;
                for (const round of brackets) {
                  for (const race of round.races) {
                    const foundRacer = race.racers.find(r => r.id === racerId);
                    if (foundRacer) {
                      racer = foundRacer;
                      break;
                    }
                  }
                  if (racer) break;
                }

                if (racer) {
                  console.log(`Found racer for position ${position}:`, racer);
                  raceResults.push({
                    position,
                    riderNumber: racer.bibNumber ? Number(racer.bibNumber) : 0,
                    name: racer.name,
                    class: race.raceClass,
                    lapTime: '-',
                    totalTime: '-',
                    status: 'finished',
                  });
                } else {
                  console.log(`Could not find racer for ID ${racerId}`);
                }
              }
            });
          }

          // Add DNF/DQ racers
          race.disqualifiedRacers?.forEach(racerId => {
            const racer = race.racers.find(r => r.id === racerId) as unknown as BracketRacer;
            if (racer) {
              console.log('DNF Racer data:', racer);
              console.log('DNF Racer number:', racer.bibNumber, typeof racer.bibNumber);
              raceResults.push({
                position: 0,
                riderNumber: racer.bibNumber ? Number(racer.bibNumber) : 0,
                name: racer.name,
                class: race.raceClass,
                lapTime: '-',
                totalTime: '-',
                status: 'DNF',
              });
            }
          });

          return raceResults;
        })
    )
    .sort((a, b) => a.position - b.position);

  if (brackets.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Trophy className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Results Available</h3>
          <p className="text-muted-foreground">Complete the races to see results here.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{selectedClass}</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded border hover:bg-accent">Export CSV</button>
          <button className="px-3 py-1 rounded border hover:bg-accent">Print Results</button>
        </div>
      </div>

      {results.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Position</TableHead>
              <TableHead className="w-24">Number</TableHead>
              <TableHead>Rider Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Best Lap</TableHead>
              <TableHead>Total Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow key={`${result.riderNumber}-${index}`}>
                <TableCell className="font-medium">{result.position || '-'}</TableCell>
                <TableCell>{result.riderNumber}</TableCell>
                <TableCell>{result.name}</TableCell>
                <TableCell>{result.class}</TableCell>
                <TableCell>{result.lapTime}</TableCell>
                <TableCell>{result.totalTime}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      result.status === 'finished'
                        ? 'bg-green-100 text-green-800'
                        : result.status === 'DNF'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {result.status.toUpperCase()}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No results available for this class.
        </div>
      )}
    </Card>
  );
};

export default function ResultsPage() {
  const activeRace = useSelector(selectActiveRace);
  const [selectedClass, setSelectedClass] = useState<string>(
    activeRace?.raceClasses[0]?.raceClass || ''
  );

  // If no active race exists, show the NoRaceComponent
  if (!activeRace) {
    return (
      <NoRaceState
        title="Results Management"
        description="Create a race in Race Management before adding results."
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <Card className="shadow-md">
          <div className="flex flex-col">
            <div className="flex justify-between items-center p-6">
              <PageHeader
                icon={Trophy}
                title="Race Results"
                description="View and export race results."
              />
            </div>
            <CardContent>
              <Tabs value={selectedClass} className="w-full">
                <ClassTabsHeader
                  raceClasses={activeRace.raceClasses}
                  onTabChange={setSelectedClass}
                />
                {activeRace.raceClasses.map(raceClass => (
                  <TabsContent
                    key={raceClass.raceClass}
                    value={raceClass.raceClass}
                    className="mt-4 space-y-6"
                  >
                    <ResultsContent race={activeRace} selectedClass={raceClass.raceClass} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
