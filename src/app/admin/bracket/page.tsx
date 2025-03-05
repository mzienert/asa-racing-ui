'use client';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { getActiveRaces } from '@/helpers/racers';
import {
  loadBracketsFromStorage,
  updateRaceResults,
  resetBrackets,
  updateFinalRankings,
} from '@/store/features/bracketSlice';
import {
  loadRacesFromStorage,
  setCurrentRace,
  updateRaceClass,
  RaceClassStatus,
} from '@/store/features/racesSlice';
import { loadRacersFromStorage } from '@/store/features/racersSlice';
import {
  selectActiveRace,
  selectHasActiveRace,
  selectRaces,
} from '@/store/selectors/raceSelectors';
import { AppDispatch } from '@/store/store';
import { Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RaceTabsHeader from '@/components/RaceTabsHeader';
import { selectRaceClassesByRaceId, selectRacersByRaceId } from '@/store/selectors/raceSelectors';
import { RootState } from '@/store/store';
import type { Race } from '@/store/features/racesSlice';
import type { BracketRace } from '@/store/features/bracketSlice';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import { RaceStatus } from '@/store/features/bracketSlice';
import { Circle, RefreshCw } from 'lucide-react';

interface BracketContentProps {
  race: Race;
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

  const handleRacerSelect = (racerId: string) => {
    if (race.bracketType === 'final') {
      // For finals, we track position 1-4
      setRankings(prev => {
        const currentPosition = prev[racerId];
        const newRankings = { ...prev };

        if (currentPosition) {
          // If already ranked, remove it
          delete newRankings[racerId];
        } else {
          // Find next available position
          const usedPositions = Object.values(newRankings);
          let nextPosition = 1;
          while (usedPositions.includes(nextPosition) && nextPosition <= 4) {
            nextPosition++;
          }
          if (nextPosition <= 4) {
            newRankings[racerId] = nextPosition;
          }
        }

        // If we have all 4 positions filled, notify parent
        const positions = Object.entries(newRankings);
        if (positions.length === 4 && onFinalRankings) {
          const first = positions.find(([, pos]) => pos === 1)?.[0];
          const second = positions.find(([, pos]) => pos === 2)?.[0];
          const third = positions.find(([, pos]) => pos === 3)?.[0];
          const fourth = positions.find(([, pos]) => pos === 4)?.[0];

          if (first && second && third && fourth) {
            onFinalRankings({ first, second, third, fourth });
          }
        }

        return newRankings;
      });
    } else {
      // Original logic for non-finals races
      setSelectedRacers(prev => {
        if (prev.includes(racerId)) {
          return prev.filter(id => id !== racerId);
        }
        if (prev.length < 2) {
          return [...prev, racerId];
        }
        return prev;
      });
    }
  };

  const getRacerPosition = (racerId: string): string => {
    if (race.bracketType === 'final') {
      const position = rankings[racerId];
      if (position) {
        return getPositionName(position);
      }
      // Check finalRankings
      if (race.finalRankings) {
        if (race.finalRankings.first === racerId) return 'first';
        if (race.finalRankings.second === racerId) return 'second';
        if (race.finalRankings.third === racerId) return 'third';
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

  useEffect(() => {
    if (race.bracketType !== 'final') {
      setSelectedRacers(winners || []);
    }
    // Initialize rankings from finalRankings if they exist
    if (race.finalRankings) {
      const newRankings: Record<string, number> = {};
      if (race.finalRankings.first) newRankings[race.finalRankings.first] = 1;
      if (race.finalRankings.second) newRankings[race.finalRankings.second] = 2;
      if (race.finalRankings.third) newRankings[race.finalRankings.third] = 3;
      if (race.finalRankings.fourth) newRankings[race.finalRankings.fourth] = 4;
      setRankings(newRankings);
    }
  }, [winners, race.finalRankings, race.bracketType]);

  return (
    <div
      className={cn(
        'bracket-match bg-card border rounded-lg p-3 relative',
        race.status === 'completed' && 'border-green-500',
        race.status === 'in_progress' && 'border-yellow-500'
      )}
      style={{
        marginTop: `${race.position * 160}px`,
        marginBottom: race.position === 0 ? '0' : '40px',
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <RaceStatusIndicator status={race.status} />
          <span className="text-sm font-medium">Race {race.raceNumber}</span>
        </div>
        <span className="text-xs text-muted-foreground capitalize">{race.bracketType}</span>
      </div>
      <div className="match-pair space-y-2">
        {race.racers.map(racer => (
          <Button
            key={racer.id}
            variant={isSelected(racer.id) ? 'default' : 'ghost'}
            disabled={race.status === 'completed'}
            className={cn(
              'w-full justify-between h-auto py-2 px-3',
              isSelected(racer.id) && 'bg-green-500/10 text-green-600',
              !isSelected(racer.id) &&
                (race.bracketType === 'final'
                  ? Object.keys(rankings).length === 4
                  : selectedRacers.length === 2) &&
                'opacity-50'
            )}
            onClick={() => {
              if (race.status !== 'completed') {
                handleRacerSelect(racer.id);
                if (
                  race.bracketType !== 'final' &&
                  selectedRacers.length === 1 &&
                  !selectedRacers.includes(racer.id)
                ) {
                  const winners = [...selectedRacers, racer.id];
                  const losers = race.racers.filter(r => !winners.includes(r.id)).map(r => r.id);
                  onWinnerSelect(race.raceNumber, winners, losers);
                }
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
              <span className="text-sm font-medium text-green-600">#{rankings[racer.id]}</span>
            )}
          </Button>
        ))}
      </div>
      {race.nextWinnerRace && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-px bg-gray-300" />
      )}
    </div>
  );
};

const BracketContent = ({ race }: BracketContentProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedRaceClasses = useSelector((state: RootState) =>
    selectRaceClassesByRaceId(state, race.id)
  );
  const brackets = useSelector((state: RootState) => state.brackets.rounds);
  const racersByClass = useSelector((state: RootState) => selectRacersByRaceId(state, race.id));
  const [raceWinners, setRaceWinners] = useState<Record<string, Record<string, string[]>>>({});

  const handleWinnerSelect = (
    raceClass: string,
    raceNumber: number,
    round: number,
    bracketType: 'winners' | 'losers' | 'final',
    winners: string[],
    losers: string[]
  ) => {
    console.log('Debug - Winner Selection:', {
      raceClass,
      raceNumber,
      round,
      bracketType,
      winners,
      losers,
    });

    // Only store winners for completed races
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
    // Only return winners for completed races
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

    dispatch(
      updateFinalRankings({
        raceId: race.id,
        raceClass,
        rankings,
      })
    );
  };

  return (
    <TabsContent key={race.id} value={race.id} className="mt-4 space-y-6">
      {selectedRaceClasses.map(raceClass => {
        const classBrackets = brackets.filter(
          b => b.raceId === race.id && b.raceClass === raceClass.raceClass
        );

        // Separate winners, losers, and finals brackets
        const winnersBrackets = classBrackets.filter(b => b.bracketType === 'winners');
        const losersBrackets = classBrackets.filter(b => b.bracketType === 'losers');
        const finalBrackets = classBrackets.filter(b => b.bracketType === 'final');

        console.log('Debug - Brackets:', {
          winners: winnersBrackets.length,
          losers: losersBrackets.length,
          finals: finalBrackets.length,
        });

        return (
          <Card key={raceClass.raceClass} className="p-4">
            <h3 className="text-lg font-semibold mb-4">{raceClass.raceClass}</h3>
            <div className="bracket-container overflow-x-auto">
              <div className="flex flex-col gap-8">
                {winnersBrackets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-4">Winners Bracket</h4>
                    <div className="bracket-rounds flex gap-16 min-w-[800px] relative">
                      {winnersBrackets.map(round => (
                        <div
                          key={`${round.roundNumber}-${round.bracketType}`}
                          className="bracket-round flex-1"
                        >
                          <h5 className="text-sm font-medium mb-2">Round {round.roundNumber}</h5>
                          <div className="relative">
                            {round.races.map(bracketRace => (
                              <BracketRace
                                key={`${bracketRace.raceNumber}-${round.bracketType}`}
                                race={bracketRace}
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

                {losersBrackets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-4">Second Chance</h4>
                    <div className="bracket-rounds flex gap-16 min-w-[800px] relative">
                      {losersBrackets.map(round => (
                        <div
                          key={`${round.roundNumber}-${round.bracketType}`}
                          className="bracket-round flex-1"
                        >
                          <h5 className="text-sm font-medium mb-2">Round {round.roundNumber}</h5>
                          <div className="relative">
                            {round.races.map(bracketRace => (
                              <BracketRace
                                key={`${bracketRace.raceNumber}-${round.bracketType}`}
                                race={{
                                  ...bracketRace,
                                  bracketType:
                                    bracketRace.bracketType === 'losers'
                                      ? ('second chance' as BracketRace['bracketType'])
                                      : bracketRace.bracketType,
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

                {finalBrackets[0]?.races.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-4">Finals</h4>
                    <div className="bracket-rounds flex gap-16 min-w-[800px] relative">
                      {finalBrackets.map(round => (
                        <div
                          key={`${round.roundNumber}-${round.bracketType}`}
                          className="bracket-round flex-1"
                        >
                          <div className="relative">
                            {round.races.map(bracketRace => (
                              <BracketRace
                                key={`${bracketRace.raceNumber}-${round.bracketType}`}
                                race={bracketRace}
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
      })}
    </TabsContent>
  );
};

const Bracket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const hasRace = useSelector(selectHasActiveRace);
  const races = useSelector(selectRaces);
  const activeRace = useSelector(selectActiveRace);
  const activeRaces = getActiveRaces(races);
  const [selectedRaceId, setSelectedRaceId] = useState<string | undefined>(activeRace?.id);

  useEffect(() => {
    dispatch(loadRacesFromStorage());
    dispatch(loadRacersFromStorage());
    dispatch(loadBracketsFromStorage());

    if (races.length > 0 && !hasRace) {
      dispatch(setCurrentRace(races[0].id));
    }
  }, [dispatch, races, hasRace]);

  useEffect(() => {
    setSelectedRaceId(activeRace?.id);
  }, [activeRace?.id]);

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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <Card className="shadow-md">
          <div className="flex flex-col">
            <div className="flex items-center justify-between p-6 pb-2">
              <PageHeader icon={Users} title="Brackets" description="Manage your brackets here." />
              <Button variant="outline" size="sm" className="gap-2" onClick={handleResetBrackets}>
                <RefreshCw className="h-4 w-4" />
                Reset All Brackets
              </Button>
            </div>
            <CardContent>
              <Tabs value={selectedRaceId} className="w-full">
                <RaceTabsHeader selectedRaceId={selectedRaceId} onTabChange={setSelectedRaceId} />
                {activeRaces.map(race => (
                  <BracketContent key={race.id} race={race} />
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
