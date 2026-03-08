-- 004_workout_sessions.sql
-- Full workout session tracking: live sessions, per-set logs, personal records

-- ── workout_sessions ─────────────────────────────────────────────────────────
-- One row per workout session (groups all exercise logs for a single training day)
CREATE TABLE public.workout_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id      UUID NOT NULL REFERENCES public.workouts(id),
  plan_id         UUID NOT NULL REFERENCES public.plans(id),
  started_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  total_sets      INTEGER DEFAULT 0,
  total_volume_lb DECIMAL(10,2) DEFAULT 0,  -- sum of (weight_lb × reps) across all sets
  rest_mode       TEXT NOT NULL DEFAULT 'flexible' CHECK (rest_mode IN ('strict','flexible')),
  weight_unit     TEXT NOT NULL DEFAULT 'lb' CHECK (weight_unit IN ('lb','kg')),
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workout_sessions_user ON public.workout_sessions(user_id, started_at DESC);
CREATE INDEX idx_workout_sessions_workout ON public.workout_sessions(workout_id);

-- Add session_id to existing workout_logs (each row = one exercise within a session)
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE;

-- sets_data JSONB already exists; document its expected shape:
-- [{ set_number, weight_value, weight_unit, reps_completed, rest_seconds_taken, is_pr }]

CREATE INDEX idx_workout_logs_session ON public.workout_logs(session_id);

-- ── personal_records ─────────────────────────────────────────────────────────
-- History of every PR achieved (not unique — keeps full history)
CREATE TABLE public.personal_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id   UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  weight_value  DECIMAL(8,2) NOT NULL,
  weight_unit   TEXT NOT NULL DEFAULT 'lb',
  reps          INTEGER NOT NULL,
  estimated_1rm DECIMAL(8,2),           -- Epley formula: w × (1 + r/30)
  session_id    UUID REFERENCES public.workout_sessions(id),
  achieved_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prs_user_exercise ON public.personal_records(user_id, exercise_id, achieved_at DESC);

-- ── user_profiles additions ──────────────────────────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS weight_unit   TEXT DEFAULT 'lb' CHECK (weight_unit IN ('lb','kg')),
  ADD COLUMN IF NOT EXISTS bar_weight_lb DECIMAL(6,2) DEFAULT 45;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workout sessions" ON public.workout_sessions
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own personal records" ON public.personal_records
  FOR ALL USING (auth.uid() = user_id);

-- Extend existing workout_logs policies to allow session-linked inserts/updates
CREATE POLICY "Users can update own workout logs" ON public.workout_logs
  FOR UPDATE USING (auth.uid() = user_id);
