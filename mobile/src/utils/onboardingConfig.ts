export const WORKOUT_SPLITS = {
  PPL: {
    name: 'Push/Pull/Legs',
    description: '6-day split focusing on movement patterns',
    days: 6,
    schedule: [
      { day: 'Push', focus: 'Chest, Shoulders, Triceps' },
      { day: 'Pull', focus: 'Back, Biceps' },
      { day: 'Legs', focus: 'Quads, Hamstrings, Glutes, Calves' },
      { day: 'Push', focus: 'Chest, Shoulders, Triceps' },
      { day: 'Pull', focus: 'Back, Biceps' },
      { day: 'Legs', focus: 'Quads, Hamstrings, Glutes, Calves' },
    ],
  },
  UPPER_LOWER: {
    name: 'Upper/Lower',
    description: '4-day split alternating upper and lower body',
    days: 4,
    schedule: [
      { day: 'Upper A', focus: 'Chest, Back, Shoulders, Arms' },
      { day: 'Lower A', focus: 'Quads, Hamstrings, Glutes, Calves' },
      { day: 'Upper B', focus: 'Chest, Back, Shoulders, Arms' },
      { day: 'Lower B', focus: 'Quads, Hamstrings, Glutes, Calves' },
    ],
  },
  FULL_BODY: {
    name: 'Full Body',
    description: '3-day full body workouts',
    days: 3,
    schedule: [
      { day: 'Full Body A', focus: 'All major muscle groups' },
      { day: 'Full Body B', focus: 'All major muscle groups' },
      { day: 'Full Body C', focus: 'All major muscle groups' },
    ],
  },
  BOXING: {
    name: 'Boxing',
    description: '4-day boxing & conditioning program',
    days: 4,
    schedule: [
      { day: 'Technical Skills', focus: 'Footwork, jabs, combinations, bag work' },
      { day: 'Strength & Power', focus: 'Upper body strength, core, explosive power' },
      { day: 'Sparring / Pad Work', focus: 'Reaction, combinations, defense' },
      { day: 'Conditioning', focus: 'Cardio, agility, recovery circuits' },
    ],
  },
  RUNNING: {
    name: 'Running',
    description: '4-day structured running program',
    days: 4,
    schedule: [
      { day: 'Easy Run', focus: 'Aerobic base, conversational pace' },
      { day: 'Tempo Run', focus: 'Lactate threshold, comfortably hard effort' },
      { day: 'Speed Work', focus: 'Intervals, track repeats, VO2 max' },
      { day: 'Long Run', focus: 'Endurance, aerobic capacity, distance' },
    ],
  },
};

// Exercise names match exactly what's seeded in the exercise library (003_exercise_library.sql / 005_cardio_exercises.sql)
// Each entry: { name, sets, reps } for strength  OR  { name, sets, duration_seconds } for timed  OR  { name, sets, distance_meters } for distance
export type ExerciseTemplateEntry =
  | { name: string; sets: number; reps: number }
  | { name: string; sets: number; duration_seconds: number }
  | { name: string; sets: number; distance_meters: number };

