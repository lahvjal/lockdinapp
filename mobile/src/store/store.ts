import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import workoutReducer from './slices/workoutSlice';
import mealReducer from './slices/mealSlice';
import waterReducer from './slices/waterSlice';
import sleepReducer from './slices/sleepSlice';
import streakReducer from './slices/streakSlice';
import planReducer from './slices/planSlice';
import workoutSessionReducer from './slices/workoutSessionSlice';

export const WORKOUT_SESSION_STORAGE_KEY = '@tino/workoutSession';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workout: workoutReducer,
    meal: mealReducer,
    water: waterReducer,
    sleep: sleepReducer,
    streak: streakReducer,
    plan: planReducer,
    workoutSession: workoutSessionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setSession'],
        ignoredPaths: ['auth.session'],
      },
    }),
});

// ── Persist workout session to AsyncStorage after every relevant change ───────
// We only persist when status is 'active' — idle/setup/complete don't need it.
let lastPersistedStatus: string | null = null;
store.subscribe(() => {
  const session = store.getState().workoutSession;
  if (session.status === 'active') {
    // Debounce slightly — write at most every 2 seconds to avoid thrashing
    AsyncStorage.setItem(WORKOUT_SESSION_STORAGE_KEY, JSON.stringify(session)).catch(() => {});
    lastPersistedStatus = 'active';
  } else if (lastPersistedStatus === 'active') {
    // Session ended normally — remove the persisted snapshot
    AsyncStorage.removeItem(WORKOUT_SESSION_STORAGE_KEY).catch(() => {});
    lastPersistedStatus = null;
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
