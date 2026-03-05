# Push Notifications Setup Guide

This guide explains how to set up and use push notifications in the LockdIn app.

## Overview

LockdIn uses Expo Notifications to send:
- Daily streak reminders
- At-risk streak warnings
- Plan check-in reminders
- Milestone achievement celebrations
- Plan expiration alerts

## Prerequisites

1. **Install dependencies:**
   ```bash
   cd mobile
   npx expo install expo-notifications expo-device expo-constants
   ```

2. **Update app.json:**
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./assets/notification-icon.png",
             "color": "#1976D2",
             "sounds": ["./assets/notification-sound.wav"]
           }
         ]
       ],
       "notification": {
         "icon": "./assets/notification-icon.png",
         "color": "#1976D2",
         "androidMode": "default",
         "androidCollapsedTitle": "LockdIn"
       }
     }
   }
   ```

3. **iOS: Add notification entitlements**
   - The app needs notification permissions configured in the iOS project

4. **Android: No additional setup needed**
   - Notifications work out of the box on Android

## Database Updates

Add `push_token` column to `user_profiles` table:

```sql
ALTER TABLE user_profiles ADD COLUMN push_token TEXT;
CREATE INDEX idx_user_profiles_push_token ON user_profiles(push_token);
```

## Notification Types

### 1. Daily Streak Reminders
- **When**: 8 PM daily (configurable)
- **Purpose**: Remind users to complete their daily goals
- **Trigger**: Scheduled repeating notification

### 2. At-Risk Warnings
- **When**: When a streak hasn't been completed and time is running out
- **Purpose**: Prevent streak breaks
- **Trigger**: Calculated based on last completion time

### 3. Check-In Reminders
- **When**: 2 days before check-in is due
- **Purpose**: Prompt users to review their plans
- **Trigger**: Scheduled based on check-in interval

### 4. Milestone Celebrations
- **When**: Immediately upon achievement
- **Purpose**: Celebrate user progress
- **Trigger**: Instant notification
- **Examples**:
  - 7-day streak
  - 30-day streak
  - 100 workouts logged
  - First week complete

### 5. Plan Expiration Alerts
- **When**: 3 days and 1 day before plan ends
- **Purpose**: Remind users to complete or extend plans
- **Trigger**: Scheduled based on plan end date

## Implementation

### Registration

Users must explicitly enable notifications in the app:

```typescript
import { registerForPushNotifications } from '../services/notifications';

// In your component
const token = await registerForPushNotifications(userId);
if (token) {
  console.log('Push token:', token);
}
```

### Scheduling Notifications

```typescript
import { scheduleNotification } from '../services/notifications';

// Schedule a notification
await scheduleNotification({
  title: 'Workout Time!',
  body: "Don't forget to log your workout today",
  data: { category: 'workout' },
  trigger: {
    hour: 18,
    minute: 0,
    repeats: true,
  },
});
```

### Edge Function Integration

The `check-plan-lifecycle` Edge Function can trigger notifications:

```typescript
// In Edge Function
const { data, error } = await supabaseClient
  .from('user_profiles')
  .select('push_token')
  .eq('id', userId)
  .single();

if (data?.push_token) {
  // Send notification via Expo Push API
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: data.push_token,
      title: 'Check-In Due',
      body: 'Your plan check-in is due today',
      data: { type: 'checkin_reminder' },
    }),
  });
}
```

## Notification Settings Screen

Users can control notifications in Settings:

- **Enable/Disable**: Master switch for all notifications
- **Daily Reminders**: Toggle daily streak reminders
- **At-Risk Warnings**: Toggle streak at-risk alerts
- **Check-In Reminders**: Toggle plan check-in notifications
- **Milestone Celebrations**: Toggle achievement notifications

## Testing

Use the test notification button in settings:

```typescript
await scheduleNotification({
  title: 'Test Notification',
  body: 'This is a test',
  data: { test: true },
  trigger: { seconds: 2 }, // 2 seconds from now
});
```

## Best Practices

1. **Always request permission** before scheduling notifications
2. **Respect user preferences** - honor notification settings
3. **Avoid notification spam** - limit frequency
4. **Provide value** - only send helpful reminders
5. **Test thoroughly** - verify notifications work on both iOS and Android
6. **Handle foreground notifications** - show alerts when app is open
7. **Deep linking** - navigate to relevant screens when notification is tapped

## Notification Channels (Android)

Create channels for different notification types:

```typescript
await Notifications.setNotificationChannelAsync('streaks', {
  name: 'Streak Reminders',
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'default',
});

await Notifications.setNotificationChannelAsync('milestones', {
  name: 'Milestone Celebrations',
  importance: Notifications.AndroidImportance.MAX,
  sound: 'celebration.wav',
});
```

## Handling Notification Responses

```typescript
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

// In your root component
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data.type === 'streak_warning') {
      navigation.navigate('Streaks');
    } else if (data.type === 'checkin_reminder') {
      navigation.navigate('Plans');
    }
  });

  return () => subscription.remove();
}, []);
```

## Troubleshooting

### iOS: Notifications not appearing
- Check notification permissions in iOS Settings
- Ensure app is built with proper entitlements
- Verify notification handler is configured

### Android: Notifications not appearing
- Check notification channel importance
- Verify app has notification permission
- Ensure background services aren't restricted

### Push token not generated
- Must use physical device (not simulator)
- Check network connectivity
- Verify Expo project configuration

## Production Considerations

1. **Use Expo's push notification service** for reliability
2. **Store push tokens** in database for server-side notifications
3. **Handle token refresh** when tokens expire
4. **Monitor delivery rates** to ensure notifications reach users
5. **Implement retry logic** for failed notifications
6. **Batch notifications** for efficiency
7. **Time zone handling** for scheduled notifications

## Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Testing Push Notifications](https://docs.expo.dev/push-notifications/testing/)
