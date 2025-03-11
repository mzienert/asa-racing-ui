'use client';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  loadBracketsFromStorage,
  updateRaceResults,
  resetBrackets,
  updateFinalRankings,
  disqualifyRacer,
} from '@/store/features/bracketSlice';
import {
  loadRacesFromStorage,
  setCurrentRace,
  updateRaceClass,
  RaceClassStatus,
  updateRaceStatus,
} from '@/store/features/racesSlice';
import { loadRacersFromStorage } from '@/store/features/racersSlice';
import {
  selectActiveRace,
  selectHasActiveRace,
  selectRaces,
} from '@/store/selectors/raceSelectors';
import { AppDispatch } from '@/store/store';
import { Users, Trophy, Ban } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectRaceClassesByRaceId, selectRacersByRaceId } from '@/store/selectors/raceSelectors';
import { RootState } from '@/store/store';
import type { Race } from '@/store/features/racesSlice';
import type { BracketRace, BracketRound } from '@/store/features/bracketSlice';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RaceStatus } from '@/store/features/bracketSlice';
import { Circle, RefreshCw } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import NoRaceState from '@/components/NoRaceState';

interface BracketContentProps {
  race: Race;
  selectedClass: string;
}

/* interface BracketMatch {
  id: string;
  round: number;
  position: number;
  racers: Array<{
    id: string;
    name: string;
    isWinner?: boolean;
  }>;
  nextMatchId?: string;
} */

/* interface BracketRoundProps {
  round: number;
  matches: BracketMatch[];
  onWinnerSelect: (matchId: string, racerId: string) => void;
} */

interface BracketRaceProps {
  race: BracketRace;
  onWinnerSelect: (raceNumber: number, winners: string[], losers: string[]) => void;
  winners: string[];
  onFinalRankings?: (rankings: {
    first: string;
    second: string;
    third: string;
    fourth: string;
  }) => void;
}

const RaceStatusIndicator = ({ status }: { status: RaceStatus }) => {
  const statusColors = {
    pending: 'text-gray-400',
    in_progress: 'text-yellow-500',
    completed: 'text-green-500',
  };

  return <Circle className={cn('h-4 w-4', statusColors[status])} />;
};

