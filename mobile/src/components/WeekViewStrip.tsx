/**
 * WeekViewStrip — shared week calendar strip used on both the Home and Plan screens.
 *
 * Shows Mon–Sun as icon cells with week navigation (← THIS WEEK →), a legend,
 * and calls onDayPress when a cell is tapped.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { getActiveVersion, getActiveConfigValue } from '../utils/planVersioning';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeekDay {
  label: string;
  date: Date;
  isToday: boolean;
  hasLog: boolean;
  isFuture: boolean;
  isRestDay: boolean;
  plannedWorkoutName: string | null;
  planDayIdx: number | null;
  isScheduledPlan?: boolean;
  isOutOfPlan?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  orange: '#F59E0B',
  white: '#F5F5F5',
  textSec: '#666',
  border: '#1E1E22',
  card: '#111113',
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getMondayOfWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WeekViewStripProps {
  /** The active workout plan row (from Redux activePlans.workout) */
  activePlan: any | null;
  /** All workout rows for the active plan */
  allWorkoutRows: any[];
  /** Plan start_date ISO string */
  planStartDate: string | null;
  /** Plan end_date ISO string (null = indefinite) */
  planEndDate: string | null;
  /** Scheduled plans array (from Redux scheduledPlans) */
  scheduledPlans: any[];
  /** Dates that have a workout log this week, as Date.toDateString() keys */
  currentWeekLogDates: Set<string>;
  /** Called when a day cell is tapped */
  onDayPress?: (day: WeekDay) => void;
  /** User ID — needed to fetch logs for past weeks */
  userId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeekViewStrip({
  activePlan,
  allWorkoutRows,
  planStartDate,
  planEndDate,
  scheduledPlans,
  currentWeekLogDates,
  onDayPress,
  userId,
}: WeekViewStripProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [days, setDays] = useState<WeekDay[]>([]);
  const [loading, setLoading] = useState(false);

  const buildWeek = useCallback(async () => {
    setLoading(weekOffset > 0);

    const today = new Date();
    const monday = getMondayOfWeek();
    const targetMonday = new Date(monday);
    targetMonday.setDate(monday.getDate() + weekOffset * 7);

    const planRestDays: number[] = activePlan
      ? (getActiveConfigValue(activePlan.config?.rest_day_versions, 'rest_days') ?? activePlan.config?.rest_days ?? [])
      : [];
    const restDaySet = new Set<number>(planRestDays);
    const toMonZero = (jsDow: number) => jsDow === 0 ? 6 : jsDow - 1;
    const numPlanDays = allWorkoutRows.length;

    // Fetch logs for past weeks; current week comes from parent's currentWeekLogDates
    let logDates: Set<string>;
    if (weekOffset === 0) {
      logDates = currentWeekLogDates;
    } else if (weekOffset < 0) {
      // Past week — query workout_logs for dates in range
      const from = targetMonday.toISOString().split('T')[0];
      const to = new Date(targetMonday.getTime() + 6 * 86400000).toISOString().split('T')[0];
      const { data: logs } = await supabase
        .from('workout_logs')
        .select('logged_at')
        .eq('user_id', userId)
        .gte('logged_at', from)
        .lte('logged_at', to + 'T23:59:59');
      logDates = new Set((logs ?? []).map((l: any) => new Date(l.logged_at).toDateString()));
    } else {
      logDates = new Set();
    }

    const built: WeekDay[] = DAY_LABELS.map((label, i) => {
      const date = new Date(targetMonday);
      date.setDate(targetMonday.getDate() + i);

      let isRestDay = false;
      let plannedWorkoutName: string | null = null;
      let planDayIdx: number | null = null;
      let isScheduledPlan = false;
      let isOutOfPlan = false;

      const dateMidnight = new Date(date); dateMidnight.setHours(0, 0, 0, 0);

      const scheduledWorkoutPlan = scheduledPlans.find(p => {
        if (p.type !== 'workout') return false;
        const s = new Date(p.start_date); s.setHours(0, 0, 0, 0);
        const e = p.end_date ? new Date(p.end_date) : null; if (e) e.setHours(0, 0, 0, 0);
        return dateMidnight >= s && (!e || dateMidnight <= e);
      });

      if (scheduledWorkoutPlan) {
        isScheduledPlan = true;
        const schedRestDays: number[] = getActiveConfigValue(scheduledWorkoutPlan.config?.rest_day_versions, 'rest_days') ?? scheduledWorkoutPlan.config?.rest_days ?? [];
        isRestDay = schedRestDays.includes(i);
        plannedWorkoutName = scheduledWorkoutPlan.name;
      } else if (activePlan) {
        const planStart = planStartDate
          ? (() => { const [y, m, d] = planStartDate.split('T')[0].split('-').map(Number); return new Date(y, m - 1, d); })()
          : null;
        const planEnd = planEndDate
          ? (() => { const [y, m, d] = planEndDate.split('T')[0].split('-').map(Number); return new Date(y, m - 1, d); })()
          : null;
        const inActivePlan = planStart
          ? dateMidnight >= planStart && (!planEnd || dateMidnight <= planEnd)
          : false;

        if (inActivePlan) {
          const weekday = toMonZero(date.getDay());
          if (restDaySet.has(weekday)) {
            isRestDay = true;
          } else if (numPlanDays > 0) {
            const row = allWorkoutRows.find((w: any) => w.day_of_week === weekday);
            planDayIdx = weekday;
            isRestDay = !row || getActiveVersion(row.exercises ?? []).length === 0;
            plannedWorkoutName = row?.name ?? null;
          }
        } else {
          isOutOfPlan = true;
        }
      } else {
        isOutOfPlan = true;
      }

      return {
        label,
        date,
        isToday: date.toDateString() === today.toDateString(),
        hasLog: logDates.has(date.toDateString()),
        isFuture: date > today,
        isRestDay,
        plannedWorkoutName,
        planDayIdx,
        isScheduledPlan,
        isOutOfPlan,
      };
    });

    setDays(built);
    setLoading(false);
  }, [weekOffset, activePlan, allWorkoutRows, planStartDate, planEndDate, scheduledPlans, currentWeekLogDates, userId]);

  useEffect(() => { buildWeek(); }, [buildWeek]);

  const hasScheduled = scheduledPlans.some(p => p.type === 'workout');

  const firstDay = days[0];
  const lastDay = days[6];

  const weekLabel =
    weekOffset === 0 ? 'THIS WEEK' :
    weekOffset === 1 ? 'NEXT WEEK' :
    weekOffset > 1   ? `+${weekOffset} WEEKS` :
    weekOffset === -1 ? 'LAST WEEK' :
                        `${Math.abs(weekOffset)} WEEKS AGO`;

  return (
    <View style={s.root}>
      {/* ── Week nav header ── */}
      <View style={s.navRow}>
        <TouchableOpacity
          onPress={() => setWeekOffset(o => o - 1)}
          style={s.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={18} color="#888" />
        </TouchableOpacity>

        <View style={s.navCenter}>
          <Text style={s.navLabel}>{weekLabel}</Text>
          {firstDay && lastDay && (
            <Text style={s.navDateRange}>
              {firstDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' – '}
              {lastDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setWeekOffset(o => o + 1)}
          style={s.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-right" size={18} color="#888" />
        </TouchableOpacity>
      </View>

      {/* ── Day cells ── */}
      {loading ? (
        <ActivityIndicator color={C.orange} size="small" style={{ marginVertical: 12 }} />
      ) : (
        <View style={s.daysRow}>
          {days.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={s.dayCol}
              onPress={() => onDayPress?.(d)}
              activeOpacity={0.7}
            >
              <Text style={[
                s.dayLabel,
                d.isToday && { color: C.orange },
                d.isOutOfPlan && { color: '#333' },
              ]}>
                {d.label}
              </Text>
              <View style={[
                s.dayDot,
                d.isToday && !d.isOutOfPlan && { borderColor: C.orange, borderWidth: 1.5 },
                d.hasLog && { backgroundColor: C.orange },
                !d.hasLog && d.isOutOfPlan && { backgroundColor: '#141414', borderColor: '#222', borderWidth: 1 },
                !d.hasLog && !d.isOutOfPlan && d.isScheduledPlan && { backgroundColor: '#1E1E3A', borderColor: '#6366F1', borderWidth: 1.5 },
                !d.hasLog && !d.isOutOfPlan && !d.isScheduledPlan && d.isRestDay && !d.isFuture && { backgroundColor: '#1A1A2E', borderColor: '#3B3B6B', borderWidth: 1 },
                !d.hasLog && !d.isOutOfPlan && !d.isScheduledPlan && d.isRestDay && d.isFuture && { backgroundColor: '#12121E', borderColor: '#252540', borderWidth: 1 },
              ]}>
                {d.hasLog
                  ? <MaterialCommunityIcons name="check" size={12} color="#000" />
                  : d.isOutOfPlan
                    ? <Text style={s.dayDash}>·</Text>
                    : d.isScheduledPlan
                      ? <MaterialCommunityIcons name="calendar-clock" size={11} color="#6366F1" />
                      : d.isRestDay
                        ? <MaterialCommunityIcons name="sleep" size={13} color={d.isFuture ? '#333366' : '#5555AA'} />
                        : <Text style={[s.dayDash, d.isToday && { color: C.orange }]}>—</Text>
                }
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Back to now ── */}
      {weekOffset !== 0 && (
        <TouchableOpacity
          onPress={() => setWeekOffset(0)}
          style={s.backToNow}
        >
          <MaterialCommunityIcons name="calendar-today" size={11} color={C.orange} />
          <Text style={s.backToNowText}>BACK TO NOW</Text>
        </TouchableOpacity>
      )}

      {/* ── Legend ── */}
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: C.orange }]} />
          <Text style={s.legendText}>Logged</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#3B3B6B' }]} />
          <Text style={s.legendText}>Rest</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#1A1A1C' }]} />
          <Text style={s.legendText}>Training</Text>
        </View>
        {hasScheduled && (
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: '#1E1E3A', borderWidth: 1.5, borderColor: '#6366F1' }]} />
            <Text style={s.legendText}>Upcoming</Text>
          </View>
        )}
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#141414', borderWidth: 1, borderColor: '#222' }]} />
          <Text style={[s.legendText, { color: '#333' }]}>No plan</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { marginBottom: 16 },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  navBtn: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A1A1C',
  },
  navCenter: { flex: 1, alignItems: 'center' },
  navLabel: { color: C.textSec, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  navDateRange: { color: '#555', fontSize: 10, fontWeight: '500', marginTop: 2 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayLabel: { color: C.textSec, fontSize: 11, fontWeight: '600' },
  dayDot: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A1A1C',
  },
  dayDash: { color: '#333', fontSize: 13, fontWeight: '700' },
  backToNow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'center', marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 8, backgroundColor: '#1A1200',
  },
  backToNowText: { color: C.orange, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  legend: { flexDirection: 'row', gap: 14, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#444', fontSize: 10, fontWeight: '500' },
});
