import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Racer {
  id: string;
  name: string;
  bibNumber: string;
  classId: string;
}

interface RacersState {
  items: Racer[];
  loading: boolean;
  error: string | null;
}

const initialState: RacersState = {
  items: [],
  loading: false,
  error: null
};

// Helper function to get racers from localStorage
const getRacersFromStorage = (): Racer[] => {
  try {
    const storedData = localStorage.getItem('racers');
    if (!storedData) return [];
    
    const parsedData = JSON.parse(storedData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (e) {
    console.error('Error parsing racers from localStorage:', e);
    return [];
  }
};

export const loadRacersFromStorage = createAsyncThunk(
  'racers/loadFromStorage',
  async () => {
    return getRacersFromStorage();
  }
);

export const persistRacer = createAsyncThunk(
  'racers/persistRacer',
  async (racer: Omit<Racer, 'id'>, { rejectWithValue, getState }) => {
    // Check if a racer with this bib number already exists
    const state = getState() as { racers: RacersState };
    const existingRacer = state.racers.items.find(r => r.bibNumber === racer.bibNumber);
    
    if (existingRacer) {
      return rejectWithValue({ existingRacer });
    }
    
    const newRacer = {
      ...racer,
      id: crypto.randomUUID()
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
  async (racer: Racer) => {
    const racers = getRacersFromStorage();
    
    const racerIndex = racers.findIndex(r => r.id === racer.id);
    if (racerIndex !== -1) {
      racers[racerIndex] = racer;
      localStorage.setItem('racers', JSON.stringify(racers));
    }
    
    return racer;
  }
);

export const deletePersistedRacer = createAsyncThunk(
  'racers/deletePersistedRacer',
  async ({ id, classId }: { id: string, classId: string }) => {
    const racers = getRacersFromStorage();
    
    const filteredRacers = racers.filter(r => r.id !== id);
    localStorage.setItem('racers', JSON.stringify(filteredRacers));
    
    return { id, classId };
  }
);

const racersSlice = createSlice({
  name: 'racers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadRacersFromStorage.pending, (state) => {
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
  }
});

export default racersSlice.reducer; 