const BracketRace = ({ race, onWinnerSelect, winners, onFinalRankings }: BracketRaceProps) => {
  const [selectedRacers, setSelectedRacers] = useState<string[]>(winners || []);
  const [rankings, setRankings] = useState<Record<string, number>>({});
  const dispatch = useDispatch<AppDispatch>();

  // Update selected racers when winners prop changes
  useEffect(() => {
    if (race.bracketType !== 'final') {
      setSelectedRacers(winners || []);
    }
    // Initialize rankings from finalRankings if they exist
    if (race.finalRankings) {
      const newRankings: Record<string, number> = {};
      if (race.finalRankings.first) newRankings[race.finalRankings.first] = 1;
      if (race.finalRankings.second) newRankings[race.finalRankings.second] = 2;
      // For 3 racers, use position 3 instead of 4
      if (race.finalRankings.third) {
        newRankings[race.finalRankings.third] = race.racers.length === 3 ? 3 : 4;
      }
      setRankings(newRankings);
    }
  }, [race.bracketType, winners, race.finalRankings, race.racers.length]);

  // Ensure we have valid racers
  const validRacers = (race.racers || []).filter((racer): racer is Racer => 
    racer != null && typeof racer === 'object' && 'id' in racer
  );

  // Determine if this is a second chance race with exactly 2 racers
  const isSecondChanceTwoRacers = race.bracketType === 'losers' && validRacers.length === 2;

  const handleRacerSelect = (racerId: string) => {
    if (race.bracketType === 'final') {
      console.log('Final race racer select - Initial state:', {
        racerId,
        currentRankings: rankings,
        totalRacers: race.racers.length,
        racers: race.racers.map(r => `${r.name} (${r.id})`),
        validRacers: validRacers.map(r => `${r.name} (${r.id})`)
      });

      // For finals, we track position 1-3 or 1-4 depending on number of racers
      const currentPosition = rankings[racerId];
      const newRankings = { ...rankings };

      if (currentPosition) {
        console.log('Removing existing position:', {
          racer: racerId,
          position: currentPosition
        });
        delete newRankings[racerId];
      } else {
        // Find next available position
        const usedPositions = Object.values(newRankings);
        let nextPosition = 1;
        while (usedPositions.includes(nextPosition) && nextPosition <= race.racers.length) {
          nextPosition++;
        }
        if (nextPosition <= race.racers.length) {
          console.log('Assigning new position:', {
            racer: racerId,
            position: nextPosition,
            usedPositions,
            totalRacers: race.racers.length
          });
          newRankings[racerId] = nextPosition;
        }
      }

      console.log('Updated rankings:', newRankings);
      setRankings(newRankings);

      // If we have all positions filled for the available racers
      const positions = Object.entries(newRankings);
      console.log('Checking positions:', {
        positions,
        racersLength: race.racers.length,
        isComplete: positions.length === race.racers.length
      });

      if (positions.length === race.racers.length && onFinalRankings) {
        console.log('All positions filled, preparing final rankings');
        
        // Sort positions by rank
        const sortedPositions = positions.sort(([, a], [, b]) => a - b);
        console.log('Sorted positions:', sortedPositions);
        
        const racerIds = sortedPositions.map(([id]) => id);
        console.log('Racer IDs in order:', racerIds);
        
        // Create rankings object based on number of racers
        const finalRankings = {
          first: racerIds[0],
          second: racerIds[1],
          third: racerIds[2],
          fourth: racerIds[2] // For 3 racers, third place is also fourth
        };
        
        console.log('Final rankings being applied:', finalRankings);

        // Update race results and final rankings
        onWinnerSelect(race.raceNumber, [finalRankings.first, finalRankings.second], [finalRankings.third, finalRankings.fourth]);
        onFinalRankings(finalRankings);
      }
    } else if (isSecondChanceTwoRacers) {
      // For second chance with exactly 2 racers, only allow one winner
      const newSelectedRacers = selectedRacers.includes(racerId) ? [] : [racerId];
      setSelectedRacers(newSelectedRacers);

      // If selecting a new winner, immediately trigger the winner selection
      if (!selectedRacers.includes(racerId)) {
        const loser = validRacers.find(r => r.id !== racerId)?.id;
        if (loser) {
          onWinnerSelect(race.raceNumber, [racerId], [loser]);
        }
      }
    } else {
      // Normal race logic (allow two winners)
      if (selectedRacers.includes(racerId)) {
        const newSelectedRacers = selectedRacers.filter(id => id !== racerId);
        setSelectedRacers(newSelectedRacers);
      } else if (selectedRacers.length < 2) {
        const newSelectedRacers = [...selectedRacers, racerId];
        setSelectedRacers(newSelectedRacers);

        // Trigger winner selection when we have two winners
        if (newSelectedRacers.length === 2) {
          const losers = validRacers
            .filter(r => !newSelectedRacers.includes(r.id))
            .map(r => r.id);
          onWinnerSelect(race.raceNumber, newSelectedRacers, losers);
        }
      }
    }
  };

  const getRacerPosition = (racerId: string): string => {
    if (race.bracketType === 'final') {
      console.log('Getting racer position:', {
        racerId,
        rankings,
        finalRankings: race.finalRankings,
        totalRacers: race.racers.length
      });

      const position = rankings[racerId];
      if (position) {
        // For 3 racers, position 3 should show as "third"
        if (race.racers.length === 3 && position === 3) {
          console.log('Showing third for 3-racer final:', racerId);
          return 'third';
        }
        return getPositionName(position);
      }
      // Check finalRankings
      if (race.finalRankings) {
        if (race.finalRankings.first === racerId) return 'first';
        if (race.finalRankings.second === racerId) return 'second';
        if (race.racers.length === 3 && (race.finalRankings.third === racerId || race.finalRankings.fourth === racerId)) {
          console.log('Showing third for saved rankings in 3-racer final:', racerId);
          return 'third';
        }
        if (race.finalRankings.fourth === racerId) return 'fourth';
      }
      return '';
    }
    return '';
  };

  const getPositionName = (position: number): string => {
    switch (position) {
      case 1:
        return 'first';
      case 2:
        return 'second';
      case 3:
        return 'third';
      case 4:
        return 'fourth';
      default:
        return '';
    }
  };

  const isSelected = (racerId: string) => {
    if (race.bracketType === 'final') {
      return !!rankings[racerId];
    }
    return selectedRacers.includes(racerId);
  };

  const handleDisqualify = (racerId: string) => {
    if (window.confirm('Are you sure you want to disqualify this racer? This action cannot be undone.')) {
      // Remove from selected racers if present
      setSelectedRacers(prev => prev.filter(id => id !== racerId));

      // Remove from rankings if present
      if (race.bracketType === 'final') {
        setRankings(prev => {
          const newRankings = { ...prev };
          delete newRankings[racerId];
          return newRankings;
        });
      }

      // Dispatch disqualification action
      dispatch(
        disqualifyRacer({
          raceId: race.raceId,
          raceClass: race.raceClass,
          raceNumber: race.raceNumber,
          round: race.round,
          bracketType: race.bracketType,
          racerId,
          racers: race.racers
        })
      ).then(() => {
        // After disqualification, update winners/losers if needed
        if (race.status === 'completed') {
          const remainingRacers = race.racers
            .filter(r => r.id !== racerId)
            .map(r => r.id);
          
          if (race.bracketType === 'final') {
            // For finals, recalculate rankings
            const validRankings = { ...race.finalRankings };
            Object.entries(validRankings).forEach(([position, id]) => {
              if (id === racerId) {
                delete validRankings[position as keyof typeof validRankings];
              }
            });
            if (onFinalRankings && Object.keys(validRankings).length === 4) {
              onFinalRankings({
                first: validRankings.first!,
                second: validRankings.second!,
                third: validRankings.third!,
                fourth: validRankings.fourth!
              });
            }
          } else {
            // For other races, update winners/losers
            const validWinners = winners.filter(id => id !== racerId);
            const validLosers = remainingRacers.filter(id => !validWinners.includes(id));
            onWinnerSelect(race.raceNumber, validWinners, validLosers);
          }
        }
      });
    }
  };

  return (
    <div
      className={cn(
        'bracket-match bg-card border rounded-lg p-3 relative',
        race.status === 'completed' && 'border-green-500',
        race.status === 'in_progress' && 'border-yellow-500'
      )}
      style={{
        marginTop: `${race.position * 10}px`,
        marginBottom: race.position === 0 ? '0' : '20px',
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <RaceStatusIndicator status={race.status} />
          <span className="text-sm font-medium">Race {race.raceNumber}</span>
        </div>
        <span className="text-xs text-muted-foreground capitalize">
          {race.bracketType}
          {isSecondChanceTwoRacers && ' (Select One Winner)'}
        </span>
      </div>
      <div className="match-pair space-y-2">
        {validRacers.map(racer => {
          const isDisqualified = race.disqualifiedRacers?.includes(racer.id);
          
          return (
            <div key={racer.id} className="flex gap-2">
              <Button
                variant={isSelected(racer.id) ? 'default' : 'ghost'}
                disabled={
                  race.status === 'completed' || 
                  isDisqualified || 
                  (isSecondChanceTwoRacers && selectedRacers.length === 1 && !selectedRacers.includes(racer.id))
                }
                className={cn(
                  'flex-1 justify-between h-auto py-2 px-3',
                  isSelected(racer.id) && 'bg-green-500/10 text-green-600',
                  !isSelected(racer.id) &&
                    ((race.bracketType === 'final'
                      ? Object.keys(rankings).length === 4
                      : isSecondChanceTwoRacers
                        ? selectedRacers.length === 1
                        : selectedRacers.length === 2)) &&
                    'opacity-50',
                  isDisqualified && 'bg-red-500/10 text-red-600 line-through'
                )}
                onClick={() => {
                  if (!isDisqualified) {
                    console.log('Racer selection clicked:', {
                      racerId: racer.id,
                      isSecondChanceTwoRacers,
                      currentlySelected: selectedRacers,
                      bracketType: race.bracketType,
                      totalRacers: validRacers.length
                    });
                    handleRacerSelect(racer.id);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{racer.name}</span>
                  {racer.seedData?.startingPosition && (
                    <span className="text-xs text-muted-foreground">
                      (#{racer.seedData.startingPosition})
                    </span>
                  )}
                  {race.bracketType === 'final' && rankings[racer.id] && (
                    <span className="text-xs font-medium text-green-600">
                      {getRacerPosition(racer.id)}
                    </span>
                  )}
                </div>
                {isSelected(racer.id) && race.bracketType !== 'final' && (
                  <Trophy className="h-4 w-4 text-green-600" />
                )}
                {race.bracketType === 'final' && rankings[racer.id] && (
                  <span className="text-sm font-medium text-green-600">
                    #{rankings[racer.id]}
                  </span>
                )}
              </Button>
              
              {!isDisqualified && race.status !== 'completed' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-auto aspect-square text-red-600 hover:text-red-700 hover:bg-red-100"
                  onClick={() => handleDisqualify(racer.id)}
                >
                  <Ban className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {race.nextWinnerRace && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-px bg-gray-300" />
      )}
    </div>
  );
};

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

const BracketContent = ({ race, selectedClass }: BracketContentProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedRaceClasses = useSelector((state: RootState) =>
    selectRaceClassesByRaceId(state, race.id)
  );
  const brackets: BracketRound[] = useSelector((state: RootState) => 
    Object.values(state.brackets.entities[race.id]?.[selectedClass] || {})
  );
  const racersByClass = useSelector((state: RootState) => selectRacersByRaceId(state, race.id));
  const [raceWinners, setRaceWinners] = useState<Record<string, Record<string, string[]>>>({});

  const raceClass = selectedRaceClasses.find(rc => rc.raceClass === selectedClass);

  useEffect(() => {
    console.log('Selected class:', selectedClass);
    console.log('Race class:', raceClass);
    console.log('Brackets:', brackets);
  }, [selectedClass, raceClass, brackets]);

  if (!raceClass) {
    return null;
  }

  // Show message when brackets haven't been formed yet
  if (!brackets || brackets.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{raceClass.raceClass} Brackets Not Ready</h3>
          <p className="text-muted-foreground">
            Complete seeding for this class to generate the brackets.
          </p>
        </div>
      </Card>
    );
  }

  // Filter and organize brackets
  const winnersBrackets = brackets
    .filter(b => b.bracketType === 'winners')
    .sort((a, b) => a.roundNumber - b.roundNumber);

  const secondChanceRounds = brackets
    .filter(b => b.bracketType === 'losers')
    .sort((a, b) => a.roundNumber - b.roundNumber);

  const finalBrackets = brackets.filter(b => b.bracketType === 'final');

  // Calculate if we need second round for second chance
  const firstRoundLosers = winnersBrackets[0]?.races.reduce((total, race) => 
    total + (race.losers?.length || 0), 0) || 0;
  const needsSecondChanceSecondRound = firstRoundLosers > 2;

  const handleWinnerSelect = (
    raceClass: string,
    raceNumber: number,
    round: number,
    bracketType: 'winners' | 'losers' | 'final',
    winners: string[],
    losers: string[]
  ) => {
    console.log('Winner Selection:', {
      raceClass,
      raceNumber,
      round,
      bracketType,
      winners,
      losers,
    });

    setRaceWinners(prev => ({
      ...prev,
      [raceClass]: {
        ...(prev[raceClass] || {}),
        [`${bracketType}-${round}-${raceNumber}`]: winners,
      },
    }));

    dispatch(
      updateRaceResults({
        raceId: race.id,
        raceClass,
        raceNumber,
        round,
        bracketType,
        winners,
        losers,
        racers: racersByClass[raceClass] || [],
      })
    );
  };

  const getWinnersForRace = (
    raceClass: string,
    raceNumber: number,
    round: number,
    bracketType: 'winners' | 'losers' | 'final',
    status: string
  ) => {
    if (status === 'completed') {
      return raceWinners[raceClass]?.[`${bracketType}-${round}-${raceNumber}`] || [];
    }
    return [];
  };

  const handleFinalRankings = (
    raceClass: string,
    rankings: { first: string; second: string; third: string; fourth: string }
  ) => {
    console.log('Debug - Final Rankings:', {
      raceClass,
      rankings,
    });

    // First mark the race as completed
    dispatch(
      updateRaceResults({
        raceId: race.id,
        raceClass,
        raceNumber: needsSecondChanceSecondRound ? 6 : 5, // Update finals race number
        round: 4, // Finals are round 4
        bracketType: 'final',
        winners: [rankings.first, rankings.second],
        losers: [rankings.third, rankings.fourth],
        racers: racersByClass[raceClass] || [],
      })
    ).then(() => {
      // Then save the final rankings
      dispatch(
        updateFinalRankings({
          raceId: race.id,
          raceClass,
          rankings: {
            first: rankings.first!,
            second: rankings.second!,
            third: rankings.third!,
            fourth: rankings.fourth!
          }
        })
      );
    });
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{raceClass.raceClass}</h3>
      <div className="bracket-container overflow-x-auto">
        <div className="flex gap-16 min-w-[1200px] relative">
          {/* Winners Bracket Column */}
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-4 text-green-600">Winners Bracket</h4>
            <div className="space-y-12">
              {winnersBrackets.map((round: BracketRound) => (
                <div
                  key={`${round.roundNumber}-${round.bracketType}`}
                  className="bracket-round"
                >
                  <h5 className="text-sm font-medium mb-2">Round {round.roundNumber}</h5>
                  <div className="relative space-y-8">
                    {round.races.map((bracketRace: BracketRace) => (
                      <div key={`${bracketRace.raceNumber}-${round.bracketType}`} className="relative">
                        <BracketRace
                          race={{
                            ...bracketRace,
                            raceId: race.id,
                            raceClass: raceClass.raceClass
                          }}
                          onWinnerSelect={(raceNumber, winners, losers) =>
                            handleWinnerSelect(
                              raceClass.raceClass,
                              raceNumber,
                              round.roundNumber,
                              round.bracketType,
                              winners,
                              losers
                            )
                          }
                          winners={getWinnersForRace(
                            raceClass.raceClass,
                            bracketRace.raceNumber,
                            round.roundNumber,
                            round.bracketType,
                            bracketRace.status
                          )}
                        />
                        {/* Add connection lines */}
                        {bracketRace.nextWinnerRace && (
                          <div className="absolute right-0 top-1/2 w-16 border-t border-gray-300" />
                        )}
                        {bracketRace.nextLoserRace && round.roundNumber === 1 && (
                          <div className="absolute right-0 top-3/4 w-32 border-t border-gray-300 border-dashed" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Second Chance Column */}
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-4 text-yellow-600">Second Chance</h4>
            <div className="space-y-12">
              {/* First Round */}
              {secondChanceRounds.map((round: BracketRound) => {
                // Only show rounds that should be visible
                if (round.roundNumber === 2 && !needsSecondChanceSecondRound) {
                  return null;
                }

                return (
                  <div
                    key={`${round.roundNumber}-${round.bracketType}`}
                    className="bracket-round"
                  >
                    <h5 className="text-sm font-medium mb-2">
                      {round.roundNumber === 1 ? 'First Round (Race 4)' : 'Second Round (Race 5)'}
                    </h5>
                    <div className="relative space-y-8">
                      {round.races.map((bracketRace: BracketRace) => (
                        <div key={`${bracketRace.raceNumber}-${round.bracketType}`} className="relative">
                          <BracketRace
                            race={{
                              ...bracketRace,
                              raceId: race.id,
                              raceClass: raceClass.raceClass
                            }}
                            onWinnerSelect={(raceNumber, winners, losers) =>
                              handleWinnerSelect(
                                raceClass.raceClass,
                                raceNumber,
                                round.roundNumber,
                                'losers',
                                winners,
                                losers
                              )
                            }
                            winners={getWinnersForRace(
                              raceClass.raceClass,
                              bracketRace.raceNumber,
                              round.roundNumber,
                              'losers',
                              bracketRace.status
                            )}
                          />
                          {/* Add connection lines */}
                          {bracketRace.nextWinnerRace && (
                            <div className="absolute right-0 top-1/2 w-16 border-t border-gray-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Finals Column */}
          {finalBrackets[0]?.races.length > 0 && (
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-4 text-blue-600">Finals (Race {needsSecondChanceSecondRound ? '6' : '5'})</h4>
              <div className="space-y-4">
                {finalBrackets.map((round: BracketRound) => (
                  <div
                    key={`${round.roundNumber}-${round.bracketType}`}
                    className="bracket-round"
                  >
                    <div className="relative space-y-1">
                      {round.races.map((bracketRace: BracketRace) => (
                        <BracketRace
                          key={`${bracketRace.raceNumber}-${round.bracketType}`}
                          race={{
                            ...bracketRace,
                            raceId: race.id,
                            raceClass: raceClass.raceClass
                          }}
                          onWinnerSelect={(raceNumber, winners, losers) =>
                            handleWinnerSelect(
                              raceClass.raceClass,
                              raceNumber,
                              round.roundNumber,
                              round.bracketType,
                              winners,
                              losers
                            )
                          }
                          winners={getWinnersForRace(
                            raceClass.raceClass,
                            bracketRace.raceNumber,
                            round.roundNumber,
                            round.bracketType,
                            bracketRace.status
                          )}
                          onFinalRankings={rankings =>
                            handleFinalRankings(raceClass.raceClass, rankings)
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const areAllBracketsCompleted = (brackets: BracketRound[], raceClasses: Array<{ raceClass: string }>) => {
  console.log('Checking bracket completion:', {
    brackets,
    raceClasses
  });

  return raceClasses.every(({ raceClass }) => {
    console.log('Checking class:', raceClass);
    
    // Get all rounds for this race class
    const classBrackets = brackets.filter(b => b.raceClass === raceClass);
    console.log('Class brackets:', classBrackets);

    // Check if we have any brackets for this class
    if (classBrackets.length === 0) {
      console.log('No brackets found for class:', raceClass);
      return false;
    }

    // First check if finals exist and are completed
    const finalRound = classBrackets.find(round => round.bracketType === 'final');
    const finalRace = finalRound?.races[0];
    
    console.log('Final round check:', {
      finalRound,
      finalRace,
      status: finalRace?.status,
      hasRankings: !!finalRace?.finalRankings
    });

    if (!finalRace || finalRace.status !== 'completed' || !finalRace.finalRankings) {
      console.log('Finals not complete for class:', raceClass);
      return false;
    }

    // Check if all races in all rounds are completed
    const allRoundsComplete = classBrackets.every(round => {
      console.log('Checking round:', round.roundNumber, 'type:', round.bracketType);
      return round.races.every(race => {
        console.log('Race', race.raceNumber, 'status:', race.status);
        return race.status === 'completed';
      });
    });

    console.log('Class completion status:', raceClass, allRoundsComplete);
    return allRoundsComplete;
  });
};

const Bracket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const hasRace = useSelector(selectHasActiveRace);
  const races = useSelector(selectRaces);
  const activeRace = useSelector(selectActiveRace);
  const [selectedRaceId, setSelectedRaceId] = useState<string | undefined>(activeRace?.id);
  const [selectedClass, setSelectedClass] = useState<string>(
    activeRace?.raceClasses[0]?.raceClass || ''
  );

  const brackets = useSelector((state: RootState) => {
    const bracketData = state.brackets.entities[activeRace?.id || ''] || {};
    return Object.values(bracketData).flat();
  });

  useEffect(() => {
    console.log('Loading initial data...');
    dispatch(loadRacesFromStorage());
    dispatch(loadRacersFromStorage());
    dispatch(loadBracketsFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (races.length > 0 && !hasRace && !activeRace) {
      dispatch(setCurrentRace(races[0].id));
    }
  }, [dispatch, races, hasRace, activeRace]);

  useEffect(() => {
    if (activeRace?.id && activeRace.id !== selectedRaceId) {
      setSelectedRaceId(activeRace.id);
      // Set the first race class as selected by default
      if (activeRace.raceClasses?.length > 0) {
        setSelectedClass(activeRace.raceClasses[0].raceClass);
      }
    }
  }, [activeRace?.id, selectedRaceId, activeRace?.raceClasses]);

  const handleResetBrackets = () => {
    if (window.confirm('Are you sure you want to reset all brackets? This cannot be undone.')) {
      // First reset brackets
      dispatch(resetBrackets());

      // Then update each race class status back to seeding
      if (activeRace) {
        activeRace.raceClasses.forEach(raceClass => {
          dispatch(
            updateRaceClass({
              raceId: activeRace.id,
              raceClass: raceClass.raceClass,
              updates: {
                raceClass: raceClass.raceClass,
                status: RaceClassStatus.Seeding,
              },
            })
          );
        });
      }
    }
  };

  const handleFinishRace = () => {
    if (!activeRace) return;
    
    if (window.confirm('Are you sure you want to finish this race? This action cannot be undone.')) {
      console.log('Finishing race:', {
        raceId: activeRace.id,
        currentStatus: activeRace.status,
        brackets
      });

      // First, ensure all final rankings are saved for each class
      const savePromises = activeRace.raceClasses.map(async ({ raceClass }) => {
        const finalRound = brackets.find(round => 
          round.bracketType === 'final' && round.raceClass === raceClass
        );
        
        if (finalRound?.races?.[0]?.finalRankings) {
          const finalRace = finalRound.races[0];
          const rankings = finalRace.finalRankings!;
          console.log('Saving final rankings for class:', raceClass, rankings);
          
          await dispatch(updateFinalRankings({
            raceId: activeRace.id,
            raceClass,
            rankings: {
              first: rankings.first!,
              second: rankings.second!,
              third: rankings.third!,
              fourth: rankings.fourth!
            }
          }));
        }
      });

      // After all rankings are saved, update race status
      Promise.all(savePromises).then(() => {
        console.log('All rankings saved, updating race status to completed');
        dispatch(updateRaceStatus({ 
          raceId: activeRace.id, 
          status: 'completed' 
        }));

        // Also update each race class status
        activeRace.raceClasses.forEach(({ raceClass }) => {
          dispatch(updateRaceClass({
            raceId: activeRace.id,
            raceClass,
            updates: {
              raceClass,
              status: RaceClassStatus.Completed
            }
          }));
        });
      });
    }
  };

  // Add check for no races
  if (races.length === 0) {
    return (
      <NoRaceState 
        title="Brackets" 
        description="Create a race in Race Management to start creating brackets." 
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <Card className="shadow-md">
          <div className="flex flex-col">
            <div className="flex justify-between items-center p-6">
              <PageHeader icon={Users} title="Brackets" description="Manage your brackets here." />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2" 
                  onClick={handleResetBrackets}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset All Brackets
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={handleFinishRace}
                  disabled={!activeRace || !areAllBracketsCompleted(brackets, activeRace.raceClasses)}
                >
                  <Trophy className="h-4 w-4" />
                  Finish Race
                </Button>
              </div>
            </div>
            <CardContent>
              <Tabs value={selectedClass} className="w-full">
                {activeRace && (
                  <ClassTabsHeader
                    raceClasses={activeRace.raceClasses}
                    onTabChange={setSelectedClass}
                  />
                )}
                {activeRace && activeRace.raceClasses.map(raceClass => (
                  <TabsContent key={raceClass.raceClass} value={raceClass.raceClass} className="mt-4 space-y-6">
                    <BracketContent race={activeRace} selectedClass={raceClass.raceClass} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Bracket;
