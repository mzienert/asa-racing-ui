import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/authSlice'
import racesReducer from './features/racesSlice'
import racersReducer from './features/racersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    races: racesReducer,
    racers: racersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Add any action types to ignore if needed
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch