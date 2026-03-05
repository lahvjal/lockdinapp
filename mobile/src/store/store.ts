import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workoutReducer from './slices/workoutSlice';
import mealReducer from './slices/mealSlice';
import waterReducer from './slices/waterSlice';
import sleepReducer from './slices/sleepSlice';
import streakReducer from './slices/streakSlice';
import planReducer from './slices/planSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workout: workoutReducer,
    meal: mealReducer,
    water: waterReducer,
    sleep: sleepReducer,
    streak: streakReducer,
    plan: planReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setSession'],
        ignoredPaths: ['auth.session'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
