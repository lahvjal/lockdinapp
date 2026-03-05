import { supabase } from '../services/supabase';
import exercisesData from '../data/exercises.json';

export async function seedExercises() {
  try {
    console.log('Starting exercise database seed...');
    
    const { data, error } = await supabase
      .from('exercises')
      .insert(exercisesData);

    if (error) {
      if (error.code === '23505') {
        console.log('Exercises already seeded');
        return { success: true, message: 'Exercises already exist' };
      }
      throw error;
    }

    console.log(`Successfully seeded ${exercisesData.length} exercises`);
    return { success: true, count: exercisesData.length };
  } catch (error) {
    console.error('Error seeding exercises:', error);
    return { success: false, error };
  }
}

export async function checkExercisesExist() {
  try {
    const { count, error } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return { exists: (count || 0) > 0, count };
  } catch (error) {
    console.error('Error checking exercises:', error);
    return { exists: false, count: 0 };
  }
}

export async function getExercisesByMuscleGroup(muscleGroup: string) {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('primary_muscle_group', muscleGroup)
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
}

export async function getExercisesByEquipment(equipment: string[]) {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .overlaps('equipment_required', equipment)
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching exercises by equipment:', error);
    return [];
  }
}

export async function getBodyweightExercises() {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('is_bodyweight', true)
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching bodyweight exercises:', error);
    return [];
  }
}

export async function findSubstituteExercises(
  originalExerciseId: string,
  availableEquipment?: string[]
) {
  try {
    const { data: originalExercise, error: fetchError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', originalExerciseId)
      .single();

    if (fetchError) throw fetchError;

    let query = supabase
      .from('exercises')
      .select('*')
      .eq('movement_pattern', originalExercise.movement_pattern)
      .neq('id', originalExerciseId);

    if (availableEquipment && availableEquipment.length > 0) {
      query = query.overlaps('equipment_required', availableEquipment);
    }

    query = query
      .or(`primary_muscle_group.eq.${originalExercise.primary_muscle_group},secondary_muscle_groups.cs.{${originalExercise.primary_muscle_group}}`)
      .order('difficulty_level')
      .limit(5);

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error finding substitute exercises:', error);
    return [];
  }
}

export async function searchExercises(query: string) {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,primary_muscle_group.ilike.%${query}%`)
      .order('name')
      .limit(20);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching exercises:', error);
    return [];
  }
}
