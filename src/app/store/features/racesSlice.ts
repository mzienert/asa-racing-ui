import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface Race {
  id: string;
  name: string;
  date: string;
  raceFormat?: string;
  raceClasses: string[];
  completed?: boolean;
}

// Change the state structure to be flat - races is now the array directly
interface RacesState {
  items: Race[]; // Changed from 'races' to 'items' to avoid confusion
  currentRaceId: string | null; // Changed from currentRace object to currentRaceId string
  loading: boolean;
  error: string | null;
}

const initialState: RacesState = {
  items: [], // Changed from 'races' to 'items'
  currentRaceId: null, // Changed from currentRace object to currentRaceId string
  loading: false,
  error: null,
};

// Simple function to get races from localStorage as an array
const getRacesFromStorage = (): Race[] => {
  try {
    const storedData = localStorage.getItem('races');
    if (!storedData) return [];

    const parsedData = JSON.parse(storedData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (e) {
    console.error('Error parsing races from localStorage:', e);
    return [];
  }
};

export const loadRacesFromStorage = createAsyncThunk('races/loadFromStorage', async () => {
  const races = getRacesFromStorage();

  const currentRaceId = localStorage.getItem('currentRaceId');

  return { races, currentRaceId };
});

export const persistRace = createAsyncThunk('races/persistRace', async (race: Omit<Race, 'id'>) => {
  // Create the new race with an ID
  const newRace = {
    ...race,
    id: crypto.randomUUID(),
  };

  // Get existing races as a simple array
  const races = getRacesFromStorage();

  // Add the new race
  races.push(newRace);

  // Store as a simple array
  localStorage.setItem('races', JSON.stringify(races));

  return newRace;
});

export const updatePersistedRace = createAsyncThunk(
  'races/updatePersistedRace',
  async (race: Race) => {
    const races = getRacesFromStorage();

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
    const races = getRacesFromStorage();

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
  extraReducers: builder => {
    builder
      .addCase(loadRacesFromStorage.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRacesFromStorage.fulfilled, (state, action) => {
        state.items = action.payload.races; // Changed from 'races' to 'items'
        state.currentRaceId = action.payload.currentRaceId;
        state.loading = false;
      })
      .addCase(loadRacesFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load races';
      })
      .addCase(persistRace.fulfilled, (state, action) => {
        state.items.push(action.payload); // Changed from 'races' to 'items'
      })
      .addCase(updatePersistedRace.fulfilled, (state, action) => {
        const index = state.items.findIndex(race => race.id === action.payload.id); // Changed from 'races' to 'items'
        if (index !== -1) {
          state.items[index] = action.payload; // Changed from 'races' to 'items'
        }
      })
      .addCase(deletePersistedRace.fulfilled, (state, action) => {
        state.items = state.items.filter(race => race.id !== action.payload); // Changed from 'races' to 'items'
        if (state.currentRaceId === action.payload) {
          state.currentRaceId = null;
        }
      })
      .addCase(setCurrentRace.fulfilled, (state, action) => {
        state.currentRaceId = action.payload;
      });
  },
});

export default racesSlice.reducer;
