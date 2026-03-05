import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput, RadioButton } from 'react-native-paper';
import { OnboardingData } from '../../../utils/onboardingConfig';

interface DietStepProps {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function DietStep({ onNext, onBack }: DietStepProps) {
  const [dietaryStyle, setDietaryStyle] = useState('flexible');
  const [customDiet, setCustomDiet] = useState('');

  const handleNext = () => {
    const diet = dietaryStyle === 'custom' ? customDiet : dietaryStyle;
    onNext({ dietaryStyle: diet });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Any dietary preferences?
      </Text>

      <RadioButton.Group
        onValueChange={setDietaryStyle}
        value={dietaryStyle}
      >
        <RadioButton.Item label="Flexible (No restrictions)" value="flexible" position="leading" />
        <RadioButton.Item label="Vegetarian" value="vegetarian" position="leading" />
        <RadioButton.Item label="Vegan" value="vegan" position="leading" />
        <RadioButton.Item label="Keto / Low Carb" value="keto" position="leading" />
        <RadioButton.Item label="Paleo" value="paleo" position="leading" />
        <RadioButton.Item label="Other" value="custom" position="leading" />
      </RadioButton.Group>

      {dietaryStyle === 'custom' && (
        <TextInput
          mode="outlined"
          placeholder="Describe your diet..."
          value={customDiet}
          onChangeText={setCustomDiet}
          style={styles.input}
        />
      )}

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={onBack} style={styles.buttonHalf}>
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
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
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginTop: 16,
    marginBottom: 24,
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
