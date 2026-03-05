import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WaterLog } from '../../types';

interface WaterState {
  dailyTarget: number;
  todaysLogs: WaterLog[];
  totalToday: number;
  loading: boolean;
}

const initialState: WaterState = {
  dailyTarget: 2000,
  todaysLogs: [],
  totalToday: 0,
  loading: false,
};

const waterSlice = createSlice({
  name: 'water',
  initialState,
  reducers: {
    setDailyTarget: (state, action: PayloadAction<number>) => {
      state.dailyTarget = action.payload;
    },
    setWaterLogs: (state, action: PayloadAction<WaterLog[]>) => {
      state.todaysLogs = action.payload;
      state.totalToday = action.payload.reduce((sum, log) => sum + log.amount_ml, 0);
    },
    addWaterLog: (state, action: PayloadAction<WaterLog>) => {
      state.todaysLogs.push(action.payload);
      state.totalToday += action.payload.amount_ml;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setDailyTarget, setWaterLogs, addWaterLog, setLoading } = waterSlice.actions;
export default waterSlice.reducer;
