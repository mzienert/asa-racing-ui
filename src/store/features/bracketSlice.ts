import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { Racer } from './racersSlice';
import { RootState } from '../store';

export type RaceStatus = 'pending' | 'in_progress' | 'completed';

export interface BracketRace {
  raceNumber: number;
  racers: Racer[];
  winners?: string[]; // IDs of top 2 racers
  losers?: string[]; // IDs of bottom 2 racers
  bracketType: 'winners' | 'losers' | 'final';
  nextWinnerRace?: number; // Race number in next winners round
  nextLoserRace?: number; // Race number in losers bracket
  round: number;
  status: RaceStatus;
  position: number; // Position in the round for visual connections
  finalRankings?: {
    first?: string;
    second?: string;
    third?: string;
    fourth?: string;
  };
  disqualifiedRacers?: string[]; // IDs of disqualified racers
  dnsRacers?: string[]; // IDs of racers who did not start
  raceId: string; // ID of the parent race
  raceClass: string; // Class of the race
}

export interface BracketRound {
  roundNumber: number;
  races: BracketRace[];
  raceId: string;
  raceClass: string;
  bracketType: 'winners' | 'losers' | 'final';
  firstRoundLosers?: string[];
}

interface BracketState {
  entities: {
    [raceId: string]: {
      [raceClass: string]: BracketRound[];
    };
  };
  loading: boolean;
  error: string | null;
}

const initialState: BracketState = {
  entities: {},
  loading: false,
  error: null,
};

const getBracketsFromStorage = (): BracketState => {
  try {
    const stored = localStorage.getItem('brackets');

    if (!stored) {
      return initialState;
    }

    const data = JSON.parse(stored);

    // Handle old format where data was directly stored
    if (data && typeof data === 'object' && !data.entities) {
      const oldData = { ...data };
      // Remove metadata fields if they exist
      delete oldData.loading;
      delete oldData.error;
      // Only include if there's actual bracket data
      if (Object.keys(oldData).length > 0) {
        const newState = {
          entities: oldData,
          loading: false,
          error: null,
        };
        return newState;
      }
      return initialState;
    }

    // Handle new format
    if (data.entities && Object.keys(data.entities).length > 0) {
      return {
        entities: data.entities,
        loading: false,
        error: null,
      };
    }

    return initialState;
  } catch {
    return initialState;
  }
};

export const loadBracketsFromStorage = createAsyncThunk('bracket/load', async () => {
  return getBracketsFromStorage();
});

// Helper function to determine optimal race group sizes
const determineRaceGroups = (numRacers: number): number[] => {
  if (numRacers <= 4) return [numRacers];

  // For all other cases, try to create balanced groups of 3-4 racers
  const groups: number[] = [];
  let remaining = numRacers;

  // First try to make groups of 4, then fill with groups of 3
  while (remaining > 0) {
    if (remaining === 5) {
      groups.push(3, 2);
      break;
    } else if (remaining === 6) {
      groups.push(3, 3);
      break;
    } else if (remaining === 7) {
      groups.push(4, 3);
      break;
    } else if (remaining >= 4) {
      groups.push(4);
      remaining -= 4;
    } else if (remaining === 3) {
      groups.push(3);
      remaining = 0;
    } else if (remaining === 2) {
      // If we have a previous group of 4, convert to 3,3
      if (groups.length > 0 && groups[groups.length - 1] === 4) {
        groups[groups.length - 1] = 3;
        groups.push(3);
      } else {
        groups.push(2);
      }
      remaining = 0;
    } else {
      // Single racer left, try to balance
      if (groups.length > 0) {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup === 4) {
          groups[groups.length - 1] = 3;
          groups.push(2);
        } else {
          groups[groups.length - 1] = lastGroup + 1;
        }
      } else {
        groups.push(1);
      }
      remaining = 0;
    }
  }

  return groups;
};

// Helper function to group racers into races (prioritizing optimal groups)
const groupIntoRaces = (racers: Racer[]): BracketRace[] => {
  const races: BracketRace[] = [];

  // Sort racers by their starting position
  const sortedRacers = [...racers].sort(
    (a, b) => (a.seedData?.startingPosition || 0) - (b.seedData?.startingPosition || 0)
  );

  // Get optimal group sizes
  const groups = determineRaceGroups(sortedRacers.length);

  let currentRaceNumber = 1;
  let startIndex = 0;

  // Create races based on determined group sizes
  for (const groupSize of groups) {
    const raceRacers = sortedRacers.slice(startIndex, startIndex + groupSize);
    races.push({
      raceNumber: currentRaceNumber,
      racers: raceRacers,
      bracketType: 'winners',
      round: 1,
      status: 'pending',
      position: currentRaceNumber - 1,
      raceId: '',
      raceClass: '',
    });
    currentRaceNumber++;
    startIndex += groupSize;
  }

  return races;
};