export const SPLIT_EXERCISE_TEMPLATES: Record<string, ExerciseTemplateEntry[][]> = {
  // ── Push / Pull / Legs ────────────────────────────────────────────────────
  PPL: [
    // Day 1 — Push A (Chest focus)
    [
      { name: 'Barbell Bench Press',         sets: 4, reps: 8  },
      { name: 'Incline Dumbbell Press',       sets: 3, reps: 10 },
      { name: 'Dumbbell Fly',                 sets: 3, reps: 12 },
      { name: 'Overhead Press',               sets: 3, reps: 8  },
      { name: 'Lateral Raise',                sets: 3, reps: 15 },
      { name: 'Cable Tricep Pushdown',        sets: 3, reps: 12 },
      { name: 'Skull Crusher',                sets: 3, reps: 10 },
    ],
    // Day 2 — Pull A (Back focus)
    [
      { name: 'Barbell Row',                  sets: 4, reps: 8  },
      { name: 'Pull-Up',                      sets: 3, reps: 8  },
      { name: 'Seated Cable Row',             sets: 3, reps: 10 },
      { name: 'Lat Pulldown',                 sets: 3, reps: 12 },
      { name: 'Face Pull',                    sets: 3, reps: 15 },
      { name: 'Barbell Curl',                 sets: 3, reps: 10 },
      { name: 'Hammer Curl',                  sets: 3, reps: 12 },
    ],
    // Day 3 — Legs A
    [
      { name: 'Barbell Back Squat',           sets: 4, reps: 8  },
      { name: 'Romanian Deadlift',            sets: 3, reps: 10 },
      { name: 'Leg Press',                    sets: 3, reps: 12 },
      { name: 'Leg Curl',                     sets: 3, reps: 12 },
      { name: 'Leg Extension',                sets: 3, reps: 15 },
      { name: 'Calf Raise',                   sets: 4, reps: 15 },
    ],
    // Day 4 — Push B (Shoulder focus)
    [
      { name: 'Overhead Press',               sets: 4, reps: 6  },
      { name: 'Incline Barbell Bench Press',  sets: 3, reps: 8  },
      { name: 'Dumbbell Shoulder Press',      sets: 3, reps: 10 },
      { name: 'Cable Fly',                    sets: 3, reps: 12 },
      { name: 'Lateral Raise',                sets: 4, reps: 15 },
      { name: 'Rope Tricep Pushdown',         sets: 3, reps: 12 },
      { name: 'Overhead Tricep Extension',    sets: 3, reps: 12 },
    ],
    // Day 5 — Pull B (Lats focus)
    [
      { name: 'Conventional Deadlift',        sets: 4, reps: 5  },
      { name: 'Lat Pulldown',                 sets: 4, reps: 10 },
      { name: 'Dumbbell Row',                 sets: 3, reps: 10 },
      { name: 'Straight Arm Pulldown',        sets: 3, reps: 12 },
      { name: 'Bent Over Rear Delt Fly',      sets: 3, reps: 15 },
      { name: 'Dumbbell Curl',                sets: 3, reps: 12 },
      { name: 'Preacher Curl',                sets: 3, reps: 10 },
    ],
    // Day 6 — Legs B (Glute/Ham focus)
    [
      { name: 'Bulgarian Split Squat',        sets: 3, reps: 10 },
      { name: 'Conventional Deadlift',        sets: 4, reps: 6  },
      { name: 'Barbell Hip Thrust',           sets: 4, reps: 12 },
      { name: 'Walking Lunge',                sets: 3, reps: 12 },
      { name: 'Leg Curl',                     sets: 3, reps: 15 },
      { name: 'Calf Raise',                   sets: 4, reps: 20 },
    ],
  ],

  // ── Upper / Lower ─────────────────────────────────────────────────────────
  UPPER_LOWER: [
    // Day 1 — Upper A (Strength)
    [
      { name: 'Barbell Bench Press',          sets: 4, reps: 6  },
      { name: 'Barbell Row',                  sets: 4, reps: 6  },
      { name: 'Overhead Press',               sets: 3, reps: 8  },
      { name: 'Pull-Up',                      sets: 3, reps: 8  },
      { name: 'Lateral Raise',                sets: 3, reps: 15 },
      { name: 'Barbell Curl',                 sets: 3, reps: 10 },
      { name: 'Skull Crusher',                sets: 3, reps: 10 },
    ],
    // Day 2 — Lower A (Quad focus)
    [
      { name: 'Barbell Back Squat',           sets: 4, reps: 6  },
      { name: 'Romanian Deadlift',            sets: 3, reps: 8  },
      { name: 'Leg Press',                    sets: 3, reps: 12 },
      { name: 'Leg Extension',                sets: 3, reps: 15 },
      { name: 'Leg Curl',                     sets: 3, reps: 12 },
      { name: 'Calf Raise',                   sets: 4, reps: 15 },
    ],
    // Day 3 — Upper B (Hypertrophy)
    [
      { name: 'Incline Dumbbell Press',        sets: 4, reps: 10 },
      { name: 'Seated Cable Row',              sets: 4, reps: 10 },
      { name: 'Dumbbell Shoulder Press',       sets: 3, reps: 12 },
      { name: 'Lat Pulldown',                  sets: 3, reps: 12 },
      { name: 'Cable Fly',                     sets: 3, reps: 15 },
      { name: 'Hammer Curl',                   sets: 3, reps: 12 },
      { name: 'Cable Tricep Pushdown',         sets: 3, reps: 12 },
    ],
    // Day 4 — Lower B (Posterior focus)
    [
      { name: 'Conventional Deadlift',         sets: 4, reps: 5  },
      { name: 'Barbell Hip Thrust',            sets: 4, reps: 10 },
      { name: 'Bulgarian Split Squat',         sets: 3, reps: 10 },
      { name: 'Leg Curl',                      sets: 3, reps: 15 },
      { name: 'Walking Lunge',                 sets: 3, reps: 12 },
      { name: 'Calf Raise',                    sets: 4, reps: 20 },
    ],
  ],

  // ── Full Body ─────────────────────────────────────────────────────────────
  FULL_BODY: [
    // Day 1 — Full Body A
    [
      { name: 'Barbell Back Squat',            sets: 3, reps: 8  },
      { name: 'Barbell Bench Press',           sets: 3, reps: 8  },
      { name: 'Barbell Row',                   sets: 3, reps: 8  },
      { name: 'Overhead Press',                sets: 3, reps: 10 },
      { name: 'Romanian Deadlift',             sets: 3, reps: 10 },
      { name: 'Plank',                         sets: 3, duration_seconds: 30 },
    ],
    // Day 2 — Full Body B
    [
      { name: 'Conventional Deadlift',         sets: 3, reps: 5  },
      { name: 'Incline Dumbbell Press',         sets: 3, reps: 10 },
      { name: 'Pull-Up',                        sets: 3, reps: 8  },
      { name: 'Dumbbell Shoulder Press',        sets: 3, reps: 10 },
      { name: 'Leg Press',                      sets: 3, reps: 12 },
      { name: 'Hanging Knee Raise',             sets: 3, reps: 15 },
    ],
    // Day 3 — Full Body C
    [
      { name: 'Bulgarian Split Squat',          sets: 3, reps: 10 },
      { name: 'Dumbbell Bench Press',           sets: 3, reps: 10 },
      { name: 'Seated Cable Row',               sets: 3, reps: 10 },
      { name: 'Lateral Raise',                  sets: 3, reps: 15 },
      { name: 'Barbell Hip Thrust',             sets: 3, reps: 12 },
      { name: 'Cable Tricep Pushdown',          sets: 3, reps: 12 },
      { name: 'Dumbbell Curl',                  sets: 3, reps: 12 },
    ],
  ],

  // ── Boxing ────────────────────────────────────────────────────────────────
  BOXING: [
    // Day 1 — Technical Skills
    [
      { name: 'Jump Rope',                      sets: 5, duration_seconds: 180 },
      { name: 'Shadow Boxing',                  sets: 4, duration_seconds: 180 },
      { name: 'Heavy Bag Work',                 sets: 5, duration_seconds: 180 },
      { name: 'Slip Bag Drill',                 sets: 3, duration_seconds: 120 },
      { name: 'Footwork Ladder Drill',          sets: 4, duration_seconds: 60  },
    ],
    // Day 2 — Strength & Power
    [
      { name: 'Medicine Ball Slam',             sets: 4, reps: 12 },
      { name: 'Push-Up',                        sets: 4, reps: 20 },
      { name: 'Pull-Up',                        sets: 4, reps: 8  },
      { name: 'Plank',                          sets: 3, duration_seconds: 60  },
      { name: 'Russian Twist',                  sets: 3, reps: 20 },
      { name: 'Battle Ropes',                   sets: 4, duration_seconds: 30  },
      { name: 'Box Jump',                       sets: 3, reps: 10 },
    ],
    // Day 3 — Sparring / Pad Work
    [
      { name: 'Jump Rope',                      sets: 3, duration_seconds: 180 },
      { name: 'Shadow Boxing',                  sets: 3, duration_seconds: 180 },
      { name: 'Pad Work Combinations',          sets: 6, duration_seconds: 120 },
      { name: 'Defensive Slip Drill',           sets: 4, duration_seconds: 60  },
      { name: 'Heavy Bag Power Shots',          sets: 3, duration_seconds: 90  },
    ],
    // Day 4 — Conditioning
    [
      { name: 'Jump Rope',                      sets: 5, duration_seconds: 180 },
      { name: 'Burpee',                         sets: 4, reps: 15 },
      { name: 'Mountain Climber',               sets: 3, duration_seconds: 45  },
      { name: 'Assault Bike',                   sets: 5, duration_seconds: 60  },
      { name: 'Hanging Knee Raise',             sets: 3, reps: 15 },
      { name: 'Neck Bridge',                    sets: 3, duration_seconds: 30  },
    ],
  ],

  // ── Running ───────────────────────────────────────────────────────────────
  RUNNING: [
    // Day 1 — Easy Run (aerobic base)
    [
      { name: 'Dynamic Warm-Up',                sets: 1, duration_seconds: 300 },
      { name: 'Easy Run',                       sets: 1, distance_meters: 5000 },
      { name: 'Running Strides',                sets: 4, distance_meters: 100  },
      { name: 'Calf Raise',                     sets: 2, reps: 20 },
    ],
    // Day 2 — Tempo Run
    [
      { name: 'Dynamic Warm-Up',                sets: 1, duration_seconds: 300 },
      { name: 'Easy Warm-Up Run',               sets: 1, distance_meters: 1600 },
      { name: 'Tempo Run',                      sets: 1, distance_meters: 4800 },
      { name: 'Easy Cool-Down Run',             sets: 1, distance_meters: 1600 },
      { name: 'Foam Roll Legs',                 sets: 1, duration_seconds: 300 },
    ],
    // Day 3 — Speed Work / Intervals
    [
      { name: 'Dynamic Warm-Up',                sets: 1, duration_seconds: 300 },
      { name: 'Easy Warm-Up Run',               sets: 1, distance_meters: 1600 },
      { name: '400m Run Interval',              sets: 8, distance_meters: 400  },
      { name: 'Easy Cool-Down Run',             sets: 1, distance_meters: 800  },
    ],
    // Day 4 — Long Run
    [
      { name: 'Dynamic Warm-Up',                sets: 1, duration_seconds: 300 },
      { name: 'Long Run',                       sets: 1, distance_meters: 12000 },
      { name: 'Post-Run Stretch',               sets: 1, duration_seconds: 600  },
    ],
  ],
};

