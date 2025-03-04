import { AppDispatch } from './store';
import { loadAuthFromStorage } from './features/authSlice';
import { loadRacersFromStorage } from './features/racersSlice';
import { loadRacesFromStorage } from './features/racesSlice';

/**
 * Initializes the Redux store with data from localStorage
 * This should be called when the application starts
 */
export const initializeStore = async (dispatch: AppDispatch) => {
  // Load authentication state first
  try {
    // Check if we have a token in localStorage before dispatching
    const token = localStorage.getItem('accessToken');

    if (token) {
      await dispatch(loadAuthFromStorage()).unwrap();
    }
  } catch (error) {
    // Handle token expiration
    if (error instanceof Error && error.message.includes('Token expired')) {
      localStorage.removeItem('accessToken'); // Clean up expired token
      window.location.href = '/login?reason=expired';
      return; // Exit early to prevent loading other data with expired token
    }
    console.error('Authentication loading failed:', error);
  }

  // Only load races and racers data if authentication didn't fail with token expiration
  dispatch(loadRacesFromStorage());
  dispatch(loadRacersFromStorage());
};
