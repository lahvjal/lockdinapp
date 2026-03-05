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
