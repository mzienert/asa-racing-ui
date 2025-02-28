import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'

interface AuthState {
  isAuthenticated: boolean
  user: null | {
    id: string
    email: string
  }
  token: string | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
}

// Function to decode JWT without external libraries
const parseJwt = (token: string) => {
  try {
    // Split the token and get the payload part
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    // Replace characters that are URL-specific
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Create the decoded payload
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
  } catch (e) {
    console.error('Error checking token expiration:', e);
    return true;
  }
};

export const loadAuthFromStorage = createAsyncThunk(
  'auth/loadFromStorage',
  async (_, { rejectWithValue }) => {
    // Make sure we're in a browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      return rejectWithValue('Not in browser environment');
    }
    
    try {
      // Try to get token from different possible keys
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.log('Available localStorage keys:', Object.keys(localStorage));
        return rejectWithValue('No token found');
      }
      
      console.log('Token found, checking expiration...');
      
      if (isTokenExpired(token)) {
        console.log('Token is expired, removing from localStorage');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('jwt');
        return rejectWithValue('Token expired');
      }
      
      // Extract user info from token
      const userData = parseJwt(token);
      console.log('Decoded token data:', userData ? 'success' : 'failed');
      
      if (!userData) {
        return rejectWithValue('Invalid token');
      }
      
      return {
        user: {
          id: userData.sub || userData.id || userData.userId,
          email: userData.email || userData.username
        },
        token
      };
    } catch (error) {
      console.error('Error in loadAuthFromStorage:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('accessToken', action.payload)
      }
      
      // Also update user info from token
      const userData = parseJwt(action.payload)
      if (userData) {
        state.user = {
          id: userData.sub || userData.id || userData.userId,
          email: userData.email || userData.username
        }
        state.isAuthenticated = true
      }
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('jwt')
        localStorage.removeItem('refreshToken')
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAuthFromStorage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAuthFromStorage.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(loadAuthFromStorage.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.error.message || 'Authentication failed';
      });
  }
})

export const { setUser, setToken, logout } = authSlice.actions
export default authSlice.reducer