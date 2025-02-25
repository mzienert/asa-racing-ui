import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Race {
  id: string;
  name: string;
  date: string;
  raceFormat: string;
  raceClasses: string[];
  completed: boolean;
}

// Async thunks
export const loadRacesFromStorage = createAsyncThunk(
  'races/loadFromStorage',
  async () => {
    const storedRaces = localStorage.getItem('races');
    return storedRaces ? JSON.parse(storedRaces) : [];
  }
);

export const persistRace = createAsyncThunk(
  'races/persistRace',
  async (race: Omit<Race, 'id'>) => {
    const newRace = {
      ...race,
      id: crypto.randomUUID()
    };
    
    // Get existing races
    const existingRaces = localStorage.getItem('races');
    const races = existingRaces ? JSON.parse(existingRaces) : [];
    
    // Add new race
    races.push(newRace);
    
    // Save to localStorage
    localStorage.setItem('races', JSON.stringify(races));
    
    return newRace;
  }
);

export const updatePersistedRace = createAsyncThunk(
  'races/updatePersistedRace',
  async (race: Race) => {
    const existingRaces = localStorage.getItem('races');
    let races = existingRaces ? JSON.parse(existingRaces) : [];
    
    races = races.map((r: Race) => 
      r.id === race.id ? race : r
    );
    
    localStorage.setItem('races', JSON.stringify(races));
    return race;
  }
);

const racesSlice = createSlice({
  name: 'races',
  initialState: [] as Race[],
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadRacesFromStorage.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(persistRace.fulfilled, (state, action) => {
        state.push(action.payload);
      })
      .addCase(updatePersistedRace.fulfilled, (state, action) => {
        const index = state.findIndex(race => race.id === action.payload.id);
        if (index !== -1) {
          state[index] = action.payload;
        }
      });
  }
});

export default racesSlice.reducer; 