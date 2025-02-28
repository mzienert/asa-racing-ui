import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface Race {
  id: string;
  name: string;
  date: string;
  location: string;
  classes: string[];
  status: 'upcoming' | 'in-progress' | 'completed';
}

interface RacesState {
  races: Race[];
  currentRace: Race | null;
  loading: boolean;
  error: string | null;
}

const initialState: RacesState = {
  races: [],
  currentRace: null,
  loading: false,
  error: null
};

export const loadRacesFromStorage = createAsyncThunk(
  'races/loadFromStorage',
  async () => {
    const storedRaces = localStorage.getItem('races');
    const currentRaceId = localStorage.getItem('currentRaceId');
    
    const races = storedRaces ? JSON.parse(storedRaces) : [];
    const currentRace = currentRaceId && races.length > 0 
      ? races.find((race: Race) => race.id === currentRaceId) || null
      : null;
    
    return { races, currentRace };
  }
);

export const persistRace = createAsyncThunk(
  'races/persistRace',
  async (race: Omit<Race, 'id'>) => {
    const storedRaces = localStorage.getItem('races');
    const races = storedRaces ? JSON.parse(storedRaces) : [];
    
    const newRace = {
      ...race,
      id: crypto.randomUUID()
    };
    
    races.push(newRace);
    localStorage.setItem('races', JSON.stringify(races));
    return newRace;
  }
);

export const updatePersistedRace = createAsyncThunk(
  'races/updatePersistedRace',
  async (race: Race) => {
    const storedRaces = localStorage.getItem('races');
    const races = storedRaces ? JSON.parse(storedRaces) : [];
    
    const raceIndex = races.findIndex((r: Race) => r.id === race.id);
    if (raceIndex !== -1) {
      races[raceIndex] = race;
      localStorage.setItem('races', JSON.stringify(races));
    }
    
    return race;
  }
);

export const deletePersistedRace = createAsyncThunk(
  'races/deletePersistedRace',
  async (id: string) => {
    const storedRaces = localStorage.getItem('races');
    const races = storedRaces ? JSON.parse(storedRaces) : [];
    
    const filteredRaces = races.filter((r: Race) => r.id !== id);
    localStorage.setItem('races', JSON.stringify(filteredRaces));
    
    return id;
  }
);

export const setCurrentRace = createAsyncThunk(
  'races/setCurrentRace',
  async (id: string | null) => {
    if (id) {
      localStorage.setItem('currentRaceId', id);
    } else {
      localStorage.removeItem('currentRaceId');
    }
    return id;
  }
);

const racesSlice = createSlice({
  name: 'races',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadRacesFromStorage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRacesFromStorage.fulfilled, (state, action) => {
        state.races = action.payload.races;
        state.currentRace = action.payload.currentRace;
        state.loading = false;
      })
      .addCase(loadRacesFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load races';
      })
      .addCase(persistRace.fulfilled, (state, action) => {
        state.races.push(action.payload);
      })
      .addCase(updatePersistedRace.fulfilled, (state, action) => {
        const index = state.races.findIndex(race => race.id === action.payload.id);
        if (index !== -1) {
          state.races[index] = action.payload;
        }
        if (state.currentRace?.id === action.payload.id) {
          state.currentRace = action.payload;
        }
      })
      .addCase(deletePersistedRace.fulfilled, (state, action) => {
        state.races = state.races.filter(race => race.id !== action.payload);
        if (state.currentRace?.id === action.payload) {
          state.currentRace = null;
        }
      })
      .addCase(setCurrentRace.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentRace = state.races.find(race => race.id === action.payload) || null;
        } else {
          state.currentRace = null;
        }
      });
  }
});

export default racesSlice.reducer; 