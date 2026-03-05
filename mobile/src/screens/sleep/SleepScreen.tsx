import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Portal, Modal, TextInput, Chip } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { setSleepLog } from '../../store/slices/sleepSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SleepLog } from '../../types';

export default function SleepScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sleepLog } = useSelector((state: RootState) => state.sleep);
  const { activePlans } = useSelector((state: RootState) => state.plan);
  const [loading, setLoading] = useState(true);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [notes, setNotes] = useState('');
  const [recoveryScore, setRecoveryScore] = useState('');

  useEffect(() => {
    loadTodaysSleep();
  }, []);

  const loadTodaysSleep = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get today's sleep log
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', today)
        .lte('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

      if (data) {
        dispatch(setSleepLog(data));
      }
    } catch (error) {
      console.error('Error loading sleep data:', error);
      Alert.alert('Error', 'Failed to load sleep data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogSleep = async () => {
    if (!user || !hours) {
      Alert.alert('Error', 'Please enter hours of sleep');
      return;
    }

    const hoursValue = parseFloat(hours);
    if (isNaN(hoursValue) || hoursValue < 0 || hoursValue > 24) {
      Alert.alert('Error', 'Please enter valid hours (0-24)');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const sleepData: Partial<SleepLog> = {
        user_id: user.id,
        date: today,
        hours: hoursValue,
        quality,
        notes: notes || null,
        recovery_score: recoveryScore ? parseInt(recoveryScore) : null,
      };

      const { data, error } = await supabase
        .from('sleep_logs')
        .upsert(sleepData, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (error) throw error;

      dispatch(setSleepLog(data));
      setLogModalVisible(false);
      
      // Reset form
      setHours('');
      setQuality('good');
      setNotes('');
      setRecoveryScore('');
      
      Alert.alert('Success', 'Sleep data logged successfully!');
    } catch (error) {
      console.error('Error logging sleep:', error);
      Alert.alert('Error', 'Failed to log sleep data');
    }
  };

  const getTargetHours = () => {
    if (!activePlans.sleep) return 8;
    return activePlans.sleep.data?.target_hours || 8;
  };

  const getSleepStatus = () => {
    if (!sleepLog) return null;
    
    const target = getTargetHours();
    const actual = sleepLog.hours;
    const difference = actual - target;

    if (difference >= 0) {
      return {
        status: 'Met',
        color: '#4CAF50',
        message: 'Great job! You got enough sleep.',
      };
    } else if (difference >= -1) {
      return {
        status: 'Close',
        color: '#FF9800',
        message: 'Almost there! Try to get a bit more sleep.',
      };
    } else {
      return {
        status: 'Below',
        color: '#F44336',
        message: 'Consider getting more sleep for better recovery.',
      };
    }
  };

  const getQualityColor = (q: string) => {
    switch (q) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FF9800';
      case 'poor': return '#F44336';
      default: return '#999';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading sleep data...</Text>
      </SafeAreaView>
    );
  }

  if (!activePlans.sleep) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Active Sleep Plan
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Complete onboarding to set up your sleep tracking.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = getSleepStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="displaySmall" style={styles.title}>Sleep & Recovery</Text>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.targetText}>
              Target: {getTargetHours()} hours per night
            </Text>
          </Card.Content>
        </Card>

        {sleepLog ? (
          <>
            <Card style={[styles.statusCard, { borderLeftColor: status?.color, borderLeftWidth: 4 }]}>
              <Card.Content>
                <Text variant="displayMedium" style={styles.hoursText}>
                  {sleepLog.hours} hours
                </Text>
                <Text variant="titleMedium" style={[styles.statusText, { color: status?.color }]}>
                  {status?.status}
                </Text>
                <Text variant="bodyMedium" style={styles.statusMessage}>
                  {status?.message}
                </Text>

                <View style={styles.qualityRow}>
                  <Text variant="bodyMedium">Quality:</Text>
                  <Chip
                    style={[styles.qualityChip, { backgroundColor: getQualityColor(sleepLog.quality) }]}
                    textStyle={styles.qualityText}
                  >
                    {sleepLog.quality.toUpperCase()}
                  </Chip>
                </View>

                {sleepLog.recovery_score && (
                  <View style={styles.recoveryRow}>
                    <Text variant="bodyMedium">Recovery Score:</Text>
                    <Text variant="titleMedium" style={styles.recoveryScore}>
                      {sleepLog.recovery_score}/100
                    </Text>
                  </View>
                )}

                {sleepLog.notes && (
                  <View style={styles.notesSection}>
                    <Text variant="bodySmall" style={styles.notesLabel}>Notes:</Text>
                    <Text variant="bodyMedium">{sleepLog.notes}</Text>
                  </View>
                )}

                <Button
                  mode="outlined"
                  onPress={() => {
                    setHours(sleepLog.hours.toString());
                    setQuality(sleepLog.quality);
                    setNotes(sleepLog.notes || '');
                    setRecoveryScore(sleepLog.recovery_score?.toString() || '');
                    setLogModalVisible(true);
                  }}
                  style={styles.updateButton}
                >
                  Update
                </Button>
              </Card.Content>
            </Card>

            <Card style={styles.infoCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.infoTitle}>
                  💡 Sleep Tips
                </Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  • Aim for consistent sleep/wake times{'\n'}
                  • Avoid screens 1 hour before bed{'\n'}
                  • Keep your room cool and dark{'\n'}
                  • Consider a wind-down routine
                </Text>
              </Card.Content>
            </Card>
          </>
        ) : (
          <Card style={styles.emptyLogCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.emptyLogTitle}>
                No sleep logged today
              </Text>
              <Text variant="bodyMedium" style={styles.emptyLogText}>
                Log your sleep from last night to track your recovery.
              </Text>
              <Button
                mode="contained"
                onPress={() => setLogModalVisible(true)}
                style={styles.logButton}
              >
                Log Last Night's Sleep
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={logModalVisible}
          onDismiss={() => setLogModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Log Sleep
            </Text>

            <TextInput
              label="Hours of Sleep"
              value={hours}
              onChangeText={setHours}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="e.g., 7.5"
            />

            <Text variant="titleSmall" style={styles.sectionTitle}>
              Sleep Quality
            </Text>

            <View style={styles.qualityOptions}>
              {(['poor', 'fair', 'good', 'excellent'] as const).map((q) => (
                <Chip
                  key={q}
                  selected={quality === q}
                  onPress={() => setQuality(q)}
                  style={[
                    styles.qualityOption,
                    quality === q && { backgroundColor: getQualityColor(q) }
                  ]}
                  textStyle={quality === q && styles.selectedQualityText}
                >
                  {q.charAt(0).toUpperCase() + q.slice(1)}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Recovery Score (0-100, optional)"
              value={recoveryScore}
              onChangeText={setRecoveryScore}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              placeholder="e.g., 85"
            />

            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Any observations about your sleep..."
            />

            <Button
              mode="contained"
              onPress={handleLogSleep}
              style={styles.modalButton}
            >
              Save
            </Button>

            <Button
              mode="outlined"
              onPress={() => setLogModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
          </ScrollView>
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
    backgroundColor: '#E8EAF6',
  },
  targetText: {
    color: '#666',
  },
  statusCard: {
    marginBottom: 16,
  },
  hoursText: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statusText: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusMessage: {
    color: '#666',
    marginTop: 8,
    marginBottom: 16,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  qualityChip: {
    height: 28,
  },
  qualityText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  recoveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  recoveryScore: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  notesSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  notesLabel: {
    color: '#666',
    marginBottom: 4,
  },
  updateButton: {
    marginTop: 16,
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: '#FFF9C4',
  },
  infoTitle: {
    marginBottom: 12,
  },
  infoText: {
    lineHeight: 20,
  },
  emptyLogCard: {
    padding: 16,
  },
  emptyLogTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyLogText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
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
    maxHeight: '90%',
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
  qualityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  qualityOption: {
    minWidth: '22%',
  },
  selectedQualityText: {
    color: '#fff',
  },
  modalButton: {
    marginTop: 8,
  },
});
