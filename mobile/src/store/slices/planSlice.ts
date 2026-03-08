import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Plan } from '../../types';

interface PlanState {
  activePlans: {
    workout?: Plan;
    meal?: Plan;
    water?: Plan;
    sleep?: Plan;
  };
  scheduledPlans: Plan[];
  loading: boolean;
}

const initialState: PlanState = {
  activePlans: {},
  scheduledPlans: [],
  loading: false,
};

const planSlice = createSlice({
  name: 'plan',
  initialState,
  reducers: {
    setActivePlans: (state, action: PayloadAction<{ workout?: Plan; meal?: Plan; water?: Plan; sleep?: Plan }>) => {
      state.activePlans = action.payload;
    },
    setActivePlan: (state, action: PayloadAction<{ type: 'workout' | 'meal' | 'water' | 'sleep'; plan: Plan }>) => {
      state.activePlans[action.payload.type] = action.payload.plan;
    },
    removePlan: (state, action: PayloadAction<'workout' | 'meal' | 'water' | 'sleep'>) => {
      delete state.activePlans[action.payload];
    },
    setScheduledPlans: (state, action: PayloadAction<Plan[]>) => {
      state.scheduledPlans = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setActivePlans, setActivePlan, removePlan, setScheduledPlans, setLoading } = planSlice.actions;
export default planSlice.reducer;
