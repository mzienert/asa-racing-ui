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
    
    console.log('Token found in localStorage:', !!token);
    console.log('Available localStorage keys:', Object.keys(localStorage));
    
    if (token) {
      await dispatch(loadAuthFromStorage()).unwrap();
      console.log('Authentication loaded successfully from storage');
    } else {
      console.log('No token found in localStorage');
    }
  } catch (error) {
    console.error('Authentication loading failed:', error);
  }

  // Load races and racers data
  dispatch(loadRacesFromStorage());
  dispatch(loadRacersFromStorage());
}; 