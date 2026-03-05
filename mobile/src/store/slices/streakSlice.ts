import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Streak } from '../../types';

interface StreakState {
  streaks: {
    workout: Streak | null;
    meal: Streak | null;
    water: Streak | null;
    sleep: Streak | null;
    overall: Streak | null;
  };
  completionPercentage: number;
  loading: boolean;
}

const initialState: StreakState = {
  streaks: {
    workout: null,
    meal: null,
    water: null,
    sleep: null,
    overall: null,
  },
  completionPercentage: 0,
  loading: false,
};

const streakSlice = createSlice({
  name: 'streak',
  initialState,
  reducers: {
    setStreaks: (state, action: PayloadAction<Partial<StreakState['streaks']>>) => {
      state.streaks = { ...state.streaks, ...action.payload };
    },
    setCompletionPercentage: (state, action: PayloadAction<number>) => {
      state.completionPercentage = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setStreaks, setCompletionPercentage, setLoading } = streakSlice.actions;
export default streakSlice.reducer;
