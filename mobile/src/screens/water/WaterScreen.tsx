import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, FAB, Portal, Modal, TextInput, ProgressBar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { setDailyTarget, addWaterLog } from '../../store/slices/waterSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WaterLog } from '../../types';

const QUICK_AMOUNTS = [250, 500, 750, 1000]; // ml

export default function WaterScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { dailyTarget, waterLogs } = useSelector((state: RootState) => state.water);
  const { activePlans } = useSelector((state: RootState) => state.plan);
  const [loading, setLoading] = useState(true);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    loadWaterPlan();
  }, []);

  const loadWaterPlan = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get active water plan
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'water')
        .eq('is_active', true)
        .single();

      if (planError) throw planError;

      const target = planData.data?.daily_target_ml || 2000;
      dispatch(setDailyTarget(target));

      // Get today's logs
      const today = new Date().toISOString().split('T')[0];
      const { data: logsData, error: logsError } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00`)
        .lte('logged_at', `${today}T23:59:59`)
        .order('logged_at', { ascending: false });

      if (logsError) throw logsError;

      // Set logs in Redux (you'll need to add this action)
    } catch (error) {
      console.error('Error loading water plan:', error);
      Alert.alert('Error', 'Failed to load water tracking');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLog = async (amount: number) => {
    await logWater(amount);
  };

  const handleCustomLog = async () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    await logWater(amount);
    setCustomAmount('');
    setCustomModalVisible(false);
  };

  const logWater = async (amountMl: number) => {
    if (!user) return;

    try {
      const waterLog: Partial<WaterLog> = {
        user_id: user.id,
        amount_ml: amountMl,
        logged_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('water_logs')
        .insert(waterLog)
        .select()
        .single();

      if (error) throw error;

      dispatch(addWaterLog(data));
    } catch (error) {
      console.error('Error logging water:', error);
      Alert.alert('Error', 'Failed to log water intake');
    }
  };

  const getTotalIntake = () => {
    return waterLogs.reduce((sum, log) => sum + log.amount_ml, 0);
  };

  const getProgress = () => {
    const total = getTotalIntake();
    return Math.min(total / dailyTarget, 1);
  };

  const getRemainingAmount = () => {
    const remaining = dailyTarget - getTotalIntake();
    return Math.max(remaining, 0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading water tracking...</Text>
      </SafeAreaView>
    );
  }

  if (!activePlans.water) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Active Water Plan
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Complete onboarding to set up your water tracking.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="displaySmall" style={styles.title}>Water Intake</Text>

        <Card style={styles.progressCard}>
          <Card.Content>
            <Text variant="displayMedium" style={styles.progressNumber}>
              {getTotalIntake()} ml
            </Text>
            <Text variant="bodyLarge" style={styles.progressTarget}>
              of {dailyTarget} ml goal
            </Text>
            
            <ProgressBar
              progress={getProgress()}
              style={styles.progressBar}
              color="#2196F3"
            />

            {getRemainingAmount() > 0 ? (
              <Text variant="bodyMedium" style={styles.remaining}>
                {getRemainingAmount()} ml remaining
              </Text>
            ) : (
              <Text variant="bodyMedium" style={styles.completed}>
                🎉 Daily goal achieved!
              </Text>
            )}
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Quick Log
        </Text>

        <View style={styles.quickButtons}>
          {QUICK_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              mode="contained"
              onPress={() => handleQuickLog(amount)}
              style={styles.quickButton}
              contentStyle={styles.quickButtonContent}
            >
              {amount} ml
            </Button>
          ))}
        </View>

        <Button
          mode="outlined"
          onPress={() => setCustomModalVisible(true)}
          style={styles.customButton}
          icon="pencil"
        >
          Custom Amount
        </Button>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Today's Log
        </Text>

        {waterLogs.length === 0 ? (
          <Text style={styles.emptyLog}>No water logged yet today</Text>
        ) : (
          <View style={styles.logList}>
            {waterLogs.map((log, index) => (
              <Card key={log.id || index} style={styles.logCard}>
                <Card.Content style={styles.logContent}>
                  <Text variant="titleMedium">{log.amount_ml} ml</Text>
                  <Text variant="bodySmall" style={styles.logTime}>
                    {new Date(log.logged_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={customModalVisible}
          onDismiss={() => setCustomModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Log Custom Amount
          </Text>

          <TextInput
            label="Amount (ml)"
            value={customAmount}
            onChangeText={setCustomAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleCustomLog}
            style={styles.modalButton}
          >
            Log Water
          </Button>

          <Button
            mode="outlined"
            onPress={() => setCustomModalVisible(false)}
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
  progressCard: {
    marginBottom: 24,
    backgroundColor: '#E3F2FD',
  },
  progressNumber: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  progressTarget: {
    color: '#666',
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  remaining: {
    color: '#666',
  },
  completed: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  quickButton: {
    flex: 1,
    minWidth: '45%',
  },
  quickButtonContent: {
    paddingVertical: 8,
  },
  customButton: {
    marginBottom: 24,
  },
  emptyLog: {
    textAlign: 'center',
    color: '#999',
    padding: 24,
  },
  logList: {
    gap: 8,
  },
  logCard: {
    marginBottom: 8,
  },
  logContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logTime: {
    color: '#666',
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
  modalButton: {
    marginTop: 8,
  },
});
