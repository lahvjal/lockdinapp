import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WeightUnit = 'lb' | 'kg';
export type RestMode   = 'strict' | 'flexible';
export type SetStatus  = 'pending' | 'active' | 'resting' | 'done';
export type SessionStatus = 'idle' | 'setup' | 'active' | 'complete';

export type MetricType = 'reps' | 'duration' | 'distance';

export interface SetLog {
  setNumber: number;
  targetReps: number;
  targetDurationSeconds: number; // 0 when metric is reps
  weightValue: number;
  weightUnit: WeightUnit;
  repsCompleted: number | null;
  durationCompleted: number | null; // seconds elapsed for timed sets
  restSecondsTaken: number | null;
  isPR: boolean;
  status: SetStatus;
  startedAt: number | null;      // ms timestamp
  completedAt: number | null;    // ms timestamp
  restStartedAt: number | null;  // ms timestamp
}

export interface ExerciseSession {
  exerciseId: string;
  name: string;
  muscle: string;
  targetSets: number;
  targetReps: number;
  targetDurationSeconds: number; // 0 when metric is reps
  metricType: MetricType;
  targetRestSeconds: number;
  sets: SetLog[];
  isAddedOnFly: boolean;
  isComplete: boolean;
  logId: string | null;          // workout_logs row id once created
  previousBestLb: number | null; // previous max weight for this exercise
}

export interface PRRecord {
  exerciseName: string;
  weightValue: number;
  weightUnit: WeightUnit;
  reps: number;
}

export interface WorkoutSessionState {
  status: SessionStatus;
  sessionId: string | null;
  workoutId: string | null;
  planId: string | null;
  workoutName: string;
  startedAt: number | null;     // ms timestamp
  endedAt: number | null;       // ms timestamp

  exercises: ExerciseSession[];
  activeExerciseIdx: number;    // which exercise is currently focused
  activeSetIdx: number;         // which set within that exercise

  restMode: RestMode;
  weightUnit: WeightUnit;
  barWeightLb: number;          // barbell weight (default 45lb)

  // Rest timer state (drives the UI timer component)
  isResting: boolean;
  restStartedAt: number | null;
  restTargetSeconds: number;

  // Summary
  prsAchieved: PRRecord[];

