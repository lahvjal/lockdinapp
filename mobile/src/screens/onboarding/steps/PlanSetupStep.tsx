import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput, RadioButton, SegmentedButtons } from 'react-native-paper';
import { OnboardingData, generateWorkoutSplit, WORKOUT_SPLITS } from '../../../utils/onboardingConfig';

interface PlanSetupStepProps {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  currentData: OnboardingData;
}

export default function PlanSetupStep({ onNext, onBack, currentData }: PlanSetupStepProps) {
  const recommendedSplit = generateWorkoutSplit(currentData);
  const splitInfo = WORKOUT_SPLITS[recommendedSplit];

  const [planName, setPlanName] = useState(splitInfo.name);
  const [durationMode, setDurationMode] = useState<'indefinite' | 'fixed' | 'check_in'>('indefinite');
  const [fixedWeeks, setFixedWeeks] = useState('12');

  const handleNext = () => {
    onNext({
      planName,
      durationMode,
      fixedWeeks: durationMode === 'fixed' ? parseInt(fixedWeeks) : undefined,
      workoutSplit: recommendedSplit,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Name your plan
      </Text>

      <TextInput
        mode="outlined"
        value={planName}
        onChangeText={setPlanName}
        style={styles.input}
        placeholder="e.g., Summer Shred, Strength Building..."
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Recommended: {splitInfo.name}
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        {splitInfo.description} ({splitInfo.days} days/week)
      </Text>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        How long do you want to run this plan?
      </Text>

      <RadioButton.Group
        onValueChange={(value) => setDurationMode(value as any)}
        value={durationMode}
      >
        <RadioButton.Item label="Indefinite (until I stop)" value="indefinite" position="leading" />
        <RadioButton.Item label="Fixed duration" value="fixed" position="leading" />
        <RadioButton.Item label="Check in every 2 weeks" value="check_in" position="leading" />
      </RadioButton.Group>

      {durationMode === 'fixed' && (
        <View style={styles.weeksInput}>
          <TextInput
            mode="outlined"
            value={fixedWeeks}
            onChangeText={setFixedWeeks}
            keyboardType="number-pad"
            label="Number of weeks"
            style={styles.numberInput}
          />
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={onBack} style={styles.buttonHalf}>
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!planName.trim()}
          style={styles.buttonHalf}
        >
          Continue
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
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  weeksInput: {
    marginTop: 16,
    marginBottom: 16,
  },
  numberInput: {
    maxWidth: 200,
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
