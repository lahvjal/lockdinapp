import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { getActiveVersion, getActiveConfigValue } from '../../utils/planVersioning';
import WeekViewStrip from '../../components/WeekViewStrip';
import { signOut } from '../../store/slices/authSlice';
import { openSetup } from '../../store/slices/workoutSessionSlice';
import PlanManagementScreen from '../plan/PlanManagementScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  bg: '#0D0D0D',
  workoutCard: '#181200',
  card: '#161616',
  orange: '#F5A023',
  green: '#22C55E',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  white: '#FFFFFF',
  textSec: '#777777',
  textDim: '#3A3A3A',
  border: '#222222',
  tabBg: '#0F0F0F',
  tabBorder: '#1E1E1E',
};

const ML_PER_GLASS = 250;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function getWeekInfo(startDate: string, endDate?: string, durationMode?: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const weekNum = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  if (durationMode === 'fixed' && endDate) {
    const end = new Date(endDate);
    const totalWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `WEEK ${weekNum} OF ${totalWeeks}`;
  }
  return `WEEK ${Math.max(1, weekNum)}`;
}

interface DashboardData {
  userName: string;
  todayWorkout: any | null;
  nextWorkout: any | null;       // next scheduled training day (if today is rest)
  allWorkoutRows: any[];         // all workout rows for the active plan (for week strip)
  planStartDate: string | null;
  planEndDate: string | null;
  exerciseNames: Record<string, string>;
  completedExerciseIds: string[];
  /** Maps exercise_id → { logId, sets_data[] } for exercises already logged today */
  completedExerciseLogs: Record<string, { logId: string; setsData: any[] }>;
  /** Date strings (toDateString) for every day this week that has a workout log */
  weekLogDates: Set<string>;
  /** Subset of weekLogDates where only some planned exercises were logged */
  weekPartialLogDates: Set<string>;
  mealSlotsCount: number;
  mealsLoggedCount: number;
  waterGlasses: number;
  waterTargetGlasses: number;
  sleepLabel: string | null;
  loading: boolean;
}

// ─── Expandable Category Card ─────────────────────────────────────────────────

interface CategoryCardProps {
  accent: string;
  dimAccent?: string;
  iconName: string;
  label: string;
  value: string;
  pct: number;
  streakDays: number;
  expanded: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}