  // True when this session was restored after a crash — UI shows "Continue"
  isResuming: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSet(setNumber: number, targetReps: number, targetDurationSeconds = 0): SetLog {
  return {
    setNumber,
    targetReps,
    targetDurationSeconds,
    weightValue: 0,
    weightUnit: 'lb',
    repsCompleted: null,
    durationCompleted: null,
    restSecondsTaken: null,
    isPR: false,
    status: 'pending',
    startedAt: null,
    completedAt: null,
    restStartedAt: null,
  };
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: WorkoutSessionState = {
  status: 'idle',
  sessionId: null,
  workoutId: null,
  planId: null,
  workoutName: '',
  startedAt: null,
  endedAt: null,

  exercises: [],
  activeExerciseIdx: 0,
  activeSetIdx: 0,

  restMode: 'flexible',
  weightUnit: 'lb',
  barWeightLb: 45,

  isResting: false,
  restStartedAt: null,
  restTargetSeconds: 90,

  prsAchieved: [],
  isResuming: false,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const workoutSessionSlice = createSlice({
  name: 'workoutSession',
  initialState,
  reducers: {

    // ── Session lifecycle ────────────────────────────────────────────────────

    openSetup(state, action: PayloadAction<{
      workoutId: string;
      planId: string;
      workoutName: string;
      exercises: Array<{
        exerciseId: string; name: string; muscle: string;
        targetSets: number; targetReps: number; targetRestSeconds: number;
        metricType?: MetricType; targetDurationSeconds?: number;
      }>;
      weightUnit: WeightUnit;
      barWeightLb: number;
      /**
       * Index of the first exercise that is NOT fully complete.
       * Exercises before this index are fully done and shown as greyed-out.
       */
      startFromExerciseIdx?: number;
      /**
       * Log data keyed by exerciseId — includes partial logs too.
       * Used to hydrate sets with real weight/reps when continuing.
       */
      completedExerciseLogs?: Record<string, { logId: string; setsData: Array<{
        set_number: number;
        weight_value: number;
        weight_unit: string;
        reps_completed: number | null;
        duration_completed: number | null;
        rest_seconds_taken: number | null;
        is_pr: boolean;
      }> }>;
    }>) {
      const { exercises, weightUnit, barWeightLb, startFromExerciseIdx = 0, completedExerciseLogs = {}, ...rest } = action.payload;
      state.status = 'setup';
      state.workoutId = rest.workoutId;
      state.planId = rest.planId;
      state.workoutName = rest.workoutName;
      state.weightUnit = weightUnit;
      state.barWeightLb = barWeightLb;

      let resolvedActiveExIdx = startFromExerciseIdx;
      let resolvedActiveSetIdx = 0;

      state.exercises = exercises.map((ex, idx) => {
        const log = completedExerciseLogs[ex.exerciseId];
        // Sort by set_number so index-based lookup is always correct regardless
        // of the order sets were logged (e.g. going back to complete a missed set).
        const sortedSetsData = log?.setsData
          ? [...log.setsData].sort((a, b) => a.set_number - b.set_number)
          : [];
        const loggedSetCount = sortedSetsData.length;
        const fullyDone = idx < startFromExerciseIdx; // all sets logged
        const partiallyDone = !fullyDone && loggedSetCount > 0 && loggedSetCount < ex.targetSets;

        const mt = ex.metricType ?? 'reps';
        const durSec = ex.targetDurationSeconds ?? 0;

        const sets = Array.from({ length: ex.targetSets }, (_, i) => {
          const setData = sortedSetsData[i];

          if (fullyDone || (partiallyDone && setData)) {
            // This set was already logged — hydrate with real data
            return {
              setNumber: i + 1,
              targetReps: ex.targetReps,
              targetDurationSeconds: durSec,
              weightValue: setData?.weight_value ?? 0,
              weightUnit: (setData?.weight_unit ?? weightUnit) as WeightUnit,
              repsCompleted: setData?.reps_completed ?? null,
              durationCompleted: setData?.duration_completed ?? null,
              restSecondsTaken: setData?.rest_seconds_taken ?? null,
              isPR: setData?.is_pr ?? false,
              status: 'done' as SetStatus,
              startedAt: null,
              completedAt: null,
              restStartedAt: null,
            };
          }

          // Pending set — not yet logged
          return { ...makeSet(i + 1, ex.targetReps, durSec) };
        });

        // For the partially-done exercise, the active set is the first pending one
        if (partiallyDone) {
          resolvedActiveExIdx = idx;
          resolvedActiveSetIdx = loggedSetCount; // first unlogged set index
        }

        return {
          ...ex,
          metricType: mt,
          targetDurationSeconds: durSec,
          sets,
          isAddedOnFly: false,
          logId: log?.logId ?? null,
          previousBestLb: null,
          isComplete: fullyDone,
        };
      });

      state.activeExerciseIdx = resolvedActiveExIdx;
      state.activeSetIdx = resolvedActiveSetIdx;
      state.prsAchieved = [];
      state.isResting = false;
      state.isResuming = startFromExerciseIdx > 0 || Object.keys(completedExerciseLogs).length > 0;
    },

    startSession(state, action: PayloadAction<{
      sessionId: string;
      restMode: RestMode;
    }>) {
      state.status = 'active';
      state.sessionId = action.payload.sessionId;
      state.restMode = action.payload.restMode;
      state.isResuming = false;
      if (!state.startedAt) {
        state.startedAt = Date.now();
        // Activate the correct set based on where openSetup left off.
        // For a fresh workout:  activeExerciseIdx=0, activeSetIdx=0 (both pending).
        // For a continued workout: these point to the first un-logged set, which
        // is still 'pending' — DO NOT fall back to [0][0] which may already be 'done'.
        const ex = state.exercises[state.activeExerciseIdx];
        const s = ex?.sets[state.activeSetIdx];
        if (s && s.status === 'pending') {
          s.status = 'active';
          s.startedAt = Date.now();
        }
      }
      // If startedAt is already set (crash-restored session via restoreSession),
      // exercise state is fully intact — don't touch it.
    },

    endSession(state) {
      state.status = 'complete';
      state.endedAt = Date.now();
      state.isResting = false;
    },

    discardSession(_state) {
      return initialState;
    },

    clearSession(_state) {
      return initialState;
    },

    // Restore a previously saved session after a crash/restart
    restoreSession(_state, action: PayloadAction<WorkoutSessionState>) {
      return {
        ...action.payload,
        // Reset transient timer state — rest timer doesn't survive a crash
        isResting: false,
        restStartedAt: null,
        isResuming: true,
      };
    },

    // ── Weight unit ──────────────────────────────────────────────────────────

    setWeightUnit(state, action: PayloadAction<WeightUnit>) {
      state.weightUnit = action.payload;
    },

    setBarWeight(state, action: PayloadAction<number>) {
      state.barWeightLb = action.payload;
    },

    setRestMode(state, action: PayloadAction<RestMode>) {
      state.restMode = action.payload;
    },

    // ── Per-set actions ──────────────────────────────────────────────────────

    setActiveExercise(state, action: PayloadAction<number>) {
      state.activeExerciseIdx = action.payload;
      // Find first non-done set
      const ex = state.exercises[action.payload];
      if (ex) {
        const nextIdx = ex.sets.findIndex(s => s.status !== 'done');
        state.activeSetIdx = nextIdx >= 0 ? nextIdx : ex.sets.length - 1;
      }
    },

    updateSetWeight(state, action: PayloadAction<{
      exIdx: number; setIdx: number; weight: number;
    }>) {
      const { exIdx, setIdx, weight } = action.payload;
      const s = state.exercises[exIdx]?.sets[setIdx];
      if (s) {
        s.weightValue = weight;
        s.weightUnit = state.weightUnit;
      }
    },

    completeSet(state, action: PayloadAction<{
      exIdx: number;
      setIdx: number;
      repsCompleted: number;
      isPR: boolean;
      logId: string;
    }>) {
      const { exIdx, setIdx, repsCompleted, isPR, logId } = action.payload;
      const ex = state.exercises[exIdx];
      if (!ex) return;
      const s = ex.sets[setIdx];
      if (!s) return;

      s.status = 'resting';
      s.repsCompleted = repsCompleted;
      s.isPR = isPR;
      s.completedAt = Date.now();
      s.restStartedAt = Date.now();
      ex.logId = logId;

      if (isPR) {
        state.prsAchieved.push({
          exerciseName: ex.name,
          weightValue: s.weightValue,
          weightUnit: s.weightUnit,
          reps: repsCompleted,
        });
      }

      // Start rest timer
      state.isResting = true;
      state.restStartedAt = Date.now();
      state.restTargetSeconds = ex.targetRestSeconds;

      // Pre-mark next set as upcoming
      const nextSetIdx = setIdx + 1;
      if (nextSetIdx < ex.sets.length) {
        state.activeSetIdx = nextSetIdx;
      }
    },

    completeTimedSet(state, action: PayloadAction<{
      exIdx: number;
      setIdx: number;
      durationCompleted: number; // seconds the user held the set
      logId: string;
    }>) {
      const { exIdx, setIdx, durationCompleted, logId } = action.payload;
      const ex = state.exercises[exIdx];
      if (!ex) return;
      const s = ex.sets[setIdx];
      if (!s) return;

      s.status = 'resting';
      s.durationCompleted = durationCompleted;
      s.isPR = false;
      s.completedAt = Date.now();
      s.restStartedAt = Date.now();
      ex.logId = logId;

      // Start rest timer
      state.isResting = true;
      state.restStartedAt = Date.now();
      state.restTargetSeconds = ex.targetRestSeconds;

      // Pre-mark next set as upcoming
      const nextSetIdx = setIdx + 1;
      if (nextSetIdx < ex.sets.length) {
        state.activeSetIdx = nextSetIdx;
      }
    },

    finishRest(state) {
      state.isResting = false;
      const { restStartedAt, restTargetSeconds } = state;
      const actualRest = restStartedAt
        ? Math.round((Date.now() - restStartedAt) / 1000)
        : restTargetSeconds;

      const ex = state.exercises[state.activeExerciseIdx];
      if (!ex) return;

      // Mark previous (resting) set as done, record rest taken
      const prevSetIdx = state.activeSetIdx - 1;
      if (prevSetIdx >= 0 && ex.sets[prevSetIdx]?.status === 'resting') {
        ex.sets[prevSetIdx].status = 'done';
        ex.sets[prevSetIdx].restSecondsTaken = actualRest;
      }

      // Check if exercise is fully done
      const allDone = ex.sets.every(s => s.status === 'done' || s.status === 'resting');
      if (allDone) {
        ex.isComplete = true;
        // Advance to next incomplete exercise
        const nextEx = state.exercises.findIndex(
          (e, i) => i > state.activeExerciseIdx && !e.isComplete
        );
        if (nextEx >= 0) {
          state.activeExerciseIdx = nextEx;
          state.activeSetIdx = 0;
          state.exercises[nextEx].sets[0].status = 'active';
          state.exercises[nextEx].sets[0].startedAt = Date.now();
        }
      } else {
        // Activate next set in same exercise
        const nextSet = ex.sets[state.activeSetIdx];
        if (nextSet) {
          nextSet.status = 'active';
          nextSet.startedAt = Date.now();
          // Only pre-fill weight from last set if the user hasn't already set
          // a custom weight during rest (weightValue > 0 means they pre-staged it).
          if (nextSet.weightValue === 0) {
            const prevWeight = ex.sets.slice(0, state.activeSetIdx).reverse().find(s => s.weightValue > 0)?.weightValue ?? 0;
            nextSet.weightValue = prevWeight;
          }
          nextSet.weightUnit = state.weightUnit;
        }
      }
    },

    skipRest(state) {
      workoutSessionSlice.caseReducers.finishRest(state);
    },

    addRestTime(state, action: PayloadAction<number>) {
      state.restTargetSeconds += action.payload;
    },

    // ── Add exercise on the fly ──────────────────────────────────────────────

    addExerciseOnFly(state, action: PayloadAction<{
      exerciseId: string; name: string; muscle: string;
      targetSets: number; targetReps: number;
      metricType?: MetricType; targetDurationSeconds?: number;
    }>) {
      const { targetSets, targetReps, metricType = 'reps', targetDurationSeconds = 0, ...rest } = action.payload;
      state.exercises.push({
        ...rest,
        targetSets,
        targetReps,
        metricType,
        targetDurationSeconds,
        targetRestSeconds: 90,
        sets: Array.from({ length: targetSets }, (_, i) => makeSet(i + 1, targetReps, targetDurationSeconds)),
        isAddedOnFly: true,
        logId: null,
        previousBestLb: null,
        isComplete: false,
      } as ExerciseSession);
    },

    // ── Pre-set next set's weight during rest ────────────────────────────────

    updateNextSetWeight(state, action: PayloadAction<number>) {
      const ex = state.exercises[state.activeExerciseIdx];
      if (!ex) return;
      const nextSet = ex.sets[state.activeSetIdx];
      if (nextSet && nextSet.status !== 'done' && nextSet.status !== 'resting') {
        nextSet.weightValue = action.payload;
        nextSet.weightUnit = state.weightUnit;
      }
    },

    // ── Update log ID after DB write ─────────────────────────────────────────

    setExerciseLogId(state, action: PayloadAction<{ exIdx: number; logId: string }>) {
      const ex = state.exercises[action.payload.exIdx];
      if (ex) ex.logId = action.payload.logId;
    },

    setPreviousBest(state, action: PayloadAction<{ exIdx: number; weightLb: number }>) {
      const ex = state.exercises[action.payload.exIdx];
      if (ex) ex.previousBestLb = action.payload.weightLb;
    },
  },
});

export const {
  openSetup, startSession, endSession, discardSession, clearSession, restoreSession,
  setWeightUnit, setBarWeight, setRestMode, setActiveExercise,
  updateSetWeight, updateNextSetWeight, completeSet, completeTimedSet, finishRest, skipRest, addRestTime,
  addExerciseOnFly, setExerciseLogId, setPreviousBest,
} = workoutSessionSlice.actions;

export default workoutSessionSlice.reducer;