// Helper to calculate bracket structure
const calculateBracketStructure = (
  racerCount: number,
  firstRoundRaces: number
): {
  totalRounds: number;
  winnersRounds: number;
  secondChanceRounds: number;
  raceNumbers: {
    start: number;
    end: number;
    finals: number;
  };
} => {
  // Special case for 1-2 racers - only finals
  if (racerCount <= 2) {
    return {
      totalRounds: 1,
      winnersRounds: 0,
      secondChanceRounds: 0,
      raceNumbers: {
        start: 1,
        end: 1,
        finals: 1,
      },
    };
  }

  // Calculate winners bracket rounds
  const winnersRounds = Math.ceil(Math.log2(firstRoundRaces)) + 1;

  // Calculate second chance rounds based on first round losers and racer count
  let secondChanceRounds = racerCount <= 6 ? 1 : 2;

  // Special case for 10 racers - force exactly 2 second chance rounds
  if (racerCount === 10) {
    secondChanceRounds = 2;
  }

  // Calculate total rounds
  const totalRounds = winnersRounds + secondChanceRounds;

  // Calculate race numbers based on specific scenarios
  let finalsRaceNumber = 0;

  // Handle specific racer counts
  if (racerCount <= 6) {
    finalsRaceNumber = 5;
  } else if (racerCount <= 8) {
    finalsRaceNumber = 6;
  } else if (racerCount === 9) {
    finalsRaceNumber = 8;
  } else if (racerCount === 10) {
    finalsRaceNumber = 10; // Set finals to race 10 for 10 racers
  } else if (racerCount === 24) {
    finalsRaceNumber = 16;
  } else {
    const winnersRaceCount = firstRoundRaces;
    const secondRoundRaces = Math.ceil(firstRoundRaces / 2);
    const thirdRoundRaces = Math.ceil(secondRoundRaces / 2);
    const totalWinnersRaces = winnersRaceCount + secondRoundRaces + thirdRoundRaces;
    const secondChanceRaceCount = secondChanceRounds === 1 ? 1 : 2;
    finalsRaceNumber = totalWinnersRaces + secondChanceRaceCount + 1;
  }

  return {
    totalRounds,
    winnersRounds,
    secondChanceRounds,
    raceNumbers: {
      start: 1,
      end: finalsRaceNumber - 1,
      finals: finalsRaceNumber,
    },
  };
};

