'use client';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { initializeStore } from '../store/initializeStore';
import { AppDispatch } from '../store/store';

/**
 * Component that initializes the Redux store with data from localStorage
 * This should be rendered near the root of your application
 */
const StoreInitializer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only run once and only on the client side
    if (!initialized && typeof window !== 'undefined') {
      initializeStore(dispatch)
        .then(() => {
          setInitialized(true);
        })
        .catch(error => {
          console.error('Store initialization failed:', error);
          setInitialized(true);
        });
    }
  }, [dispatch, initialized]);

  // This component doesn't render anything
  return null;
};

export default StoreInitializer;
