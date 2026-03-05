import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MealSlot, MealLog } from '../../types';

interface MealState {
  todaysMealSlots: MealSlot[];
  todaysLogs: MealLog[];
  loading: boolean;
}

const initialState: MealState = {
  todaysMealSlots: [],
  todaysLogs: [],
  loading: false,
};

const mealSlice = createSlice({
  name: 'meal',
  initialState,
  reducers: {
    setMealSlots: (state, action: PayloadAction<MealSlot[]>) => {
      state.todaysMealSlots = action.payload;
    },
    setMealLogs: (state, action: PayloadAction<MealLog[]>) => {
      state.todaysLogs = action.payload;
    },
    addMealLog: (state, action: PayloadAction<MealLog>) => {
      state.todaysLogs.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setMealSlots, setMealLogs, addMealLog, setLoading } = mealSlice.actions;
export default mealSlice.reducer;
