import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export enum RaceStatus {
  Configuring = 'CONFIGURING',
  In_Progress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
}

export enum RaceClassStatus {
  Created = 'CREATED',
  Seeding = 'SEEDING',
  Racing = 'RACING',
  Completed = 'COMPLETED',
}

export interface RaceClass {
  raceClass: string;
  status: RaceClassStatus;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  raceClasses: RaceClass[];
  status: RaceStatus;
}

interface RacesState {
  items: Race[];
  currentRaceId: string | null;
  loading: boolean;
  error: string | null;
}

interface SeedData {
  time?: string;
  startingPosition?: number | null;
}

interface StoredRacer {
  id: string;
  raceId: string;
  name: string;
  bibNumber: string;
  classId: string;
  seedData?: SeedData;
}

const initialState: RacesState = {
  items: [],
  currentRaceId: null,
  loading: false,
  error: null,
};

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
  const newRace = {
    ...race,
    id: crypto.randomUUID(),
  };

  const existingRaces = getRacesFromStorage();
  const updatedRaces = [...existingRaces, newRace];

  localStorage.setItem('races', JSON.stringify(updatedRaces));

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

    const racers = JSON.parse(localStorage.getItem('racers') || '[]') as StoredRacer[];
    const remainingRacers = racers.filter(racer => racer.raceId !== id);

    localStorage.setItem('racers', JSON.stringify(remainingRacers));

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

export const updateRaceClass = createAsyncThunk(
  'races/updateRaceClass',
  async ({ raceId, raceClass, updates }: { raceId: string; raceClass: string; updates: Partial<RaceClass> }) => {
    const races = getRacesFromStorage();
    const raceIndex = races.findIndex(r => r.id === raceId);
    
    if (raceIndex !== -1) {
      const race = races[raceIndex];
      const raceClassIndex = race.raceClasses.findIndex(rc => rc.raceClass === raceClass);
      
      if (raceClassIndex !== -1) {
        race.raceClasses[raceClassIndex] = {
          ...race.raceClasses[raceClassIndex],
          ...updates
        };
        localStorage.setItem('races', JSON.stringify(races));
        return { raceId, raceClass, updates };
      }
    }
    throw new Error('Race or race class not found');
  }
);

export const updateRaceStatus = createAsyncThunk(
  'races/updateStatus',
  async ({ raceId, status }: { raceId: string; status: RaceStatus }) => {
    return { raceId, status };
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
        state.items = action.payload.races;
        state.currentRaceId = action.payload.currentRaceId;
        state.loading = false;
      })
      .addCase(loadRacesFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load races';
      })
      .addCase(persistRace.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updatePersistedRace.fulfilled, (state, action) => {
        const index = state.items.findIndex(race => race.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deletePersistedRace.fulfilled, (state, action) => {
        state.items = state.items.filter(race => race.id !== action.payload);
        if (state.currentRaceId === action.payload) {
          state.currentRaceId = null;
        }
      })
      .addCase(setCurrentRace.fulfilled, (state, action) => {
        state.currentRaceId = action.payload;
      })
      .addCase(updateRaceClass.fulfilled, (state, action) => {
        const { raceId, raceClass, updates } = action.payload;
        const race = state.items.find(r => r.id === raceId);
        if (race) {
          const raceClassItem = race.raceClasses.find(rc => rc.raceClass === raceClass);
          if (raceClassItem) {
            Object.assign(raceClassItem, updates);
          }
        }
      })
      .addCase(updateRaceStatus.fulfilled, (state, action) => {
        const race = state.items.find(r => r.id === action.payload.raceId);
        if (race) {
          race.status = action.payload.status;
          localStorage.setItem('races', JSON.stringify(state.items));
        }
      });
  },
});

export default racesSlice.reducer;
