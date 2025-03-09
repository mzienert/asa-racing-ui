import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Racer } from './racersSlice';
import { RootState } from '../../store';

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

interface BracketRound {
  roundNumber: number;
  races: BracketRace[];
  raceId: string;
  raceClass: string;
  bracketType: 'winners' | 'losers' | 'final';
  firstRoundLosers?: string[];
}

interface BracketState {
  [raceId: string]: Record<string, BracketRound[]>;  // raceId -> raceClass -> rounds
  loading?: boolean;
  error?: string | null;
}

const initialState: BracketState = {
  loading: false,
  error: null,
};

const getBracketsFromStorage = (): BracketState => {
  try {
    const stored = localStorage.getItem('brackets');
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Error parsing brackets from localStorage:', e);
    return {};
  }
};

export const loadBracketsFromStorage = createAsyncThunk('bracket/load', async () => {
  return getBracketsFromStorage();
});

// Helper function to generate tournament bracket seeding order
const generateBracketSeeds = (count: number): number[] => {
  // Find the next power of 2 that can accommodate all racers
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(count)));
  const seeds: number[] = [];

  // Generate the seeding pattern for a full bracket
  for (let i = 1; i <= nextPowerOf2 / 2; i++) {
    seeds.push(i);
    seeds.push(nextPowerOf2 + 1 - i);
  }

  // Return only the number of seeds we need
  return seeds.slice(0, count);
};

// Helper function to group racers into races (4 racers per race)
const groupIntoRaces = (racers: Racer[]): BracketRace[] => {
  const races: BracketRace[] = [];
  const seeds = generateBracketSeeds(racers.length);

  // Sort racers by their starting position
  const sortedRacers = [...racers].sort(
    (a, b) => (a.seedData?.startingPosition || 0) - (b.seedData?.startingPosition || 0)
  );

  // Group into races of 4
  for (let i = 0; i < seeds.length; i += 4) {
    const raceRacers = seeds
      .slice(i, i + 4)
      .map(seed => {
        const index = seed - 1;
        return index < sortedRacers.length ? sortedRacers[index] : null;
      })
      .filter((racer): racer is Racer => racer !== null);

    if (raceRacers.length > 0) {
      races.push({
        raceNumber: Math.floor(i / 4) + 1,
        racers: raceRacers,
        bracketType: 'winners',
        round: 1,
        status: 'pending',
        position: Math.floor(i / 4),
        raceId: '',
        raceClass: '',
      });
    }
  }

  return races;
};

// Calculate total number of rounds needed for N racers
const calculateTotalRounds = (racerCount: number): number => {
  return Math.ceil(Math.log(racerCount) / Math.log(4));
};

// Generate initial bracket structure including winners and losers brackets
const generateFullBracketStructure = (
  racers: Racer[],
  raceId: string,
  raceClass: string
): BracketRound[] => {
  const rounds: BracketRound[] = [];

  // Create first round of Winners bracket (Races 1-4)
  const firstRoundRaces = groupIntoRaces(racers).map((race, idx) => ({
    ...race,
    bracketType: 'winners' as const,
    round: 1,
    nextWinnerRace: Math.floor(idx / 2) + 1, // Next winners race number
    nextLoserRace: idx <= 1 ? 5 : 7, // Point to Race 5 or 7 in Second Chance
    raceId,
    raceClass,
  }));

  rounds.push({
    roundNumber: 1,
    races: firstRoundRaces,
    raceId,
    raceClass,
    bracketType: 'winners',
  });

  // Add Winners bracket Round 2
  rounds.push({
    roundNumber: 2,
    races: [],
    raceId,
    raceClass,
    bracketType: 'winners',
  });

  // Add Second Chance rounds
  // Round 1 (Races 5,7)
  rounds.push({
    roundNumber: 1,
    races: [],
    raceId,
    raceClass,
    bracketType: 'losers',
  });

  // Round 2 (Races 6,8)
  rounds.push({
    roundNumber: 2,
    races: [],
    raceId,
    raceClass,
    bracketType: 'losers',
  });

  // Add Finals (Race 10)
  rounds.push({
    roundNumber: 4,
    races: [],
    raceId,
    raceClass,
    bracketType: 'final',
  });

  return rounds;
};

