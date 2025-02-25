import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface Racer {
  id: string;
  name: string;
  bibNumber: string;
  classId: string;
}

interface RacersState {
  racers: Record<string, Racer[]>;
}

const initialState: RacersState = {
  racers: {}
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
  async (racer: Omit<Racer, 'id'>) => {
    const newRacer = {
      ...racer,
      id: crypto.randomUUID()
    };
    
    const storedRacers = localStorage.getItem('racers');
    const racers = storedRacers ? JSON.parse(storedRacers) : {};
    
    if (!racers[newRacer.classId]) {
      racers[newRacer.classId] = [];
    }
    racers[newRacer.classId].push(newRacer);
    
    localStorage.setItem('racers', JSON.stringify(racers));
    return newRacer;
  }
);

export const updatePersistedRacer = createAsyncThunk(
  'racers/updatePersistedRacer',
  async (racer: Racer) => {
    const storedRacers = localStorage.getItem('racers');
    let racers = storedRacers ? JSON.parse(storedRacers) : {};
    
    const racerIndex = racers[racer.classId]?.findIndex((r: Racer) => r.id === racer.id);
    if (racerIndex !== undefined && racerIndex !== -1) {
      racers[racer.classId][racerIndex] = racer;
      localStorage.setItem('racers', JSON.stringify(racers));
    }
    
    return racer;
  }
);

const racersSlice = createSlice({
  name: 'racers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadRacersFromStorage.fulfilled, (state, action) => {
        state.racers = action.payload;
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
      });
  }
});

export default racersSlice.reducer; 