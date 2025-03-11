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
  } catch (e) {
    return initialState;
  }
};

export const loadBracketsFromStorage = createAsyncThunk('bracket/load', async () => {
  return getBracketsFromStorage();
});

// Helper function to generate tournament bracket seeding order
const generateBracketSeeds = (count: number): number[] => {
  // Find the next power of 2 that can accommodate all racers
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(Math.min(count, 32))));
  const seeds: number[] = [];

  // Generate the seeding pattern for a full bracket
  for (let i = 1; i <= nextPowerOf2 / 2; i++) {
    seeds.push(i);
    seeds.push(nextPowerOf2 + 1 - i);
  }

  // Return only the number of seeds we need
  return seeds.slice(0, count);
};

// Helper function to determine optimal race group sizes
const determineRaceGroups = (numRacers: number): number[] => {
  // Special cases for 9 or fewer racers
  if (numRacers <= 4) return [numRacers];
  if (numRacers === 5) return [3, 2];
  if (numRacers === 6) return [3, 3];
  if (numRacers === 7) return [4, 3];
  if (numRacers === 8) return [4, 4];
  if (numRacers === 9) return [3, 3, 3]; // For 9 racers, use three groups of 3 for better balance

  // For larger numbers, we'll use similar principles
  const groups: number[] = [];
  let remaining = numRacers;

  // First, create as many groups of 4 as possible
  while (remaining >= 4) {
    groups.push(4);
    remaining -= 4;
  }

  // Handle the remainder
  if (remaining > 0) {
    const lastFullGroup = groups[groups.length - 1];

    // If we have 3 remaining, just add a group of 3
    if (remaining === 3) {
      groups.push(3);
    }
    // If we have 2 remaining and a previous group of 4,
    // split into two groups of 3
    else if (remaining === 2 && lastFullGroup === 4) {
      groups[groups.length - 1] = 3;
      groups.push(3);
    }
    // If we have 1 remaining, try to balance groups
    else if (remaining === 1 && groups.length > 0) {
      // Remove last group of 4 and create two groups of 3 and 2
      groups[groups.length - 1] = 3;
      groups.push(2);
    }
    // If we can't balance better, just add the remainder
    else {
      groups.push(remaining);
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

// Helper function to calculate race numbers for different bracket sections
export const calculateRaceNumbers = (
  numFirstRoundRaces: number,
  totalLosers: number,
  racerCount: number
) => {
  // For 9 racers, we have a simplified structure
  if (racerCount === 9) {
    return {
      // Winners bracket: Races 1-3 for first round, Race 4 for second round
      winnersStart: 1,
      winnersSecondRound: 4,

      // Second chance bracket: Race 5 for first-round losers
      secondChanceFirstRound: 5,

      // Second chance final: Race 7 for winner of Race 5
      secondChanceFinal: 7,

      // Finals is Race 8
      finals: 8,
    };
  }

  // Standard structure for other racer counts
  return {
    // Winners bracket races: 1-2 for first round, 3 for second round
    winnersStart: 1,
    winnersSecondRound: 3,

    // Second chance races: 4 for first round, 5 for second round (if needed)
    secondChanceFirstRound: 4,
    secondChanceSecondRound: totalLosers > 2 ? 5 : undefined,

    // Finals is race 6 when we have more than 2 losers (needing second round), otherwise race 5
    finals: totalLosers > 2 ? 6 : 5,
  };
};

// Generate initial bracket structure including winners and losers brackets
export const generateFullBracketStructure = (
  racers: Racer[],
  raceId: string,
  raceClass: string
): BracketRound[] => {
  const rounds: BracketRound[] = [];
  const firstRoundRaces = groupIntoRaces(racers);
  const numFirstRoundRaces = firstRoundRaces.length;
  const racerCount = racers.length;

  // Calculate total losers based on the actual race configurations
  let totalLosers = 0;
  firstRoundRaces.forEach(race => {
    // Each race produces losers equal to racers - 2 (since 2 advance)
    const losersInRace = Math.max(0, race.racers.length - 2);
    totalLosers += losersInRace;
  });

  const needsSecondChanceSecondRound = totalLosers > 2;
  const raceNumbers = calculateRaceNumbers(numFirstRoundRaces, totalLosers, racerCount);

  // Special handling for 9 racers
  if (racerCount === 9) {
    // Create first round of Winners bracket (3 races)
    const mappedFirstRoundRaces = firstRoundRaces.map((race, idx) => {
      const raceNumber = idx + raceNumbers.winnersStart;
      return {
        ...race,
        raceNumber,
        bracketType: 'winners' as const,
        round: 1,
        nextWinnerRace: raceNumbers.winnersSecondRound,
        nextLoserRace: raceNumbers.secondChanceFirstRound,
        raceId,
        raceClass,
        status: 'pending' as const,
      };
    });

    rounds.push({
      roundNumber: 1,
      races: mappedFirstRoundRaces,
      raceId,
      raceClass,
      bracketType: 'winners',
    });

    // Add Winners bracket second round (Race 4)
    rounds.push({
      roundNumber: 2,
      races: [
        {
          raceNumber: raceNumbers.winnersSecondRound,
          racers: [],
          bracketType: 'winners' as const,
          round: 2,
          status: 'pending' as const,
          position: 0,
          nextWinnerRace: raceNumbers.finals,
          // No nextLoserRace - losers from second round are eliminated
          raceId,
          raceClass,
        },
      ],
      raceId,
      raceClass,
      bracketType: 'winners',
    });

    // Add Second Chance first round (Race 5) - for first round losers
    rounds.push({
      roundNumber: 1,
      races: [
        {
          raceNumber: raceNumbers.secondChanceFirstRound,
          racers: [],
          bracketType: 'losers' as const,
          round: 1,
          status: 'pending' as const,
          position: 0,
          nextWinnerRace: raceNumbers.secondChanceFinal, // Winner goes to Race 7
          raceId,
          raceClass,
        },
      ],
      raceId,
      raceClass,
      bracketType: 'losers',
    });

    // For 9 racers, we don't need Race 6 since second round losers don't go to second chance
    // Instead, we'll have a simpler structure:
    // - Race 5: First round losers (3 racers)
    // - Race 7: Winner from Race 5 (1 racer)
    // - Race 8: Finals with winners from Race 4 (2 racers) and Race 7 (1 racer)

    // Add Second Chance final (Race 7)
    rounds.push({
      roundNumber: 2,
      races: [
        {
          raceNumber: raceNumbers.secondChanceFinal as number,
          racers: [],
          bracketType: 'losers' as const,
          round: 2,
          status: 'pending' as const,
          position: 0,
          nextWinnerRace: raceNumbers.finals, // Winner goes to finals
          raceId,
          raceClass,
        },
      ],
      raceId,
      raceClass,
      bracketType: 'losers',
    });

    // Add Finals (Race 8)
    rounds.push({
      roundNumber: 3,
      races: [
        {
          raceNumber: raceNumbers.finals,
          racers: [],
          bracketType: 'final' as const,
          round: 3,
          status: 'pending' as const,
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

  // Standard bracket structure for other racer counts
  // Create first round of Winners bracket
  const mappedFirstRoundRaces = firstRoundRaces.map((race, idx) => {
    const raceNumber = idx + raceNumbers.winnersStart;
    return {
      ...race,
      raceNumber,
      bracketType: 'winners' as const,
      round: 1,
      nextWinnerRace: raceNumbers.winnersSecondRound,
      nextLoserRace: raceNumbers.secondChanceFirstRound,
      raceId,
      raceClass,
      status: 'pending' as const,
    };
  });

  rounds.push({
    roundNumber: 1,
    races: mappedFirstRoundRaces,
    raceId,
    raceClass,
    bracketType: 'winners',
  });

  // Add Winners bracket second round
  rounds.push({
    roundNumber: 2,
    races: [
      {
        raceNumber: raceNumbers.winnersSecondRound,
        racers: [],
        bracketType: 'winners' as const,
        round: 2,
        status: 'pending' as const,
        position: 0,
        nextWinnerRace: raceNumbers.finals,
        raceId,
        raceClass,
      },
    ],
    raceId,
    raceClass,
    bracketType: 'winners',
  });

  // Add Second Chance rounds
  // First round of second chance (receives losers from winners round 1)
  const secondChanceFirstRound = {
    roundNumber: 1,
    races: [
      {
        raceNumber: raceNumbers.secondChanceFirstRound,
        racers: [],
        bracketType: 'losers' as const,
        round: 1,
        status: 'pending' as const,
        position: 0,
        // If we need second round, winners go to Race 5, otherwise straight to finals
        nextWinnerRace: needsSecondChanceSecondRound
          ? (raceNumbers.secondChanceSecondRound as number)
          : raceNumbers.finals,
        raceId,
        raceClass,
      },
    ],
    raceId,
    raceClass,
    bracketType: 'losers' as const,
  };
  rounds.push(secondChanceFirstRound);

  // Only add second round of second chance if we'll have more than 2 losers
  if (needsSecondChanceSecondRound) {
    rounds.push({
      roundNumber: 2,
      races: [
        {
          raceNumber: raceNumbers.secondChanceSecondRound as number,
          racers: [],
          bracketType: 'losers' as const,
          round: 2,
          status: 'pending' as const,
          position: 0,
          nextWinnerRace: raceNumbers.finals,
          raceId,
          raceClass,
        },
      ],
      raceId,
      raceClass,
      bracketType: 'losers' as const,
    });
  }

  // Add Finals (Race 6 if we need second round of second chance, Race 5 otherwise)
  rounds.push({
    roundNumber: 3,
    races: [
      {
        raceNumber: raceNumbers.finals,
        racers: [],
        bracketType: 'final' as const,
        round: 3,
        status: 'pending' as const,
        position: 0,
        raceId,
        raceClass,
      },
    ],
    raceId,
    raceClass,
    bracketType: 'final' as const,
  });

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

// Helper function to create next round race
const createNextRoundRace = (
  roundNumber: number,
  raceNumber: number,
  position: number,
  bracketType: 'winners' | 'losers' | 'final',
  raceId: string,
  raceClass: string
): BracketRace => ({
  raceNumber,
  racers: [],
  round: roundNumber,
  bracketType,
  status: 'pending',
  position,
  raceId,
  raceClass,
});

// Helper to populate next round races
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
  const updatedRounds = [...rounds];
  
  // Calculate total losers from the first round races
  let totalLosers = 0;
  const firstRoundWinners = rounds.find(
    (r: BracketRound) => r.roundNumber === 1 && r.bracketType === 'winners'
  );
  
  if (firstRoundWinners) {
    firstRoundWinners.races.forEach(race => {
      const losersInRace = Math.max(0, race.racers.length - 2);
      totalLosers += losersInRace;
    });
  }
  
  // Count total racers
  let totalRacers = 0;
  if (firstRoundWinners) {
    firstRoundWinners.races.forEach(race => {
      totalRacers += race.racers.length;
    });
  }

  const needsSecondChanceSecondRound = totalLosers > 2;
  const raceNumbers = calculateRaceNumbers(
    firstRoundWinners?.races.length || 2,
    totalLosers,
    totalRacers
  );

  if (bracketType === 'winners') {
    if (currentRound === 1) {
      // Winners go to Race 3
      const nextRoundIndex = rounds.findIndex(
        (r: BracketRound) => r.roundNumber === 2 && r.bracketType === 'winners'
      );
      if (nextRoundIndex >= 0) {
        const targetRace = updatedRounds[nextRoundIndex].races.find(
          (r: BracketRace) => r.raceNumber === raceNumbers.winnersSecondRound
        );
        if (targetRace) {
          const newWinners = winners.filter(
            (winnerId: string) => !targetRace.racers.some((r: Racer) => r.id === winnerId)
          );
          targetRace.racers = [...targetRace.racers, ...getRacersByIds(racers, newWinners)];
        }
      }

      // Losers go to Race 4
      if (losers.length > 0) {
        const loserRoundIndex = rounds.findIndex(
          (r: BracketRound) => r.roundNumber === 1 && r.bracketType === 'losers'
        );
        if (loserRoundIndex >= 0) {
          const targetRace = updatedRounds[loserRoundIndex].races.find(
            (r: BracketRace) => r.raceNumber === raceNumbers.secondChanceFirstRound
          );
          if (targetRace) {
            const newLosers = losers.filter(
              (loserId: string) => !targetRace.racers.some((r: Racer) => r.id === loserId)
            );
            targetRace.racers = [...targetRace.racers, ...getRacersByIds(racers, newLosers)];
          }
        }
      }
    } else if (currentRound === 2) {
      // Winners from Race 3 go to Finals
      const finalsIndex = rounds.findIndex((r: BracketRound) => r.bracketType === 'final');
      if (finalsIndex >= 0) {
        const finalsRace = updatedRounds[finalsIndex].races[0];
        finalsRace.racers = [...finalsRace.racers, ...getRacersByIds(racers, winners)];
      }
    }
  } else if (bracketType === 'losers') {
    // Special case for 6-7 racers (3 losers) in first round of second chance
    const shouldAdvanceTwoWinners = totalLosers === 3 && currentRound === 1;
    const actualWinners = shouldAdvanceTwoWinners
      ? winners.length >= 2
        ? winners.slice(0, 2)
        : winners
      : winners.length > 1
        ? [winners[0]]
        : winners;

    if (currentRound === 1) {
      if (!needsSecondChanceSecondRound) {
        // If only 2 losers, winners go directly to finals
        const finalsIndex = rounds.findIndex((r: BracketRound) => r.bracketType === 'final');
        if (finalsIndex >= 0) {
          const finalsRace = updatedRounds[finalsIndex].races[0];
          const winnerRacers = getRacersByIds(racers, actualWinners);
          finalsRace.racers = [...finalsRace.racers, ...winnerRacers];
        }
      } else {
        // Winners from Race 4 go to Race 5
        const nextRoundIndex = rounds.findIndex(
          (r: BracketRound) => r.roundNumber === 2 && r.bracketType === 'losers'
        );
        if (nextRoundIndex >= 0) {
          const targetRace = updatedRounds[nextRoundIndex].races.find(
            (r: BracketRace) => r.raceNumber === raceNumbers.secondChanceSecondRound
          );
          if (targetRace) {
            targetRace.racers = [...targetRace.racers, ...getRacersByIds(racers, actualWinners)];
          }
        }
      }
    } else if (currentRound === 2) {
      // Winners from Race 5 go to Finals
      const finalsIndex = rounds.findIndex((r: BracketRound) => r.bracketType === 'final');
      if (finalsIndex >= 0) {
        const finalsRace = updatedRounds[finalsIndex].races[0];
        finalsRace.racers = [...finalsRace.racers, ...getRacersByIds(racers, winners)];
      }
    }
  }

  return updatedRounds;
};

// Add logging to updateRaceResults
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
                      // For finals, also update finalRankings when completing the race
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
      });
  },
});

export const { resetBrackets } = bracketSlice.actions;
export default bracketSlice.reducer;
