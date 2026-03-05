import { OnboardingData, WorkoutSplitType, WORKOUT_SPLITS, MEAL_TEMPLATES, MealTemplateType } from './onboardingConfig';
import { supabase } from '../services/supabase';

export function generateWorkoutSplit(onboardingData: OnboardingData): WorkoutSplitType {
  const { availableDays, experienceLevel } = onboardingData;

  if (!availableDays) return 'FULL_BODY';

  if (availableDays >= 6 && experienceLevel !== 'beginner') {
    return 'PPL';
  } else if (availableDays >= 4) {
    return 'UPPER_LOWER';
  } else {
    return 'FULL_BODY';
  }
}

export function generateMealTemplate(onboardingData: OnboardingData): MealTemplateType {
  const { experienceLevel, goal } = onboardingData;

  if (goal?.toLowerCase().includes('muscle') || goal?.toLowerCase().includes('bulk')) {
    return 'FIVE_MEALS';
  } else if (experienceLevel === 'advanced') {
    return 'FIVE_MEALS';
  } else if (experienceLevel === 'intermediate') {
    return 'FOUR_MEALS';
  } else {
    return 'THREE_MEALS';
  }
}

export async function createWorkoutPlan(userId: string, onboardingData: OnboardingData) {
  const split = onboardingData.workoutSplit || generateWorkoutSplit(onboardingData);
  const splitConfig = WORKOUT_SPLITS[split];

  const planName = onboardingData.planName || `${splitConfig.name} Plan`;

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .insert({
      user_id: userId,
      name: planName,
      type: 'workout',
      duration_mode: onboardingData.durationMode || 'indefinite',
      end_date: onboardingData.durationMode === 'fixed' && onboardingData.fixedWeeks
        ? new Date(Date.now() + onboardingData.fixedWeeks * 7 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      status: 'active',
      config: {
        split: split,
        experience_level: onboardingData.experienceLevel,
        equipment: onboardingData.equipment || [],
      },
    })
    .select()
    .single();

  if (planError) throw planError;

  const workouts = splitConfig.schedule.map((day, index) => ({
    plan_id: plan.id,
    day_of_week: index,
    name: day.day,
    exercises: [],
  }));

  const { error: workoutsError } = await supabase
    .from('workouts')
    .insert(workouts);

  if (workoutsError) throw workoutsError;

  return plan;
}

export async function createMealPlan(userId: string, onboardingData: OnboardingData) {
  const template = onboardingData.mealTemplate || generateMealTemplate(onboardingData);
  const mealConfig = MEAL_TEMPLATES[template];

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .insert({
      user_id: userId,
      name: 'Meal Plan',
      type: 'meal',
      duration_mode: onboardingData.durationMode || 'indefinite',
      status: 'active',
      config: {
        template: template,
        dietary_style: onboardingData.dietaryStyle,
      },
    })
    .select()
    .single();

  if (planError) throw planError;

  const mealSlots = mealConfig.slots.map((slot, index) => ({
    plan_id: plan.id,
    name: slot.name,
    time_of_day: slot.time,
    meal_type: slot.type,
    order_index: index,
  }));

  const { error: slotsError } = await supabase
    .from('meal_slots')
    .insert(mealSlots);

  if (slotsError) throw slotsError;

  return plan;
}

export async function createWaterPlan(userId: string, onboardingData: OnboardingData) {
  const waterGoal = onboardingData.waterGoal || 2000;

  const { data: plan, error } = await supabase
    .from('plans')
    .insert({
      user_id: userId,
      name: 'Water Tracking',
      type: 'water',
      duration_mode: 'indefinite',
      status: 'active',
      config: {
        daily_target_ml: waterGoal,
      },
    })
    .select()
    .single();

  if (error) throw error;
  return plan;
}

export async function createSleepPlan(userId: string, onboardingData: OnboardingData) {
  const { data: plan, error } = await supabase
    .from('plans')
    .insert({
      user_id: userId,
      name: 'Sleep & Recovery',
      type: 'sleep',
      duration_mode: 'indefinite',
      status: 'active',
      config: {
        target_hours: 8,
      },
    })
    .select()
    .single();

  if (error) throw error;
  return plan;
}

export async function initializeStreaks(userId: string) {
  const categories = ['workout', 'meal', 'water', 'sleep', 'overall'];

  const streaks = categories.map(category => ({
    user_id: userId,
    category,
    current_count: 0,
    longest_count: 0,
  }));

  const { error } = await supabase
    .from('streaks')
    .insert(streaks);

  if (error) throw error;
}

export async function initializeSkipTokens(userId: string) {
  const currentMonth = new Date().toISOString().substring(0, 7) + '-01';

  const { error } = await supabase
    .from('skip_tokens')
    .insert({
      user_id: userId,
      month: currentMonth,
      total_tokens: 2,
      used_tokens: 0,
    });

  if (error && error.code !== '23505') throw error;
}

export async function completeOnboarding(userId: string, onboardingData: OnboardingData) {
  try {
    await createWorkoutPlan(userId, onboardingData);
    await createMealPlan(userId, onboardingData);
    await createWaterPlan(userId, onboardingData);
    await createSleepPlan(userId, onboardingData);
    await initializeStreaks(userId);
    await initializeSkipTokens(userId);

    await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        goal: onboardingData.goal,
        experience_level: onboardingData.experienceLevel,
        equipment_access: onboardingData.equipment,
        dietary_style: onboardingData.dietaryStyle,
      });

    return { success: true };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { success: false, error };
  }
}
