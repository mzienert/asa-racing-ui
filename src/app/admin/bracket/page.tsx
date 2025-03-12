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
  markRacerDNS,
} from '@/store/features/bracketSlice';
import {
  loadRacesFromStorage,
  setCurrentRace,
  updateRaceClass,
  RaceClassStatus,
  updateRaceStatus,
  RaceStatus,
} from '@/store/features/racesSlice';
import { loadRacersFromStorage } from '@/store/features/racersSlice';
import {
  selectActiveRace,
  selectHasActiveRace,
  selectRaces,
} from '@/store/selectors/raceSelectors';
import { AppDispatch } from '@/store/store';
import { Users, Trophy, Ban, Hash, Flag, XCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectRaceClassesByRaceId, selectRacersByRaceId } from '@/store/selectors/raceSelectors';
import { RootState } from '@/store/store';
import type { Race } from '@/store/features/racesSlice';
import type { BracketRace, BracketRound } from '@/store/features/bracketSlice';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Circle, RefreshCw } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import NoRaceState from '@/components/NoRaceState';
import { Racer } from '@/store/features/racersSlice';
import { createSelector } from '@reduxjs/toolkit';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  round: number;
  onFinalRankings?: (rankings: {
    first: string;
    second: string;
    third: string;
    fourth: string;
  }) => void;
  brackets: BracketRound[];
}

const RaceStatusIndicator = ({ status }: { status: RaceStatus }) => {
  const statusColors: Record<RaceStatus, string> = {
    [RaceStatus.In_Progress]: 'text-yellow-500',
    [RaceStatus.Completed]: 'text-green-500',
    [RaceStatus.Configuring]: 'text-gray-400',
  };

  return <Circle className={cn('h-4 w-4', statusColors[status])} />;
};

