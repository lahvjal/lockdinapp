import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Workout, WorkoutLog, SetData } from '../../types';

interface WorkoutState {
  todaysWorkout: Workout | null;
  activeSession: {
    workoutId: string;
    startedAt: string;
    currentExerciseIndex: number;
    logs: Partial<WorkoutLog>[];
  } | null;
  restTimer: {
    active: boolean;
    secondsRemaining: number;
    exerciseId: string | null;
  };
  previousLogs: Record<string, WorkoutLog>;
  loading: boolean;
}

const initialState: WorkoutState = {
  todaysWorkout: null,
  activeSession: null,
  restTimer: {
    active: false,
    secondsRemaining: 0,
    exerciseId: null,
  },
  previousLogs: {},
  loading: false,
};

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    setTodaysWorkout: (state, action: PayloadAction<Workout | null>) => {
      state.todaysWorkout = action.payload;
    },
    startWorkoutSession: (state, action: PayloadAction<string>) => {
      state.activeSession = {
        workoutId: action.payload,
        startedAt: new Date().toISOString(),
        currentExerciseIndex: 0,
        logs: [],
      };
    },
    endWorkoutSession: (state) => {
      state.activeSession = null;
    },
    logExerciseSet: (state, action: PayloadAction<{ exerciseId: string; setData: SetData }>) => {
      if (state.activeSession) {
        const existingLogIndex = state.activeSession.logs.findIndex(
          log => log.exercise_id === action.payload.exerciseId
        );
        
        if (existingLogIndex >= 0) {
          const log = state.activeSession.logs[existingLogIndex];
          if (log.sets_data) {
            log.sets_data.push(action.payload.setData);
          }
        } else {
          state.activeSession.logs.push({
            exercise_id: action.payload.exerciseId,
            sets_data: [action.payload.setData],
          });
        }
      }
    },
    startRestTimer: (state, action: PayloadAction<{ seconds: number; exerciseId: string }>) => {
      state.restTimer = {
        active: true,
        secondsRemaining: action.payload.seconds,
        exerciseId: action.payload.exerciseId,
      };
    },
    updateRestTimer: (state, action: PayloadAction<number>) => {
      state.restTimer.secondsRemaining = action.payload;
      if (action.payload <= 0) {
        state.restTimer.active = false;
      }
    },
    stopRestTimer: (state) => {
      state.restTimer = {
        active: false,
        secondsRemaining: 0,
        exerciseId: null,
      };
    },
    setPreviousLog: (state, action: PayloadAction<{ exerciseId: string; log: WorkoutLog }>) => {
      state.previousLogs[action.payload.exerciseId] = action.payload.log;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setTodaysWorkout,
  startWorkoutSession,
  endWorkoutSession,
  logExerciseSet,
  startRestTimer,
  updateRestTimer,
  stopRestTimer,
  setPreviousLog,
  setLoading,
} = workoutSlice.actions;

export default workoutSlice.reducer;
