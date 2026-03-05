import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Portal, Modal, TextInput, RadioButton } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plan } from '../../types';

interface PlanWithStats extends Plan {
  days_active: number;
  completion_rate: number;
  time_remaining?: number;
  next_checkin?: string;
}

export default function PlanManagementScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activePlans, setActivePlans] = useState<PlanWithStats[]>([]);
  const [archivedPlans, setArchivedPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanWithStats | null>(null);
  const [newEndDate, setNewEndDate] = useState('');
  const [newCheckInInterval, setNewCheckInInterval] = useState('7');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get active plans
      const { data: activePlansData, error: activeError } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (activeError) throw activeError;

      // Enrich with stats
      const enrichedPlans = await Promise.all(
        (activePlansData || []).map(async (plan) => {
          const stats = await getPlanStats(plan);
          return { ...plan, ...stats };
        })
      );

      setActivePlans(enrichedPlans);

      // Get archived plans
      const { data: archivedPlansData, error: archivedError } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['archived', 'completed'])
        .order('updated_at', { ascending: false })
        .limit(10);

      if (archivedError) throw archivedError;

      setArchivedPlans(archivedPlansData || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      Alert.alert('Error', 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const getPlanStats = async (plan: Plan): Promise<any> => {
    const createdDate = new Date(plan.created_at);
    const today = new Date();
    const daysActive = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate completion rate based on category
    let completionRate = 0;
    // This would query actual logs - simplified for now
    completionRate = Math.random() * 100; // Placeholder

    let timeRemaining: number | undefined;
    let nextCheckin: string | undefined;

    if (plan.data?.duration_mode === 'fixed' && plan.data?.end_date) {
      const endDate = new Date(plan.data.end_date);
      timeRemaining = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (plan.data?.duration_mode === 'check_in' && plan.data?.check_in_interval_days) {
      const lastCheckIn = plan.data?.last_check_in_date 
        ? new Date(plan.data.last_check_in_date)
        : createdDate;
      
      const nextCheckInDate = new Date(lastCheckIn);
      nextCheckInDate.setDate(nextCheckInDate.getDate() + plan.data.check_in_interval_days);
      nextCheckin = nextCheckInDate.toISOString().split('T')[0];
    }

    return {
      days_active: daysActive,
      completion_rate: Math.round(completionRate),
      time_remaining: timeRemaining,
      next_checkin: nextCheckin,
    };
  };

  const handleEditPlan = (plan: PlanWithStats) => {
    setSelectedPlan(plan);
    if (plan.data?.end_date) {
      setNewEndDate(plan.data.end_date);
    }
    if (plan.data?.check_in_interval_days) {
      setNewCheckInInterval(plan.data.check_in_interval_days.toString());
    }
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPlan) return;

    try {
      const updates: any = { ...selectedPlan.data };

      if (selectedPlan.data?.duration_mode === 'fixed' && newEndDate) {
        updates.end_date = newEndDate;
      }

      if (selectedPlan.data?.duration_mode === 'check_in' && newCheckInInterval) {
        updates.check_in_interval_days = parseInt(newCheckInInterval);
      }

      const { error } = await supabase
        .from('plans')
        .update({ data: updates })
        .eq('id', selectedPlan.id);

      if (error) throw error;

      Alert.alert('Success', 'Plan updated successfully');
      setEditModalVisible(false);
      await loadPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      Alert.alert('Error', 'Failed to update plan');
    }
  };

  const handleArchivePlan = async () => {
    if (!selectedPlan) return;

    try {
      const { error } = await supabase
        .from('plans')
        .update({ 
          status: 'archived',
          config: { ...selectedPlan.config, archived_at: new Date().toISOString() }
        })
        .eq('id', selectedPlan.id);

      if (error) throw error;

      Alert.alert('Success', 'Plan archived successfully');
      setArchiveModalVisible(false);
      await loadPlans();
    } catch (error) {
      console.error('Error archiving plan:', error);
      Alert.alert('Error', 'Failed to archive plan');
    }
  };

  const handleCompletePlan = async (plan: PlanWithStats) => {
    Alert.alert(
      'Complete Plan',
      'Mark this plan as completed? It will be archived and you can create a new one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('plans')
                .update({ 
                  status: 'completed',
                  config: { 
                    ...plan.config, 
                    completed_at: new Date().toISOString(),
                  }
                })
                .eq('id', plan.id);

              if (error) throw error;

              Alert.alert('Success', 'Plan completed! 🎉');
              await loadPlans();
            } catch (error) {
              console.error('Error completing plan:', error);
              Alert.alert('Error', 'Failed to complete plan');
            }
          },
        },
      ]
    );
  };

  const handleCheckIn = async (plan: PlanWithStats) => {
    Alert.alert(
      'Check-In',
      'How would you like to continue with this plan?',
      [
        {
          text: 'Continue',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('plans')
                .update({ 
                  data: { 
                    ...plan.data, 
                    last_check_in_date: new Date().toISOString(),
                    check_in_response: 'continue'
                  }
                })
                .eq('id', plan.id);

              if (error) throw error;

              Alert.alert('Great!', 'Keep up the good work!');
              await loadPlans();
            } catch (error) {
              console.error('Error updating check-in:', error);
            }
          },
        },
        {
          text: 'Modify',
          onPress: () => handleEditPlan(plan),
        },
        {
          text: 'Complete',
          onPress: () => handleCompletePlan(plan),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getDurationModeLabel = (mode: string) => {
    switch (mode) {
      case 'indefinite': return 'Ongoing';
      case 'fixed': return 'Fixed Duration';
      case 'check_in': return 'Check-In Based';
      default: return 'Unknown';
    }
  };

  const getDurationModeColor = (mode: string) => {
    switch (mode) {
      case 'indefinite': return '#4CAF50';
      case 'fixed': return '#2196F3';
      case 'check_in': return '#FF9800';
      default: return '#999';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading plans...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="displaySmall" style={styles.title}>My Plans</Text>

        <Text variant="titleLarge" style={styles.sectionTitle}>Active Plans</Text>

        {activePlans.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No active plans. Complete onboarding to create your first plan.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          activePlans.map((plan) => (
            <Card key={plan.id} style={styles.planCard}>
              <Card.Content>
                <View style={styles.planHeader}>
                  <View>
                    <Text variant="titleLarge">{plan.name || 'Unnamed Plan'}</Text>
                    <Text variant="bodySmall" style={styles.categoryText}>
                      {plan.type?.toUpperCase()}
                    </Text>
                  </View>
                  <Chip 
                    style={[styles.modeChip, { backgroundColor: getDurationModeColor(plan.data?.duration_mode || 'indefinite') }]}
                    textStyle={styles.modeChipText}
                  >
                    {getDurationModeLabel(plan.data?.duration_mode || 'indefinite')}
                  </Chip>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text variant="bodySmall" style={styles.statLabel}>Days Active</Text>
                    <Text variant="titleMedium">{plan.days_active}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text variant="bodySmall" style={styles.statLabel}>Completion</Text>
                    <Text variant="titleMedium">{plan.completion_rate}%</Text>
                  </View>
                  {plan.time_remaining !== undefined && (
                    <View style={styles.stat}>
                      <Text variant="bodySmall" style={styles.statLabel}>Days Left</Text>
                      <Text variant="titleMedium" style={plan.time_remaining < 7 ? styles.urgentText : undefined}>
                        {plan.time_remaining}
                      </Text>
                    </View>
                  )}
                </View>

                {plan.next_checkin && (
                  <View style={styles.checkinBanner}>
                    <Text variant="bodySmall">
                      Next check-in: {new Date(plan.next_checkin).toLocaleDateString()}
                    </Text>
                    <Button
                      mode="text"
                      compact
                      onPress={() => handleCheckIn(plan)}
                    >
                      Check In Now
                    </Button>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <Button
                    mode="text"
                    onPress={() => handleEditPlan(plan)}
                    icon="pencil"
                  >
                    Edit
                  </Button>
                  {plan.data?.duration_mode === 'fixed' && plan.time_remaining !== undefined && plan.time_remaining <= 0 && (
                    <Button
                      mode="contained"
                      onPress={() => handleCompletePlan(plan)}
                      icon="check"
                    >
                      Complete
                    </Button>
                  )}
                  <Button
                    mode="text"
                    onPress={() => {
                      setSelectedPlan(plan);
                      setArchiveModalVisible(true);
                    }}
                    icon="archive"
                  >
                    Archive
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        {archivedPlans.length > 0 && (
          <>
            <Text variant="titleLarge" style={styles.sectionTitle}>Archived Plans</Text>
            {archivedPlans.map((plan) => (
              <Card key={plan.id} style={styles.archivedCard}>
                <Card.Content>
                  <Text variant="titleMedium">{plan.name || 'Unnamed Plan'}</Text>
                  <Text variant="bodySmall" style={styles.archivedText}>
                    {plan.type?.toUpperCase()} • Archived {new Date(plan.updated_at).toLocaleDateString()}
                  </Text>
                  {plan.data?.completion_status === 'completed' && (
                    <Chip style={styles.completedChip} textStyle={styles.completedChipText}>
                      ✓ Completed
                    </Chip>
                  )}
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Edit Plan
          </Text>

          {selectedPlan?.data?.duration_mode === 'fixed' && (
            <TextInput
              label="End Date (YYYY-MM-DD)"
              value={newEndDate}
              onChangeText={setNewEndDate}
              mode="outlined"
              style={styles.input}
            />
          )}

          {selectedPlan?.data?.duration_mode === 'check_in' && (
            <TextInput
              label="Check-in Interval (days)"
              value={newCheckInInterval}
              onChangeText={setNewCheckInInterval}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          )}

          <Button
            mode="contained"
            onPress={handleSaveEdit}
            style={styles.modalButton}
          >
            Save Changes
          </Button>

          <Button
            mode="outlined"
            onPress={() => setEditModalVisible(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
        </Modal>

        <Modal
          visible={archiveModalVisible}
          onDismiss={() => setArchiveModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Archive Plan?
          </Text>

          <Text variant="bodyMedium" style={styles.modalText}>
            This will deactivate the plan and move it to your archived plans. You can't undo this action.
          </Text>

          <Button
            mode="contained"
            onPress={handleArchivePlan}
            style={styles.modalButton}
          >
            Archive
          </Button>

          <Button
            mode="outlined"
            onPress={() => setArchiveModalVisible(false)}
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
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  planCard: {
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    color: '#666',
    marginTop: 4,
  },
  modeChip: {
    height: 28,
  },
  modeChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#666',
    marginBottom: 4,
  },
  urgentText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  checkinBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  archivedCard: {
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  archivedText: {
    color: '#666',
    marginTop: 4,
  },
  completedChip: {
    marginTop: 8,
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
  },
  completedChipText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyCard: {
    marginBottom: 16,
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
  modalText: {
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 8,
  },
});
