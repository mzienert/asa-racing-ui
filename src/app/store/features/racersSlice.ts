import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface Racer {
  id: string;
  name: string;
  bibNumber: string;
  classId: string;
  position: number;
}

interface RacersState {
  racers: Record<string, Racer[]>;
  loading: boolean;
  error: string | null;
}

const initialState: RacersState = {
  racers: {},
  loading: false,
  error: null
};

export const loadRacersFromStorage = createAsyncThunk(
  'racers/loadFromStorage',
  async () => {
    const storedRacers = localStorage.getItem('racers');
    return storedRacers ? JSON.parse(storedRacers) : {};
  }
);

export const persistRacer = createAsyncThunk(
  'racers/persistRacer',
  async (racer: Omit<Racer, 'id' | 'position'>, { rejectWithValue }) => {
    const storedRacers = localStorage.getItem('racers');
    const racers = storedRacers ? JSON.parse(storedRacers) : {};
    
    // Check for duplicate bib number and get existing racer's name
    const allRacers = Object.values(racers).flat() as Racer[];
    const existingRacer = allRacers.find(r => r.bibNumber === racer.bibNumber);
    
    if (existingRacer) {
      return rejectWithValue({
        message: 'Duplicate bib number',
        existingRacer
      });
    }

    if (!racers[racer.classId]) {
      racers[racer.classId] = [];
    }

    const newRacer = {
      ...racer,
      id: crypto.randomUUID(),
      position: racers[racer.classId].length + 1
    };
    
    racers[racer.classId].push(newRacer);
    localStorage.setItem('racers', JSON.stringify(racers));
    return newRacer;
  }
);

export const updatePersistedRacer = createAsyncThunk(
  'racers/updatePersistedRacer',
  async (racer: Racer) => {
    const storedRacers = localStorage.getItem('racers');
    const racers = storedRacers ? JSON.parse(storedRacers) : {};
    
    const racerIndex = racers[racer.classId]?.findIndex((r: Racer) => r.id === racer.id);
    if (racerIndex !== undefined && racerIndex !== -1) {
      racers[racer.classId][racerIndex] = racer;
      localStorage.setItem('racers', JSON.stringify(racers));
    }
    
    return racer;
  }
);

export const deletePersistedRacer = createAsyncThunk(
  'racers/deletePersistedRacer',
  async ({ id, classId }: Pick<Racer, 'id' | 'classId'>) => {
    const storedRacers = localStorage.getItem('racers');
    const racers = storedRacers ? JSON.parse(storedRacers) : {};
    
    racers[classId] = racers[classId].filter((r: Racer) => r.id !== id);
    localStorage.setItem('racers', JSON.stringify(racers));
    
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
        state.racers = action.payload;
        state.loading = false;
      })
      .addCase(loadRacersFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load racers';
      })
      .addCase(persistRacer.fulfilled, (state, action) => {
        const { classId } = action.payload;
        if (!state.racers[classId]) {
          state.racers[classId] = [];
        }
        state.racers[classId].push(action.payload);
      })
      .addCase(updatePersistedRacer.fulfilled, (state, action) => {
        const { id, classId } = action.payload;
        const racerIndex = state.racers[classId]?.findIndex(racer => racer.id === id);
        if (racerIndex !== undefined && racerIndex !== -1) {
          state.racers[classId][racerIndex] = action.payload;
        }
      })
      .addCase(deletePersistedRacer.fulfilled, (state, action) => {
        const { id, classId } = action.payload;
        state.racers[classId] = state.racers[classId].filter(racer => racer.id !== id);
      });
  }
});

export default racersSlice.reducer; 