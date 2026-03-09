import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { OnboardingData } from '../../../utils/onboardingConfig';

interface WelcomeStepProps {
  onNext: (data: Partial<OnboardingData>) => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [goal, setGoal] = useState('');

  const handleNext = () => {
    if (goal.trim()) {
      onNext({ goal });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Welcome to TINO! 👋
      </Text>
      
      <Text variant="bodyLarge" style={styles.greeting}>
        Hi {user?.email?.split('@')[0]}, let's set up your plan.
      </Text>

      <Text variant="titleMedium" style={styles.question}>
        What's your main fitness goal?
      </Text>

      <TextInput
        mode="outlined"
        placeholder="e.g., Build muscle, lose weight, get stronger..."
        value={goal}
        onChangeText={setGoal}
        style={styles.input}
        multiline
        numberOfLines={3}
      />

      <Button
        mode="contained"
        onPress={handleNext}
        disabled={!goal.trim()}
        style={styles.button}
      >
        Continue
      </Button>
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
    marginBottom: 16,
    textAlign: 'center',
  },
  greeting: {
    marginBottom: 32,
    textAlign: 'center',
    color: '#666',
  },
  question: {
    marginBottom: 16,
    fontWeight: '600',
  },
  input: {
    marginBottom: 24,
  },
  button: {
    paddingVertical: 8,
  },
});
