import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    isAuthenticated: boolean;
    user: {
        id: string;
        email: string;
    } | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    user: null
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<{ id: string; email: string } | null>) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        },
        clearAuth: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        }
    }
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer; 