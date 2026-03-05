import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, TextInput, IconButton, Portal, Modal } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { logExerciseSet, startRestTimer, endWorkoutSession } from '../../store/slices/workoutSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import RestTimerModal from '../../components/workout/RestTimerModal';

interface ExerciseData {
  exercise_id: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes?: string;
}

export default function WorkoutSessionScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { todaysWorkout, activeSession, previousLogs } = useSelector((state: RootState) => state.workout);
  
  const [exercises, setExercises] = useState<any[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<Array<{ reps: string; weight: string; completed: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    if (!todaysWorkout) return;

    try {
      const exerciseIds = (todaysWorkout.exercises as ExerciseData[]).map(e => e.exercise_id);
      
      const { data: exerciseDetails, error } = await supabase
        .from('exercises')
        .select('*')
        .in('id', exerciseIds);

      if (error) throw error;

      const exercisesWithDetails = (todaysWorkout.exercises as ExerciseData[]).map(ex => {
        const details = exerciseDetails.find(d => d.id === ex.exercise_id);
        return { ...ex, ...details };
      });

      setExercises(exercisesWithDetails);
      initializeSets(exercisesWithDetails[0]);
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Error', 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const initializeSets = (exercise: any) => {
    const numSets = exercise.sets || 3;
    const previousLog = previousLogs[exercise.exercise_id];
    
    if (previousLog) {
      setSets(previousLog.sets_data.map((set: any) => ({
        reps: set.reps.toString(),
        weight: set.weight.toString(),
        completed: false,
      })));
    } else {
      setSets(Array(numSets).fill({ reps: '', weight: '', completed: false }));
    }
  };

  const handleSetComplete = (index: number) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], completed: true };
    setSets(newSets);

    const currentExercise = exercises[currentExerciseIndex];
    
    dispatch(logExerciseSet({
      exerciseId: currentExercise.exercise_id,
      setData: {
        set_number: index + 1,
        reps: parseInt(newSets[index].reps) || 0,
        weight: parseFloat(newSets[index].weight) || 0,
        completed: true,
      },
    }));

    if (currentExercise.rest_seconds && index < sets.length - 1) {
      dispatch(startRestTimer({
        seconds: currentExercise.rest_seconds,
        exerciseId: currentExercise.exercise_id,
      }));
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      initializeSets(exercises[currentExerciseIndex + 1]);
    } else {
      handleFinishWorkout();
    }
  };

  const handleFinishWorkout = () => {
    Alert.alert(
      'Finish Workout?',
      'Great job! Ready to complete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            dispatch(endWorkoutSession());
            // Navigate back or to completion screen
          },
        },
      ]
    );
  };

  const handleCopyLastWorkout = () => {
    const currentExercise = exercises[currentExerciseIndex];
    const previousLog = previousLogs[currentExercise.exercise_id];
    
    if (previousLog) {
      setSets(previousLog.sets_data.map((set: any) => ({
        reps: set.reps.toString(),
        weight: set.weight.toString(),
        completed: false,
      })));
    }
  };

  if (loading || exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading workout...</Text>
      </SafeAreaView>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const previousLog = previousLogs[currentExercise.exercise_id];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="labelMedium" style={styles.progress}>
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </Text>
          <IconButton icon="close" onPress={handleFinishWorkout} />
        </View>

        <Text variant="headlineMedium" style={styles.exerciseName}>
          {currentExercise.name}
        </Text>

        {currentExercise.description && (
          <Text variant="bodyMedium" style={styles.description}>
            {currentExercise.description}
          </Text>
        )}

        {previousLog && (
          <Card style={styles.ghostCard}>
            <Card.Content>
              <Text variant="labelMedium" style={styles.ghostLabel}>
                Last Time:
              </Text>
              {previousLog.sets_data.map((set: any, i: number) => (
                <Text key={i} variant="bodySmall" style={styles.ghostSet}>
                  Set {set.set_number}: {set.reps} reps × {set.weight} lbs
                </Text>
              ))}
              <Button
                mode="text"
                onPress={handleCopyLastWorkout}
                style={styles.copyButton}
                compact
              >
                Copy Last Workout
              </Button>
            </Card.Content>
          </Card>
        )}

        <View style={styles.setsContainer}>
          {sets.map((set, index) => (
            <Card
              key={index}
              style={[styles.setCard, set.completed && styles.setCardCompleted]}
            >
              <Card.Content>
                <Text variant="titleMedium" style={styles.setNumber}>
                  Set {index + 1}
                </Text>
                
                <View style={styles.inputRow}>
                  <TextInput
                    mode="outlined"
                    label="Reps"
                    value={set.reps}
                    onChangeText={(text) => {
                      const newSets = [...sets];
                      newSets[index] = { ...newSets[index], reps: text };
                      setSets(newSets);
                    }}
                    keyboardType="number-pad"
                    style={styles.input}
                    disabled={set.completed}
                  />
                  
                  <TextInput
                    mode="outlined"
                    label="Weight (lbs)"
                    value={set.weight}
                    onChangeText={(text) => {
                      const newSets = [...sets];
                      newSets[index] = { ...newSets[index], weight: text };
                      setSets(newSets);
                    }}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    disabled={set.completed}
                  />
                </View>

                {!set.completed ? (
                  <Button
                    mode="contained"
                    onPress={() => handleSetComplete(index)}
                    disabled={!set.reps || !set.weight}
                  >
                    Complete Set
                  </Button>
                ) : (
                  <Text style={styles.completedText}>✓ Completed</Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleNextExercise}
          style={styles.nextButton}
          disabled={sets.filter(s => s.completed).length === 0}
        >
          {currentExerciseIndex < exercises.length - 1 ? 'Next Exercise' : 'Finish Workout'}
        </Button>
      </ScrollView>

      <RestTimerModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progress: {
    color: '#666',
  },
  exerciseName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  ghostCard: {
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
  },
  ghostLabel: {
    color: '#666',
    marginBottom: 4,
  },
  ghostSet: {
    color: '#333',
    marginVertical: 2,
  },
  copyButton: {
    marginTop: 8,
  },
  setsContainer: {
    marginBottom: 20,
  },
  setCard: {
    marginBottom: 12,
  },
  setCardCompleted: {
    backgroundColor: '#e8f5e9',
  },
  setNumber: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
  },
  completedText: {
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  nextButton: {
    marginTop: 8,
  },
});
