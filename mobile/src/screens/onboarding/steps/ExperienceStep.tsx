import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, RadioButton } from 'react-native-paper';
import { OnboardingData } from '../../../utils/onboardingConfig';

interface ExperienceStepProps {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function ExperienceStep({ onNext, onBack }: ExperienceStepProps) {
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        What's your experience level?
      </Text>

      <RadioButton.Group
        onValueChange={(value) => setExperienceLevel(value as any)}
        value={experienceLevel}
      >
        <View style={styles.option}>
          <RadioButton.Item
            label="Beginner"
            value="beginner"
            position="leading"
          />
          <Text variant="bodySmall" style={styles.description}>
            New to working out or returning after a break
          </Text>
        </View>

        <View style={styles.option}>
          <RadioButton.Item
            label="Intermediate"
            value="intermediate"
            position="leading"
          />
          <Text variant="bodySmall" style={styles.description}>
            Comfortable with gym equipment and basic exercises
          </Text>
        </View>

        <View style={styles.option}>
          <RadioButton.Item
            label="Advanced"
            value="advanced"
            position="leading"
          />
          <Text variant="bodySmall" style={styles.description}>
            Experienced lifter with solid technique
          </Text>
        </View>
      </RadioButton.Group>

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={onBack} style={styles.buttonHalf}>
          Back
        </Button>
        <Button
          mode="contained"
          onPress={() => onNext({ experienceLevel })}
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
  option: {
    marginBottom: 16,
  },
  description: {
    marginLeft: 56,
    marginTop: -8,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  buttonHalf: {
    flex: 1,
  },
});
