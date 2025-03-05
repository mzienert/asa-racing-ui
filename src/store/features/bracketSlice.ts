import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Racer } from './racersSlice';

interface BracketRace {
  raceNumber: number;
  racers: Racer[];
}

interface BracketRound {
  roundNumber: number;
  races: BracketRace[];
  raceId: string;
  raceClass: string;
}

interface BracketState {
  rounds: BracketRound[];
  loading: boolean;
  error: string | null;
}

const initialState: BracketState = {
  rounds: [],
  loading: false,
  error: null,
};

const getBracketsFromStorage = (): BracketRound[] => {
  try {
    const stored = localStorage.getItem('brackets');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error parsing brackets from localStorage:', e);
    return [];
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
}

// Helper function to group racers into races (4 racers per race)
const groupIntoRaces = (racers: Racer[]): BracketRace[] => {
  const races: BracketRace[] = [];
  const seeds = generateBracketSeeds(racers.length);
  
  // Sort racers by their starting position
  const sortedRacers = [...racers].sort((a, b) => 
    (a.seedData?.startingPosition || 0) - (b.seedData?.startingPosition || 0)
  );

  // Group into races of 4
  for (let i = 0; i < seeds.length; i += 4) {
    const raceRacers = seeds.slice(i, i + 4).map(seed => {
      const index = seed - 1;
      return index < sortedRacers.length ? sortedRacers[index] : null;
    }).filter((racer): racer is Racer => racer !== null);

    if (raceRacers.length > 0) {
      races.push({
        raceNumber: Math.floor(i / 4) + 1,
        racers: raceRacers
      });
    }
  }

  return races;
};

export const createBracket = createAsyncThunk(
  'bracket/create',
  async ({ racers, raceId, raceClass }: { racers: Racer[], raceId: string, raceClass: string }) => {
    const firstRound: BracketRound = {
      roundNumber: 1,
      races: groupIntoRaces(racers),
      raceId,
      raceClass
    };

    const existingBrackets = getBracketsFromStorage();
    const updatedBrackets = [...existingBrackets.filter(b => 
      b.raceId !== raceId || b.raceClass !== raceClass
    ), firstRound];
    
    localStorage.setItem('brackets', JSON.stringify(updatedBrackets));
    return firstRound;
  }
);

const bracketSlice = createSlice({
  name: 'bracket',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadBracketsFromStorage.fulfilled, (state, action) => {
        state.rounds = action.payload;
        state.loading = false;
      })
      .addCase(createBracket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBracket.fulfilled, (state, action) => {
        state.rounds = [...state.rounds.filter(r => 
          r.raceId !== action.payload.raceId || r.raceClass !== action.payload.raceClass
        ), action.payload];
        state.loading = false;
      })
      .addCase(createBracket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create bracket';
      });
  },
});

export default bracketSlice.reducer;