export const generateFullBracketStructure = (
  racers: Racer[],
  raceId: string,
  raceClass: string
): BracketRound[] => {
  const rounds: BracketRound[] = [];

  // Special case for 1 or 2 racers - create only a final round
  if (racers.length <= 2) {
    rounds.push({
      roundNumber: 1,
      races: [
        {
          raceNumber: 1,
          racers: [...racers], // Include all racers directly in the final
          bracketType: 'final',
          round: 1,
          status: 'pending',
          position: 0,
          raceId,
          raceClass,
        },
      ],
      raceId,
      raceClass,
      bracketType: 'final',
    });

    return rounds;
  }

  // Special case for 3-4 racers - create a first round and finals
  if (racers.length <= 4) {
    // First round with all racers
    rounds.push({
      roundNumber: 1,
      races: [
        {
          raceNumber: 1,
          racers: [...racers],
          bracketType: 'winners',
          round: 1,
          status: 'pending',
          position: 0,
          nextWinnerRace: 3, // Points to finals
          nextLoserRace: 2, // Points to second chance
          raceId,
          raceClass,
        },
      ],
      raceId,
      raceClass,
      bracketType: 'winners',
    });

    // Second chance round
    rounds.push({
      roundNumber: 1,
      races: [
        {
          raceNumber: 2,
          racers: [], // Will be populated with first round losers
          bracketType: 'losers',
          round: 1,
          status: 'pending',
          position: 0,
          nextWinnerRace: 3, // Points to finals
          raceId,
          raceClass,
        },
      ],
      raceId,
      raceClass,
      bracketType: 'losers',
    });

    // Finals
    rounds.push({
      roundNumber: 2,
      races: [
        {
          raceNumber: 3,
          racers: [], // Will be populated after first round and second chance
          bracketType: 'final',
          round: 2,
          status: 'pending',
          position: 0,
          raceId,
          raceClass,
        },
      ],
      raceId,
      raceClass,
      bracketType: 'final',
    });

    return rounds;
  }

  const firstRoundRaces = groupIntoRaces(racers);
  const numFirstRoundRaces = firstRoundRaces.length;

  // Special case for 9 racers - ensure first round has 3 races with 3 racers each
  if (racers.length === 9) {
    // Redistribute racers evenly
    const sortedRacers = [...racers].sort(
      (a, b) => (a.seedData?.startingPosition || 0) - (b.seedData?.startingPosition || 0)
    );

    // Create 3 races with 3 racers each
    const redistributedRaces: BracketRace[] = [];
    for (let i = 0; i < 3; i++) {
      const raceRacers = sortedRacers.slice(i * 3, (i + 1) * 3);
      redistributedRaces.push({
        raceNumber: i + 1,
        racers: raceRacers,
        bracketType: 'winners',
        round: 1,
        status: 'pending',
        position: i,
        raceId: '',
        raceClass: '',
      });
    }

    // Use redistributed races for 9 racers
    if (redistributedRaces.length === 3) {
      console.log('9 racers: Redistributed to 3 races with 3 racers each');
      firstRoundRaces.length = 0;
      firstRoundRaces.push(...redistributedRaces);
    }
  }

  // Calculate bracket structure
  const structure = calculateBracketStructure(racers.length, numFirstRoundRaces);
  let currentRaceNumber = structure.raceNumbers.start;

  // Create winners bracket rounds
  for (let round = 1; round <= structure.winnersRounds; round++) {
    const races: BracketRace[] = [];

    if (round === 1) {
      // First round uses the grouped races
      races.push(
        ...firstRoundRaces.map((race, idx) => ({
          ...race,
          raceNumber: currentRaceNumber + idx,
          bracketType: 'winners' as const,
          round,
          nextWinnerRace: currentRaceNumber + numFirstRoundRaces,
          nextLoserRace: structure.raceNumbers.end - structure.secondChanceRounds + 1,
          raceId,
          raceClass,
          status: 'pending' as const,
        }))
      );
      currentRaceNumber += numFirstRoundRaces;
    } else {
      // Subsequent rounds
      // Special case for 9 racers - ensure exactly 1 race in second round
      const numRaces =
        racers.length === 9 && round === 2
          ? 1
          : Math.ceil(numFirstRoundRaces / Math.pow(2, round - 1));
      for (let i = 0; i < numRaces; i++) {
        const isLastWinnersRound = round === structure.winnersRounds;
        races.push({
          raceNumber: currentRaceNumber + i,
          racers: [],
          bracketType: 'winners',
          round,
          status: 'pending',
          position: i,
          nextWinnerRace: isLastWinnersRound
            ? structure.raceNumbers.finals
            : currentRaceNumber + numRaces,
          raceId,
          raceClass,
        });
      }
      currentRaceNumber += numRaces;
    }

    rounds.push({
      roundNumber: round,
      races,
      raceId,
      raceClass,
      bracketType: 'winners',
    });
  }

  // Create second chance rounds
  for (let round = 1; round <= structure.secondChanceRounds; round++) {
    const races: BracketRace[] = [];
    // For 9 racers, ensure exactly 1 race per second chance round
    // For 10 racers with 4 or fewer first round losers, keep them in one race
    const totalFirstRoundLosers = rounds
      .find(r => r.roundNumber === 1 && r.bracketType === 'winners')
      ?.races.reduce((sum, race) => sum + (race.losers?.length || 0), 0) || 0;

    const numRaces = 
      racers.length === 9 ? 1 : 
      (round === 1 && totalFirstRoundLosers <= 4) ? 1 :
      round === 1 ? Math.min(2, Math.ceil(numFirstRoundRaces / 2)) : 1;

    for (let i = 0; i < numRaces; i++) {
      races.push({
        raceNumber: currentRaceNumber++,
        racers: [],
        bracketType: 'losers',
        round,
        status: 'pending',
        position: i,
        nextWinnerRace:
          round < structure.secondChanceRounds ? currentRaceNumber : structure.raceNumbers.finals,
        raceId,
        raceClass,
      });
    }

    rounds.push({
      roundNumber: round,
      races,
      raceId,
      raceClass,
      bracketType: 'losers',
    });
  }

  // Add finals
  rounds.push({
    roundNumber: structure.totalRounds,
    races: [
      {
        raceNumber: structure.raceNumbers.finals,
        racers: [],
        bracketType: 'final',
        round: structure.totalRounds,
        status: 'pending',
        position: 0,
        raceId,
        raceClass,
      },
    ],
    raceId,
    raceClass,
    bracketType: 'final',
  });

  // Update the special handling for 10 racers
  if (racers.length === 10) {
    // Ensure Race 6 points to Race 10 (finals)
    const winnersRound3 = rounds.find(
      r => r.roundNumber === 3 && r.bracketType === 'winners'
    );
    if (winnersRound3 && winnersRound3.races.length > 0) {
      winnersRound3.races[0].nextWinnerRace = 10; // Point to finals
    }

    // Update finals race number
    const finalsRound = rounds.find(r => r.bracketType === 'final');
    if (finalsRound && finalsRound.races.length > 0) {
      finalsRound.races[0].raceNumber = 10;
    }

    // Count total first round losers
    const totalFirstRoundLosers = rounds
      .find(r => r.roundNumber === 1 && r.bracketType === 'winners')
      ?.races.reduce((sum, race) => sum + (race.losers?.length || 0), 0) || 0;

    // Only split first round losers if there are more than 4
    if (totalFirstRoundLosers > 4) {
      // Ensure first round losers are distributed correctly between Race 7 and 8
      const firstRoundRaces = rounds.find(
        r => r.roundNumber === 1 && r.bracketType === 'winners'
      );
      if (firstRoundRaces) {
        firstRoundRaces.races.forEach((race, idx) => {
          // First race losers go to Race 7, second and third race losers go to Race 8
          race.nextLoserRace = idx === 0 ? 7 : 8;
        });
      }
    } else {
      // All losers go to Race 7
      const firstRoundRaces = rounds.find(
        r => r.roundNumber === 1 && r.bracketType === 'winners'
      );
      if (firstRoundRaces) {
        firstRoundRaces.races.forEach(race => {
          race.nextLoserRace = 7;
        });
      }
    }

    // Set up second chance rounds correctly
    const secondChanceRound1 = rounds.find(
      r => r.roundNumber === 1 && r.bracketType === 'losers'
    );
    if (secondChanceRound1) {
      // Only create two races if we have more than 4 first round losers
      if (totalFirstRoundLosers > 4) {
        if (secondChanceRound1.races.length === 1) {
          secondChanceRound1.races.push({
            raceNumber: 8,
            racers: [],
            bracketType: 'losers',
            round: 1,
            status: 'pending',
            position: 1,
            nextWinnerRace: 9,
            raceId,
            raceClass,
          });
        }
        // Set correct race numbers and progression
        secondChanceRound1.races[0].raceNumber = 7;
        secondChanceRound1.races[0].nextWinnerRace = 9;
        secondChanceRound1.races[1].raceNumber = 8;
        secondChanceRound1.races[1].nextWinnerRace = 9;
      } else {
        // Keep single race with number 7
        secondChanceRound1.races[0].raceNumber = 7;
        secondChanceRound1.races[0].nextWinnerRace = 9;
      }
    }

    const secondChanceRound2 = rounds.find(
      r => r.roundNumber === 2 && r.bracketType === 'losers'
    );
    if (secondChanceRound2 && secondChanceRound2.races.length > 0) {
      secondChanceRound2.races[0].raceNumber = 9; // Second round is Race 9
      secondChanceRound2.races[0].nextWinnerRace = 10; // Winner goes to finals
    }
  }

  // Special case for 24 racers - ensure sequential race numbers
  if (racers.length === 24) {
    // Reassign race numbers sequentially
    let raceNumber = 1; // Declare the variable with an initial value
    rounds.forEach(round => {
      round.races.forEach(race => {
        race.raceNumber = raceNumber++;
      });
    });

    // Update nextWinnerRace and nextLoserRace references
    rounds.forEach(round => {
      round.races.forEach(race => {
        if (race.nextWinnerRace) {
          // Find the target race and update the reference
          const targetRound = rounds.find(
            r => r.roundNumber === round.roundNumber + 1 && r.bracketType === round.bracketType
          );
          if (targetRound && targetRound.races.length > 0) {
            race.nextWinnerRace = targetRound.races[0].raceNumber;
          }
        }
        if (race.nextLoserRace) {
          // Find the target race and update the reference
          const targetRound = rounds.find(r => r.bracketType === 'losers' && r.roundNumber === 1);
          if (targetRound && targetRound.races.length > 0) {
            race.nextLoserRace = targetRound.races[0].raceNumber;
          }
        }
      });
    });
  }

  return rounds;
};

