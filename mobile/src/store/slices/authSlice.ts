import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isBootstrapping: boolean;
  isOnboarded: boolean;
}

const initialState: AuthState = {
  session: null,
  user: null,
  loading: true,
  isBootstrapping: false,
  isOnboarded: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
      state.user = action.payload?.user || null;
      state.loading = false;
    },
    setBootstrapping: (state, action: PayloadAction<boolean>) => {
      state.isBootstrapping = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setOnboarded: (state, action: PayloadAction<boolean>) => {
      state.isOnboarded = action.payload;
    },
    signOut: (state) => {
      state.session = null;
      state.user = null;
      state.isOnboarded = false;
    },
  },
});

export const { setSession, setBootstrapping, setLoading, setOnboarded, signOut } = authSlice.actions;
export default authSlice.reducer;
