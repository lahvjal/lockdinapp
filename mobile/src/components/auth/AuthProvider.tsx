import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';
import { setSession, setBootstrapping, setOnboarded } from '../../store/slices/authSlice';
import { setActivePlans, setScheduledPlans } from '../../store/slices/planSlice';
import { setStreaks, setCompletionPercentage } from '../../store/slices/streakSlice';
import { restoreSession } from '../../store/slices/workoutSessionSlice';
import { WORKOUT_SESSION_STORAGE_KEY } from '../../store/store';
import AppNavigator from '../../navigation/AppNavigator';
import { Plan, Streak } from '../../types';

async function bootstrapUserData(userId: string, dispatch: any) {
  console.log('[Bootstrap] Starting for user:', userId);
  try {
    console.log('[Bootstrap] Fetching plans...');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'scheduled']);

    if (plansError) console.error('[Bootstrap] Plans fetch error:', plansError);

    if (plans) {
      console.log('[Bootstrap] Plans fetched:', plans.length, 'rows');
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
      console.log('[Bootstrap] Active plans:', Object.keys(activePlans));
      dispatch(setActivePlans(activePlans));
      dispatch(setScheduledPlans(scheduledPlans));
    }

    console.log('[Bootstrap] Fetching streaks...');
    const { data: streakRows, error: streaksError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId);

    if (streaksError) console.error('[Bootstrap] Streaks fetch error:', streaksError);

    if (streakRows) {
      console.log('[Bootstrap] Streaks fetched:', streakRows.length, 'rows');
      const streakMap: Record<string, Streak> = {};
      streakRows.forEach((s: Streak) => { streakMap[s.category] = s; });
      dispatch(setStreaks({
        workout: streakMap.workout ?? null,
        meal: streakMap.meal ?? null,
        water: streakMap.water ?? null,
        sleep: streakMap.sleep ?? null,
        overall: streakMap.overall ?? null,
      }));

      const today = new Date().toISOString().split('T')[0];
      const overall = streakMap.overall;
      const loggedToday = overall?.last_log_date?.startsWith(today);
      dispatch(setCompletionPercentage(loggedToday ? 100 : 0));
    }

    // Check if user has completed profile setup (has full_name set)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();
  const profileComplete = !!(profile?.full_name);
  console.log('[Bootstrap] Profile complete:', profileComplete);
  dispatch(setOnboarded(profileComplete));

  console.log('[Bootstrap] Done.');
  } catch (err) {
    console.error('[Bootstrap] Unexpected error:', err);
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
    console.log('[AuthProvider] Mounting, restoring session...');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AuthProvider] getSession result:', session ? `user=${session.user.id}` : 'no session');
      dispatch(setSession(session));
      if (session?.user) {
        await bootstrapUserData(session.user.id, dispatch);
      }

      try {
        const raw = await AsyncStorage.getItem(WORKOUT_SESSION_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved?.status === 'active' && saved?.workoutId) {
            console.log('[AuthProvider] Restoring in-progress workout session');
            dispatch(restoreSession(saved));
          }
        }
      } catch (_) {}

      console.log('[AuthProvider] Initialization complete, rendering navigator');
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthProvider] onAuthStateChange:', event, session ? `user=${session.user.id}` : 'no session');
      dispatch(setSession(session));
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[AuthProvider] SIGNED_IN — deferring bootstrap to next tick');
        dispatch(setBootstrapping(true));
        const userId = session.user.id;
        // Defer out of the onAuthStateChange callback to avoid Supabase internal
        // auth lock deadlock — API calls made inside the callback hang indefinitely.
        setTimeout(async () => {
          console.log('[AuthProvider] Bootstrap starting (deferred)');
          await bootstrapUserData(userId, dispatch);
          dispatch(setBootstrapping(false));
          console.log('[AuthProvider] Bootstrap complete — unblocking navigation');
        }, 0);
      }
      if (event === 'SIGNED_OUT') {
        console.log('[AuthProvider] SIGNED_OUT — clearing plans');
        dispatch(setActivePlans({}));
        dispatch(setScheduledPlans([]));
      }
    });

    const handleDeepLink = ({ url }: { url: string }) => {
      console.log('[AuthProvider] Deep link received:', url.substring(0, 60) + '...');
      if (url.includes('access_token')) {
        handleOAuthUrl(url, dispatch);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url?.includes('access_token')) {
        console.log('[AuthProvider] Cold launch with OAuth URL');
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