// Replace the selector with properly memoized versions
const selectBracketsState = (state: RootState) => state.brackets;
const selectRaceId = (_state: RootState, raceId: string) => raceId;
const selectRaceClass = (_state: RootState, _raceId: string, raceClass: string) => raceClass;

export const selectBracketsByRaceAndClass = createSelector(
  [selectBracketsState, selectRaceId, selectRaceClass],
  (bracketsState, raceId, raceClass) => {
    const brackets = bracketsState.entities[raceId]?.[raceClass] || [];
    return brackets.map(round => ({
      ...round,
      races: round.races.map(race => ({
        ...race,
        // Ensure we're not creating new arrays unnecessarily
        racers: race.racers || [],
        winners: race.winners || [],
        losers: race.losers || [],
      })),
    }));
  }
);

// Add selector for winners bracket
export const selectWinnersBracket = createSelector([selectBracketsByRaceAndClass], brackets =>
  brackets.filter(round => round.bracketType === 'winners')
);

// Add selector for second chance bracket
export const selectSecondChanceBracket = createSelector([selectBracketsByRaceAndClass], brackets =>
  brackets.filter(round => round.bracketType === 'losers')
);

// Add selector for finals
export const selectFinalsBracket = createSelector([selectBracketsByRaceAndClass], brackets =>
  brackets.find(round => round.bracketType === 'final')
);

// Update the createBracket thunk
export const createBracket = createAsyncThunk(
  'bracket/create',
  async ({ racers, raceId, raceClass }: { racers: Racer[]; raceId: string; raceClass: string }) => {
    const bracketStructure = generateFullBracketStructure(racers, raceId, raceClass);
    return {
      raceId,
      raceClass,
      rounds: bracketStructure,
    };
  }
);

// Helper function to get racers by their IDs
const getRacersByIds = (racers: Racer[], ids: string[]): Racer[] => {
  return ids.map(id => racers.find(r => r.id === id)).filter((r): r is Racer => r !== undefined);
};

