export interface User {
  id: string;
  email: string;
  created_at: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  goal?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  equipment_access?: string[];
  dietary_style?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  primary_muscle_group: string;
  secondary_muscle_groups?: string[];
  equipment_required: string[];
  movement_pattern: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  video_url?: string;
  created_at: string;
}

export interface Plan {
  id: string;
  user_id: string;
  name: string;
  type: 'workout' | 'meal' | 'water' | 'sleep';
  duration_mode: 'indefinite' | 'fixed' | 'check_in';
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'archived';
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  plan_id: string;
  day_of_week: number;
  name: string;
  exercises: WorkoutExercise[];
  created_at: string;
}

export interface WorkoutExercise {
  exercise_id: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string;
  exercise_id: string;
  logged_at: string;
  sets_data: SetData[];
  notes?: string;
}

export interface SetData {
  set_number: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ExerciseSubstitution {
  id: string;
  user_id: string;
  workout_log_id: string;
  original_exercise_id: string;
  substitute_exercise_id: string;
  reason?: string;
  created_at: string;
}

export interface MealSlot {
  id: string;
  plan_id: string;
  name: string;
  time_of_day: string;
  meal_type: string;
  order: number;
}

export interface MealLog {
  id: string;
  user_id: string;
  meal_slot_id: string;
  description: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  logged_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
  date: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  sleep_start: string;
  sleep_end: string;
  duration_minutes: number;
  quality_rating?: number;
  recovery_notes?: string;
  logged_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  category: 'workout' | 'meal' | 'water' | 'sleep' | 'overall';
  current_count: number;
  longest_count: number;
  last_log_date: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: Record<string, any>;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface SkipToken {
  id: string;
  user_id: string;
  month: string;
  total_tokens: number;
  used_tokens: number;
  created_at: string;
}
