import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface SeedData {
  time: string | null;
  startingPosition: number | null;
}

export interface Racer {
  id: string;
  name: string;
  bibNumber: string;
  raceId: string;
  raceClass: string;
  seedData: SeedData;
}

interface RacersState {
  items: Racer[];
  loading: boolean;
  error: string | null;
}

const initialState: RacersState = {
  items: [],
  loading: false,
  error: null,
};

// Helper function to get racers from localStorage
const getRacersFromStorage = (): Racer[] => {
  try {
    const storedData = localStorage.getItem('racers');
    if (!storedData) return [];

    const parsedData = JSON.parse(storedData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (e) {
    return [];
  }
};

export const loadRacersFromStorage = createAsyncThunk('racers/loadFromStorage', async () => {
  return getRacersFromStorage();
});

export const persistRacer = createAsyncThunk(
  'racers/persistRacer',
  async (racer: Omit<Racer, 'id'>, { rejectWithValue, getState }) => {
    const state = getState() as RootState;

    if (!racer.raceId) {
      return rejectWithValue({ error: 'No race ID provided' });
    }

    // Check if a racer with this bib number already exists in this race
    const existingRacer = state.racers.items.find(
      r => r.bibNumber === racer.bibNumber && r.raceId === racer.raceId
    );

    if (existingRacer) {
      return rejectWithValue({ existingRacer });
    }

    const newRacer: Racer = {
      ...racer,
      id: crypto.randomUUID(),
      raceId: racer.raceId, // Ensure raceId is set
      raceClass: racer.raceClass, // Use raceClass directly
      seedData: {
        time: null,
        startingPosition: null
      }
    };

    // Get existing racers
    const racers = getRacersFromStorage();

    // Add the new racer
    racers.push(newRacer);

    // Store in localStorage
    localStorage.setItem('racers', JSON.stringify(racers));

    return newRacer;
  }
);

export const updatePersistedRacer = createAsyncThunk(
  'racers/updatePersistedRacer',
  async (racer: Racer, { getState }) => {
    const state = getState() as RootState;
    const currentRaceId = state.races.currentRaceId;

    if (!currentRaceId) {
      throw new Error('No active race found');
    }

    const racers = getRacersFromStorage();
    const updatedRacer = { ...racer };

    const racerIndex = racers.findIndex(r => r.id === racer.id);
    if (racerIndex !== -1) {
      racers[racerIndex] = updatedRacer;
      localStorage.setItem('racers', JSON.stringify(racers));
    }

    return updatedRacer;
  }
);

export const deletePersistedRacer = createAsyncThunk(
  'racers/deletePersistedRacer',
  async ({ id, raceClass }: { id: string; raceClass: string }) => {
    const racers = getRacersFromStorage();

    const filteredRacers = racers.filter(r => r.id !== id);
    localStorage.setItem('racers', JSON.stringify(filteredRacers));

    return { id, raceClass };
  }
);

const racersSlice = createSlice({
  name: 'racers',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadRacersFromStorage.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRacersFromStorage.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(loadRacersFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load racers';
      })
      .addCase(persistRacer.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updatePersistedRacer.fulfilled, (state, action) => {
        const index = state.items.findIndex(racer => racer.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deletePersistedRacer.fulfilled, (state, action) => {
        state.items = state.items.filter(racer => racer.id !== action.payload.id);
      });
  },
});

export default racersSlice.reducer;
