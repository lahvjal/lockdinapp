import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SleepLog } from '../../types';

interface SleepState {
  todaysLog: SleepLog | null;
  loading: boolean;
}

const initialState: SleepState = {
  todaysLog: null,
  loading: false,
};

const sleepSlice = createSlice({
  name: 'sleep',
  initialState,
  reducers: {
    setSleepLog: (state, action: PayloadAction<SleepLog | null>) => {
      state.todaysLog = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setSleepLog, setLoading } = sleepSlice.actions;
export default sleepSlice.reducer;