// Helper to check and restructure races with too many racers
export const checkAndRestructureRaces = (
  rounds: BracketRound[],
  racers: Racer[],
  raceId: string,
  raceClass: string
): BracketRound[] => {
  // Deep clone the rounds to avoid mutating the original
  let updatedRounds = JSON.parse(JSON.stringify(rounds));

  console.log('CHECKING AND RESTRUCTURING RACES');

  // Check each round for races with too many racers
  for (let i = 0; i < updatedRounds.length; i++) {
    const round = updatedRounds[i];

    // Special case for second chance first round with 5 racers
    if (round.bracketType === 'losers' && round.roundNumber === 1) {
      const totalRacers = round.races.reduce(
        (sum: number, race: BracketRace) => sum + race.racers.length,
        0
      );

      console.log(
        `Second chance first round: ${totalRacers} racers in ${round.races.length} races`
      );

      // If we have 5 racers in a single race in the second chance first round, split into two races
      if (totalRacers === 5 && round.races.length === 1) {
        console.log('Splitting 5 racers into two races (3 and 2)');

        const originalRace = round.races[0];
        const allRacers = [...originalRace.racers];

        console.log(
          'All racers:',
          allRacers.map((r: Racer) => r.id)
        );

        // Create two races: one with 3 racers, one with 2
        originalRace.racers = allRacers.slice(0, 3);

        console.log(
          'Race 1 racers:',
          originalRace.racers.map((r: Racer) => r.id)
        );

        // Create a new race for the remaining 2 racers
        const newRace: BracketRace = {
          raceNumber: originalRace.raceNumber + 1,
          racers: allRacers.slice(3, 5),
          bracketType: 'losers',
          round: round.roundNumber,
          status: 'pending',
          position: originalRace.position + 1,
          raceId,
          raceClass,
          nextWinnerRace: originalRace.nextWinnerRace, // Both races should progress to the same next race
        };

        console.log(
          'Race 2 racers:',
          newRace.racers.map((r: Racer) => r.id)
        );

        // Add the new race
        round.races.push(newRace);

        console.log('After splitting, second chance first round has', round.races.length, 'races');

        // Update race numbers for all subsequent races
        updatedRounds = reassignRaceNumbers(updatedRounds);
      }
    }

    // Check each race for too many racers
    let racesAdded = false;
    for (let j = 0; j < round.races.length; j++) {
      const race = round.races[j];

      // If a race has more than 4 racers, split it into two races
      if (race.racers.length > 4) {
        console.log(
          `Race ${race.raceNumber} in ${round.bracketType} round ${round.roundNumber} has ${race.racers.length} racers, splitting`
        );

        // Get all racers in this race
        const allRacers = [...race.racers];

        // Determine how to split the racers (3 and 2 for 5 racers)
        let firstGroupSize = 3;
        if (allRacers.length > 5) {
          firstGroupSize = Math.ceil(allRacers.length / 2);
          if (firstGroupSize > 4) {
            firstGroupSize = 4;
          }
        }

        // Update the current race to have only the first group
        race.racers = allRacers.slice(0, firstGroupSize);

        // Create a new race for the second group
        const newRace: BracketRace = {
          raceNumber: race.raceNumber + 1,
          racers: allRacers.slice(firstGroupSize),
          bracketType: race.bracketType,
          round: race.round,
          status: 'pending',
          position: race.position + 1,
          raceId,
          raceClass,
          nextWinnerRace: race.nextWinnerRace, // Both races should progress to the same next race
        };

        // Add the new race to the round
        round.races.push(newRace);
        racesAdded = true;
      }
    }

    // If we added races, reassign race numbers
    if (racesAdded) {
      updatedRounds = reassignRaceNumbers(updatedRounds);
    }
  }

  return updatedRounds;
};

// Helper to reassign race numbers sequentially
export const reassignRaceNumbers = (rounds: BracketRound[]): BracketRound[] => {
  let nextRaceNumber = 1;

  // First handle winners bracket in order
  const winnersRounds = rounds
    .filter(r => r.bracketType === 'winners')
    .sort((a, b) => a.roundNumber - b.roundNumber);

  winnersRounds.forEach(round => {
    round.races.forEach(race => {
      race.raceNumber = nextRaceNumber++;
    });
  });

  // Then handle second chance bracket
  const secondChanceRounds = rounds
    .filter(r => r.bracketType === 'losers')
    .sort((a, b) => a.roundNumber - b.roundNumber);

  // First, get the race number that will be assigned to the first race in second chance round 2
  // We need this to correctly set nextWinnerRace for all races in round 1
  const secondChanceRound1RaceCount =
    secondChanceRounds.find(r => r.roundNumber === 1)?.races.length || 0;
  const secondChanceRound2StartRaceNumber = nextRaceNumber + secondChanceRound1RaceCount;

  secondChanceRounds.forEach(round => {
    round.races.forEach(race => {
      race.raceNumber = nextRaceNumber++;

      // Update nextWinnerRace references
      if (round.roundNumber === 1) {
        // If this is first round, all races should point to the first race of second round
        const secondChanceRound2 = secondChanceRounds.find(r => r.roundNumber === 2);
        if (secondChanceRound2 && secondChanceRound2.races.length > 0) {
          // All races in second chance round 1 should point to the first race in round 2
          race.nextWinnerRace = secondChanceRound2StartRaceNumber;
        } else {
          // If no second round, winners go to finals
          const finalsRound = rounds.find(r => r.bracketType === 'final');
          if (finalsRound) {
            const finalsRaceNumber =
              nextRaceNumber +
              secondChanceRounds.reduce((sum, r) => sum + r.races.length, 0) -
              (round.races.length + (secondChanceRound2?.races.length || 0));
            race.nextWinnerRace = finalsRaceNumber;
          }
        }
      }
    });
  });

  // Finally handle finals
  const finalsRound = rounds.find(r => r.bracketType === 'final');
  if (finalsRound && finalsRound.races.length > 0) {
    finalsRound.races[0].raceNumber = nextRaceNumber;
  }

  return rounds;
};