export const MEAL_TEMPLATES = {
  THREE_MEALS: {
    name: '3 Meals',
    slots: [
      { name: 'Breakfast', time: '08:00', type: 'breakfast' },
      { name: 'Lunch', time: '12:00', type: 'lunch' },
      { name: 'Dinner', time: '18:00', type: 'dinner' },
    ],
  },
  FOUR_MEALS: {
    name: '4 Meals',
    slots: [
      { name: 'Breakfast', time: '07:30', type: 'breakfast' },
      { name: 'Lunch', time: '12:00', type: 'lunch' },
      { name: 'Snack', time: '15:30', type: 'snack' },
      { name: 'Dinner', time: '19:00', type: 'dinner' },
    ],
  },
  FIVE_MEALS: {
    name: '5 Meals (with pre/post workout)',
    slots: [
      { name: 'Breakfast', time: '07:00', type: 'breakfast' },
      { name: 'Pre-Workout Snack', time: '10:30', type: 'pre-workout' },
      { name: 'Lunch', time: '13:00', type: 'lunch' },
      { name: 'Post-Workout Snack', time: '16:30', type: 'post-workout' },
      { name: 'Dinner', time: '19:30', type: 'dinner' },
    ],
  },
};

export type WorkoutSplitType = keyof typeof WORKOUT_SPLITS;
export type MealTemplateType = keyof typeof MEAL_TEMPLATES;

