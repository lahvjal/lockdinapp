import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, FAB, Portal, Modal, TextInput, Chip } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { setMealSlots, addMealLog } from '../../store/slices/mealSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MealSlot, MealLog } from '../../types';

export default function MealsScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { mealSlots, mealLogs } = useSelector((state: RootState) => state.meal);
  const { activePlans } = useSelector((state: RootState) => state.plan);
  const [loading, setLoading] = useState(true);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot | null>(null);
  const [mealDescription, setMealDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  useEffect(() => {
    loadTodaysMealPlan();
  }, []);

  const loadTodaysMealPlan = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get active meal plan
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'meals')
        .eq('is_active', true)
        .single();

      if (planError) throw planError;

      // Get today's meal slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('meal_slots')
        .select('*')
        .eq('plan_id', planData.id)
        .order('time_of_day', { ascending: true });

      if (slotsError) throw slotsError;

      dispatch(setMealSlots(slotsData || []));

      // Get today's logs
      const today = new Date().toISOString().split('T')[0];
      const { data: logsData, error: logsError } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00`)
        .lte('logged_at', `${today}T23:59:59`);

      if (logsError) throw logsError;

      // Dispatch logs (you'll need to add setMealLogs to slice if not exists)
    } catch (error) {
      console.error('Error loading meal plan:', error);
      Alert.alert('Error', 'Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLogModal = (slot: MealSlot) => {
    setSelectedSlot(slot);
    setLogModalVisible(true);
  };

  const handleLogMeal = async () => {
    if (!user || !selectedSlot || !mealDescription.trim()) {
      Alert.alert('Error', 'Please enter meal description');
      return;
    }

    try {
      const mealLog: Partial<MealLog> = {
        user_id: user.id,
        meal_slot_id: selectedSlot.id,
        description: mealDescription,
        calories: calories ? parseInt(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fats: fats ? parseFloat(fats) : null,
        logged_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('meal_logs')
        .insert(mealLog)
        .select()
        .single();

      if (error) throw error;

      dispatch(addMealLog(data));
      
      // Reset form
      setMealDescription('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      setLogModalVisible(false);
      
      Alert.alert('Success', 'Meal logged successfully!');
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Failed to log meal');
    }
  };

  const getMealProgress = (slotId: string) => {
    return mealLogs.filter(log => log.meal_slot_id === slotId).length > 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading meal plan...</Text>
      </SafeAreaView>
    );
  }

  if (!activePlans.meals) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Active Meal Plan
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Complete onboarding to set up your meal tracking plan.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="displaySmall" style={styles.title}>Today's Meals</Text>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium">Daily Progress</Text>
            <Text variant="bodyMedium" style={styles.summaryText}>
              {mealLogs.length} of {mealSlots.length} meals logged
            </Text>
          </Card.Content>
        </Card>

        {mealSlots.map((slot) => (
          <Card key={slot.id} style={styles.mealCard}>
            <Card.Content>
              <View style={styles.slotHeader}>
                <View>
                  <Text variant="titleLarge">{slot.name}</Text>
                  <Text variant="bodySmall" style={styles.time}>
                    {slot.time_of_day}
                  </Text>
                </View>
                {getMealProgress(slot.id) ? (
                  <Chip icon="check" style={styles.completedChip}>
                    Logged
                  </Chip>
                ) : (
                  <Chip style={styles.pendingChip}>Pending</Chip>
                )}
              </View>

              {slot.description && (
                <Text variant="bodyMedium" style={styles.description}>
                  {slot.description}
                </Text>
              )}

              {slot.target_calories && (
                <Text variant="bodySmall" style={styles.target}>
                  Target: ~{slot.target_calories} cal
                </Text>
              )}

              <Button
                mode="contained"
                onPress={() => handleOpenLogModal(slot)}
                style={styles.logButton}
              >
                Log Meal
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <Modal
          visible={logModalVisible}
          onDismiss={() => setLogModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Log {selectedSlot?.name}
          </Text>

          <TextInput
            label="What did you eat?"
            value={mealDescription}
            onChangeText={setMealDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Macros (Optional)
          </Text>

          <View style={styles.macrosRow}>
            <TextInput
              label="Calories"
              value={calories}
              onChangeText={setCalories}
              mode="outlined"
              keyboardType="numeric"
              style={styles.macroInput}
            />
            <TextInput
              label="Protein (g)"
              value={protein}
              onChangeText={setProtein}
              mode="outlined"
              keyboardType="numeric"
              style={styles.macroInput}
            />
          </View>

          <View style={styles.macrosRow}>
            <TextInput
              label="Carbs (g)"
              value={carbs}
              onChangeText={setCarbs}
              mode="outlined"
              keyboardType="numeric"
              style={styles.macroInput}
            />
            <TextInput
              label="Fats (g)"
              value={fats}
              onChangeText={setFats}
              mode="outlined"
              keyboardType="numeric"
              style={styles.macroInput}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleLogMeal}
            style={styles.modalButton}
          >
            Save Meal
          </Button>

          <Button
            mode="outlined"
            onPress={() => setLogModalVisible(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
  },
  summaryText: {
    marginTop: 8,
    color: '#666',
  },
  mealCard: {
    marginBottom: 12,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  time: {
    color: '#666',
    marginTop: 4,
  },
  completedChip: {
    backgroundColor: '#4CAF50',
  },
  pendingChip: {
    backgroundColor: '#FFF9C4',
  },
  description: {
    color: '#666',
    marginBottom: 8,
  },
  target: {
    color: '#999',
    marginBottom: 12,
  },
  logButton: {
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#666',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  macroInput: {
    flex: 1,
  },
  modalButton: {
    marginTop: 8,
  },
});