// Helper to find a race by its race number
const findRaceByNumber = (rounds: BracketRound[], raceNumber: number): BracketRace | undefined => {
  for (const round of rounds) {
    const race = round.races.find(r => r.raceNumber === raceNumber);
    if (race) {
      return race;
    }
  }
  return undefined;
};

// Add logging to updateRaceResults action creator
export const updateRaceResults = createAsyncThunk(
  'bracket/updateResults',
  async ({
    raceId,
    raceClass,
    raceNumber,
    round,
    bracketType,
    winners,
    losers,
    racers,
  }: {
    raceId: string;
    raceClass: string;
    raceNumber: number;
    round: number;
    bracketType: 'winners' | 'losers' | 'final';
    winners: string[];
    losers: string[];
    racers: Racer[];
  }) => {
    return {
      raceId,
      raceClass,
      raceNumber,
      round,
      bracketType,
      winners,
      losers,
      racers,
    };
  }
);

export const updateFinalRankings = createAsyncThunk(
  'bracket/updateFinalRankings',
  async ({
    raceId,
    raceClass,
    rankings,
  }: {
    raceId: string;
    raceClass: string;
    rankings: {
      first: string;
      second: string;
      third: string;
      fourth: string;
    };
  }) => {
    return {
      raceId,
      raceClass,
      rankings,
    };
  }
);

export const disqualifyRacer = createAsyncThunk(
  'bracket/disqualifyRacer',
  async ({
    raceId,
    raceClass,
    raceNumber,
    round,
    bracketType,
    racerId,
    racers,
  }: {
    raceId: string;
    raceClass: string;
    raceNumber: number;
    round: number;
    bracketType: 'winners' | 'losers' | 'final';
    racerId: string;
    racers: Racer[];
  }) => {
    return {
      raceId,
      raceClass,
      raceNumber,
      round,
      bracketType,
      racerId,
      racers,
    };
  }
);

export const markRacerDNS = createAsyncThunk(
  'bracket/markRacerDNS',
  async ({
    raceId,
    raceClass,
    raceNumber,
    round,
    bracketType,
    racerId,
    racers,
  }: {
    raceId: string;
    raceClass: string;
    raceNumber: number;
    round: number;
    bracketType: 'winners' | 'losers' | 'final';
    racerId: string;
    racers: Racer[];
  }) => {
    return {
      raceId,
      raceClass,
      raceNumber,
      round,
      bracketType,
      racerId,
      racers,
    };
  }
);

