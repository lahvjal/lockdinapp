import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { OnboardingData } from '../../../utils/onboardingConfig';

interface AvailableDaysStepProps {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function AvailableDaysStep({ onNext, onBack }: AvailableDaysStepProps) {
  const [availableDays, setAvailableDays] = useState<number>(3);

  const dayOptions = [2, 3, 4, 5, 6, 7];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        How many days per week can you work out?
      </Text>

      <View style={styles.chipContainer}>
        {dayOptions.map((days) => (
          <Chip
            key={days}
            selected={availableDays === days}
            onPress={() => setAvailableDays(days)}
            style={styles.chip}
            mode={availableDays === days ? 'flat' : 'outlined'}
          >
            {days} days
          </Chip>
        ))}
      </View>

      <Text variant="bodyMedium" style={styles.hint}>
        Based on your selection, we'll recommend the best workout split for you.
      </Text>

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={onBack} style={styles.buttonHalf}>
          Back
        </Button>
        <Button
          mode="contained"
          onPress={() => onNext({ availableDays })}
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
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  chip: {
    minWidth: 100,
  },
  hint: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
});
