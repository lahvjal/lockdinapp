-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  goal TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  equipment_access TEXT[],
  dietary_style TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  primary_muscle_group TEXT NOT NULL,
  secondary_muscle_groups TEXT[],
  equipment_required TEXT[] NOT NULL DEFAULT '{}',
  movement_pattern TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  video_url TEXT,
  is_bodyweight BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for exercise search
CREATE INDEX idx_exercises_muscle_group ON public.exercises(primary_muscle_group);
CREATE INDEX idx_exercises_movement_pattern ON public.exercises(movement_pattern);
CREATE INDEX idx_exercises_equipment ON public.exercises USING GIN(equipment_required);

-- Plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('workout', 'meal', 'water', 'sleep')),
  duration_mode TEXT NOT NULL CHECK (duration_mode IN ('indefinite', 'fixed', 'check_in')) DEFAULT 'indefinite',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_plans_user_type_active ON public.plans(user_id, type) WHERE status = 'active';
CREATE INDEX idx_plans_user_type_status ON public.plans(user_id, type, status);

-- Workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workouts_plan_id ON public.workouts(plan_id);

-- Workout logs table
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sets_data JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workout_logs_user_date ON public.workout_logs(user_id, logged_at DESC);
CREATE INDEX idx_workout_logs_exercise ON public.workout_logs(exercise_id, logged_at DESC);

-- Exercise substitutions table
CREATE TABLE public.exercise_substitutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  original_exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  substitute_exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_substitutions_user ON public.exercise_substitutions(user_id, created_at DESC);

-- Meal slots table
CREATE TABLE public.meal_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  time_of_day TIME NOT NULL,
  meal_type TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_slots_plan ON public.meal_slots(plan_id, order_index);

-- Meal logs table
CREATE TABLE public.meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_slot_id UUID NOT NULL REFERENCES public.meal_slots(id),
  description TEXT NOT NULL,
  calories INTEGER,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_meal_logs_user_date ON public.meal_logs(user_id, date DESC);

-- Water logs table
CREATE TABLE public.water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_water_logs_user_date ON public.water_logs(user_id, date DESC);

-- Sleep logs table
CREATE TABLE public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_start TIMESTAMP WITH TIME ZONE NOT NULL,
  sleep_end TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  recovery_notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_sleep_logs_user_date ON public.sleep_logs(user_id, date DESC);

-- Streaks table
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('workout', 'meal', 'water', 'sleep', 'overall')),
  current_count INTEGER NOT NULL DEFAULT 0,
  longest_count INTEGER NOT NULL DEFAULT 0,
  last_log_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

CREATE INDEX idx_streaks_user ON public.streaks(user_id);

-- Badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id, earned_at DESC);

-- Skip tokens table
CREATE TABLE public.skip_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_tokens INTEGER NOT NULL DEFAULT 2,
  used_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX idx_skip_tokens_user_month ON public.skip_tokens(user_id, month DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skip_tokens ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Plans policies
CREATE POLICY "Users can view own plans" ON public.plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plans" ON public.plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON public.plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON public.plans
  FOR DELETE USING (auth.uid() = user_id);

-- Workouts policies
CREATE POLICY "Users can view workouts from own plans" ON public.workouts
  FOR SELECT USING (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create workouts for own plans" ON public.workouts
  FOR INSERT WITH CHECK (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

-- Workout logs policies
CREATE POLICY "Users can view own workout logs" ON public.workout_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workout logs" ON public.workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exercise substitutions policies
CREATE POLICY "Users can view own substitutions" ON public.exercise_substitutions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own substitutions" ON public.exercise_substitutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Meal slots policies
CREATE POLICY "Users can view meal slots from own plans" ON public.meal_slots
  FOR SELECT USING (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create meal slots for own plans" ON public.meal_slots
  FOR INSERT WITH CHECK (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update meal slots from own plans" ON public.meal_slots
  FOR UPDATE USING (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete meal slots from own plans" ON public.meal_slots
  FOR DELETE USING (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

-- Meal logs policies
CREATE POLICY "Users can view own meal logs" ON public.meal_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal logs" ON public.meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Water logs policies
CREATE POLICY "Users can view own water logs" ON public.water_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own water logs" ON public.water_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sleep logs policies
CREATE POLICY "Users can view own sleep logs" ON public.sleep_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sleep logs" ON public.sleep_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "Users can view own streaks" ON public.streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User badges policies
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Skip tokens policies
CREATE POLICY "Users can view own skip tokens" ON public.skip_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own skip tokens" ON public.skip_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skip tokens" ON public.skip_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Exercises are public (read-only)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises
  FOR SELECT USING (true);

-- Badges are public (read-only)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are viewable by everyone" ON public.badges
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