// Update populateNextRoundRaces to handle progression correctly
export const populateNextRoundRaces = (
  rounds: BracketRound[],
  currentRound: number,
  raceId: string,
  raceClass: string,
  winners: string[],
  losers: string[],
  racers: Racer[],
  raceNumber: number,
  bracketType: 'winners' | 'losers' | 'final'
): BracketRound[] => {
  // Deep clone the rounds to avoid mutating the original
  const updatedRounds = JSON.parse(JSON.stringify(rounds));

  console.log(
    `POPULATING NEXT ROUND RACES: Round ${currentRound}, Race ${raceNumber}, Bracket ${bracketType}`
  );
  console.log(`Winners: ${winners.join(', ')}, Losers: ${losers.join(', ')}`);

  // Find the current race
  const currentRoundObj = updatedRounds.find(
    (r: BracketRound) => r.roundNumber === currentRound && r.bracketType === bracketType
  );

  if (!currentRoundObj) {
    console.log('Current round not found');
    return updatedRounds;
  }

  const currentRace = currentRoundObj.races.find((r: BracketRace) => r.raceNumber === raceNumber);

  if (!currentRace) {
    console.log('Current race not found');
    return updatedRounds;
  }

  // Update the current race with winners and losers
  currentRace.winners = winners;
  currentRace.losers = losers;
  currentRace.status = 'completed';

  // Get the winner and loser racers
  const winnerRacers = getRacersByIds(racers, winners);
  const loserRacers = getRacersByIds(racers, losers);

  // Count total racers to determine bracket structure
  const totalRacers = racers.length;

  // Special case for 9 racers in round 2
  if (totalRacers === 9 && currentRound === 2 && bracketType === 'winners') {
    // Find round 2 winners bracket
    const round2 = updatedRounds.find(
      (r: BracketRound) => r.roundNumber === 2 && r.bracketType === 'winners'
    );

    if (round2) {
      // Check if all races in round 2 are completed
      const completedRaces = round2.races.filter((r: BracketRace) => r.status === 'completed');
      const allWinners = completedRaces.flatMap((r: BracketRace) => getRacersByIds(racers, r.winners || []));

      // If we have all winners from round 2 (4 winners total)
      if (allWinners.length === 4) {
        console.log('9 racers: All round 2 races completed, sending winners to round 3');
        
        // Find round 3 race (race 6)
        const round3Race = findRaceByNumber(updatedRounds, 6);
        if (round3Race) {
          // Add all winners to round 3 race
          round3Race.racers = allWinners;
          // Update nextWinnerRace to point to finals
          round3Race.nextWinnerRace = 9;
          console.log('Added all winners to round 3 race:', round3Race.raceNumber);
        }
      } else {
        // Still collecting winners, add to round 3 race
        const round3Race = findRaceByNumber(updatedRounds, 6);
        if (round3Race) {
          round3Race.racers = [...round3Race.racers, ...winnerRacers];
          // Update nextWinnerRace to point to finals
          round3Race.nextWinnerRace = 9;
          console.log(`Added winners from race ${raceNumber} to round 3`);
        }
      }
    }
  } else if (totalRacers === 9 && currentRound === 3 && bracketType === 'winners') {
    // Handle round 3 winners going to finals
    const finalsRace = findRaceByNumber(updatedRounds, 9);
    if (finalsRace) {
      console.log('9 racers: Adding round 3 winners to finals');
      finalsRace.racers = [...finalsRace.racers, ...winnerRacers];
    }
  } else if (totalRacers === 9 && currentRound === 2 && bracketType === 'losers') {
    // Handle second chance round 2 - only take the winner
    const finalsRace = findRaceByNumber(updatedRounds, 9);
    if (finalsRace) {
      console.log('9 racers: Adding single winner from second chance round 2 to finals');
      // Only take the first winner
      const singleWinner = winnerRacers.slice(0, 1);
      finalsRace.racers = [...finalsRace.racers, ...singleWinner];
    }
  } else {
    // Handle normal progression
    if (currentRace.nextWinnerRace) {
      const nextRace = findRaceByNumber(updatedRounds, currentRace.nextWinnerRace);
      if (nextRace) {
        console.log(`Adding winners to race ${nextRace.raceNumber}`);
        nextRace.racers = [...nextRace.racers, ...winnerRacers];
      }
    }
  }

  // Handle progression to losers bracket
  if (bracketType === 'winners' && currentRace.nextLoserRace && losers.length > 0) {
    // Only first round losers go to second chance
    if (currentRound === 1) {
      const nextLoserRace = findRaceByNumber(updatedRounds, currentRace.nextLoserRace);
      if (nextLoserRace) {
        console.log(`Adding losers to second chance race ${nextLoserRace.raceNumber}`);
        nextLoserRace.racers = [...nextLoserRace.racers, ...loserRacers];
      }
    }
  }

  // Final check for any races that need restructuring
  console.log('Final check for restructuring');
  return checkAndRestructureRaces(updatedRounds, racers, raceId, raceClass);
};