export interface OnboardingData {
  goal?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  availableDays?: number;
  equipment?: string[];
  dietaryStyle?: string;
  workoutSplit?: WorkoutSplitType;
  mealTemplate?: MealTemplateType;
  planName?: string;
  durationMode?: 'indefinite' | 'fixed' | 'check_in';
  fixedWeeks?: number;
  waterGoal?: number;
}

/**
 * Recommends a workout split based on the user's available training days and experience.
 * - 5+ days & not a beginner → PPL (Push/Pull/Legs)
 * - 3–4 days → Upper/Lower
 * - 1–2 days → Full Body
 */
export function generateWorkoutSplit(data: OnboardingData): WorkoutSplitType {
  const days = data.availableDays ?? 3;
  const level = data.experienceLevel ?? 'beginner';

  if (days >= 5 && level !== 'beginner') return 'PPL';
  if (days >= 3) return 'UPPER_LOWER';
  return 'FULL_BODY';
}

/**
 * Recommends a meal template based on the user's dietary style.
 * - Intermittent fasting → 3 meals
 * - High-protein / performance → 5 meals
 * - Everything else → 4 meals
 */
export function generateMealTemplate(data: OnboardingData): MealTemplateType {
  const dietary = (data.dietaryStyle ?? '').toLowerCase();

  if (dietary.includes('intermittent') || dietary.includes('fasting')) return 'THREE_MEALS';
  if (dietary.includes('high-protein') || dietary.includes('bodybuilder') || dietary.includes('performance')) return 'FIVE_MEALS';
  return 'FOUR_MEALS';
}
