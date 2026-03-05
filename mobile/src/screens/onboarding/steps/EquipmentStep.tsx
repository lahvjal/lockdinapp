import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Checkbox } from 'react-native-paper';
import { OnboardingData } from '../../../utils/onboardingConfig';

interface EquipmentStepProps {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbells',
  'Kettlebells',
  'Cables',
  'Machines',
  'Bench',
  'Squat Rack',
  'Pull-Up Bar',
  'Resistance Bands',
  'Bodyweight Only',
];

export default function EquipmentStep({ onNext, onBack }: EquipmentStepProps) {
  const [equipment, setEquipment] = useState<string[]>([]);

  const toggleEquipment = (item: string) => {
    if (item === 'Bodyweight Only') {
      setEquipment(['Bodyweight Only']);
      return;
    }

    if (equipment.includes('Bodyweight Only')) {
      setEquipment([item]);
      return;
    }

    if (equipment.includes(item)) {
      setEquipment(equipment.filter((e) => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        What equipment do you have access to?
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Select all that apply
      </Text>

      <View style={styles.checkboxContainer}>
        {EQUIPMENT_OPTIONS.map((item) => (
          <Checkbox.Item
            key={item}
            label={item}
            status={equipment.includes(item) ? 'checked' : 'unchecked'}
            onPress={() => toggleEquipment(item)}
            position="leading"
          />
        ))}
      </View>

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={onBack} style={styles.buttonHalf}>
          Back
        </Button>
        <Button
          mode="contained"
          onPress={() => onNext({ equipment })}
          disabled={equipment.length === 0}
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
});
