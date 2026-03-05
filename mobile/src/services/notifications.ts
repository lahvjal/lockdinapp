// Push Notifications Service
// Handles registration, scheduling, and sending notifications

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationConfig {
  title: string;
  body: string;
  data?: any;
  trigger?: Notifications.NotificationTriggerInput;
}

/**
 * Register for push notifications and save token to database
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Save token to database
    await supabase
      .from('user_profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleNotification(
  config: NotificationConfig
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: config.body,
        data: config.data || {},
      },
      trigger: config.trigger || null, // null = immediate
    });

    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Schedule daily streak reminder
 */
export async function scheduleDailyStreakReminder(hour: number = 20, minute: number = 0): Promise<string | null> {
  return await scheduleNotification({
    title: '🔥 Keep Your Streak Alive!',
    body: "Don't forget to complete your daily goals",
    data: { type: 'streak_reminder' },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

/**
 * Schedule streak at-risk warning (category specific)
 */
export async function scheduleStreakWarning(category: string, hoursRemaining: number): Promise<string | null> {
  const categoryEmojis = {
    workout: '💪',
    meals: '🍽️',
    water: '💧',
    sleep: '😴',
  };

  return await scheduleNotification({
    title: `${categoryEmojis[category as keyof typeof categoryEmojis] || '⚠️'} Streak At Risk!`,
    body: `Only ${hoursRemaining} hours left to log your ${category}`,
    data: { type: 'streak_warning', category },
    trigger: {
      seconds: 60, // Show in 1 minute (for testing, adjust as needed)
    },
  });
}

/**
 * Schedule check-in reminder for a plan
 */
export async function scheduleCheckInReminder(planName: string, daysUntil: number): Promise<string | null> {
  return await scheduleNotification({
    title: '📋 Plan Check-In Reminder',
    body: `Your "${planName}" check-in is in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
    data: { type: 'checkin_reminder', plan_name: planName },
    trigger: {
      seconds: 60 * 60 * 24 * daysUntil, // Notify N days before
    },
  });
}

/**
 * Send milestone achievement notification
 */
export async function notifyMilestoneAchieved(milestone: string, badge?: string): Promise<string | null> {
  return await scheduleNotification({
    title: '🎉 Milestone Achieved!',
    body: milestone,
    data: { type: 'milestone', badge },
    trigger: null, // Immediate
  });
}

/**
 * Notify user of plan expiration
 */
export async function notifyPlanExpiring(planName: string, daysRemaining: number): Promise<string | null> {
  return await scheduleNotification({
    title: '⏰ Plan Ending Soon',
    body: `Your "${planName}" plan ends in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
    data: { type: 'plan_expiring', plan_name: planName },
    trigger: null,
  });
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}
