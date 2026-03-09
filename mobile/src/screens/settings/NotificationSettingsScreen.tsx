import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Switch, Button, List, Divider } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  registerForPushNotifications,
  scheduleDailyStreakReminder,
  cancelAllNotifications,
  getScheduledNotifications,
} from '../../services/notifications';

export default function NotificationSettingsScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [streakReminders, setStreakReminders] = useState(true);
  const [atRiskWarnings, setAtRiskWarnings] = useState(true);
  const [checkInReminders, setCheckInReminders] = useState(true);
  const [milestoneNotifications, setMilestoneNotifications] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    loadNotificationSettings();
    loadScheduledCount();
  }, []);

  const loadNotificationSettings = async () => {
    // Load settings from database or AsyncStorage
    // Placeholder for now
  };

  const loadScheduledCount = async () => {
    const scheduled = await getScheduledNotifications();
    setScheduledCount(scheduled.length);
  };

  const handleEnableNotifications = async (enabled: boolean) => {
    if (enabled && user) {
      const token = await registerForPushNotifications(user.id);
      if (token) {
        setNotificationsEnabled(true);
        Alert.alert('Success', 'Push notifications enabled!');
        
        // Schedule default daily reminder
        if (streakReminders) {
          await scheduleDailyStreakReminder(20, 0); // 8 PM default
        }
        
        await loadScheduledCount();
      } else {
        Alert.alert('Error', 'Failed to enable push notifications');
      }
    } else {
      setNotificationsEnabled(false);
      await cancelAllNotifications();
      await loadScheduledCount();
    }
  };

  const handleStreakReminders = async (enabled: boolean) => {
    setStreakReminders(enabled);
    if (enabled && notificationsEnabled) {
      await scheduleDailyStreakReminder(20, 0);
      Alert.alert('Enabled', 'Daily streak reminders will be sent at 8 PM');
      await loadScheduledCount();
    }
  };

  const testNotification = async () => {
    const { scheduleNotification } = await import('../../services/notifications');
    await scheduleNotification({
      title: 'Test Notification',
      body: 'This is a test notification from TINO',
      data: { test: true },
      trigger: { seconds: 2 },
    });
    Alert.alert('Scheduled', 'Test notification will appear in 2 seconds');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="displaySmall" style={styles.title}>Notifications</Text>

        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Enable Notifications"
              description="Allow TINO to send you push notifications"
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleEnableNotifications}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Notification Types
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Daily Streak Reminders"
              description="Remind me to complete my daily goals (8 PM)"
              right={() => (
                <Switch
                  value={streakReminders}
                  onValueChange={handleStreakReminders}
                  disabled={!notificationsEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="At-Risk Warnings"
              description="Alert me when a streak is about to break"
              right={() => (
                <Switch
                  value={atRiskWarnings}
                  onValueChange={setAtRiskWarnings}
                  disabled={!notificationsEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Check-In Reminders"
              description="Remind me when plan check-ins are due"
              right={() => (
                <Switch
                  value={checkInReminders}
                  onValueChange={setCheckInReminders}
                  disabled={!notificationsEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Milestone Celebrations"
              description="Notify me when I achieve milestones"
              right={() => (
                <Switch
                  value={milestoneNotifications}
                  onValueChange={setMilestoneNotifications}
                  disabled={!notificationsEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.infoTitle}>
              📱 About Notifications
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Notifications help you stay on track with your goals. We'll only send relevant reminders and never spam you.
              {'\n\n'}
              Currently scheduled: {scheduledCount} notification{scheduledCount !== 1 ? 's' : ''}
            </Text>
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={testNotification}
          style={styles.testButton}
          disabled={!notificationsEnabled}
        >
          Send Test Notification
        </Button>

        <Button
          mode="text"
          onPress={async () => {
            await cancelAllNotifications();
            await loadScheduledCount();
            Alert.alert('Cleared', 'All scheduled notifications cleared');
          }}
          style={styles.clearButton}
          disabled={!notificationsEnabled}
        >
          Clear All Scheduled Notifications
        </Button>
      </ScrollView>
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
    marginTop: 24,
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  infoCard: {
    marginTop: 24,
    backgroundColor: '#E3F2FD',
  },
  infoTitle: {
    marginBottom: 12,
  },
  infoText: {
    lineHeight: 20,
  },
  testButton: {
    marginTop: 24,
  },
  clearButton: {
    marginTop: 8,
  },
});