const BracketRace = ({
  race,
  onWinnerSelect,
  winners,
  round,
  onFinalRankings,
  brackets,
}: BracketRaceProps) => {
  const [selectedRacers, setSelectedRacers] = useState<string[]>(winners || []);
  const [rankings, setRankings] = useState<Record<string, number>>({});
  const [showDQDialog, setShowDQDialog] = useState(false);
  const [showDNSDialog, setShowDNSDialog] = useState(false);
  const [selectedRacerForAction, setSelectedRacerForAction] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  // Ensure we have valid racers
  const validRacers = (race.racers || []).filter(
    (racer): racer is Racer => racer != null && typeof racer === 'object' && 'id' in racer
  );

  // Get total racers in the bracket
  const totalRacers = useSelector((state: RootState) => {
    const racersByClass = selectRacersByRaceId(state, race.raceId);
    return racersByClass[race.raceClass]?.length || 0;
  });

  // Check if all racers are either DQ'd or DNS
  const allRacersDisqualifiedOrDNS =
    validRacers.length > 0 &&
    validRacers.every(
      racer => race.disqualifiedRacers?.includes(racer.id) || race.dnsRacers?.includes(racer.id)
    );

  // Check if exactly 2 racers are DQ'd or DNS'd
  const twoRacersDQorDNS = validRacers.length > 0 && 
    validRacers.filter(racer => 
      race.disqualifiedRacers?.includes(racer.id) || race.dnsRacers?.includes(racer.id)
    ).length === 2;

  // Special case flags
  const isFirstRoundAllDQorDNS =
    round === 1 && race.bracketType === 'winners' && allRacersDisqualifiedOrDNS;
  const isSecondRaceAllDQorDNS =
    totalRacers === 6 &&
    round === 1 &&
    race.raceNumber === 2 &&
    race.bracketType === 'winners' &&
    allRacersDisqualifiedOrDNS;
  const isFirstRoundTwoRacersDQorDNS = totalRacers === 6 && round === 1 && race.bracketType === 'winners' && twoRacersDQorDNS;
  const isSixRacersRace3 =
    totalRacers === 6 &&
    race.raceNumber === 3 &&
    race.bracketType === 'winners';
  const isNineRacersSecondRound =
    totalRacers === 9 && round === 2 && race.bracketType === 'winners';
  const isNineRacersThirdRound = totalRacers === 9 && round === 3 && race.bracketType === 'winners';
  const isSixRacersRace4 =
    race.raceNumber === 4 && race.bracketType === 'losers' && validRacers.length === 2;
  const isSevenRacersRace4 =
    race.raceNumber === 4 && race.bracketType === 'losers' && validRacers.length === 3;
  const isSevenRacersRace5 =
    race.raceNumber === 5 && race.bracketType === 'losers' && validRacers.length === 2;
  const isEightRacersRace5 =
    totalRacers === 8 && race.raceNumber === 5 && race.bracketType === 'losers';
  const isSecondChanceTwoRacers =
    race.bracketType === 'losers' && validRacers.length === 2 && !isSevenRacersRace4;
  const isNineRacersSecondChanceFirstRound =
    totalRacers === 9 && race.bracketType === 'losers' && race.raceNumber === 7;
  const isNineRacersSecondChanceSecondRound =
    totalRacers === 9 && race.bracketType === 'losers' && race.raceNumber === 9;

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
      if (race.finalRankings.third) {
        newRankings[race.finalRankings.third] = race.racers.length === 3 ? 3 : 4;
      }
      setRankings(newRankings);
    }
  }, [race.bracketType, winners, race.finalRankings, race.racers.length]);

  const handleRacerSelect = (racerId: string) => {
    console.log('handleRacerSelect called:', {
      racerId,
      isSixRacersRace3,
      totalRacers,
      raceNumber: race.raceNumber,
      bracketType: race.bracketType,
      validRacers: validRacers.length,
      currentSelected: selectedRacers,
    });

    // For finals, handle rankings differently
    if (race.bracketType === 'final') {
      const isSelected = selectedRacers.includes(racerId);

      // If already selected, remove from rankings and selected racers
      if (isSelected) {
        setSelectedRacers(prev => prev.filter(id => id !== racerId));
        setRankings(prev => {
          const newRankings = { ...prev };
          delete newRankings[racerId];
          return newRankings;
        });
        return;
      }

      // If not selected, determine next available position
      const usedPositions = Object.values(rankings);
      let nextPosition = 1;
      while (usedPositions.includes(nextPosition)) {
        nextPosition++;
      }

      // Don't allow more than 3 positions for 3 racers, or 4 positions for more racers
      const maxPositions = race.racers.length === 3 ? 3 : 4;
      if (nextPosition > maxPositions) {
        return;
      }

      // Add to rankings and selected racers
      setSelectedRacers(prev => [...prev, racerId]);
      setRankings(prev => ({
        ...prev,
        [racerId]: nextPosition,
      }));
      return;
    }

    const isSelected = selectedRacers.includes(racerId);

    // Handle six racers Race 3 case
    if (isSixRacersRace3) {
      console.log('Handling Race 3 selection:', {
        isSelected,
        currentSelected: selectedRacers,
        maxAllowed: validRacers.length === 2 ? 1 : 2
      });
      if (isSelected) {
        setSelectedRacers(selectedRacers.filter(id => id !== racerId));
      } else if (selectedRacers.length < (validRacers.length === 2 ? 1 : 2)) {  // Allow selecting 1 winner for 2 racers, 2 winners for 3-4 racers
        setSelectedRacers([...selectedRacers, racerId]);
      }
      return;
    }

    // Handle Race 5 in 6-racer bracket (second round of second chance)
    if (totalRacers === 6 && race.bracketType === 'losers' && race.raceNumber === 5) {
      if (isSelected) {
        setSelectedRacers(selectedRacers.filter(id => id !== racerId));
      } else if (selectedRacers.length < 1) {
        setSelectedRacers([racerId]);
      }
      return;
    }

    // Handle all special cases
    if (isNineRacersSecondRound || (isNineRacersThirdRound && race.raceNumber !== 6)) {
      if (isSelected) {
        setSelectedRacers(selectedRacers.filter(id => id !== racerId));
      } else if (selectedRacers.length < 2) {
        setSelectedRacers([...selectedRacers, racerId]);
      }
      return;
    }

    // Special case for Race 6 in 9-racer bracket
    if (totalRacers === 9 && race.raceNumber === 6) {
      if (isSelected) {
        setSelectedRacers(selectedRacers.filter(id => id !== racerId));
      } else if (selectedRacers.length < 3) {
        setSelectedRacers([...selectedRacers, racerId]);
      }
      return;
    }

    // Special case for Race 5 in 8-racer bracket (second chance round 2)
    if (isEightRacersRace5) {
      if (isSelected) {
        setSelectedRacers(selectedRacers.filter(id => id !== racerId));
      } else if (selectedRacers.length < 1) {
        setSelectedRacers([racerId]);
      }
      return;
    }

    // Special case for Race 5 in 7-racer bracket (second chance round 2)
    if (totalRacers === 7 && race.raceNumber === 5 && race.bracketType === 'losers') {
      if (isSelected) {
        setSelectedRacers(selectedRacers.filter(id => id !== racerId));
      } else if (selectedRacers.length < 1) {
        setSelectedRacers([racerId]);
      }
      return;
    }

    if (isSixRacersRace4 || (isSecondChanceTwoRacers && !isSevenRacersRace5)) {
      if (isSelected) {
        setSelectedRacers(selectedRacers.filter(id => id !== racerId));
      } else if (selectedRacers.length < 1) {
        setSelectedRacers([racerId]);
      }
      return;
    }

    if (isSevenRacersRace4) {
      if (isSelected) {
        setSelectedRacers(selectedRacers.filter(id => id !== racerId));
      } else if (selectedRacers.length < 2) {
        setSelectedRacers([...selectedRacers, racerId]);
      }
      return;
    }

    if (isNineRacersSecondChanceFirstRound) {
      if (isSelected) {
        setSelectedRacers(selectedRacers.filter(id => id !== racerId));
      } else if (selectedRacers.length < 2) {
        setSelectedRacers([...selectedRacers, racerId]);
      }
      return;
    }

    if (isNineRacersSecondChanceSecondRound) {
      if (isSelected) {
        setSelectedRacers(selectedRacers.filter(id => id !== racerId));
      } else if (selectedRacers.length < 1) {
        setSelectedRacers([racerId]);
      }
      return;
    }

    // Default handling for standard races
    if (isSelected) {
      setSelectedRacers(selectedRacers.filter(id => id !== racerId));
    } else if (selectedRacers.length < 2) {
      setSelectedRacers([...selectedRacers, racerId]);
    }
  };

  const getRacerPosition = (racerId: string): string => {
    if (race.bracketType === 'final') {
      const position = rankings[racerId];
      if (position) {
        // For 3 racers, position 3 should show as "third"
        if (race.racers.length === 3 && position === 3) {
          return 'third';
        }
        return getPositionName(position);
      }
      // Check finalRankings
      if (race.finalRankings) {
        if (race.finalRankings.first === racerId) return 'first';
        if (race.finalRankings.second === racerId) return 'second';
        if (
          race.racers.length === 3 &&
          (race.finalRankings.third === racerId || race.finalRankings.fourth === racerId)
        ) {
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
    // For final races, we need to check selectedRacers directly
    if (race.bracketType === 'final') {
      return selectedRacers.includes(racerId);
    }
    // For completed races, check winners array
    if (race.status === 'completed') {
      return race.winners?.includes(racerId);
    }
    // For pending races, check selectedRacers
    return selectedRacers.includes(racerId);
  };

  const handleDisqualify = (racerId: string) => {
    setSelectedRacerForAction(racerId);
    setShowDQDialog(true);
  };

  const handleConfirmDQ = () => {
    if (!selectedRacerForAction) return;

    // Remove from selected racers if present
    setSelectedRacers(prev => prev.filter(id => id !== selectedRacerForAction));

    // Remove from rankings if present
    if (race.bracketType === 'final') {
      setRankings(prev => {
        const newRankings = { ...prev };
        delete newRankings[selectedRacerForAction];
        return newRankings;
      });
    }

    // Dispatch disqualification action
    dispatch(
      disqualifyRacer({
        raceId: race.raceId,
        raceClass: race.raceClass,
        raceNumber: race.raceNumber,
        round: round,
        bracketType: race.bracketType,
        racerId: selectedRacerForAction,
        racers: race.racers,
      })
    ).then(() => {
      // After disqualification, update winners/losers if needed
      if (race.status === 'completed') {
        const remainingRacers = race.racers
          .filter(r => r.id !== selectedRacerForAction)
          .map(r => r.id);

        if (race.bracketType === 'final') {
          // For finals, recalculate rankings
          const validRankings = { ...race.finalRankings };
          Object.entries(validRankings).forEach(([position, id]) => {
            if (id === selectedRacerForAction) {
              delete validRankings[position as keyof typeof validRankings];
            }
          });
          if (onFinalRankings && Object.keys(validRankings).length === 4) {
            onFinalRankings({
              first: validRankings.first!,
              second: validRankings.second!,
              third: validRankings.third!,
              fourth: validRankings.fourth || validRankings.third!,
            });
          }
        } else {
          // For other races, update winners/losers
          const validWinners = winners.filter(id => id !== selectedRacerForAction);
          const validLosers = remainingRacers.filter(id => !validWinners.includes(id));
          onWinnerSelect(race.raceNumber, validWinners, validLosers);
        }
      }
    });

    setShowDQDialog(false);
    setSelectedRacerForAction(null);
  };

  const handleDNS = (racerId: string) => {
    setSelectedRacerForAction(racerId);
    setShowDNSDialog(true);
  };

  const handleConfirmDNS = () => {
    if (!selectedRacerForAction) return;

    // Remove from selected racers if present
    setSelectedRacers(prev => prev.filter(id => id !== selectedRacerForAction));

    // Remove from rankings if present
    if (race.bracketType === 'final') {
      setRankings(prev => {
        const newRankings = { ...prev };
        delete newRankings[selectedRacerForAction];
        return newRankings;
      });
    }

    // Dispatch DNS action
    dispatch(
      markRacerDNS({
        raceId: race.raceId,
        raceClass: race.raceClass,
        raceNumber: race.raceNumber,
        round: round,
        bracketType: race.bracketType,
        racerId: selectedRacerForAction,
        racers: race.racers,
      })
    ).then(() => {
      // After DNS, update winners/losers if needed
      if (race.status === 'completed') {
        const remainingRacers = race.racers
          .filter(r => r.id !== selectedRacerForAction)
          .map(r => r.id);

        if (race.bracketType === 'final') {
          // For finals, recalculate rankings
          const validRankings = { ...race.finalRankings };
          Object.entries(validRankings).forEach(([position, id]) => {
            if (id === selectedRacerForAction) {
              delete validRankings[position as keyof typeof validRankings];
            }
          });
          if (onFinalRankings && Object.keys(validRankings).length === 4) {
            onFinalRankings({
              first: validRankings.first!,
              second: validRankings.second!,
              third: validRankings.third!,
              fourth: validRankings.fourth || validRankings.third!,
            });
          }
        } else {
          // For other races, update winners/losers
          const validWinners = winners.filter(id => id !== selectedRacerForAction);
          const validLosers = remainingRacers.filter(id => !validWinners.includes(id));
          onWinnerSelect(race.raceNumber, validWinners, validLosers);
        }
      }
    });

    setShowDNSDialog(false);
    setSelectedRacerForAction(null);
  };

  const handleCompleteRace = () => {
    console.log('handleCompleteRace called:', {
      isSixRacersRace3,
      totalRacers,
      raceNumber: race.raceNumber,
      bracketType: race.bracketType,
      selectedRacers,
      validRacers: validRacers.length
    });

    // Special handling for races where all racers are DQ'd or DNS
    if (isFirstRoundAllDQorDNS || isSecondRaceAllDQorDNS) {
      const losers = validRacers.map(racer => racer.id);
      // Get remaining racers that aren't in winners array
      const remainingRacers = validRacers.map(racer => racer.id);
      onWinnerSelect(race.raceNumber, [], remainingRacers);
      
      // Update race status
      dispatch(
        updateRaceResults({
          raceId: race.raceId,
          raceClass: race.raceClass,
          raceNumber: race.raceNumber,
          round: round,
          bracketType: race.bracketType,
          winners: [],
          losers: remainingRacers,
          racers: validRacers,
        })
      );
      return;
    }

    // Special handling for races where exactly 2 racers are DQ'd or DNS'd in first round
    if (isFirstRoundTwoRacersDQorDNS) {
      // Get the DQ'd/DNS'd racers
      const dqDnsRacers = validRacers.filter(racer => 
        race.disqualifiedRacers?.includes(racer.id) || race.dnsRacers?.includes(racer.id)
      ).map(racer => racer.id);

      // Get the remaining racers (not DQ'd or DNS'd)
      const remainingRacers = validRacers
        .filter(racer => !dqDnsRacers.includes(racer.id))
        .map(racer => racer.id);

      // The remaining racers are winners, DQ'd/DNS'd racers go to second chance
      onWinnerSelect(race.raceNumber, remainingRacers, dqDnsRacers);
      
      // Update race status
      dispatch(
        updateRaceResults({
          raceId: race.raceId,
          raceClass: race.raceClass,
          raceNumber: race.raceNumber,
          round: round,
          bracketType: race.bracketType,
          winners: remainingRacers,
          losers: dqDnsRacers,
          racers: validRacers,
        })
      );
      return;
    }

    if (selectedRacers.length === 0 && !isFirstRoundAllDQorDNS) {
      console.log('No racers selected, returning');
      return;
    }

    // Special handling for finals
    if (race.bracketType === 'final') {
      const sortedRacers = [...selectedRacers].sort((a, b) => rankings[a] - rankings[b]);

      // Special case: If this is Race 6 (finals) and we only have 2 racers
      // (happens when Race 1 had all DQ/DNS), we only need 2 positions filled
      const isTwoRacerFinals = race.racers.length === 2;
      const requiredPositions = isTwoRacerFinals ? 2 : race.racers.length === 3 ? 3 : 4;

      if (sortedRacers.length !== requiredPositions) {
        return;
      }

      const finalRankings = {
        first: sortedRacers[0],
        second: sortedRacers[1],
        third: isTwoRacerFinals ? sortedRacers[1] : sortedRacers[2],
        fourth: isTwoRacerFinals
          ? sortedRacers[1]
          : race.racers.length > 3
            ? sortedRacers[3]
            : undefined,
      };

      if (onFinalRankings) {
        onFinalRankings({
          first: finalRankings.first!,
          second: finalRankings.second!,
          third: finalRankings.third!,
          fourth: finalRankings.fourth || finalRankings.third!,
        });
      }
      setSelectedRacers([]);
      setRankings({});
      return;
    }

    // Special case for Race 6 in 9-racer bracket
    if (totalRacers === 9 && race.raceNumber === 6) {
      if (selectedRacers.length !== 3) {
        return;
      }
    } else {
      // Validate selected racers count based on race type
      const isValid =
        (isSixRacersRace3 && ((validRacers.length === 2 && selectedRacers.length === 1) || (validRacers.length > 2 && selectedRacers.length === 2))) ||
        (isNineRacersSecondRound && selectedRacers.length === 2) ||
        (isNineRacersThirdRound && selectedRacers.length === 2) ||
        (isSixRacersRace4 && selectedRacers.length === 1) ||
        (isSevenRacersRace4 && selectedRacers.length === 2) ||
        ((isSevenRacersRace5 || (isSecondChanceTwoRacers && !isSevenRacersRace4)) &&
          selectedRacers.length === 1) ||
        (!isSixRacersRace3 &&
          !isSixRacersRace4 &&
          !isSevenRacersRace4 &&
          !isSevenRacersRace5 &&
          !isSecondChanceTwoRacers &&
          selectedRacers.length === 2);

      console.log('Validation check:', {
        isValid,
        isSixRacersRace3,
        selectedRacersLength: selectedRacers.length,
        validationResult: isSixRacersRace3 && selectedRacers.length === 2
      });

      if (!isValid) {
        console.log('Validation failed, returning');
        return;
      }
    }

    if (isNineRacersSecondChanceFirstRound && selectedRacers.length !== 2) {
      return;
    }

    if (isNineRacersSecondChanceSecondRound && selectedRacers.length !== 1) {
      return;
    }

    const winners = selectedRacers;
    const losers = validRacers.filter(racer => !winners.includes(racer.id)).map(racer => racer.id);

    // Call onWinnerSelect with the complete race information
    onWinnerSelect(race.raceNumber, winners, losers);

    // Reset selected racers after completion
    setSelectedRacers([]);
  };

  // Add helper to determine if we have a second round of second chance
  const hasSecondChanceSecondRound = () => {
    if (totalRacers === 6) {
      // Find Race 4 (first second chance race)
      const secondChanceRound = brackets.find(
        (r: BracketRound) => r.bracketType === 'losers' && r.roundNumber === 1
      );
      const race4 = secondChanceRound?.races[0];

      // Check if Race 4 has or will have 4 racers
      return race4 && race4.racers.length === 4;
    }
    return false;
  };

  // Add helper to get the finals race number
  const getFinalsRaceNumber = () => {
    if (totalRacers === 6) {
      return hasSecondChanceSecondRound() ? 6 : 5;
    }
    // ... existing logic for other racer counts ...
    return 5;
  };

  return (
    <div
      className={cn(
        'bracket-match bg-card border rounded-lg p-3 relative',
        race.status === 'completed' && 'border-green-500',
        race.status === 'in_progress' && 'border-yellow-500',
        (isFirstRoundAllDQorDNS || isSecondRaceAllDQorDNS) && 'border-red-500'
      )}
      style={{
        marginTop: `${race.position * 10}px`,
        marginBottom: race.position === 0 ? '0' : '20px',
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <RaceStatusIndicator status={race.status as unknown as RaceStatus} />
          <span className="text-sm font-medium">
            Race {race.raceNumber}
            {race.bracketType === 'winners' && ' (Winners Bracket)'}
            {race.bracketType === 'losers' && ' (Second Chance)'}
            {race.bracketType === 'final' &&
              ` (Finals${hasSecondChanceSecondRound() ? ' - Race 6' : ''})`}
            {isFirstRoundAllDQorDNS && ' (All DQ/DNS - Move to Second Chance)'}
            {isSecondRaceAllDQorDNS && ' (All DQ/DNS - Move to Second Chance)'}
            {isSixRacersRace3 && ` (Select ${validRacers.length === 2 ? 'One' : 'Two'} Winner${validRacers.length === 2 ? '' : 's'}`}
            {isNineRacersSecondRound && ' (Select Two Winners)'}
            {isNineRacersThirdRound && race.raceNumber !== 6 && ' (Select Two Winners)'}
            {totalRacers === 9 && race.raceNumber === 6 && ' (Select Three Winners)'}
            {isSixRacersRace4 && ' (Select One Winner)'}
            {isSevenRacersRace4 && ' (Select Two Winners)'}
            {(isSevenRacersRace5 || (isSecondChanceTwoRacers && !isSevenRacersRace4)) &&
              ' (Select One Winner)'}
            {isNineRacersSecondChanceFirstRound && ' (Select Two Winners)'}
            {isNineRacersSecondChanceSecondRound && ' (Select One Winner)'}
          </span>
        </div>
        {((selectedRacers.length > 0 && !isFirstRoundAllDQorDNS && !isSecondRaceAllDQorDNS) ||
          (isFirstRoundAllDQorDNS && validRacers.length > 0) ||
          (isSecondRaceAllDQorDNS && validRacers.length > 0)) &&
          race.status !== 'completed' && (
            <Button
              variant={
                isFirstRoundAllDQorDNS
                  ? 'destructive'
                  : isSecondRaceAllDQorDNS
                    ? 'destructive'
                    : 'outline'
              }
              size="sm"
              className="gap-2"
              onClick={handleCompleteRace}
            >
              {isFirstRoundAllDQorDNS
                ? 'Move to Second Chance'
                : isSecondRaceAllDQorDNS
                  ? 'Move to Second Chance'
                  : 'Complete Race'}
            </Button>
          )}
      </div>
      <div className="match-pair space-y-2">
        {validRacers.map(racer => {
          const isDisqualified = race.disqualifiedRacers?.includes(racer.id);
          const isDNS = race.dnsRacers?.includes(racer.id);

          return (
            <div key={racer.id} className="flex gap-2">
              <Button
                variant={isSelected(racer.id) ? 'default' : 'ghost'}
                disabled={
                  race.status === 'completed' ||
                  isDisqualified ||
                  isDNS ||
                  (isSecondChanceTwoRacers &&
                    selectedRacers.length === 1 &&
                    !selectedRacers.includes(racer.id) &&
                    !isSevenRacersRace5)
                }
                className={cn(
                  'flex-1 justify-between h-auto py-2 px-3',
                  isSelected(racer.id) && 'bg-green-500/10 text-green-600',
                  !isSelected(racer.id) &&
                    (race.bracketType === 'final'
                      ? Object.keys(rankings).length === 4
                      : isSecondChanceTwoRacers && !isSevenRacersRace5
                        ? selectedRacers.length === 1 && !selectedRacers.includes(racer.id)
                        : selectedRacers.length === 2 && !selectedRacers.includes(racer.id)) &&
                    'opacity-50',
                  isDisqualified && 'bg-red-500/10 text-red-600 line-through',
                  isDNS && 'bg-gray-500/10 text-gray-600 line-through'
                )}
                onClick={() => {
                  if (!isDisqualified && !isDNS) {
                    handleRacerSelect(racer.id);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{racer.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      <span>{racer.bibNumber}</span>
                    </div>
                    {racer.seedData?.startingPosition && (
                      <div className="flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        <span>Seed #{racer.seedData.startingPosition}</span>
                      </div>
                    )}
                  </div>
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
                    #{race.racers.length === 3 && rankings[racer.id] === 4 ? 3 : rankings[racer.id]}
                  </span>
                )}
              </Button>

              {!isDisqualified && !isDNS && race.status !== 'completed' && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-auto aspect-square text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={() => handleDisqualify(racer.id)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Disqualify Racer (DQ)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {round === 1 && race.bracketType === 'winners' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-auto aspect-square text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                            onClick={() => handleDNS(racer.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Did Not Start (DNS)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <ConfirmationDialog
        open={showDQDialog}
        onOpenChange={setShowDQDialog}
        title="Disqualify Racer"
        description="Are you sure you want to disqualify this racer? This action cannot be undone."
        onCancel={() => {
          setShowDQDialog(false);
          setSelectedRacerForAction(null);
        }}
        onConfirm={handleConfirmDQ}
        cancelText="Cancel"
        confirmText="Disqualify"
        variant="default"
      />
      <ConfirmationDialog
        open={showDNSDialog}
        onOpenChange={setShowDNSDialog}
        title="Mark as DNS"
        description="Are you sure you want to mark this racer as DNS (Did Not Start)? This action cannot be undone."
        onCancel={() => {
          setShowDNSDialog(false);
          setSelectedRacerForAction(null);
        }}
        onConfirm={handleConfirmDNS}
        cancelText="Cancel"
        confirmText="Mark as DNS"
        variant="default"
      />
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

  // Memoized selector for brackets
  const selectBracketsByRaceAndClass = createSelector(
    [
      (state: RootState) => state.brackets.entities,
      (_state: RootState, raceId: string) => raceId,
      (_state: RootState, _raceId: string, raceClass: string) => raceClass,
    ],
    (entities, raceId, raceClass) => {
      return Object.values(entities[raceId]?.[raceClass] || {});
    }
  );

  const brackets: BracketRound[] = useSelector((state: RootState) =>
    selectBracketsByRaceAndClass(state, race.id, selectedClass)
  );

  const racersByClass = useSelector((state: RootState) => selectRacersByRaceId(state, race.id));
  const [raceWinners, setRaceWinners] = useState<Record<string, Record<string, string[]>>>({});

  const raceClass = selectedRaceClasses.find(rc => rc.raceClass === selectedClass);

  // Calculate total racers for this class
  const totalRacers = racersByClass[selectedClass]?.length || 0;

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

  // Filter and organize brackets first
  const winnersBrackets = brackets
    .filter(b => b.bracketType === 'winners')
    .sort((a, b) => a.roundNumber - b.roundNumber);

  const secondChanceRounds = brackets
    .filter(b => b.bracketType === 'losers')
    .sort((a, b) => a.roundNumber - b.roundNumber);

  const finalBrackets = brackets.filter(b => b.bracketType === 'final');

  // Then calculate if we need second round for second chance
  const firstRoundLosers = winnersBrackets
    .filter(b => b.roundNumber === 1)
    .reduce(
      (total, round) =>
        round.races.reduce((raceTotal, race) => raceTotal + (race.losers?.length || 0), total),
      0
    );
  const needsSecondChanceSecondRound = firstRoundLosers > 2;

  const handleWinnerSelect = (
    raceClass: string,
    raceNumber: number,
    round: number,
    bracketType: 'winners' | 'losers' | 'final',
    selectedWinners: string[],
    selectedLosers: string[]
  ) => {
    // Special case for Race 6 in 9-racer bracket
    if (totalRacers === 9 && raceNumber === 6) {
      if (selectedWinners.length !== 3) {
        return;
      }
    } else {
      // Validate the winners and losers based on race type
      const isSevenRacersRace4 = raceNumber === 4 && bracketType === 'losers' && totalRacers === 7;
      const isSevenRacersRace5 = raceNumber === 5 && bracketType === 'losers' && totalRacers === 7;
      const isSecondChanceTwoRacers =
        bracketType === 'losers' && selectedWinners.length + selectedLosers.length === 2;
      const isSixRacersRace3 = totalRacers === 6 && raceNumber === 3 && bracketType === 'winners';

      if (isSevenRacersRace4 && selectedWinners.length !== 2) {
        return;
      }

      if (
        (isSevenRacersRace5 || (isSecondChanceTwoRacers && !isSevenRacersRace4)) &&
        selectedWinners.length !== 1
      ) {
        return;
      }

      if (isSixRacersRace3 && selectedWinners.length !== 1) {
        return;
      }

      if (
        !isSevenRacersRace4 &&
        !isSevenRacersRace5 &&
        !isSecondChanceTwoRacers &&
        !isSixRacersRace3 &&
        bracketType !== 'final' &&
        selectedWinners.length !== 2
      ) {
        return;
      }
    }

    // Get the racers for this class
    const classRacers = racersByClass[raceClass] || [];

    try {
      // Dispatch the race results update
      dispatch(
        updateRaceResults({
          raceId: race.id,
          raceClass,
          raceNumber,
          round,
          bracketType,
          winners: selectedWinners,
          losers: selectedLosers,
          racers: classRacers,
        })
      )
        .then(() => {
          // Update the winners state for this race
          setRaceWinners(prev => {
            const newState = {
              ...prev,
              [raceClass]: {
                ...prev[raceClass],
                [`${bracketType}-${round}-${raceNumber}`]: selectedWinners,
              },
            };
            return newState;
          });
        })
        .catch(error => {
          // Handle error silently
        });
    } catch (error) {
      // Handle error silently
    }
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
    // Determine the finals race number based on racer count
    let finalsRaceNumber = 5; // Default for 6 racers
    if (totalRacers === 9) {
      finalsRaceNumber = 8; // For 9 racers
    } else if (totalRacers === 7 || totalRacers === 8) {
      finalsRaceNumber = 6; // For 7-8 racers
    }

    // First mark the race as completed
    dispatch(
      updateRaceResults({
        raceId: race.id,
        raceClass,
        raceNumber: finalsRaceNumber,
        round: 3, // Finals are round 3
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
            fourth: rankings.fourth!,
          },
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
                <div key={`${round.roundNumber}-${round.bracketType}`} className="bracket-round">
                  <h5 className="text-sm font-medium mb-2">Round {round.roundNumber}</h5>
                  <div className="space-y-8">
                    {round.races.map((bracketRace: BracketRace) => (
                      <BracketRace
                        key={`${bracketRace.raceNumber}-${round.bracketType}`}
                          race={{
                            ...bracketRace,
                            raceId: race.id,
                            raceClass: raceClass.raceClass,
                          }}
                          round={round.roundNumber}
                          brackets={brackets}
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
                          onFinalRankings={
                            round.bracketType === 'final'
                              ? (rankings: {
                                  first: string;
                                  second: string;
                                  third: string;
                                  fourth: string;
                                }) => handleFinalRankings(raceClass.raceClass, rankings)
                              : undefined
                          }
                        />
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
              {secondChanceRounds.map((round: BracketRound) => {
                // Only show rounds that should be visible
                if (round.roundNumber === 2 && !needsSecondChanceSecondRound) {
                  return null;
                }

                return (
                  <div key={`${round.roundNumber}-${round.bracketType}`} className="bracket-round">
                    <h5 className="text-sm font-medium mb-2">
                      {totalRacers === 9
                        ? round.roundNumber === 1
                          ? 'First Round (Race 5)'
                          : 'Second Round (Race 7)'
                        : round.roundNumber === 1
                          ? 'First Round (Race 4)'
                          : 'Second Round (Race 5)'}
                    </h5>
                    <div className="space-y-8">
                      {round.races.map((bracketRace: BracketRace) => (
                        <BracketRace
                          key={`${bracketRace.raceNumber}-${round.bracketType}`}
                            race={{
                              ...bracketRace,
                              raceId: race.id,
                              raceClass: raceClass.raceClass,
                            }}
                            round={round.roundNumber}
                            brackets={brackets}
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
                            onFinalRankings={
                              round.bracketType === 'final'
                                ? (rankings: {
                                    first: string;
                                    second: string;
                                    third: string;
                                    fourth: string;
                                  }) => handleFinalRankings(raceClass.raceClass, rankings)
                                : undefined
                            }
                          />
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
              <h4 className="text-sm font-medium mb-4 text-blue-600">Finals</h4>
              <div className="space-y-4">
                {finalBrackets.map((round: BracketRound) => (
                  <div key={`${round.roundNumber}-${round.bracketType}`} className="bracket-round">
                    <div className="space-y-1">
                      {round.races.map((bracketRace: BracketRace) => (
                        <BracketRace
                          key={`${bracketRace.raceNumber}-${round.bracketType}`}
                          race={{
                            ...bracketRace,
                            raceId: race.id,
                            raceClass: raceClass.raceClass,
                          }}
                          round={round.roundNumber}
                          brackets={brackets}
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
                          onFinalRankings={
                            round.bracketType === 'final'
                              ? (rankings: {
                                  first: string;
                                  second: string;
                                  third: string;
                                  fourth: string;
                                }) => handleFinalRankings(raceClass.raceClass, rankings)
                              : undefined
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

const areAllBracketsCompleted = (
  brackets: BracketRound[],
  raceClasses: Array<{ raceClass: string }>
) => {
  return raceClasses.every(({ raceClass }) => {
    // Get all rounds for this race class
    const classBrackets = brackets.filter(b => b.raceClass === raceClass);

    // Check if we have any brackets for this class
    if (classBrackets.length === 0) {
      return false;
    }

    // First check if finals exist and are completed
    const finalRound = classBrackets.find(round => round.bracketType === 'final');
    const finalRace = finalRound?.races[0];

    if (!finalRace || finalRace.status !== 'completed' || !finalRace.finalRankings) {
      return false;
    }

    // Check if all races in all rounds are completed
    const allRoundsComplete = classBrackets.every(round => {
      return round.races.every(race => {
        return race.status === 'completed';
      });
    });

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
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  // Memoized selector for brackets
  const selectAllBracketsByRaceId = createSelector(
    [(state: RootState) => state.brackets.entities, (state: RootState, raceId: string) => raceId],
    (entities, raceId) => {
      const bracketData = entities[raceId] || {};
      return Object.values(bracketData).flat();
    }
  );

  const brackets = useSelector((state: RootState) =>
    selectAllBracketsByRaceId(state, activeRace?.id || '')
  );

  useEffect(() => {
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
    setShowResetDialog(false);
  };

  const handleFinishRace = () => {
    if (!activeRace) return;

    // First, ensure all final rankings are saved for each class
    const savePromises = activeRace.raceClasses.map(async ({ raceClass }) => {
      const finalRound = brackets.find(
        round => round.bracketType === 'final' && round.raceClass === raceClass
      );

      if (finalRound?.races?.[0]?.finalRankings) {
        const finalRace = finalRound.races[0];
        const rankings = finalRace.finalRankings!;

        await dispatch(
          updateFinalRankings({
            raceId: activeRace.id,
            raceClass,
            rankings: {
              first: rankings.first!,
              second: rankings.second!,
              third: rankings.third!,
              fourth: rankings.fourth!,
            },
          })
        );
      }
    });

    // After all rankings are saved, update race status
    Promise.all(savePromises).then(() => {
      dispatch(
        updateRaceStatus({
          raceId: activeRace.id,
          status: RaceStatus.Completed,
        })
      );

      // Also update each race class status
      activeRace.raceClasses.forEach(({ raceClass }) => {
        dispatch(
          updateRaceClass({
            raceId: activeRace.id,
            raceClass,
            updates: {
              raceClass,
              status: RaceClassStatus.Completed,
            },
          })
        );
      });

      setShowFinishDialog(false);
    });
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
                  onClick={() => setShowResetDialog(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset All Brackets
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowFinishDialog(true)}
                  disabled={
                    !activeRace || !areAllBracketsCompleted(brackets, activeRace.raceClasses)
                  }
                >
                  <Trophy className="h-4 w-4" />
                  Finish Race
                </Button>
              </div>
            </div>
            <CardContent>
              <Tabs value={selectedClass} className="w-full">
                <ClassTabsHeader
                  raceClasses={activeRace?.raceClasses || []}
                  onTabChange={setSelectedClass}
                />
                {activeRace &&
                  activeRace.raceClasses.map(raceClass => (
                    <TabsContent
                      key={raceClass.raceClass}
                      value={raceClass.raceClass}
                      className="mt-4 space-y-6"
                    >
                      <BracketContent race={activeRace} selectedClass={raceClass.raceClass} />
                    </TabsContent>
                  ))}
              </Tabs>
            </CardContent>
          </div>
        </Card>
      </div>
      <ConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset All Brackets"
        description="Are you sure you want to reset all brackets? This action cannot be undone."
        onCancel={() => setShowResetDialog(false)}
        onConfirm={handleResetBrackets}
        cancelText="Cancel"
        confirmText="Reset Brackets"
      />
      <ConfirmationDialog
        open={showFinishDialog}
        onOpenChange={setShowFinishDialog}
        title="Finish Race"
        description="Are you sure you want to finish this race? This action cannot be undone."
        onCancel={() => setShowFinishDialog(false)}
        onConfirm={handleFinishRace}
        cancelText="Cancel"
        confirmText="Finish Race"
        variant="green"
      />
    </div>
  );
};

export default Bracket;
