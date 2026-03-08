import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';
import { setSession } from '../../store/slices/authSlice';
import { setActivePlans, setScheduledPlans } from '../../store/slices/planSlice';
import { setStreaks, setCompletionPercentage } from '../../store/slices/streakSlice';
import { restoreSession } from '../../store/slices/workoutSessionSlice';
import { WORKOUT_SESSION_STORAGE_KEY } from '../../store/store';
import AppNavigator from '../../navigation/AppNavigator';
import { Plan, Streak } from '../../types';

async function bootstrapUserData(userId: string, dispatch: any) {
  try {
    // Load active plans
    const { data: plans } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'scheduled']);

    if (plans) {
      const activePlans: { workout?: Plan; meal?: Plan; water?: Plan; sleep?: Plan } = {};
      const scheduledPlans: Plan[] = [];
      plans.forEach((plan: Plan) => {
        if (plan.status === 'scheduled') {
          scheduledPlans.push(plan);
        } else if (plan.type === 'workout') activePlans.workout = plan;
        else if (plan.type === 'meal') activePlans.meal = plan;
        else if (plan.type === 'water') activePlans.water = plan;
        else if (plan.type === 'sleep') activePlans.sleep = plan;
      });
      dispatch(setActivePlans(activePlans));
      dispatch(setScheduledPlans(scheduledPlans));
    }

    // Load streaks
    const { data: streakRows } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId);

    if (streakRows) {
      const streakMap: Record<string, Streak> = {};
      streakRows.forEach((s: Streak) => { streakMap[s.category] = s; });
      dispatch(setStreaks({
        workout: streakMap.workout ?? null,
        meal: streakMap.meal ?? null,
        water: streakMap.water ?? null,
        sleep: streakMap.sleep ?? null,
        overall: streakMap.overall ?? null,
      }));

      // Derive today's completion % from overall streak last_log_date
      const today = new Date().toISOString().split('T')[0];
      const overall = streakMap.overall;
      const loggedToday = overall?.last_log_date?.startsWith(today);
      dispatch(setCompletionPercentage(loggedToday ? 100 : 0));
    }
  } catch (err) {
    console.error('Error bootstrapping user data:', err);
  }
}

function extractTokensFromUrl(url: string) {
  // Supabase puts tokens in the URL hash fragment: #access_token=...&refresh_token=...
  const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '';
  const params = new URLSearchParams(fragment);
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
  };
}

async function handleOAuthUrl(url: string, dispatch: any) {
  const { accessToken, refreshToken } = extractTokensFromUrl(url);
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error && data.session) {
      dispatch(setSession(data.session));
      await bootstrapUserData(data.session.user.id, dispatch);
    }
  }
}

export default function AuthProvider({ children }: { children?: React.ReactNode }) {
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Restore session on launch
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      dispatch(setSession(session));
      if (session?.user) {
        await bootstrapUserData(session.user.id, dispatch);
      }

      // Attempt to restore an in-progress workout session that survived a crash
      try {
        const raw = await AsyncStorage.getItem(WORKOUT_SESSION_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          // Only restore if the session was active (not complete/idle)
          if (saved?.status === 'active' && saved?.workoutId) {
            dispatch(restoreSession(saved));
          }
        }
      } catch (_) {}

      setInitializing(false);
    });

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      dispatch(setSession(session));
      if (event === 'SIGNED_IN' && session?.user) {
        await bootstrapUserData(session.user.id, dispatch);
      }
      if (event === 'SIGNED_OUT') {
        dispatch(setActivePlans({}));
        dispatch(setScheduledPlans([]));
      }
    });

    // Handle OAuth deep link callbacks (Google/Apple via exp:// in Expo Go)
    // When the browser redirects to exp://localhost:8081/--/auth/callback#access_token=...
    // iOS closes the browser and sends the URL here via Linking.
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url.includes('access_token')) {
        handleOAuthUrl(url, dispatch);
      }
    };

    // Handle the case where the app was cold-launched from the OAuth redirect
    Linking.getInitialURL().then((url) => {
      if (url?.includes('access_token')) {
        handleOAuthUrl(url, dispatch);
      }
    });

    const linkingSub = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, [dispatch]);

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
