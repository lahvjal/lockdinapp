import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { OnboardingData, WORKOUT_SPLITS, MEAL_TEMPLATES, generateMealTemplate } from '../../../utils/onboardingConfig';
import { completeOnboarding } from '../../../utils/planGenerator';

interface ReviewStepProps {
  onComplete: () => void;
  onBack: () => void;
  data: OnboardingData;
}

export default function ReviewStep({ onComplete, onBack, data }: ReviewStepProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const splitInfo = data.workoutSplit ? WORKOUT_SPLITS[data.workoutSplit] : null;
  const mealTemplate = generateMealTemplate(data);
  const mealInfo = MEAL_TEMPLATES[mealTemplate];

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const result = await completeOnboarding(user.id, data);

    if (result.success) {
      onComplete();
    } else {
      setError('Failed to create your plans. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Creating your personalized plan...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Review Your Plan
      </Text>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Goal</Text>
        <Text variant="bodyLarge">{data.goal}</Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Experience</Text>
        <Text variant="bodyLarge">{data.experienceLevel}</Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Workout Plan</Text>
        <Text variant="bodyLarge">{splitInfo?.name}</Text>
        <Text variant="bodyMedium" style={styles.detail}>
          {splitInfo?.days} days per week
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Meal Structure</Text>
        <Text variant="bodyLarge">{mealInfo.name}</Text>
        <Text variant="bodyMedium" style={styles.detail}>
          {mealInfo.slots.length} meals/snacks per day
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Equipment</Text>
        <Text variant="bodyMedium">{data.equipment?.join(', ')}</Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Duration</Text>
        <Text variant="bodyLarge">
          {data.durationMode === 'indefinite' && 'Indefinite'}
          {data.durationMode === 'fixed' && `${data.fixedWeeks} weeks`}
          {data.durationMode === 'check_in' && 'Check in every 2 weeks'}
        </Text>
      </View>

      {error && (
        <Text variant="bodyMedium" style={styles.error}>
          {error}
        </Text>
      )}

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={onBack} style={styles.buttonHalf} disabled={loading}>
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleComplete}
          style={styles.buttonHalf}
          loading={loading}
          disabled={loading}
        >
          Start Training!
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#666',
  },
  detail: {
    color: '#999',
    marginTop: 2,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  buttonHalf: {
    flex: 1,
  },
});