export const createBracket = createAsyncThunk(
  'bracket/create',
  async ({ racers, raceId, raceClass }: { racers: Racer[]; raceId: string; raceClass: string }) => {
    const existingBrackets = getBracketsFromStorage();
    const bracketStructure = generateFullBracketStructure(racers, raceId, raceClass);
    
    const updatedBrackets = {
      ...existingBrackets,
      [raceId]: {
        ...(existingBrackets[raceId] || {}),
        [raceClass]: bracketStructure
      }
    };
    
    localStorage.setItem('brackets', JSON.stringify(updatedBrackets));
    return {
      raceId,
      raceClass,
      rounds: bracketStructure
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
  bracketType: 'winners' | 'losers' | 'final'
): BracketRace => ({
  raceNumber,
  racers: [],
  round: roundNumber,
  bracketType,
  status: 'pending',
  position,
  raceId: '',
  raceClass: '',
});

// Helper to populate next round races
const populateNextRoundRaces = (
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
  console.log('Populating next round:', {
    currentRound,
    raceNumber,
    bracketType,
    winners,
    losers
  });

  // Get current race to check for disqualified racers
  const currentRace = rounds
    .find(r => r.roundNumber === currentRound && r.bracketType === bracketType)
    ?.races.find(r => r.raceNumber === raceNumber);

  // Filter out disqualified racers from winners and losers
  const validWinners = winners.filter(
    id => !currentRace?.disqualifiedRacers?.includes(id)
  );
  const validLosers = losers.filter(
    id => !currentRace?.disqualifiedRacers?.includes(id)
  );

  if (bracketType === 'winners') {
    // Handle winners bracket progression
    const nextRoundNumber = currentRound + 1;
    const nextRoundIndex = rounds.findIndex(
      r =>
        r.roundNumber === nextRoundNumber &&
        r.bracketType === 'winners' &&
        r.raceId === raceId &&
        r.raceClass === raceClass
    );

    if (nextRoundIndex >= 0) {
      const nextRaceNumber = Math.floor((raceNumber - 1) / 2) + 1;
      const existingRace = rounds[nextRoundIndex].races.find(r => r.raceNumber === nextRaceNumber);

      if (existingRace) {
        // Check for duplicates before adding winners
        const newWinners = validWinners.filter(
          winnerId => !existingRace.racers.some(r => r.id === winnerId)
        );
        if (newWinners.length > 0) {
          existingRace.racers = [...existingRace.racers, ...getRacersByIds(racers, newWinners)];
        }
      } else {
        const newRace = createNextRoundRace(
          nextRoundNumber,
          nextRaceNumber,
          Math.floor((raceNumber - 1) / 2),
          'winners'
        );
        newRace.racers = getRacersByIds(racers, validWinners);
        updatedRounds[nextRoundIndex].races.push(newRace);
      }
    }

    // Handle losers going to Second Chance Round 1 (only from first round)
    if (currentRound === 1) {
      const loserRoundIndex = rounds.findIndex(
        r =>
          r.roundNumber === 1 &&
          r.bracketType === 'losers' &&
          r.raceId === raceId &&
          r.raceClass === raceClass
      );

      if (loserRoundIndex >= 0) {
        // Calculate Second Chance race number (5 or 7 based on winners race number)
        const secondChanceRaceNumber = raceNumber <= 2 ? 5 : 7;
        console.log('Creating Second Chance race:', secondChanceRaceNumber);

        // Find or create the race
        let targetRace = updatedRounds[loserRoundIndex].races.find(
          r => r.raceNumber === secondChanceRaceNumber
        );

        if (!targetRace) {
          targetRace = createNextRoundRace(1, secondChanceRaceNumber, secondChanceRaceNumber - 5, 'losers');
          targetRace.nextWinnerRace = secondChanceRaceNumber + 1; // Points to Race 6 or 8
          updatedRounds[loserRoundIndex].races.push(targetRace);
        }

        // Add losers to the race
        const newLosers = validLosers.filter(
          loserId => !targetRace.racers.some(r => r.id === loserId)
        );
        if (newLosers.length > 0) {
          targetRace.racers = [...targetRace.racers, ...getRacersByIds(racers, newLosers)];
        }
      }
    }

    // Check if Winners bracket Round 2 is complete and create finals if Second Chance is ready
    if (currentRound === 2) {
      const winnersChampions = validWinners; // This will be two winners from Round 2
      
      // Check if Second Chance Round 2 (Race 6) is complete
      const secondChanceRound2 = rounds.find(
        r => r.roundNumber === 2 && r.bracketType === 'losers'
      );
      const race6 = secondChanceRound2?.races.find(r => r.raceNumber === 6);
      const race6Complete = race6?.status === 'completed';
      const race6Winner = race6?.winners?.[0];

      if (race6Complete && race6Winner && winnersChampions.length === 2) {
        // Create finals (Race 10) with all three racers
        const finalsIndex = rounds.findIndex(r => r.bracketType === 'final');
        if (finalsIndex >= 0) {
          const finalsRace = createNextRoundRace(4, 10, 0, 'final');
          finalsRace.racers = [
            ...getRacersByIds(racers, winnersChampions), // Add both winners from Round 2
            ...getRacersByIds(racers, [race6Winner]) // Add the Second Chance winner
          ];
          updatedRounds[finalsIndex].races = [finalsRace];
        }
      }
    }
  } else if (bracketType === 'losers') {
    // Handle Second Chance progression
    const nextRoundNumber = currentRound + 1;
    
    // Get all completed races from current round
    const currentRoundRaces = rounds.find(
      r => r.roundNumber === currentRound && r.bracketType === 'losers'
    )?.races || [];
    
    const allCurrentRoundComplete = currentRoundRaces.every(r => r.status === 'completed');
    
    if (allCurrentRoundComplete && currentRound === 1) {
      const nextRoundIndex = rounds.findIndex(
        r => r.roundNumber === 2 && r.bracketType === 'losers'
      );
      
      if (nextRoundIndex >= 0) {
        // Create Race 6 and 8
        currentRoundRaces.forEach(race => {
          const nextRaceNumber = race.raceNumber === 5 ? 6 : 8;
          console.log('Creating Second Chance Round 2 race:', nextRaceNumber);
          
          // Check if race already exists
          const existingRace = updatedRounds[nextRoundIndex].races.find(
            r => r.raceNumber === nextRaceNumber
          );

          if (!existingRace) {
            const newRace = createNextRoundRace(2, nextRaceNumber, nextRaceNumber - 6, 'losers');
            newRace.racers = getRacersByIds(racers, race.winners || []);
            updatedRounds[nextRoundIndex].races.push(newRace);
          }
        });
      }
    }

    // Check if this is Race 6 completion and Winners bracket Round 2 is complete
    if (currentRound === 2 && raceNumber === 6) {
      const race6Winner = validWinners[0];
      
      // Check if Winners bracket Round 2 is complete
      const winnersRound2 = rounds.find(
        r => r.roundNumber === 2 && r.bracketType === 'winners'
      );
      const winnersRound2Complete = winnersRound2?.races.every(r => r.status === 'completed');
      const winnersChampions = winnersRound2?.races[0]?.winners;

      if (winnersRound2Complete && winnersChampions?.length === 2) {
        // Create finals (Race 10) with all three racers
        const finalsIndex = rounds.findIndex(r => r.bracketType === 'final');
        if (finalsIndex >= 0) {
          const finalsRace = createNextRoundRace(4, 10, 0, 'final');
          finalsRace.racers = [
            ...getRacersByIds(racers, winnersChampions), // Add both winners from Round 2
            ...getRacersByIds(racers, [race6Winner]) // Add the Second Chance winner
          ];
          updatedRounds[finalsIndex].races = [finalsRace];
        }
      }
    }
  }

  return updatedRounds;
};

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
      const { loading, error } = state;
      Object.keys(state).forEach(key => {
        if (key !== 'loading' && key !== 'error') {
          delete state[key];
        }
      });
      state.loading = loading;
      state.error = error;
      localStorage.removeItem('brackets');
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadBracketsFromStorage.fulfilled, (state, action) => {
        const { loading, error } = state;
        Object.assign(state, action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createBracket.fulfilled, (state, action) => {
        const { raceId, raceClass, rounds } = action.payload;
        if (!state[raceId]) {
          state[raceId] = {};
        }
        state[raceId][raceClass] = rounds;
        state.loading = false;
      })
      .addCase(updateRaceResults.fulfilled, (state, action) => {
        const { raceId, raceClass, raceNumber, round, bracketType, winners, losers, racers } =
          action.payload;

        if (!state[raceId]?.[raceClass]) return;

        // Update current race results
        let updatedRounds = state[raceId][raceClass].map(bracketRound => {
          if (
            bracketRound.roundNumber === round &&
            bracketRound.bracketType === bracketType
          ) {
            return {
              ...bracketRound,
              races: bracketRound.races.map(race =>
                race.raceNumber === raceNumber
                  ? { ...race, winners, losers, status: 'completed' as const }
                  : race
              ),
            };
          }
          return bracketRound;
        });

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

        state[raceId][raceClass] = updatedRounds;
        localStorage.setItem('brackets', JSON.stringify(state));
      })
      .addCase(updateFinalRankings.fulfilled, (state, action) => {
        const { raceId, raceClass, rankings } = action.payload;

        if (!state[raceId]?.[raceClass]) return;

        state[raceId][raceClass] = state[raceId][raceClass].map(round => {
          if (round.bracketType === 'final') {
            return {
              ...round,
              races: round.races.map(race => ({
                ...race,
                finalRankings: rankings,
                status: 'completed' as const,
                winners: [rankings.first, rankings.second],
                losers: [rankings.third, rankings.fourth],
              })),
            };
          }
          return round;
        });

        localStorage.setItem('brackets', JSON.stringify(state));
      })
      .addCase(disqualifyRacer.fulfilled, (state, action) => {
        const { raceId, raceClass, raceNumber, round, bracketType, racerId } = action.payload;

        if (!state[raceId]?.[raceClass]) return;

        // Find and update the race
        state[raceId][raceClass] = state[raceId][raceClass].map(bracketRound => {
          if (bracketRound.roundNumber === round && bracketRound.bracketType === bracketType) {
            return {
              ...bracketRound,
              races: bracketRound.races.map(race => {
                if (race.raceNumber === raceNumber) {
                  // Add racer to disqualified list
                  const disqualifiedRacers = [...(race.disqualifiedRacers || []), racerId];
                  
                  // Remove from winners/losers if present
                  const winners = race.winners?.filter(id => id !== racerId) || [];
                  const losers = race.losers?.filter(id => id !== racerId) || [];
                  
                  // If this is the final race, update rankings
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
                      finalRankings: rankings
                    };
                  }
                  
                  return {
                    ...race,
                    disqualifiedRacers,
                    winners,
                    losers
                  };
                }
                return race;
              }),
            };
          }
          return bracketRound;
        });

        localStorage.setItem('brackets', JSON.stringify(state));
      });
  },
});

// Update selector to use new state structure
export const selectBracketsByRaceAndClass = (state: RootState, raceId: string, raceClass: string) =>
  state[raceId]?.[raceClass] || [];

export const { resetBrackets } = bracketSlice.actions;
export default bracketSlice.reducer;
