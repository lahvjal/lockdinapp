import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, FAB, Portal, Modal, IconButton } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { setTodaysWorkout, startWorkoutSession } from '../../store/slices/workoutSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function WorkoutHomeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { todaysWorkout, activeSession } = useSelector((state: RootState) => state.workout);
  const { activePlans } = useSelector((state: RootState) => state.plan);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodaysWorkout();
  }, []);

  const loadTodaysWorkout = async () => {
    if (!user || !activePlans.workout) {
      setLoading(false);
      return;
    }

    try {
      const dayOfWeek = new Date().getDay();

      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('plan_id', activePlans.workout.id)
        .eq('day_of_week', dayOfWeek)
        .single();

      if (error) throw error;

      dispatch(setTodaysWorkout(workouts));
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = () => {
    if (todaysWorkout) {
      dispatch(startWorkoutSession(todaysWorkout.id));
      navigation.navigate('WorkoutSession' as never);
    }
  };

  const handleContinueWorkout = () => {
    navigation.navigate('WorkoutSession' as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!activePlans.workout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Active Workout Plan
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Complete onboarding to create your workout plan
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!todaysWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            Rest Day 🧘
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            No workout scheduled for today. Take time to recover!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="displaySmall" style={styles.title}>
          Today's Workout
        </Text>

        <Card style={styles.workoutCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.workoutName}>
              {todaysWorkout.name}
            </Text>
            
            {activeSession ? (
              <View>
                <Text variant="bodyLarge" style={styles.inProgress}>
                  Workout in progress...
                </Text>
                <Button
                  mode="contained"
                  onPress={handleContinueWorkout}
                  style={styles.button}
                >
                  Continue Workout
                </Button>
              </View>
            ) : (
              <Button
                mode="contained"
                onPress={handleStartWorkout}
                style={styles.button}
                icon="play"
              >
                Start Workout
              </Button>
            )}
          </Card.Content>
        </Card>

        <View style={styles.planInfo}>
          <Text variant="titleMedium" style={styles.planTitle}>
            {activePlans.workout.name}
          </Text>
          <Text variant="bodyMedium" style={styles.planDetail}>
            Duration: {activePlans.workout.duration_mode}
          </Text>
        </View>
      </ScrollView>
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
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  workoutCard: {
    marginBottom: 24,
  },
  workoutName: {
    marginBottom: 16,
  },
  inProgress: {
    color: '#4CAF50',
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  planInfo: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  planTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  planDetail: {
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
});