const bracketSlice = createSlice({
  name: 'brackets',
  initialState,
  reducers: {
    resetBrackets: state => {
      state.entities = {};
      localStorage.removeItem('brackets');
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadBracketsFromStorage.fulfilled, (state, action) => {
        state.entities = action.payload.entities;
        state.loading = false;
        state.error = null;
      })
      .addCase(createBracket.fulfilled, (state, action) => {
        const { raceId, raceClass, rounds } = action.payload;
        if (!state.entities) {
          state.entities = {};
        }
        if (!state.entities[raceId]) {
          state.entities[raceId] = {};
        }
        state.entities[raceId][raceClass] = rounds;
        state.loading = false;

        // Save the entire state to localStorage
        const stateToSave = {
          entities: state.entities,
          loading: false,
          error: null,
        };
        localStorage.setItem('brackets', JSON.stringify(stateToSave));
      })
      .addCase(updateRaceResults.fulfilled, (state, action) => {
        const { raceId, raceClass, raceNumber, round, bracketType, winners, losers, racers } =
          action.payload;

        if (!state.entities[raceId]?.[raceClass]) {
          return;
        }

        // Update current race results
        let updatedRounds = state.entities[raceId][raceClass].map((bracketRound: BracketRound) => {
          if (bracketRound.roundNumber === round && bracketRound.bracketType === bracketType) {
            return {
              ...bracketRound,
              races: bracketRound.races.map((race: BracketRace) =>
                race.raceNumber === raceNumber
                  ? {
                      ...race,
                      winners,
                      losers,
                      status: 'completed' as const,
                      ...(bracketType === 'final' && {
                        finalRankings: {
                          first: winners[0],
                          second: winners[1] || losers[0],
                          third: winners[1] ? losers[0] : losers[1],
                          fourth: winners[1] ? losers[1] : losers[2],
                        },
                      }),
                    }
                  : race
              ),
            };
          }
          return bracketRound;
        });

        // Only populate next round if this isn't the finals
        if (bracketType !== 'final') {
          // Populate next round races
          updatedRounds = populateNextRoundRaces(
            updatedRounds,
            round,
            raceId,
            raceClass,
            winners,
            losers,
            racers,
            raceNumber,
            bracketType
          );
        }

        state.entities[raceId][raceClass] = updatedRounds;

        // Save with proper structure
        const stateToSave = {
          entities: state.entities,
          loading: false,
          error: null,
        };
        localStorage.setItem('brackets', JSON.stringify(stateToSave));
      })
      .addCase(updateFinalRankings.fulfilled, (state, action) => {
        const { raceId, raceClass, rankings } = action.payload;

        if (!state.entities[raceId]?.[raceClass]) {
          return;
        }

        state.entities[raceId][raceClass] = state.entities[raceId][raceClass].map(
          (round: BracketRound) => {
            if (round.bracketType === 'final') {
              const updatedRound = {
                ...round,
                races: round.races.map((race: BracketRace) => {
                  const updatedRace = {
                    ...race,
                    finalRankings: rankings,
                    status: 'completed' as const,
                    winners: [rankings.first, rankings.second],
                    losers: [rankings.third, rankings.fourth],
                  };
                  return updatedRace;
                }),
              };
              return updatedRound;
            }
            return round;
          }
        );

        // Save with proper structure
        const stateToSave = {
          entities: state.entities,
          loading: false,
          error: null,
        };
        localStorage.setItem('brackets', JSON.stringify(stateToSave));
      })
      .addCase(disqualifyRacer.fulfilled, (state, action) => {
        const { raceId, raceClass, raceNumber, round, bracketType, racerId } = action.payload;

        if (!state.entities[raceId]?.[raceClass]) return;

        state.entities[raceId][raceClass] = state.entities[raceId][raceClass].map(
          (bracketRound: BracketRound) => {
            if (bracketRound.roundNumber === round && bracketRound.bracketType === bracketType) {
              return {
                ...bracketRound,
                races: bracketRound.races.map((race: BracketRace) => {
                  if (race.raceNumber === raceNumber) {
                    const disqualifiedRacers = [...(race.disqualifiedRacers || []), racerId];
                    const winners = race.winners?.filter((id: string) => id !== racerId) || [];
                    const losers = race.losers?.filter((id: string) => id !== racerId) || [];

                    if (race.finalRankings) {
                      const rankings = { ...race.finalRankings };
                      Object.entries(rankings).forEach(([position, id]) => {
                        if (id === racerId) {
                          delete rankings[position as keyof typeof rankings];
                        }
                      });
                      return {
                        ...race,
                        disqualifiedRacers,
                        winners,
                        losers,
                        finalRankings: rankings,
                      };
                    }

                    return {
                      ...race,
                      disqualifiedRacers,
                      winners,
                      losers,
                    };
                  }
                  return race;
                }),
              };
            }
            return bracketRound;
          }
        );

        // Save with proper structure
        const stateToSave = {
          entities: state.entities,
          loading: false,
          error: null,
        };
        localStorage.setItem('brackets', JSON.stringify(stateToSave));
      })
      .addCase(markRacerDNS.fulfilled, (state, action) => {
        const { raceId, raceClass, raceNumber, round, bracketType, racerId } = action.payload;

        if (!state.entities[raceId]?.[raceClass]) return;

        state.entities[raceId][raceClass] = state.entities[raceId][raceClass].map(
          (bracketRound: BracketRound) => {
            if (bracketRound.roundNumber === round && bracketRound.bracketType === bracketType) {
              return {
                ...bracketRound,
                races: bracketRound.races.map((race: BracketRace) => {
                  if (race.raceNumber === raceNumber) {
                    const dnsRacers = [...(race.dnsRacers || []), racerId];
                    const winners = race.winners?.filter((id: string) => id !== racerId) || [];
                    const losers = race.losers?.filter((id: string) => id !== racerId) || [];

                    if (race.finalRankings) {
                      const rankings = { ...race.finalRankings };
                      Object.entries(rankings).forEach(([position, id]) => {
                        if (id === racerId) {
                          delete rankings[position as keyof typeof rankings];
                        }
                      });
                      return {
                        ...race,
                        dnsRacers,
                        winners,
                        losers,
                        finalRankings: rankings,
                      };
                    }

                    return {
                      ...race,
                      dnsRacers,
                      winners,
                      losers,
                    };
                  }
                  return race;
                }),
              };
            }
            return bracketRound;
          }
        );

        // Save with proper structure
        const stateToSave = {
          entities: state.entities,
          loading: false,
          error: null,
        };
        localStorage.setItem('brackets', JSON.stringify(stateToSave));
      });
  },
});

export const { resetBrackets } = bracketSlice.actions;
export default bracketSlice.reducer;