function CategoryCard({
  accent, dimAccent, iconName, label, value, pct, streakDays, expanded, onPress, children,
}: CategoryCardProps) {
  const activeAccent = dimAccent ?? accent;
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: expanded ? activeAccent + '33' : C.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Card summary row */}
      <View style={styles.cardSummaryRow}>
        {/* Icon */}
        <View style={[styles.cardIcon, { backgroundColor: activeAccent + '1A' }]}>
          <MaterialCommunityIcons name={iconName as any} size={22} color={activeAccent} />
        </View>

        {/* Label + Value */}
        <View style={styles.cardCenter}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardValue} numberOfLines={1}>{value}</Text>
        </View>

        {/* Pct + Streak */}
        <View style={styles.cardRight}>
          <Text style={[styles.cardPct, { color: activeAccent }]}>
            {pct}<Text style={styles.cardPctSuffix}>%</Text>
          </Text>
          <View style={styles.miniStreak}>
            <Text style={styles.miniStreakFlame}>🔥</Text>
            <Text style={styles.miniStreakDays}>{streakDays} days</Text>
          </View>
        </View>

        {/* Chevron */}
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={C.textDim}
          style={{ marginLeft: 4 }}
        />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: activeAccent }]} />
      </View>

      {/* Expandable content */}
      {expanded && children && (
        <View style={styles.expandedContent}>
          <View style={[styles.expandedDivider, { backgroundColor: accent + '22' }]} />
          {children}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardScreen({ navigation }: { navigation?: any }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activePlans, scheduledPlans } = useSelector((state: RootState) => state.plan);
  const { streaks, completionPercentage } = useSelector((state: RootState) => state.streak);
  const workoutSession = useSelector((state: RootState) => state.workoutSession);
  const hasAnyPlan = !!(activePlans.workout || activePlans.meal || activePlans.water || activePlans.sleep);

  // True when there's an in-progress session for today's workout (resumed after crash)
  const hasActiveSession = workoutSession.isResuming && workoutSession.status === 'setup';

  const [data, setData] = useState<DashboardData>({
    userName: '',
    todayWorkout: null,
    nextWorkout: null,
    allWorkoutRows: [],
    planStartDate: null,
    planEndDate: null,
    exerciseNames: {},
    completedExerciseIds: [],
    completedExerciseLogs: {},
    weekLogDates: new Set(),
    weekPartialLogDates: new Set(),
    mealSlotsCount: 0,
    mealsLoggedCount: 0,
    waterGlasses: 0,
    waterTargetGlasses: 8,
    sleepLabel: null,
    loading: true,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    workout: false,
    meal: false,
    water: false,
    sleep: false,
  });

  const toggleExpanded = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartWorkout = useCallback(async () => {
    if (!activePlans.workout || !data.todayWorkout) return;
    // Fetch user's weight unit preference
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('weight_unit, bar_weight_lb')
      .eq('id', user!.id)
      .maybeSingle();
    const weightUnit = (profile?.weight_unit ?? 'lb') as 'lb' | 'kg';
    const barWeightLb = profile?.bar_weight_lb ?? 45;

    const exList = getActiveVersion(data.todayWorkout.exercises ?? []).map((ex: any) => ({
      exerciseId: ex.exercise_id,
      name: data.exerciseNames[ex.exercise_id] ?? 'Exercise',
      muscle: '',
      targetSets: ex.sets ?? 3,
      targetReps: ex.reps ?? 8,
      targetRestSeconds: ex.rest_seconds ?? 90,
      metricType: (ex.metric_type ?? 'reps') as 'reps' | 'duration' | 'distance',
      targetDurationSeconds: ex.duration_seconds ?? 0,
    }));

    // Find the first exercise not yet fully logged today — start from there.
    // An exercise is "fully done" only when its logged set count matches its target.
    const startFromExerciseIdx = exList.findIndex((ex: any) => {
      const log = data.completedExerciseLogs[ex.exerciseId];
      const loggedSets = log?.setsData?.length ?? 0;
      return loggedSets < ex.targetSets; // not fully done
    });
    const resumeIdx = startFromExerciseIdx >= 0 ? startFromExerciseIdx : exList.length;

    dispatch(openSetup({
      workoutId: data.todayWorkout.id,
      planId: activePlans.workout.id,
      workoutName: data.todayWorkout.name,
      exercises: exList,
      weightUnit,
      barWeightLb,
      startFromExerciseIdx: resumeIdx,
      completedExerciseLogs: data.completedExerciseLogs,
    }));
  }, [activePlans.workout, data.todayWorkout, data.exerciseNames, data.completedExerciseIds, data.completedExerciseLogs, user, dispatch]);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayStr = today.toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    if (!user) {
      console.log('[Dashboard] loadData skipped — no user');
      return;
    }
    console.log('[Dashboard] loadData starting, activePlans:', Object.keys(activePlans).filter(k => !!(activePlans as any)[k]));
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      const userName = profile?.full_name
        ? profile.full_name.split(' ')[0].toUpperCase()
        : (user.email?.split('@')[0] ?? 'YOU').toUpperCase();

      // Today's workout — uses cyclic plan-day index so it always lines up correctly
      let todayWorkout: any = null;
      let nextWorkout: any = null;
      let allWorkoutRows: any[] = [];
      let exerciseNames: Record<string, string> = {};
      let completedExerciseIds: string[] = [];
      let completedExerciseLogs: Record<string, { logId: string; setsData: any[] }> = {};
      let weekLogDates: Set<string> = new Set();
      let weekPartialLogDates: Set<string> = new Set();

      if (activePlans.workout) {
        // Fetch all workout day rows for the plan (sorted by day_of_week)
        const { data: allWorkouts } = await supabase
          .from('workouts')
          .select('*')
          .eq('plan_id', activePlans.workout.id)
          .order('day_of_week', { ascending: true });

        if (allWorkouts && allWorkouts.length > 0) {
          allWorkoutRows = allWorkouts;
          // day_of_week now stores the actual calendar weekday (Mon=0 … Sun=6).
          // Get today's weekday in the same Mon=0 convention (JS getDay: Sun=0 so adjust).
          const jsDow = today.getDay(); // 0=Sun … 6=Sat
          const todayWeekday = jsDow === 0 ? 6 : jsDow - 1; // convert to Mon=0 … Sun=6

          const restDaysForPlan: number[] = getActiveConfigValue(activePlans.workout.config?.rest_day_versions, 'rest_days') ?? activePlans.workout.config?.rest_days ?? [];
          const isRestToday = restDaysForPlan.includes(todayWeekday);

          const todayRow = isRestToday ? null : allWorkouts.find(w => w.day_of_week === todayWeekday);
          const hasExercisesToday = todayRow && getActiveVersion(todayRow.exercises ?? []).length > 0;
          todayWorkout = hasExercisesToday ? todayRow : null;

          // Find the next upcoming training day
          if (!isRestToday && !hasExercisesToday) {
            // Today is a workout day slot but has no exercises — find next
            for (let offset = 1; offset <= 7; offset++) {
              const checkWeekday = (todayWeekday + offset) % 7;
              if (restDaysForPlan.includes(checkWeekday)) continue;
              const candidate = allWorkouts.find(w => w.day_of_week === checkWeekday && (w.exercises ?? []).length > 0);
              if (candidate) { nextWorkout = { ...candidate, daysAway: offset }; break; }
            }
          } else if (isRestToday) {
            for (let offset = 1; offset <= 7; offset++) {
              const checkWeekday = (todayWeekday + offset) % 7;
              if (restDaysForPlan.includes(checkWeekday)) continue;
              const candidate = allWorkouts.find(w => w.day_of_week === checkWeekday && (w.exercises ?? []).length > 0);
              if (candidate) { nextWorkout = { ...candidate, daysAway: offset }; break; }
            }
          }

          // Resolve exercise names for whichever workout we'll display
          const displayWorkout = todayWorkout ?? nextWorkout;
          if (displayWorkout) {
            const allExIds: string[] = getActiveVersion(displayWorkout.exercises ?? []).map((e: any) => e.exercise_id);
            if (allExIds.length > 0) {
              const { data: exRows } = await supabase
                .from('exercises')
                .select('id, name')
                .in('id', allExIds);
              exerciseNames = (exRows ?? []).reduce((acc: Record<string, string>, ex: any) => {
                acc[ex.id] = ex.name;
                return acc;
              }, {});
            }
          }

          // Completion logs for today's workout — fetch sets_data so we can
          // hydrate previously completed exercises when the user continues mid-workout.
          // NOTE: We query by workout_id only (no logged_at filter) because a
          // "Continue Workout" session creates a new session row but updates the
          // *same* workout_logs rows via upsert; the original logged_at may be from
          // an earlier session. We keep the latest log per exercise via ordering.
          if (todayWorkout) {
            const { data: logs } = await supabase
              .from('workout_logs')
              .select('id, exercise_id, sets_data, logged_at')
              .eq('workout_id', todayWorkout.id)
              .eq('user_id', user.id)
              .order('logged_at', { ascending: false });
            // Deduplicate: keep only the most-recent log row per exercise_id
            const seenExIds = new Set<string>();
            const dedupedLogs = (logs ?? []).filter((l: any) => {
              if (seenExIds.has(l.exercise_id)) return false;
              seenExIds.add(l.exercise_id);
              return true;
            });
            completedExerciseIds = dedupedLogs.map((l: any) => l.exercise_id);
            completedExerciseLogs = dedupedLogs.reduce((acc: typeof completedExerciseLogs, l: any) => {
              acc[l.exercise_id] = { logId: l.id, setsData: l.sets_data ?? [] };
              return acc;
            }, {});
          }
        }

        // Fetch all workout_logs for the current Mon–Sun to power the WeekViewStrip
        if (activePlans.workout) {
          const monday = new Date(today);
          const jsDow = today.getDay();
          const diffToMonday = jsDow === 0 ? -6 : 1 - jsDow;
          monday.setDate(today.getDate() + diffToMonday);
          monday.setHours(0, 0, 0, 0);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          const { data: weekLogs } = await supabase
            .from('workout_logs')
            .select('logged_at, exercise_id')
            .eq('user_id', user.id)
            .gte('logged_at', monday.toISOString())
            .lte('logged_at', sunday.toISOString());
          const toMonZero = (jsDow: number) => jsDow === 0 ? 6 : jsDow - 1;
          const logsByDate = new Map<string, Set<string>>();
          for (const l of weekLogs ?? []) {
            const ds = new Date(l.logged_at).toDateString();
            if (!logsByDate.has(ds)) logsByDate.set(ds, new Set());
            logsByDate.get(ds)!.add(l.exercise_id);
          }
          weekLogDates = new Set(logsByDate.keys());
          for (const [ds, exIds] of logsByDate) {
            const weekday = toMonZero(new Date(ds).getDay());
            const row = allWorkoutRows.find((w: any) => w.day_of_week === weekday);
            const plannedCount = row ? getActiveVersion(row.exercises ?? []).length : 0;
            if (plannedCount > 0 && exIds.size < plannedCount) {
              weekPartialLogDates.add(ds);
            }
          }
        }
      }

      // Meals
      let mealSlotsCount = 0;
      let mealsLoggedCount = 0;
      if (activePlans.meal) {
        const { data: slots } = await supabase
          .from('meal_slots')
          .select('id')
          .eq('plan_id', activePlans.meal.id);
        mealSlotsCount = slots?.length ?? 0;
        if (slots && slots.length > 0) {
          const slotIds = slots.map((s: any) => s.id);
          const { data: mealLogs } = await supabase
            .from('meal_logs')
            .select('id')
            .in('meal_slot_id', slotIds)
            .gte('logged_at', `${todayStr}T00:00:00`)
            .lte('logged_at', `${todayStr}T23:59:59`);
          mealsLoggedCount = mealLogs?.length ?? 0;
        }
      }

      // Water
      const waterTargetGlasses = activePlans.water?.config?.daily_target_ml
        ? Math.round(activePlans.water.config.daily_target_ml / ML_PER_GLASS)
        : 8;
      let waterGlasses = 0;
      if (activePlans.water) {
        const { data: waterLogs } = await supabase
          .from('water_logs')
          .select('amount_ml')
          .eq('user_id', user.id)
          .eq('date', todayStr);
        const totalMl = (waterLogs ?? []).reduce((sum: number, l: any) => sum + l.amount_ml, 0);
        waterGlasses = Math.floor(totalMl / ML_PER_GLASS);
      }

      // Sleep (last night)
      let sleepLabel: string | null = null;
      if (activePlans.sleep) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const { data: sleepLog } = await supabase
          .from('sleep_logs')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('logged_at', `${yesterdayStr}T18:00:00`)
          .lte('logged_at', `${todayStr}T14:00:00`)
          .order('logged_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (sleepLog) {
          const h = Math.floor(sleepLog.duration_minutes / 60);
          const m = sleepLog.duration_minutes % 60;
          sleepLabel = `${h}h ${m}m last night`;
        }
      }

      console.log('[Dashboard] loadData complete — todayWorkout:', todayWorkout?.name ?? 'none', '| meals:', mealSlotsCount, '| water glasses:', waterGlasses);
      setData({
        userName,
        todayWorkout,
        nextWorkout,
        allWorkoutRows,
        planStartDate: activePlans.workout?.start_date ?? null,
        planEndDate: activePlans.workout?.end_date ?? null,
        exerciseNames,
        completedExerciseIds,
        completedExerciseLogs,
        weekLogDates,
        weekPartialLogDates,
        mealSlotsCount,
        mealsLoggedCount,
        waterGlasses,
        waterTargetGlasses,
        sleepLabel,
        loading: false,
      });
    } catch (err) {
      console.error('[Dashboard] loadData error:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [user, activePlans, dayOfWeek, todayStr]);

  useEffect(() => { loadData(); }, [loadData]);

  // Reload dashboard data whenever a workout session finishes so the exercise
  // completion checkboxes update immediately without needing a manual refresh.
  const prevSessionStatusRef = useRef<string>(workoutSession.status);
  useEffect(() => {
    const prev = prevSessionStatusRef.current;
    const curr = workoutSession.status;
    prevSessionStatusRef.current = curr;
    // Trigger when: active→complete (end workout) or active/complete→idle (done/discard)
    if ((prev === 'active' && curr === 'complete') || (prev !== 'idle' && curr === 'idle')) {
      loadData();
    }
  }, [workoutSession.status, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const workoutPlan = activePlans.workout;
  const overallStreak = streaks.overall?.current_count ?? 0;
  const todayPct = Math.round(completionPercentage ?? 0);

  const isRestDay = !data.todayWorkout;
  const displayWorkout = data.todayWorkout ?? data.nextWorkout;
  const exercises: any[] = getActiveVersion(displayWorkout?.exercises ?? []);
  const workoutDone = exercises.filter(e => data.completedExerciseIds.includes(e.exercise_id)).length;
  const workoutPct = !isRestDay && exercises.length > 0
    ? Math.round((workoutDone / exercises.length) * 100)
    : 0;

  // Show "Continue Workout" when any exercise has been started today but the
  // workout isn't fully complete, OR when a crash-restored session is waiting.
  // Use set counts (not just log presence) so partially-done exercises count correctly.
  const anyStartedToday = !isRestDay && exercises.some((ex: any) => {
    const log = data.completedExerciseLogs[ex.exercise_id];
    return (log?.setsData?.length ?? 0) > 0;
  });
  const allFullyDone = !isRestDay && exercises.length > 0 && exercises.every((ex: any) => {
    const log = data.completedExerciseLogs[ex.exercise_id];
    return (log?.setsData?.length ?? 0) >= (ex.sets ?? 1);
  });
  const isContinuing = hasActiveSession || (anyStartedToday && !allFullyDone);
  const mealPct = data.mealSlotsCount > 0 ? Math.round((data.mealsLoggedCount / data.mealSlotsCount) * 100) : 0;
  const waterPct = Math.min(100, data.waterTargetGlasses > 0 ? Math.round((data.waterGlasses / data.waterTargetGlasses) * 100) : 0);
  const sleepPct = data.sleepLabel ? 100 : 0;

  if (data.loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.orange} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Image source={require('../../../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
          <TouchableOpacity style={styles.headerSide} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.menuDots}>• • •</Text>
          </TouchableOpacity>
        </View>

        {/* ── Greeting ── */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingTime}>{getGreeting()}</Text>
            <Text style={styles.greetingName}>{data.userName || 'YOU'}</Text>
            <View style={styles.completionPill}>
              <Text style={styles.pillFlame}>🔥</Text>
              <Text style={styles.pillText}>{todayPct}% TODAY</Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakFlameEmoji}>🔥</Text>
            <Text style={styles.streakCount}>{overallStreak}</Text>
            <Text style={styles.streakLabel}>DAY{'\n'}STREAK</Text>
          </View>
        </View>

        {/* ── No Plan Empty State ── */}
        {!hasAnyPlan && (
          <View style={styles.noPlanBanner}>
            <View style={styles.noPlanIconWrap}>
              <MaterialCommunityIcons name="clipboard-plus-outline" size={32} color={C.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noPlanTitle}>No active plan</Text>
              <Text style={styles.noPlanSub}>Set up your workout, meals, water and sleep goals.</Text>
            </View>
            <TouchableOpacity
              style={styles.noPlanBtn}
              onPress={() => navigation?.navigate('Plan', { autoCreate: true })}
              activeOpacity={0.85}
            >
              <Text style={styles.noPlanBtnText}>CREATE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Plan Banner ── */}
        {workoutPlan && (
          <View style={styles.planBanner}>
            <Text style={styles.planBannerText}>
              {'• '}
              {workoutPlan.name.toUpperCase()}
              {' — '}
              {getWeekInfo(workoutPlan.start_date, workoutPlan.end_date, workoutPlan.duration_mode)}
              {' •'}
            </Text>
          </View>
        )}

        {/* ── Week Strip ── */}
        <WeekViewStrip
          activePlan={workoutPlan ?? null}
          allWorkoutRows={data.allWorkoutRows}
          planStartDate={data.planStartDate}
          planEndDate={data.planEndDate}
          scheduledPlans={scheduledPlans}
          currentWeekLogDates={data.weekLogDates}
          partialLogDates={data.weekPartialLogDates}
          userId={user?.id ?? ''}
        />

        {/* ── Section Header ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY'S PLAN</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* ── Workout Card ── */}
        {activePlans.workout && (
          <CategoryCard
            accent={C.orange}
            dimAccent={isRestDay ? '#4A7FA5' : undefined}
            iconName={isRestDay ? 'sleep' : 'lightning-bolt'}
            label="WORKOUT"
            value={
              isRestDay
                ? data.nextWorkout
                  ? `Rest Day · ${displayWorkout?.name} in ${data.nextWorkout.daysAway}d`
                  : 'Rest Day'
                : data.todayWorkout?.name ?? 'Training Day'
            }
            pct={workoutPct}
            streakDays={streaks.workout?.current_count ?? 0}
            expanded={expanded.workout}
            onPress={() => toggleExpanded('workout')}
          >
            {exercises.length > 0 ? (
              <View style={styles.exerciseList}>
                {isRestDay && data.nextWorkout && (
                  <View style={styles.nextDayBanner}>
                    <MaterialCommunityIcons name="calendar-arrow-right" size={13} color={C.orange} />
                    <Text style={styles.nextDayText}>
                      Next: {displayWorkout?.name} in {data.nextWorkout.daysAway} day{data.nextWorkout.daysAway !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                {exercises.map((ex: any, i: number) => {
                  const log = data.completedExerciseLogs[ex.exercise_id];
                  const loggedSets = log?.setsData?.length ?? 0;
                  const fullyDone = !isRestDay && loggedSets >= (ex.sets ?? 1);
                  const partial   = !isRestDay && loggedSets > 0 && !fullyDone;
                  const name = data.exerciseNames[ex.exercise_id] ?? 'Exercise';
                  const metricSuffix = (() => {
                    if (ex.metric_type === 'duration' && ex.duration_seconds) {
                      const m = Math.floor(ex.duration_seconds / 60);
                      const s = ex.duration_seconds % 60;
                      if (m > 0 && s > 0) return `${m}m ${s}s`;
                      if (m > 0) return `${m}min`;
                      return `${s}sec`;
                    }
                    if (ex.metric_type === 'distance' && ex.distance_meters) {
                      return ex.distance_meters >= 1000
                        ? `${(ex.distance_meters / 1000).toFixed(1).replace(/\.0$/, '')}km`
                        : `${ex.distance_meters}m`;
                    }
                    return ex.weight ? `${ex.reps} @ ${ex.weight}lb` : `${ex.reps}`;
                  })();
                  const meta = `${ex.sets}×${metricSuffix}`;
                  return (
                    <View key={ex.exercise_id ?? i} style={[styles.exerciseRow, i > 0 && styles.exerciseRowBorder]}>
                      <View style={[styles.checkbox, fullyDone && styles.checkboxDone, partial && styles.checkboxPartial]}>
                        {fullyDone && <MaterialCommunityIcons name="check" size={11} color="#000" />}
                        {partial   && <View style={styles.checkboxDot} />}
                      </View>
                      <Text style={[styles.exerciseName, (fullyDone || partial) && styles.exerciseNameDone]} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={styles.exerciseMeta}>{meta}</Text>
                    </View>
                  );
                })}
                {!isRestDay && (
                  <View style={styles.workoutProgress}>
                    <Text style={styles.workoutProgressText}>
                      {workoutDone}/{exercises.length} done
                      {workoutDone === exercises.length && exercises.length > 0 ? ' · Great work! 🔥' : ''}
                    </Text>
                  </View>
                )}
                {/* Start Workout button */}
                {!isRestDay && exercises.length > 0 && (
                  <TouchableOpacity style={[styles.startWorkoutBtn, isContinuing && styles.continueWorkoutBtn]} onPress={handleStartWorkout} activeOpacity={0.85}>
                    <MaterialCommunityIcons name={isContinuing ? 'play-circle-outline' : 'play-circle'} size={16} color="#000" />
                    <Text style={styles.startWorkoutBtnText}>{isContinuing ? 'CONTINUE WORKOUT' : 'START WORKOUT'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.restDayRow}>
                <MaterialCommunityIcons name="moon-waning-crescent" size={18} color="#4A7FA5" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.restDayTitle}>REST DAY</Text>
                  <Text style={styles.restDayText}>Recovery is part of the process</Text>
                </View>
              </View>
            )}
          </CategoryCard>
        )}

        {/* ── Meals Card ── */}
        {activePlans.meal && (
          <CategoryCard
            accent={C.green}
            iconName="silverware-fork-knife"
            label="MEALS"
            value={`${data.mealsLoggedCount} of ${data.mealSlotsCount} logged`}
            pct={mealPct}
            streakDays={streaks.meal?.current_count ?? 0}
            expanded={expanded.meal}
            onPress={() => toggleExpanded('meal')}
          >
            <Text style={styles.expandedHint}>
              {data.mealSlotsCount - data.mealsLoggedCount > 0
                ? `${data.mealSlotsCount - data.mealsLoggedCount} meal${data.mealSlotsCount - data.mealsLoggedCount > 1 ? 's' : ''} remaining today`
                : 'All meals logged for today!'}
            </Text>
          </CategoryCard>
        )}

        {/* ── Water Card ── */}
        {activePlans.water && (
          <CategoryCard
            accent={C.blue}
            iconName="water"
            label="WATER"
            value={`${data.waterGlasses} of ${data.waterTargetGlasses} glasses`}
            pct={waterPct}
            streakDays={streaks.water?.current_count ?? 0}
            expanded={expanded.water}
            onPress={() => toggleExpanded('water')}
          >
            <View style={styles.glassesRow}>
              {Array.from({ length: data.waterTargetGlasses }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.glassDot,
                    i < data.waterGlasses
                      ? { backgroundColor: C.blue }
                      : { backgroundColor: C.blue + '22', borderColor: C.blue + '44', borderWidth: 1 },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.expandedHint}>
              {data.waterTargetGlasses - data.waterGlasses > 0
                ? `${data.waterTargetGlasses - data.waterGlasses} more glass${data.waterTargetGlasses - data.waterGlasses > 1 ? 'es' : ''} to reach your goal`
                : 'Daily water goal reached!'}
            </Text>
          </CategoryCard>
        )}

        {/* ── Sleep Card ── */}
        {activePlans.sleep && (
          <CategoryCard
            accent={C.purple}
            iconName="moon-waning-crescent"
            label="SLEEP"
            value={data.sleepLabel ?? 'Not logged yet'}
            pct={sleepPct}
            streakDays={streaks.sleep?.current_count ?? 0}
            expanded={expanded.sleep}
            onPress={() => toggleExpanded('sleep')}
          >
            <Text style={styles.expandedHint}>
              {data.sleepLabel ? 'Sleep logged for last night.' : 'Log last night\'s sleep to keep your streak alive.'}
            </Text>
          </CategoryCard>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Trends Tab (placeholder) ─────────────────────────────────────────────────

function TrendsScreen() {
  return (
    <SafeAreaView style={styles.placeholderRoot}>
      <MaterialCommunityIcons name="chart-line" size={48} color={C.orange} />
      <Text style={styles.placeholderTitle}>Trends</Text>
      <Text style={styles.placeholderSub}>Analytics coming soon</Text>
    </SafeAreaView>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    dispatch(signOut());
  };

  return (
    <SafeAreaView style={styles.placeholderRoot}>
      <MaterialCommunityIcons name="account-circle-outline" size={64} color={C.orange} />
      <Text style={styles.placeholderTitle}>{user?.email}</Text>
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

export default function HomeScreen() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: C.orange,
        tabBarInactiveTintColor: C.textSec,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Today"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="lightning-bolt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Trends"
        component={TrendsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Plan"
        component={PlanManagementScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  headerSide: { width: 44 },
  headerLogo: {
    height: 22,
    width: 100,
  },
  menuDots: {
    color: C.textSec,
    fontSize: 10,
    letterSpacing: 3,
    textAlign: 'right',
  },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
  },
  greetingLeft: { flex: 1 },
  greetingTime: {
    color: C.textSec,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  greetingName: {
    color: C.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  completionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261800',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  pillFlame: { fontSize: 13, marginRight: 5 },
  pillText: {
    color: C.orange,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  streakBadge: {
    alignItems: 'center',
    marginLeft: 12,
    paddingTop: 4,
  },
  streakFlameEmoji: { fontSize: 28 },
  streakCount: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  streakLabel: {
    color: C.textSec,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 12,
  },

  // Plan Banner
  noPlanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.orange + '0D',
    borderWidth: 1,
    borderColor: C.orange + '33',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  noPlanIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.orange + '1A',
    alignItems: 'center', justifyContent: 'center',
  },
  noPlanTitle: { color: C.white, fontSize: 14, fontWeight: '800', marginBottom: 2 },
  noPlanSub: { color: C.textSec, fontSize: 12, lineHeight: 16 },
  noPlanBtn: {
    backgroundColor: C.orange,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noPlanBtnText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  planBanner: {
    alignItems: 'center',
    marginBottom: 18,
  },
  planBannerText: {
    color: C.orange,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: C.textSec,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A2014',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  liveText: {
    color: C.green,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Expandable card
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardCenter: {
    flex: 1,
  },
  cardLabel: {
    color: C.textSec,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  cardValue: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  cardPct: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
  },
  cardPctSuffix: {
    fontSize: 14,
    fontWeight: '600',
  },
  miniStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniStreakFlame: { fontSize: 10 },
  miniStreakDays: {
    color: C.textSec,
    fontSize: 10,
    fontWeight: '500',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#1E1E1E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  expandedContent: {
    marginTop: 12,
  },
  expandedDivider: {
    height: 1,
    marginBottom: 12,
  },
  expandedHint: {
    color: C.textSec,
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Water glasses dots
  glassesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  glassDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  // Exercise list (inside expanded workout card)
  exerciseList: { gap: 0 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 10,
  },
  exerciseRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: C.orange,
    borderColor: C.orange,
  },
  checkboxPartial: {
    borderColor: C.orange,
    backgroundColor: 'transparent',
  },
  checkboxDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.orange,
  },
  exerciseName: {
    flex: 1,
    color: C.white,
    fontSize: 14,
    fontWeight: '500',
  },
  exerciseNameDone: {
    color: C.textSec,
  },
  exerciseMeta: {
    color: C.textSec,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 0,
  },
  restDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#4A7FA5' + '12',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4A7FA5' + '30',
  },
  restDayTitle: {
    color: '#4A7FA5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  restDayText: {
    color: C.textSec,
    fontSize: 12,
    fontStyle: 'italic',
  },
  nextDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: C.orange + '12',
    borderRadius: 8,
    marginBottom: 8,
  },
  nextDayText: {
    color: C.orange,
    fontSize: 12,
    fontWeight: '600',
  },
  workoutProgress: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    alignItems: 'flex-end',
  },
  workoutProgressText: {
    color: C.textSec,
    fontSize: 11,
    fontWeight: '600',
  },
  startWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: C.orange,
  },
  continueWorkoutBtn: {
    backgroundColor: '#10B981',
  },
  startWorkoutBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Placeholder screens
  placeholderRoot: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
  },
  placeholderSub: {
    color: C.textSec,
    fontSize: 14,
  },
  signOutBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  signOutText: {
    color: C.textSec,
    fontSize: 14,
    fontWeight: '600',
  },

  // Tab bar
  tabBar: {
    backgroundColor: C.tabBg,
    borderTopColor: C.tabBorder,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
});
