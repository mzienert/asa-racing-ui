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
  const totalRounds = calculateTotalRounds(racers.length);
  const rounds: BracketRound[] = [];

  // Create first round
  const firstRoundRaces = groupIntoRaces(racers).map((race, idx) => ({
    ...race,
    bracketType: 'winners' as const,
    round: 1,
    nextWinnerRace: Math.floor(idx / 2) + 1, // Next winners race number
    nextLoserRace: idx + 1, // Initial losers race number
  }));

  rounds.push({
    roundNumber: 1,
    races: firstRoundRaces,
    raceId,
    raceClass,
    bracketType: 'winners',
  });

  // Pre-generate empty subsequent rounds
  for (let i = 2; i <= totalRounds; i++) {
    rounds.push({
      roundNumber: i,
      races: [],
      raceId,
      raceClass,
      bracketType: 'winners',
    });

    // Add corresponding losers bracket round
    rounds.push({
      roundNumber: i,
      races: [],
      raceId,
      raceClass,
      bracketType: 'losers',
    });
  }

  // Add final round (winners vs losers champion)
  rounds.push({
    roundNumber: totalRounds + 1,
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

  // Only check for finals creation after round 2
  if (currentRound >= 2) {
    // Get winners from both brackets' completed races in current round
    const currentRoundWinners = new Set<string>();

    // Get all completed races from current round in both brackets
    rounds.forEach(round => {
      if (
        (round.bracketType === 'winners' || round.bracketType === 'losers') &&
        round.roundNumber === currentRound
      ) {
        round.races.forEach(race => {
          if (race.status === 'completed' && race.winners) {
            race.winners.forEach(w => currentRoundWinners.add(w));
          }
        });
      }
    });

    console.log('Debug - Current Round Winners:', {
      count: currentRoundWinners.size,
      racers: Array.from(currentRoundWinners),
      currentRound,
      bracketType,
    });

    // If both brackets in current round are complete, create finals
    const currentRoundComplete = rounds
      .filter(
        r =>
          (r.bracketType === 'winners' || r.bracketType === 'losers') &&
          r.roundNumber === currentRound
      )
      .every(r => r.races.every(race => race.status === 'completed'));

    if (currentRoundComplete && currentRoundWinners.size <= 4 && bracketType !== 'final') {
      const finalsIndex = rounds.findIndex(r => r.bracketType === 'final');
      if (finalsIndex >= 0 && rounds[finalsIndex].races.length === 0) {
        const finalsRace = createNextRoundRace(rounds[finalsIndex].roundNumber, 1, 0, 'final');

        // Get all winners from current round
        const finalRacers = getRacersByIds(racers, Array.from(currentRoundWinners));
        finalsRace.racers = finalRacers;

        updatedRounds[finalsIndex].races = [finalsRace];

        console.log('Debug - Created Finals:', {
          racers: finalRacers.map(r => r.name),
          round: rounds[finalsIndex].roundNumber,
        });

        return updatedRounds;
      }
    }
  }

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
        // Add winners to existing race
        existingRace.racers = [...existingRace.racers, ...getRacersByIds(racers, winners)];
      } else {
        // Create new race with winners
        const newRace = createNextRoundRace(
          nextRoundNumber,
          nextRaceNumber,
          Math.floor((raceNumber - 1) / 2),
          'winners'
        );
        newRace.racers = getRacersByIds(racers, winners);
        updatedRounds[nextRoundIndex].races.push(newRace);
      }
    }

    // Only handle losers for Round 1
    if (currentRound === 1) {
      const loserRoundIndex = rounds.findIndex(
        r =>
          r.roundNumber === 2 &&
          r.bracketType === 'losers' &&
          r.raceId === raceId &&
          r.raceClass === raceClass
      );

      if (loserRoundIndex >= 0) {
        const loserRaceNumber = Math.ceil(raceNumber / 2);
        const existingRace = updatedRounds[loserRoundIndex].races.find(
          r => r.raceNumber === loserRaceNumber
        );

        if (existingRace) {
          existingRace.racers = [...existingRace.racers, ...getRacersByIds(racers, losers)];
        } else {
          const newRace = createNextRoundRace(2, loserRaceNumber, loserRaceNumber - 1, 'losers');
          newRace.racers = getRacersByIds(racers, losers);
          updatedRounds[loserRoundIndex].races.push(newRace);
        }
      }
    }
  } else if (bracketType === 'losers') {
    // Progress losers bracket winners to next losers round
    const nextRoundNumber = currentRound + 1;
    const nextRoundIndex = rounds.findIndex(
      r =>
        r.roundNumber === nextRoundNumber &&
        r.bracketType === 'losers' &&
        r.raceId === raceId &&
        r.raceClass === raceClass
    );

    if (nextRoundIndex >= 0) {
      const nextRaceNumber = Math.floor((raceNumber - 1) / 2) + 1;
      const existingRace = updatedRounds[nextRoundIndex].races.find(
        r => r.raceNumber === nextRaceNumber
      );

      if (existingRace) {
        existingRace.racers = [...existingRace.racers, ...getRacersByIds(racers, winners)];
      } else {
        const newRace = createNextRoundRace(
          nextRoundNumber,
          nextRaceNumber,
          Math.floor((raceNumber - 1) / 2),
          'losers'
        );
        newRace.racers = getRacersByIds(racers, winners);
        updatedRounds[nextRoundIndex].races.push(newRace);
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
      });
  },
});

// Update selector to use new state structure
export const selectBracketsByRaceAndClass = (state: RootState, raceId: string, raceClass: string) =>
  state[raceId]?.[raceClass] || [];

export const { resetBrackets } = bracketSlice.actions;
export default bracketSlice.reducer;
