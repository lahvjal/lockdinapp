import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Platform, LayoutAnimation,
  UIManager, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { setActivePlans, setActivePlan, setScheduledPlans } from '../../store/slices/planSlice';
import { setStreaks } from '../../store/slices/streakSlice';
import { Plan, Streak } from '../../types';
import { WORKOUT_SPLITS, MEAL_TEMPLATES, SPLIT_EXERCISE_TEMPLATES } from '../../utils/onboardingConfig';
import { getActiveVersion, getActiveConfigValue } from '../../utils/planVersioning';
import WeekViewStrip, { WeekDay } from '../../components/WeekViewStrip';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: '#0A0A0C',
  card: '#111113',
  sheet: '#0F0F11',
  orange: '#F59E0B',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  red: '#EF4444',
  white: '#F5F5F5',
  textSec: '#666',
  textDim: '#2E2E32',
  border: '#1E1E22',
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const SPLITS = [
  { id: 'ppl',     label: 'Push / Pull / Legs', sub: '6 days/week · Chest, Shoulders, Tri / Back, Bi / Legs' },
  { id: 'ul',      label: 'Upper / Lower',       sub: '4 days/week · Upper body · Lower body alternating' },
  { id: 'fb',      label: 'Full Body',            sub: '3 days/week · All muscle groups each session' },
  { id: 'boxing',  label: 'Boxing',               sub: '4 days/week · Bag work, pad work, strength & conditioning' },
  { id: 'running', label: 'Running',              sub: '4 days/week · Easy, tempo, speed work & long run' },
  { id: 'custom',  label: 'Custom',               sub: 'Your choice · Build your own split from scratch' },
];

const DURATIONS = [
  { id: 'indefinite', label: 'Indefinite', sub: 'Run until I stop it' },
  { id: '4w',         label: '4 Weeks',    sub: 'Short focused block' },
  { id: '8w',         label: '8 Weeks',    sub: 'Standard program length' },
  { id: '12w',        label: '12 Weeks',   sub: 'Full transformation cycle' },
  { id: 'checkin',    label: 'Check-in',   sub: 'Remind me every 2 weeks' },
];

const CATEGORIES = [
  { id: 'workout', icon: 'lightning-bolt',        label: 'Workout',          color: '#F59E0B', desc: 'Log exercises, sets, reps & weight' },
  { id: 'meal',    icon: 'silverware-fork-knife',  label: 'Meals',            color: '#10B981', desc: 'Log what and when you eat' },
  { id: 'water',   icon: 'water',                  label: 'Water',            color: '#3B82F6', desc: 'Track daily water intake' },
  { id: 'sleep',   icon: 'moon-waning-crescent',   label: 'Sleep & Recovery', color: '#8B5CF6', desc: 'Log sleep time and recovery' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWeekInfo(plan: Plan): string {
  const start = new Date(plan.start_date);
  const now = new Date();
  const weekNum = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
  if (plan.duration_mode === 'fixed' && plan.end_date) {
    const end = new Date(plan.end_date);
    const totalWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `WEEK ${weekNum} OF ${totalWeeks}`;
  }
  return `WEEK ${weekNum}`;
}

function getWeekProgress(plan: Plan): number {
  if (!plan.end_date) return 0;
  const start = new Date(plan.start_date).getTime();
  const end = new Date(plan.end_date).getTime();
  return Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
}

function getDurationLabel(plan: Plan): string {
  if (plan.duration_mode === 'fixed' && plan.end_date) {
    const weeks = Math.round(
      (new Date(plan.end_date).getTime() - new Date(plan.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return `Fixed — ${weeks} weeks`;
  }
  if (plan.duration_mode === 'check_in') return 'Check-in every 2 weeks';
  return 'Indefinite';
}

function getMondayOfWeek(): Date {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ─── Wizard Sub-Components ────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={s.stepDots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[s.stepDot, {
          width: i === current ? 20 : 6,
          backgroundColor: i <= current ? C.orange : C.border,
        }]} />
      ))}
    </View>
  );
}

function SelectPill({ label, sub, selected, onPress }: {
  label: string; sub?: string; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[s.pill, selected && { borderColor: C.orange, backgroundColor: C.orange + '15' }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[s.pillLabel, selected && { color: C.white }]}>{label}</Text>
        {sub ? <Text style={[s.pillSub, selected && { color: C.orange + 'BB' }]} numberOfLines={2}>{sub}</Text> : null}
      </View>
      <View style={[s.pillRadio, selected && { backgroundColor: C.orange, borderColor: C.orange }]}>
        {selected && <MaterialCommunityIcons name="check" size={11} color="#000" />}
      </View>
    </TouchableOpacity>
  );
}

function CategoryToggle({ cat, active, onToggle }: {
  cat: typeof CATEGORIES[number]; active: boolean; onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.75}
      style={[s.catToggle, active && { borderColor: cat.color + '55', backgroundColor: cat.color + '10' }]}
    >
      <View style={[s.catIconBox, { backgroundColor: active ? cat.color + '22' : '#1A1A1C' }]}>
        <MaterialCommunityIcons name={cat.icon as any} size={20} color={active ? cat.color : '#555'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.catLabel, active && { color: C.white }]}>{cat.label}</Text>
        <Text style={[s.catDesc, active && { color: cat.color + 'AA' }]} numberOfLines={1}>{cat.desc}</Text>
      </View>
      <View style={[s.toggle, { backgroundColor: active ? cat.color : C.border }]}>
        <View style={[s.toggleKnob, { left: active ? 12 : 2 }]} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyHero}>
        <View style={s.emptyIconRow}>
          {CATEGORIES.map(cat => (
            <View key={cat.id} style={[s.emptyIcon, { backgroundColor: cat.color + '18', borderColor: cat.color + '33' }]}>
              <MaterialCommunityIcons name={cat.icon as any} size={20} color={cat.color} />
            </View>
          ))}
        </View>
        <Text style={s.emptyTitle}>NO ACTIVE PLAN</Text>
        <Text style={s.emptySub}>Build your plan, set your categories, and start tracking today.</Text>
      </View>

      <TouchableOpacity style={s.ctaBtn} onPress={onStart} activeOpacity={0.85}>
        <Text style={s.ctaBtnText}>+ CREATE YOUR PLAN</Text>
      </TouchableOpacity>

      <Text style={s.emptyTip}>You control what you track — add as many or as few categories as you want</Text>
    </View>
  );
}

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

function Step1_Name({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View>
      <Text style={s.stepTitle}>NAME YOUR PLAN</Text>
      <Text style={s.stepSub}>Call it whatever keeps you motivated.</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="e.g. Summer Cut, Back to Basics…"
        placeholderTextColor={C.textDim}
        maxLength={32}
        style={s.nameInput}
        autoFocus
      />
      <Text style={s.charCount}>{value.length}/32</Text>
    </View>
  );
}

function Step2_Categories({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <View>
      <Text style={s.stepTitle}>WHAT ARE YOU TRACKING?</Text>
      <Text style={s.stepSub}>Pick one or all. You can always add more later.</Text>
      <View style={{ gap: 9, marginTop: 20 }}>
        {CATEGORIES.map(cat => (
          <CategoryToggle
            key={cat.id}
            cat={cat}
            active={selected.includes(cat.id)}
            onToggle={() => onToggle(cat.id)}
          />
        ))}
      </View>
    </View>
  );
}

function Step3_Split({ selected, onSelect, isEditing }: { selected: string; onSelect: (v: string) => void; isEditing?: boolean }) {
  return (
    <View>
      <Text style={s.stepTitle}>CHOOSE YOUR SPLIT</Text>
      {isEditing
        ? <Text style={s.stepSub}>Your exercises have been customised — shown as "Custom". Select a preset to reset all days to its default exercises, or keep Custom to leave your exercises unchanged.</Text>
        : <Text style={s.stepSub}>How do you want to structure your workout week?</Text>
      }
      <View style={{ gap: 9, marginTop: 20 }}>
        {SPLITS.map(sp => (
          <SelectPill key={sp.id} label={sp.label} sub={sp.sub} selected={selected === sp.id} onPress={() => onSelect(sp.id)} />
        ))}
      </View>
    </View>
  );
}

const MAX_DAYS = 7;
const DEFAULT_DAY_COUNT = 4;

function Step3b_CustomSplit({ days, onChange }: {
  days: string[]; onChange: (days: string[]) => void;
}) {
  const setCount = (n: number) => {
    const next = Array.from({ length: n }, (_, i) => days[i] ?? `Day ${i + 1}`);
    onChange(next);
  };
  const setName = (i: number, val: string) => {
    const next = [...days];
    next[i] = val;
    onChange(next);
  };

  return (
    <View>
      <Text style={s.stepTitle}>BUILD YOUR SPLIT</Text>
      <Text style={s.stepSub}>Choose how many days per week and name each session.</Text>

      {/* Day count selector */}
      <View style={s.dayCountRow}>
        <Text style={s.dayCountLabel}>TRAINING DAYS / WEEK</Text>
        <View style={s.dayCountBtns}>
          {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map(n => (
            <TouchableOpacity
              key={n}
              onPress={() => setCount(n)}
              style={[s.dayCountBtn, days.length === n && s.dayCountBtnActive]}
              activeOpacity={0.7}
            >
              <Text style={[s.dayCountBtnText, days.length === n && { color: '#000' }]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Day name inputs */}
      <View style={{ gap: 9, marginTop: 16 }}>
        {days.map((name, i) => (
          <View key={i} style={s.dayNameRow}>
            <View style={s.dayNumBadge}>
              <Text style={s.dayNumText}>{i + 1}</Text>
            </View>
            <TextInput
              value={name}
              onChangeText={v => setName(i, v)}
              placeholder={`Day ${i + 1} name…`}
              placeholderTextColor={C.textDim}
              maxLength={24}
              style={s.dayNameInput}
            />
          </View>
        ))}
      </View>

      <Text style={s.dayHint}>
        e.g. "Push", "Pull", "Legs", "Upper Body", "Chest & Back"
      </Text>
    </View>
  );
}

// ─── Configure Days (Workout) ─────────────────────────────────────────────────

// Helper: format seconds as "1m 30s" or "45s"
function fmtDuration(s: number): string {
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  }
  return `${s}s`;
}
// Helper: format meters as "1.2 km" or "400 m"
function fmtDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace(/\.0$/, '')} km` : `${m} m`;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: number;
  // For timed exercises (duration_seconds > 0 means metric_type = 'duration')
  duration_seconds?: number;
  // For distance exercises (distance_meters > 0 means metric_type = 'distance')
  distance_meters?: number;
  metric_type?: 'reps' | 'duration' | 'distance';
}
export interface WorkoutDayConfig { name: string; exercises: ExerciseEntry[]; }
export interface MealSlotConfig { name: string; time: string; type: string; }

type ExerciseRow = { id: string; name: string; primary_muscle_group: string; equipment_category: string | null; metric_type?: string | null };

const EQ_CATS = [
  { key: 'all',        label: 'All',       icon: 'dumbbell' },
  { key: 'barbell',    label: 'Barbell',   icon: 'weight-lifter' },
  { key: 'dumbbell',   label: 'Dumbbell',  icon: 'arm-flex' },
  { key: 'machine',    label: 'Machine',   icon: 'robot-industrial' },
  { key: 'cable',      label: 'Cable',     icon: 'cable-data' },
  { key: 'bodyweight', label: 'Bodyweight',icon: 'human' },
  { key: 'kettlebell', label: 'Kettlebell',icon: 'kettle' },
  { key: 'other',      label: 'Other',     icon: 'dots-horizontal' },
] as const;

function ConfigureDays({ days, onChange, userId }: {
  days: WorkoutDayConfig[];
  onChange: (d: WorkoutDayConfig[]) => void;
  userId: string;
}) {
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [displayList, setDisplayList] = useState<ExerciseRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [creatingCustom, setCreatingCustom] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCategory = useCallback(async (cat: string) => {
    setSearching(true);
    let q = supabase
      .from('exercises')
      .select('id, name, primary_muscle_group, equipment_category, metric_type')
      .order('name')
      .limit(30);
    if (cat !== 'all') q = q.eq('equipment_category', cat);
    const { data } = await q;
    setDisplayList(data ?? []);
    setSearching(false);
  }, []);

  // Load exercises when day opens or category changes
  useEffect(() => {
    if (expandedIdx < 0) return;
    if (searchQuery.length >= 2) return; // search mode, don't override
    loadCategory(activeCategory);
  }, [expandedIdx, activeCategory, loadCategory]);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (searchQuery.length < 2) {
      loadCategory(activeCategory);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      let q = supabase
        .from('exercises')
        .select('id, name, primary_muscle_group, equipment_category, metric_type')
        .ilike('name', `%${searchQuery}%`)
        .limit(15);
      if (activeCategory !== 'all') q = q.eq('equipment_category', activeCategory);
      const { data } = await q;
      setDisplayList(data ?? []);
      setSearching(false);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [searchQuery, activeCategory]);

  const toggleDay = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIdx(prev => prev === idx ? -1 : idx);
    setSearchQuery('');
  };

  const addDay = () => {
    if (days.length >= MAX_DAYS) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newIdx = days.length;
    onChange([...days, { name: `Day ${newIdx + 1}`, exercises: [] }]);
    setExpandedIdx(newIdx);
    setSearchQuery('');
  };

  const removeDay = (dayIdx: number) => {
    if (days.length <= 1) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(days.filter((_, i) => i !== dayIdx));
    setExpandedIdx(prev => {
      if (prev === dayIdx) return -1;
      if (prev > dayIdx) return prev - 1;
      return prev;
    });
  };

  const renameDay = (dayIdx: number, name: string) => {
    onChange(days.map((d, i) => i !== dayIdx ? d : { ...d, name }));
  };

  const addExercise = (dayIdx: number, ex: ExerciseRow) => {
    if (days[dayIdx].exercises.some(e => e.id === ex.id)) return;
    const mt = (ex.metric_type ?? 'reps') as 'reps' | 'duration' | 'distance';
    onChange(days.map((d, i) => i !== dayIdx ? d : {
      ...d,
      exercises: [...d.exercises, {
        id: ex.id,
        name: ex.name,
        muscle: ex.primary_muscle_group,
        sets: 3,
        reps: mt === 'reps' ? 8 : 0,
        metric_type: mt,
        duration_seconds: mt === 'duration' ? 60 : undefined,
        distance_meters: mt === 'distance' ? 400 : undefined,
      }],
    }));
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    onChange(days.map((d, i) => i !== dayIdx ? d : { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }));
  };

  const updateField = (dayIdx: number, exIdx: number, field: 'sets' | 'reps' | 'duration_seconds' | 'distance_meters', delta: number) => {
    const minVal = field === 'distance_meters' ? 100 : 1;
    const step = field === 'duration_seconds' ? 15 : field === 'distance_meters' ? 100 : 1;
    onChange(days.map((d, i) => i !== dayIdx ? d : {
      ...d,
      exercises: d.exercises.map((ex, j) => j !== exIdx ? ex : {
        ...ex,
        [field]: Math.max(minVal, ((ex[field] as number) ?? 0) + delta * step),
      }),
    }));
  };

  const createCustomExercise = async (dayIdx: number) => {
    const name = searchQuery.trim();
    if (!name) return;
    setCreatingCustom(true);
    try {
      // Check if it already exists
      const { data: existing } = await supabase
        .from('exercises')
        .select('id, name, primary_muscle_group, equipment_category, metric_type')
        .ilike('name', name)
        .limit(1)
        .maybeSingle();
      if (existing) {
        addExercise(dayIdx, existing);
        setSearchQuery('');
        return;
      }
      const { data: inserted, error } = await supabase
        .from('exercises')
        .insert({
          name,
          description: 'Custom exercise',
          primary_muscle_group: 'Custom',
          secondary_muscle_groups: [],
          equipment_required: [],
          movement_pattern: 'Custom',
          difficulty_level: 'beginner',
          is_bodyweight: false,
          is_locked: false,
          equipment_category: 'other',
          metric_type: 'reps',
          created_by: userId,
        })
        .select('id, name, primary_muscle_group, equipment_category, metric_type')
        .single();
      if (error) throw error;
      if (inserted) addExercise(dayIdx, inserted);
      setSearchQuery('');
    } catch (err) {
      Alert.alert('Error', 'Could not save custom exercise. Try a different name.');
    } finally {
      setCreatingCustom(false);
    }
  };

  return (
    <View>
      <Text style={s.stepTitle}>CONFIGURE YOUR DAYS</Text>
      {days.some(d => d.exercises.length > 0)
        ? <Text style={s.stepSub}>We've pre-filled exercises for each day. Swap, remove, or add more as you like.</Text>
        : <Text style={s.stepSub}>Add exercises to each session. Tap a day to expand. Use + ADD DAY to add more days.</Text>
      }

      <View style={{ gap: 8, marginTop: 18 }}>
        {days.map((day, dayIdx) => {
          const isOpen = expandedIdx === dayIdx;
          const isPrefilled = day.exercises.length > 0;
          return (
            <View key={dayIdx} style={[s.dayCard, isOpen && { borderColor: C.orange + '55' }]}>
              <TouchableOpacity style={s.dayCardHeader} onPress={() => toggleDay(dayIdx)} activeOpacity={0.75}>
                <View style={s.dayCardBadge}><Text style={s.dayCardBadgeText}>{dayIdx + 1}</Text></View>
                {isOpen ? (
                  <TextInput
                    value={day.name}
                    onChangeText={v => renameDay(dayIdx, v)}
                    style={s.dayCardNameInput}
                    placeholderTextColor={C.textSec}
                    maxLength={24}
                    onPress={e => e.stopPropagation?.()}
                  />
                ) : (
                  <Text style={s.dayCardName}>{day.name}</Text>
                )}
                {isPrefilled && !isOpen && (
                  <View style={s.prefilledBadge}>
                    <MaterialCommunityIcons name="lightning-bolt" size={10} color={C.orange} />
                    <Text style={s.prefilledBadgeText}>{day.exercises.length}</Text>
                  </View>
                )}
                {!isOpen && (
                  <Text style={s.dayCardCount}>
                    {day.exercises.length > 0 ? `${day.exercises.length} exercise${day.exercises.length !== 1 ? 's' : ''}` : 'empty'}
                  </Text>
                )}
                {days.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeDay(dayIdx)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ marginLeft: 4 }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={15} color="#555" />
                  </TouchableOpacity>
                )}
                <MaterialCommunityIcons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#444" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              {isOpen && (
                <View style={s.dayCardBody}>
                  {/* Added exercises */}
                  {day.exercises.map((ex, exIdx) => {
                    const mt = ex.metric_type ?? 'reps';
                    return (
                    <View key={ex.id} style={[s.exRow, exIdx > 0 && s.exRowBorder]}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.exName} numberOfLines={1}>{ex.name}</Text>
                        <Text style={s.exMuscle}>{ex.muscle}</Text>
                      </View>

                      {/* Sets counter — same for all types */}
                      <View style={s.counter}>
                        <TouchableOpacity onPress={() => updateField(dayIdx, exIdx, 'sets', -1)} style={s.counterBtn}>
                          <Text style={s.counterBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={s.counterVal}>{ex.sets}</Text>
                        <TouchableOpacity onPress={() => updateField(dayIdx, exIdx, 'sets', 1)} style={s.counterBtn}>
                          <Text style={s.counterBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Metric counter: reps / duration / distance */}
                      {mt === 'reps' ? (
                        <>
                          <Text style={s.counterX}>×</Text>
                          <View style={s.counter}>
                            <TouchableOpacity onPress={() => updateField(dayIdx, exIdx, 'reps', -1)} style={s.counterBtn}>
                              <Text style={s.counterBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={s.counterVal}>{ex.reps}</Text>
                            <TouchableOpacity onPress={() => updateField(dayIdx, exIdx, 'reps', 1)} style={s.counterBtn}>
                              <Text style={s.counterBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : mt === 'duration' ? (
                        <>
                          <Text style={s.counterX}>·</Text>
                          <View style={s.counter}>
                            <TouchableOpacity onPress={() => updateField(dayIdx, exIdx, 'duration_seconds', -1)} style={s.counterBtn}>
                              <Text style={s.counterBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={[s.counterVal, { minWidth: 36 }]}>{fmtDuration(ex.duration_seconds ?? 60)}</Text>
                            <TouchableOpacity onPress={() => updateField(dayIdx, exIdx, 'duration_seconds', 1)} style={s.counterBtn}>
                              <Text style={s.counterBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={s.counterX}>·</Text>
                          <View style={s.counter}>
                            <TouchableOpacity onPress={() => updateField(dayIdx, exIdx, 'distance_meters', -1)} style={s.counterBtn}>
                              <Text style={s.counterBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={[s.counterVal, { minWidth: 44 }]}>{fmtDistance(ex.distance_meters ?? 400)}</Text>
                            <TouchableOpacity onPress={() => updateField(dayIdx, exIdx, 'distance_meters', 1)} style={s.counterBtn}>
                              <Text style={s.counterBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}

                      <TouchableOpacity onPress={() => removeExercise(dayIdx, exIdx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name="close" size={15} color="#555" />
                      </TouchableOpacity>
                    </View>
                    );
                  })}

                  {/* Category filter tabs */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={s.catScroll}
                    contentContainerStyle={s.catScrollContent}
                  >
                    {EQ_CATS.map(cat => (
                      <TouchableOpacity
                        key={cat.key}
                        onPress={() => setActiveCategory(cat.key)}
                        style={[s.catPill, activeCategory === cat.key && s.catPillActive]}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.catPillText, activeCategory === cat.key && s.catPillTextActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Search bar */}
                  <View style={s.exSearchRow}>
                    <MaterialCommunityIcons name="magnify" size={15} color="#555" />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search or type a custom name…"
                      placeholderTextColor={C.textDim}
                      style={s.exSearchInput}
                    />
                    {(searching || creatingCustom) && <ActivityIndicator size="small" color={C.orange} />}
                    {searchQuery.length > 0 && !searching && (
                      <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name="close-circle" size={14} color="#444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Exercise list */}
                  <View style={s.exResults}>
                    {displayList.map((ex, i) => {
                      const added = day.exercises.some(e => e.id === ex.id);
                      const mt = ex.metric_type;
                      const metricIcon = mt === 'duration' ? 'timer-outline' : mt === 'distance' ? 'run-fast' : null;
                      return (
                        <TouchableOpacity
                          key={ex.id}
                          onPress={() => addExercise(dayIdx, ex)}
                          disabled={added}
                          activeOpacity={0.7}
                          style={[s.exResult, i > 0 && s.exResultBorder, added && { opacity: 0.35 }]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={s.exResultName}>{ex.name}</Text>
                            <Text style={s.exResultMuscle}>{ex.primary_muscle_group}</Text>
                          </View>
                          {metricIcon && (
                            <View style={[s.exCatBadge, { backgroundColor: '#1A2A3A', borderColor: '#3B82F6' }]}>
                              <MaterialCommunityIcons name={metricIcon as any} size={10} color="#60A5FA" style={{ marginRight: 2 }} />
                              <Text style={[s.exCatBadgeText, { color: '#60A5FA' }]}>{mt}</Text>
                            </View>
                          )}
                          {!metricIcon && ex.equipment_category !== 'other' && ex.equipment_category !== null && (
                            <View style={s.exCatBadge}>
                              <Text style={s.exCatBadgeText}>{ex.equipment_category}</Text>
                            </View>
                          )}
                          <MaterialCommunityIcons name={added ? 'check' : 'plus'} size={14} color={added ? '#555' : C.orange} style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                      );
                    })}

                    {/* Create custom exercise option */}
                    {searchQuery.trim().length >= 2 && (
                      <TouchableOpacity
                        onPress={() => createCustomExercise(dayIdx)}
                        disabled={creatingCustom}
                        activeOpacity={0.7}
                        style={[s.exResult, displayList.length > 0 && s.exResultBorder, { backgroundColor: C.orange + '0D' }]}
                      >
                        <MaterialCommunityIcons name="plus-circle-outline" size={15} color={C.orange} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={[s.exResultName, { color: C.orange }]}>
                            Save "{searchQuery.trim()}" as exercise
                          </Text>
                          <Text style={s.exResultMuscle}>Add to your personal library</Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {displayList.length === 0 && searchQuery.length < 2 && !searching && (
                      <View style={{ padding: 16, alignItems: 'center' }}>
                        <Text style={{ color: C.textSec, fontSize: 12 }}>
                          {activeCategory === 'all' ? 'Loading exercises…' : `No ${activeCategory} exercises found`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {days.length < MAX_DAYS && (
        <TouchableOpacity style={s.addDayBtn} onPress={addDay} activeOpacity={0.75}>
          <MaterialCommunityIcons name="plus" size={15} color={C.orange} />
          <Text style={s.addDayBtnText}>ADD DAY</Text>
        </TouchableOpacity>
      )}

      <Text style={s.dayHint}>Exercises are optional — you can always update from the workout screen.</Text>
    </View>
  );
}

// ─── Configure Meals ──────────────────────────────────────────────────────────

function ConfigureMeals({ slots, onChange }: { slots: MealSlotConfig[]; onChange: (s: MealSlotConfig[]) => void }) {
  const update = (i: number, field: keyof MealSlotConfig, val: string) =>
    onChange(slots.map((s, idx) => idx !== i ? s : { ...s, [field]: val }));
  const remove = (i: number) => onChange(slots.filter((_, idx) => idx !== i));
  const add = () => onChange([...slots, { name: `Meal ${slots.length + 1}`, time: '12:00', type: 'meal' }]);

  return (
    <View>
      <Text style={s.stepTitle}>SET UP YOUR MEALS</Text>
      <Text style={s.stepSub}>Name each slot and set the time. Drag to reorder later.</Text>
      <View style={{ gap: 9, marginTop: 20 }}>
        {slots.map((slot, i) => (
          <View key={i} style={s.mealSlotRow}>
            <View style={[s.dayCardBadge, { backgroundColor: C.green + '22' }]}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={13} color={C.green} />
            </View>
            <TextInput
              value={slot.name}
              onChangeText={v => update(i, 'name', v)}
              style={s.mealSlotName}
              placeholderTextColor={C.textDim}
              maxLength={24}
            />
            <TextInput
              value={slot.time}
              onChangeText={v => update(i, 'time', v)}
              style={s.mealSlotTime}
              placeholderTextColor={C.textDim}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            {slots.length > 1 && (
              <TouchableOpacity onPress={() => remove(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={15} color="#555" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={s.addSlotBtn} onPress={add} activeOpacity={0.75}>
          <MaterialCommunityIcons name="plus" size={14} color={C.green} />
          <Text style={s.addSlotText}>Add Meal Slot</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Configure Water ──────────────────────────────────────────────────────────

function ConfigureWater({ glasses, onChange }: { glasses: number; onChange: (n: number) => void }) {
  return (
    <View>
      <Text style={s.stepTitle}>DAILY WATER GOAL</Text>
      <Text style={s.stepSub}>How many glasses do you aim to drink per day?</Text>
      <View style={s.goalRow}>
        <TouchableOpacity style={s.goalBtn} onPress={() => onChange(Math.max(1, glasses - 1))}>
          <Text style={s.goalBtnText}>−</Text>
        </TouchableOpacity>
        <View style={s.goalCenter}>
          <Text style={s.goalValue}>{glasses}</Text>
          <Text style={s.goalUnit}>glasses / day</Text>
          <Text style={s.goalSub}>{glasses * 250} ml · {Math.round(glasses * 8.454)} fl oz</Text>
        </View>
        <TouchableOpacity style={s.goalBtn} onPress={() => onChange(Math.min(20, glasses + 1))}>
          <Text style={s.goalBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={s.quickRow}>
        {[6, 8, 10, 12].map(n => (
          <TouchableOpacity key={n} style={[s.quickBtn, glasses === n && s.quickBtnActive]} onPress={() => onChange(n)} activeOpacity={0.7}>
            <Text style={[s.quickBtnText, glasses === n && { color: '#000' }]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Configure Sleep ──────────────────────────────────────────────────────────

function ConfigureSleep({ hours, onChange }: { hours: number; onChange: (n: number) => void }) {
  return (
    <View>
      <Text style={s.stepTitle}>SLEEP TARGET</Text>
      <Text style={s.stepSub}>How many hours of sleep are you aiming for each night?</Text>
      <View style={s.goalRow}>
        <TouchableOpacity style={s.goalBtn} onPress={() => onChange(Math.max(4, parseFloat((hours - 0.5).toFixed(1))))}>
          <Text style={s.goalBtnText}>−</Text>
        </TouchableOpacity>
        <View style={s.goalCenter}>
          <Text style={s.goalValue}>{hours}</Text>
          <Text style={s.goalUnit}>hours / night</Text>
        </View>
        <TouchableOpacity style={s.goalBtn} onPress={() => onChange(Math.min(12, parseFloat((hours + 0.5).toFixed(1))))}>
          <Text style={s.goalBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={s.quickRow}>
        {[6, 7, 7.5, 8, 9].map(n => (
          <TouchableOpacity key={n} style={[s.quickBtn, hours === n && s.quickBtnActive]} onPress={() => onChange(n)} activeOpacity={0.7}>
            <Text style={[s.quickBtnText, hours === n && { color: '#000' }]}>{n}h</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Schedule Step (start date + rest days) ──────────────────────────────────

const WEEK_DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const WEEK_DAY_FULL  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function Step_Schedule({
  startDate, restDays, trainingDayCount,
  currentPlanEndDate, currentPlanName,
  onStartDate, onRestDays, lockStartDate,
}: {
  startDate: Date;
  restDays: number[];
  trainingDayCount: number;
  currentPlanEndDate?: Date;
  currentPlanName?: string;
  onStartDate: (d: Date) => void;
  onRestDays: (r: number[]) => void;
  lockStartDate?: boolean;
}) {
  const today = new Date(); today.setHours(0,0,0,0);

  // Calendar month navigation (0 = current month)
  const [monthOffset, setMonthOffset] = useState(0);

  // The earliest allowed start date
  const earliestStart = currentPlanEndDate
    ? (() => { const d = new Date(currentPlanEndDate); d.setHours(0,0,0,0); d.setDate(d.getDate() + 1); return d; })()
    : today;

  // Compute the month being displayed
  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const viewYear = viewMonth.getFullYear();
  const viewMonthIdx = viewMonth.getMonth();
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build the grid: ISO week starts Monday (0=Mon … 6=Sun)
  // Leading blanks: how many days before the 1st of the month (Mon=0)
  const firstDayOfMonth = new Date(viewYear, viewMonthIdx, 1);
  // JS: 0=Sun … 6=Sat → convert to Mon=0 … Sun=6
  const firstDayJS = firstDayOfMonth.getDay(); // 0=Sun
  const leadingBlanks = (firstDayJS === 0 ? 6 : firstDayJS - 1);
  const daysInMonth = new Date(viewYear, viewMonthIdx + 1, 0).getDate();
  // total cells — round up to complete rows
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

  // Max rest days
  const maxRestDays = trainingDayCount > 0 ? Math.max(0, 7 - trainingDayCount) : 7;
  const atLimit = restDays.length >= maxRestDays;

  const toggleRestDay = (dayIdx: number) => {
    const isCurrentlyRest = restDays.includes(dayIdx);
    if (!isCurrentlyRest && atLimit) return;
    onRestDays(isCurrentlyRest ? restDays.filter(d => d !== dayIdx) : [...restDays, dayIdx]);
  };

  const isSelected = (d: Date) => d.toDateString() === startDate.toDateString();

  const isBlocked = (d: Date) => {
    if (!currentPlanEndDate) return false;
    const e = new Date(currentPlanEndDate); e.setHours(0,0,0,0);
    return d >= today && d <= e;
  };

  const isPast = (d: Date) => d < today;

  // Can go back to current month but no further
  const canGoBack = monthOffset > 0;

  return (
    <View>
      <Text style={s.stepTitle}>SCHEDULE</Text>
      <Text style={s.stepSub}>Pick when your plan starts and which days are rest days.</Text>

      {/* ── Current Plan Overlap Warning ── */}
      {currentPlanEndDate && (
        <View style={s.schedCurrentPlanNote}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#F59E0B" />
          <Text style={s.schedCurrentPlanNoteText}>
            {currentPlanName ? `"${currentPlanName}"` : 'Your current plan'} runs until{' '}
            <Text style={{ fontWeight: '700' }}>{formatShortDate(currentPlanEndDate)}</Text>.
            {' '}Your new plan must start on or after{' '}
            <Text style={{ fontWeight: '700' }}>{formatShortDate(earliestStart)}</Text>.
          </Text>
        </View>
      )}

      {/* ── Start Date ── */}
      <Text style={[s.schedSectionLabel, lockStartDate && { color: '#444' }]}>START DATE</Text>
      <View style={[s.schedCalendar, lockStartDate && { opacity: 0.35 }]} pointerEvents={lockStartDate ? 'none' : 'auto'}>
        {/* Month navigation header */}
        <View style={s.schedMonthNav}>
          <TouchableOpacity
            onPress={() => setMonthOffset(o => o - 1)}
            disabled={!canGoBack}
            style={[s.schedMonthNavBtn, !canGoBack && { opacity: 0.2 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color={C.white} />
          </TouchableOpacity>
          <Text style={s.schedMonthLabel}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={() => setMonthOffset(o => o + 1)}
            style={s.schedMonthNavBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.white} />
          </TouchableOpacity>
        </View>

        {/* Day-of-week header */}
        <View style={s.schedCalHeader}>
          {WEEK_DAY_NAMES.map(n => (
            <Text key={n} style={s.schedCalHeaderCell}>{n}</Text>
          ))}
        </View>

        {/* Calendar grid rows */}
        {Array.from({ length: totalCells / 7 }, (_, week) => (
          <View key={week} style={s.schedCalRow}>
            {Array.from({ length: 7 }, (_, col) => {
              const cellIdx = week * 7 + col;
              const dayNum = cellIdx - leadingBlanks + 1;
              if (dayNum < 1 || dayNum > daysInMonth) {
                return <View key={col} style={s.schedCalCell} />;
              }
              const d = new Date(viewYear, viewMonthIdx, dayNum);
              const past = isPast(d);
              const blocked = isBlocked(d);
              const disabled = past || blocked || !!lockStartDate;
              const sel = isSelected(d);
              const isToday = d.toDateString() === today.toDateString();
              return (
                <TouchableOpacity
                  key={col}
                  onPress={() => !disabled && onStartDate(d)}
                  disabled={disabled}
                  activeOpacity={0.75}
                  style={[
                    s.schedCalCell,
                    sel && s.schedCalCellSelected,
                    isToday && !sel && !blocked && s.schedCalCellToday,
                    (past || blocked) && s.schedCalCellPast,
                    blocked && !past && s.schedCalCellBlocked,
                  ]}
                >
                  <Text style={[
                    s.schedCalCellText,
                    sel && s.schedCalCellTextSelected,
                    isToday && !sel && !blocked && { color: C.orange },
                    (past || blocked) && s.schedCalCellTextPast,
                  ]}>{dayNum}</Text>
                  {blocked && !past && <View style={s.schedCalCellBlockedDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={[s.schedSelectedRow, lockStartDate && { opacity: 0.35 }]}>
        <MaterialCommunityIcons name="calendar-check" size={14} color={lockStartDate ? '#555' : C.orange} />
        <Text style={[s.schedSelectedText, lockStartDate && { color: '#555' }]}>
          {isSelected(today) ? 'Starting today' : `Starting ${formatShortDate(startDate)}`}
        </Text>
      </View>

      {/* Lock notice when editing an active plan */}
      {lockStartDate && (
        <View style={[s.schedCurrentPlanNote, { marginTop: 10, marginBottom: 0 }]}>
          <MaterialCommunityIcons name="lock-outline" size={14} color="#F59E0B" />
          <Text style={s.schedCurrentPlanNoteText}>Start date is locked for active plans.</Text>
        </View>
      )}

      {/* ── Rest Days ── */}
      <View style={s.schedRestHeader}>
        <Text style={[s.schedSectionLabel, { marginTop: 0 }]}>REST DAYS</Text>
        <View style={s.schedRestQuota}>
          <Text style={s.schedRestQuotaNum}>{restDays.length}</Text>
          <Text style={s.schedRestQuotaSep}>/</Text>
          <Text style={s.schedRestQuotaMax}>{maxRestDays}</Text>
        </View>
      </View>
      <Text style={s.schedRestSub}>
        {trainingDayCount > 0
          ? `Your ${trainingDayCount}-day plan leaves ${maxRestDays} rest day${maxRestDays !== 1 ? 's' : ''} per week.`
          : 'Tap the days you won\'t be training each week.'}
      </Text>
      <View style={s.schedRestRow}>
        {WEEK_DAY_NAMES.map((name, i) => {
          const isRest = restDays.includes(i);
          const isDisabled = !isRest && atLimit;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => toggleRestDay(i)}
              disabled={isDisabled}
              activeOpacity={0.75}
              style={[
                s.schedRestBtn,
                isRest && s.schedRestBtnActive,
                isDisabled && s.schedRestBtnDisabled,
              ]}
            >
              <Text style={[
                s.schedRestBtnLabel,
                isRest && s.schedRestBtnLabelActive,
                isDisabled && { color: '#2A2A2E' },
              ]}>{name}</Text>
              {isRest && (
                <MaterialCommunityIcons name="sleep" size={11} color="#5555AA" style={{ marginTop: 2 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {restDays.length > 0 && (
        <Text style={s.schedRestSummary}>
          Rest: {restDays.sort((a, b) => a - b).map(i => WEEK_DAY_FULL[i]).join(', ')}
        </Text>
      )}
      {atLimit && maxRestDays > 0 && (
        <Text style={s.schedRestLimitNote}>
          Max {maxRestDays} rest day{maxRestDays !== 1 ? 's' : ''} for a {trainingDayCount}-day plan — tap a selected day to unselect it.
        </Text>
      )}
    </View>
  );
}

function Step4_Duration({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <View>
      <Text style={s.stepTitle}>HOW LONG?</Text>
      <Text style={s.stepSub}>Set a finish line or run it until you decide to stop.</Text>
      <View style={{ gap: 9, marginTop: 20 }}>
        {DURATIONS.map(d => (
          <SelectPill key={d.id} label={d.label} sub={d.sub} selected={selected === d.id} onPress={() => onSelect(d.id)} />
        ))}
      </View>
    </View>
  );
}

function Step5_Review({ form, isFutureStart, isEditing }: {
  form: {
    name: string; categories: string[]; split: string; duration: string;
    workoutDays: WorkoutDayConfig[];
    mealSlots: MealSlotConfig[]; waterGoalGlasses: number; sleepGoalHours: number;
    startDate: Date; restDays: number[];
  };
  isFutureStart: boolean;
  isEditing?: boolean;
}) {
  const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
  const isCustom = form.split === 'custom';
  const splitLabel = isCustom
    ? `Custom · ${form.workoutDays.length} days/week`
    : (SPLITS.find(sp => sp.id === form.split)?.label ?? '—');
  const durLabel = DURATIONS.find(d => d.id === form.duration)?.label ?? '—';
  const totalExercises = form.workoutDays.reduce((sum, d) => sum + d.exercises.length, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const startLabel = form.startDate.toDateString() === today.toDateString()
    ? 'Today'
    : form.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const restLabel = form.restDays.length > 0
    ? form.restDays.sort((a, b) => a - b).map(i => WEEK_DAY_FULL[i]).join(', ')
    : 'None';

  return (
    <View>
      <Text style={s.stepTitle}>{isEditing ? 'REVIEW CHANGES' : isFutureStart ? 'SCHEDULE PLAN?' : 'READY TO START?'}</Text>
      <Text style={s.stepSub}>
        {isEditing
          ? 'Review your updates. Changes to exercises will apply from today onwards.'
          : isFutureStart
          ? `This plan is queued and will activate automatically on ${startLabel}. Your current plan continues until then.`
          : "Here's what you're committing to."}
      </Text>

      {isFutureStart && (
        <View style={s.reviewScheduledBanner}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color="#6366F1" />
          <Text style={s.reviewScheduledBannerText}>
            Starts <Text style={{ fontWeight: '800', color: '#818CF8' }}>{startLabel}</Text>
            {' '}— nothing changes until then
          </Text>
        </View>
      )}

      <View style={s.reviewHero}>
        <Text style={s.reviewName}>{form.name || 'UNTITLED PLAN'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {form.categories.map(id => {
            const c = catMap[id];
            if (!c) return null;
            return (
              <View key={id} style={[s.reviewTag, { backgroundColor: c.color + '22', borderColor: c.color + '44' }]}>
                <MaterialCommunityIcons name={c.icon as any} size={10} color={c.color} />
                <Text style={[s.reviewTagText, { color: c.color }]}>{c.label.toUpperCase()}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {[
        { label: 'PLAN NAME', value: form.name || '—' },
        { label: 'STARTS', value: startLabel },
        ...(form.categories.includes('workout') ? [
          { label: 'SPLIT', value: splitLabel },
          { label: 'EXERCISES', value: totalExercises > 0 ? `${totalExercises} across ${form.workoutDays.length} days` : 'None set — add later' },
          { label: 'REST DAYS', value: restLabel },
        ] : []),
        ...(form.categories.includes('meal') ? [
          { label: 'MEAL SLOTS', value: `${form.mealSlots.length} slots configured` },
        ] : []),
        ...(form.categories.includes('water') ? [
          { label: 'WATER GOAL', value: `${form.waterGoalGlasses} glasses / day` },
        ] : []),
        ...(form.categories.includes('sleep') ? [
          { label: 'SLEEP TARGET', value: `${form.sleepGoalHours} hours / night` },
        ] : []),
        { label: 'DURATION', value: durLabel },
      ].map((row, i) => (
        <View key={i} style={s.reviewRow}>
          <Text style={s.reviewRowLabel}>{row.label}</Text>
          <Text style={s.reviewRowValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Plan Creation Logic ──────────────────────────────────────────────────────

async function runCreatePlans(
  userId: string,
  form: {
    name: string; categories: string[]; split: string; duration: string;
    workoutDays: WorkoutDayConfig[];
    mealSlots: MealSlotConfig[]; waterGoalGlasses: number; sleepGoalHours: number;
    startDate: Date; restDays: number[];
  },
  dispatch: any,
) {
  const durationMode = form.duration === 'checkin' ? 'check_in'
    : form.duration === 'indefinite' ? 'indefinite'
    : 'fixed';
  const fixedWeeks = form.duration === '4w' ? 4 : form.duration === '8w' ? 8 : form.duration === '12w' ? 12 : undefined;
  const startIso = form.startDate.toISOString();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isFutureStart = form.startDate > today;
  const planStatus = isFutureStart ? 'scheduled' : 'active';
  const endDate = fixedWeeks
    ? new Date(form.startDate.getTime() + fixedWeeks * 7 * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  const isCustomSplit = form.split === 'custom';
  const splitKey = form.split === 'ppl' ? 'PPL'
    : form.split === 'ul' ? 'UPPER_LOWER'
    : form.split === 'fb' ? 'FULL_BODY'
    : form.split === 'boxing' ? 'BOXING'
    : form.split === 'running' ? 'RUNNING'
    : 'FULL_BODY';

  // Only archive existing plans if the new plan starts today (immediate takeover)
  if (!isFutureStart) {
    await supabase.from('plans').update({ status: 'archived' })
      .eq('user_id', userId).eq('status', 'active').in('type', form.categories);
  } else {
    // Cancel any previously scheduled (not yet started) plans of the same types
    await supabase.from('plans').update({ status: 'archived' })
      .eq('user_id', userId).eq('status', 'scheduled').in('type', form.categories);
  }

  const createdPlans: Record<string, Plan> = {};
  // All categories created in this session share one group_id so they appear
  // as a single entry in the history tab instead of one card per category.
  const groupId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });

  for (const type of form.categories) {
    const startDateStr = form.startDate.toISOString().split('T')[0];
    const config: Record<string, any> =
      type === 'workout'
        ? {
            split: isCustomSplit ? 'CUSTOM' : splitKey,
            custom_days: isCustomSplit ? form.workoutDays.map(d => d.name) : undefined,
            rest_day_versions: [{ effective_from: startDateStr, rest_days: form.restDays }],
          }
      : type === 'meal' ? { template: 'CUSTOM' }
      : type === 'water'
        ? { water_target_versions: [{ effective_from: startDateStr, daily_target_ml: form.waterGoalGlasses * 250 }] }
      : { sleep_target_versions: [{ effective_from: startDateStr, target_hours: form.sleepGoalHours }] };

    const { data: plan, error } = await supabase
      .from('plans')
      .insert({ user_id: userId, name: form.name, type, duration_mode: durationMode, start_date: startIso, end_date: endDate, status: planStatus, config, group_id: groupId })
      .select().single();
    if (error) throw error;
    createdPlans[type] = plan;

    if (type === 'workout') {
      // Assign day_of_week as the actual calendar weekday (Mon=0 … Sun=6),
      // distributing workout days across the non-rest days of the week in order.
      const nonRestWeekdays = [0,1,2,3,4,5,6].filter(d => !form.restDays.includes(d));
      const workoutRows = form.workoutDays.map((day, idx) => ({
        plan_id: plan.id,
        day_of_week: nonRestWeekdays[idx] ?? idx,
        name: day.name,
        // Store in versioned format from day one so edits can append cleanly
        exercises: [{
          label: 'original',
          effective_from: startDateStr,
          exercises: day.exercises.map(ex => ({
            exercise_id: ex.id,
            sets: ex.sets,
            reps: ex.metric_type === 'reps' ? ex.reps : 0,
            rest_seconds: 90,
            metric_type: ex.metric_type ?? 'reps',
            duration_seconds: ex.duration_seconds ?? null,
            distance_meters: ex.distance_meters ?? null,
          })),
        }],
      }));
      await supabase.from('workouts').insert(workoutRows);
    }
    if (type === 'meal') {
      const slots = form.mealSlots.map((slot, idx) => ({
        plan_id: plan.id, name: slot.name, time_of_day: slot.time, meal_type: slot.type, order_index: idx,
      }));
      await supabase.from('meal_slots').insert(slots);
    }
  }

  // Upsert streaks for all selected categories + overall
  await supabase.from('streaks').upsert(
    [...form.categories, 'overall'].map(category => ({ user_id: userId, category, current_count: 0, longest_count: 0 })),
    { onConflict: 'user_id, category', ignoreDuplicates: true }
  );

  // Upsert skip tokens
  const currentMonth = new Date().toISOString().substring(0, 7) + '-01';
  await supabase.from('skip_tokens')
    .upsert({ user_id: userId, month: currentMonth, total_tokens: 2, used_tokens: 0 },
    { onConflict: 'user_id, month', ignoreDuplicates: true });

  // Update Redux — only put plans into activePlans if they start today
  if (!isFutureStart) {
    dispatch(setActivePlans({
      workout: createdPlans.workout,
      meal: createdPlans.meal,
      water: createdPlans.water,
      sleep: createdPlans.sleep,
    }));
  } else {
    // Reload scheduled plans from Supabase
    const { data: scheduled } = await supabase
      .from('plans').select('*').eq('user_id', userId).eq('status', 'scheduled')
      .order('start_date', { ascending: true });
    dispatch(setScheduledPlans(scheduled ?? []));
  }

  const { data: streakRows } = await supabase.from('streaks').select('*').eq('user_id', userId);
  if (streakRows) {
    const sm: Record<string, Streak> = {};
    streakRows.forEach((sr: Streak) => { sm[sr.category] = sr; });
    dispatch(setStreaks({ workout: sm.workout ?? null, meal: sm.meal ?? null, water: sm.water ?? null, sleep: sm.sleep ?? null, overall: sm.overall ?? null }));
  }
}

// ─── Day Detail Modal ─────────────────────────────────────────────────────────

interface DayDetailModalProps {
  day: WeekDay | null;
  allWorkoutRows: any[];
  userId: string;
  planId: string | null;
  onClose: () => void;
}

function DayDetailModal({ day, allWorkoutRows, userId, planId, onClose }: DayDetailModalProps) {
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>({});
  const [loggedSets, setLoggedSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const plannedRow = day && day.planDayIdx !== null
    ? allWorkoutRows.find((w: any) => w.day_of_week === day.planDayIdx) ?? null
    : null;
  const dayDateStr = day?.date.toISOString().split('T')[0];
  const plannedExercises: { exercise_id: string; sets: number; reps: number }[] =
    getActiveVersion(plannedRow?.exercises ?? [], dayDateStr);

  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setLoggedSets([]);
      setExerciseNames({});
      try {
        const allExIds = plannedExercises.map((e: any) => e.exercise_id).filter(Boolean);

        // Fetch exercise names
        if (allExIds.length > 0) {
          const { data: exRows } = await supabase
            .from('exercises').select('id, name').in('id', allExIds);
          const nameMap: Record<string, string> = {};
          (exRows ?? []).forEach((ex: any) => { nameMap[ex.id] = ex.name; });
          if (!cancelled) setExerciseNames(nameMap);
        }

        // Fetch actual logs for this day (past/today only)
        if (!day.isFuture && planId) {
          const dateStr = day.date.toISOString().split('T')[0];
          const { data: logs } = await supabase
            .from('workout_logs')
            .select('exercise_id, sets_data')
            .eq('user_id', userId)
            .gte('logged_at', `${dateStr}T00:00:00`)
            .lte('logged_at', `${dateStr}T23:59:59`);

          if (!cancelled) {
            // Also fetch exercise names for any logged exercises not in the plan
            const loggedExIds = (logs ?? []).map((l: any) => l.exercise_id).filter(Boolean);
            const missingIds = loggedExIds.filter((id: string) => !allExIds.includes(id));
            if (missingIds.length > 0) {
              const { data: missingExRows } = await supabase
                .from('exercises').select('id, name').in('id', missingIds);
              setExerciseNames(prev => {
                const next = { ...prev };
                (missingExRows ?? []).forEach((ex: any) => { next[ex.id] = ex.name; });
                return next;
              });
            }
            setLoggedSets(logs ?? []);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [day?.date.toDateString()]);

  if (!day) return null;

  const dateLabel = day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const isToday = day.isToday;
  const isPast = !day.isFuture && !isToday;

  const loggedExIds = new Set(loggedSets.map((l: any) => l.exercise_id));
  const totalLoggedSets = loggedSets.reduce((sum, l) => sum + ((l.sets_data ?? []).filter((s: any) => s.completed).length), 0);

  return (
    <Modal
      visible={!!day}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
          {/* Handle */}
          <View style={s.modalHandle} />

          {/* Header — always visible */}
          <View style={s.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalDateLabel}>{dateLabel.toUpperCase()}</Text>
              {isToday && (
                <View style={s.modalTodayBadge}>
                  <View style={s.modalTodayDot} />
                  <Text style={s.modalTodayText}>TODAY</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="close" size={20} color="#555" />
            </TouchableOpacity>
          </View>

          {/* Scrollable body — fills remaining sheet height */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <ActivityIndicator color={C.orange} size="small" style={{ marginVertical: 24 }} />
            ) : day.isScheduledPlan ? (
              /* ── Scheduled (Future) Plan Day ── */
              <View style={s.modalRestWrap}>
                <View style={[s.modalRestIcon, { backgroundColor: '#6366F122' }]}>
                  <MaterialCommunityIcons name="calendar-clock" size={32} color="#6366F1" />
                </View>
                <Text style={[s.modalRestTitle, { color: '#6366F1' }]}>UPCOMING PLAN</Text>
                <Text style={s.modalRestSub}>
                  {day.plannedWorkoutName
                    ? `"${day.plannedWorkoutName}" starts on this day.`
                    : 'This day belongs to your next scheduled plan.'}
                </Text>
                <Text style={[s.modalRestSub, { marginTop: 6, color: '#555' }]}>
                  Your current plan finishes before this. Keep it up!
                </Text>
              </View>
            ) : day.isOutOfPlan ? (
              /* ── No Plan Coverage ── */
              <View style={s.modalRestWrap}>
                <View style={[s.modalRestIcon, { backgroundColor: '#1A1A1A' }]}>
                  <MaterialCommunityIcons name="calendar-remove-outline" size={32} color="#444" />
                </View>
                <Text style={[s.modalRestTitle, { color: '#444' }]}>NO PLAN</Text>
                <Text style={[s.modalRestSub, { color: '#333' }]}>
                  This day falls outside any active or scheduled plan.
                </Text>
                <Text style={[s.modalRestSub, { marginTop: 6, color: '#333' }]}>
                  Create a new plan to fill this time.
                </Text>
              </View>
            ) : day.isRestDay ? (
              /* ── Rest Day ── */
              <View style={s.modalRestWrap}>
                <View style={s.modalRestIcon}>
                  <MaterialCommunityIcons name="sleep" size={32} color="#5555AA" />
                </View>
                <Text style={s.modalRestTitle}>REST DAY</Text>
                <Text style={s.modalRestSub}>Recovery is part of the process. Let your body rebuild.</Text>
                {isPast && loggedSets.length > 0 && (
                  <View style={s.modalRestNote}>
                    <MaterialCommunityIcons name="check-circle" size={14} color={C.orange} />
                    <Text style={s.modalRestNoteText}>You still logged {totalLoggedSets} set{totalLoggedSets !== 1 ? 's' : ''} today</Text>
                  </View>
                )}
              </View>
            ) : (
              /* ── Training Day ── */
              <View>
                {/* Day name banner */}
                {plannedRow && (
                  <View style={s.modalWorkoutBanner}>
                    <MaterialCommunityIcons name="lightning-bolt" size={14} color={C.orange} />
                    <Text style={s.modalWorkoutName}>{plannedRow.name}</Text>
                    {!day.isFuture && (
                      <View style={[s.modalStatusBadge, {
                        backgroundColor: loggedSets.length > 0 ? C.orange + '22' : '#222',
                      }]}>
                        <Text style={[s.modalStatusText, {
                          color: loggedSets.length > 0 ? C.orange : '#555',
                        }]}>
                          {loggedSets.length > 0 ? `${loggedExIds.size} logged` : isPast ? 'Skipped' : 'Not started'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Summary stats for past days */}
                {!day.isFuture && loggedSets.length > 0 && (
                  <View style={s.modalSummaryRow}>
                    <View style={s.modalSummaryBox}>
                      <Text style={s.modalSummaryVal}>{loggedExIds.size}</Text>
                      <Text style={s.modalSummaryLabel}>EXERCISES</Text>
                    </View>
                    <View style={[s.modalSummaryBox, { borderLeftWidth: 1, borderLeftColor: '#222' }]}>
                      <Text style={s.modalSummaryVal}>{totalLoggedSets}</Text>
                      <Text style={s.modalSummaryLabel}>SETS DONE</Text>
                    </View>
                  </View>
                )}

                {/* Exercise list */}
                {plannedExercises.length === 0 ? (
                  <Text style={s.modalNoExercises}>No exercises configured for this day.</Text>
                ) : (
                  <View style={s.modalExList}>
                    {plannedExercises.map((ex: any, i: number) => {
                      const name = exerciseNames[ex.exercise_id] ?? 'Exercise';
                      const logged = loggedSets.find((l: any) => l.exercise_id === ex.exercise_id);
                      const completedSets = logged
                        ? (logged.sets_data ?? []).filter((s: any) => s.completed)
                        : [];
                      const isDone = completedSets.length >= ex.sets;

                      return (
                        <View key={i} style={[s.modalExRow, i > 0 && s.modalExRowBorder]}>
                          <View style={[
                            s.modalExCheck,
                            isDone && { backgroundColor: C.orange, borderColor: C.orange },
                            !isDone && completedSets.length > 0 && { borderColor: C.orange },
                          ]}>
                            {isDone
                              ? <MaterialCommunityIcons name="check" size={11} color="#000" />
                              : completedSets.length > 0
                                ? <Text style={{ color: C.orange, fontSize: 9, fontWeight: '800' }}>{completedSets.length}</Text>
                                : null
                            }
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.modalExName, isDone && { color: '#666' }]} numberOfLines={1}>{name}</Text>
                            <Text style={s.modalExTarget}>{ex.sets}×{ex.reps} target</Text>
                          </View>
                          {!day.isFuture && completedSets.length > 0 && (
                            <Text style={s.modalExLogged}>{completedSets.length}/{ex.sets} sets</Text>
                          )}
                          {day.isFuture && (
                            <Text style={s.modalExFuture}>{ex.sets}×{ex.reps}</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface PlanGroup {
  /** key used for React rendering */
  key: string;
  name: string;
  status: Plan['status'];
  start_date: string;
  end_date?: string;
  updated_at: string;
  /** one Plan row per category that belongs to this group */
  plans: Plan[];
}
interface ScreenData { weekDays: WeekDay[]; skipTotal: number; skipUsed: number; historyGroups: PlanGroup[]; allWorkoutRows: any[]; planStartDate: string | null; planEndDate: string | null; }

interface WorkoutDayDetail { name: string; exercises: { name: string; sets: number; reps: number }[]; }
interface MealSlotDetail  { name: string; time: string; type: string; }
interface CatDetails {
  workout?: WorkoutDayDetail[];
  meal?:    MealSlotDetail[];
  loadingCats: Set<string>;
}

export default function PlanManagementScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activePlans, scheduledPlans } = useSelector((state: RootState) => state.plan);
  const { streaks } = useSelector((state: RootState) => state.streak);

  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [creating, setCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlanIds, setEditingPlanIds] = useState<string[]>([]);
  const [step, setStep] = useState(0);

  const defaultMealSlots: MealSlotConfig[] = MEAL_TEMPLATES['FOUR_MEALS'].slots.map(s => ({ name: s.name, time: s.time, type: s.type }));
  // Default start date for new plans: day after current plan ends (if applicable), else today
  const defaultStartDate = (() => {
    const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);
    if (activePlans.workout?.end_date) {
      const end = new Date(activePlans.workout.end_date); end.setHours(0,0,0,0);
      const nextDay = new Date(end); nextDay.setDate(end.getDate() + 1);
      return nextDay > todayMidnight ? nextDay : todayMidnight;
    }
    return todayMidnight;
  })();

  const defaultForm = {
    name: '',
    categories: ['workout'] as string[],
    split: '',
    duration: '',
    workoutDays: [] as WorkoutDayConfig[],
    mealSlots: defaultMealSlots,
    waterGoalGlasses: 8,
    sleepGoalHours: 8,
    startDate: defaultStartDate,
    restDays: [] as number[],  // 0=Mon … 6=Sun (ISO week order)
  };
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [screenData, setScreenData] = useState<ScreenData>({
    weekDays: [], skipTotal: 2, skipUsed: 0, historyGroups: [], allWorkoutRows: [], planStartDate: null, planEndDate: null,
  });
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [catDetails, setCatDetails] = useState<CatDetails>({ loadingCats: new Set() });
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [endDatePickerMonth, setEndDatePickerMonth] = useState(0); // month offset from today

  const fetchCatDetail = useCallback(async (catId: string) => {
    // Don't re-fetch if already loaded
    if ((catDetails as any)[catId] !== undefined) return;
    setCatDetails(prev => ({ ...prev, loadingCats: new Set([...prev.loadingCats, catId]) }));
    try {
      if (catId === 'workout' && activePlans.workout) {
        const { data: workoutRows } = await supabase
          .from('workouts')
          .select('name, day_of_week, exercises')
          .eq('plan_id', activePlans.workout.id)
          .order('day_of_week', { ascending: true });

        const days: WorkoutDayDetail[] = [];
        if (workoutRows && workoutRows.length > 0) {
          const allExIds = workoutRows.flatMap((w: any) =>
            getActiveVersion(w.exercises ?? []).map((e: any) => e.exercise_id).filter(Boolean)
          );
          let nameMap: Record<string, string> = {};
          if (allExIds.length > 0) {
            const { data: exRows } = await supabase
              .from('exercises').select('id, name').in('id', allExIds);
            nameMap = (exRows ?? []).reduce((acc: Record<string, string>, ex: any) => {
              acc[ex.id] = ex.name; return acc;
            }, {});
          }
          for (const row of workoutRows) {
            days.push({
              name: row.name,
              exercises: getActiveVersion(row.exercises ?? []).map((ex: any) => ({
                name: nameMap[ex.exercise_id] ?? 'Exercise',
                sets: ex.sets ?? 3,
                reps: ex.reps ?? 8,
              })),
            });
          }
        }
        setCatDetails(prev => {
          const next = new Set(prev.loadingCats); next.delete('workout');
          return { ...prev, workout: days, loadingCats: next };
        });

      } else if (catId === 'meal' && activePlans.meal) {
        const { data: slots } = await supabase
          .from('meal_slots')
          .select('name, time_of_day, meal_type')
          .eq('plan_id', activePlans.meal.id)
          .order('order_index', { ascending: true });
        const slotList: MealSlotDetail[] = (slots ?? []).map((s: any) => ({
          name: s.name, time: s.time_of_day, type: s.meal_type,
        }));
        setCatDetails(prev => {
          const next = new Set(prev.loadingCats); next.delete('meal');
          return { ...prev, meal: slotList, loadingCats: next };
        });

      } else {
        // Water and sleep have config in Redux — no extra fetch needed
        setCatDetails(prev => {
          const next = new Set(prev.loadingCats); next.delete(catId);
          return { ...prev, loadingCats: next };
        });
      }
    } catch {
      setCatDetails(prev => {
        const next = new Set(prev.loadingCats); next.delete(catId);
        return { ...prev, loadingCats: next };
      });
    }
  }, [activePlans, catDetails]);

  const hasActivePlans = Object.values(activePlans).some(Boolean);

  // Derive wizard steps dynamically
  const steps = [
    { id: 'name' },
    ...(!isEditing ? [{ id: 'categories' }] : []),
    ...(form.categories.includes('workout') ? [
      { id: 'split' },
      ...(form.split ? [{ id: 'configureDays' }] : []),
    ] : []),
    ...(form.categories.includes('meal')  ? [{ id: 'configureMeals' }] : []),
    ...(form.categories.includes('water') ? [{ id: 'configureWater' }] : []),
    ...(form.categories.includes('sleep') ? [{ id: 'configureSleep' }] : []),
    { id: 'duration' },
    { id: 'schedule' },
    { id: 'review' },
  ];
  const currentStepId = steps[step]?.id;
  const isLastStep = step === steps.length - 1;
  const canAdvance = (() => {
    if (currentStepId === 'name')           return form.name.trim().length > 0;
    if (currentStepId === 'categories')     return form.categories.length > 0;
    if (currentStepId === 'split')          return !!form.split;
    if (currentStepId === 'configureDays')  return true;
    if (currentStepId === 'configureMeals') return form.mealSlots.length > 0 && form.mealSlots.every(sl => sl.name.trim().length > 0);
    if (currentStepId === 'configureWater') return true;
    if (currentStepId === 'configureSleep') return true;
    if (currentStepId === 'duration')       return !!form.duration;
    if (currentStepId === 'schedule') {
      // When editing, start date is locked (active) or freely chosen (scheduled) — always advance
      if (isEditing) return true;
      // For new plans, selected start date must be after current plan ends
      if (activePlans.workout?.end_date) {
        const end = new Date(activePlans.workout.end_date); end.setHours(0,0,0,0);
        return form.startDate > end;
      }
      return true;
    }
    if (currentStepId === 'review') return true;
    return false;
  })();

  const loadScreenData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const monday = getMondayOfWeek();
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      const today = new Date();

      const { data: logs } = await supabase
        .from('workout_logs')
        .select('logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', monday.toISOString())
        .lte('logged_at', sunday.toISOString());

      const logDates = new Set((logs ?? []).map((l: any) => new Date(l.logged_at).toDateString()));

      // Fetch the active workout plan fresh from DB (avoids stale closure issues)
      let allWorkoutRows: any[] = [];
      let planStartDate: string | null = null;
      let planEndDate: string | null = null;
      let planRestDays: number[] = [];
      const { data: freshWorkoutPlan } = await supabase
        .from('plans').select('*').eq('user_id', user.id)
        .eq('type', 'workout').eq('status', 'active').maybeSingle();
      if (freshWorkoutPlan) {
        planStartDate = freshWorkoutPlan.start_date ?? null;
        planEndDate = freshWorkoutPlan.end_date ?? null;
        planRestDays = getActiveConfigValue(freshWorkoutPlan.config?.rest_day_versions, 'rest_days') ?? freshWorkoutPlan.config?.rest_days ?? [];
        const { data: workoutRows } = await supabase
          .from('workouts')
          .select('id, name, day_of_week, exercises')
          .eq('plan_id', freshWorkoutPlan.id)
          .order('day_of_week', { ascending: true });
        allWorkoutRows = workoutRows ?? [];
        // Keep Redux in sync if it was stale
        if (!activePlans.workout || activePlans.workout.id !== freshWorkoutPlan.id) {
          dispatch(setActivePlan({ type: 'workout', plan: freshWorkoutPlan }));
        }
      }

      const numPlanDays = allWorkoutRows.length;
      // Pre-compute a set of rest weekdays for quick lookup (Mon=0 … Sun=6)
      const activeRestDays = new Set<number>(planRestDays);
      // Helper: JS getDay (Sun=0) → Mon=0 … Sun=6
      const toMonZero = (jsDow: number) => jsDow === 0 ? 6 : jsDow - 1;

      const weekDays: WeekDay[] = DAY_LABELS.map((label, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);

        let isRestDay = false;
        let plannedWorkoutName: string | null = null;
        let planDayIdx: number | null = null;

        const dateMidnight = new Date(date); dateMidnight.setHours(0,0,0,0);

        // Check if this day is within the active plan's date range
        const planStart = planStartDate ? (() => { const [y,m,d] = planStartDate.split('T')[0].split('-').map(Number); return new Date(y, m-1, d); })() : null;
        const planEnd   = planEndDate   ? (() => { const [y,m,d] = planEndDate.split('T')[0].split('-').map(Number);   return new Date(y, m-1, d); })() : null;
        const inActivePlan = planStart
          ? dateMidnight >= planStart && (!planEnd || dateMidnight <= planEnd)
          : false;

        if (inActivePlan) {
          const weekday = toMonZero(date.getDay()); // Mon=0 … Sun=6
          if (activeRestDays.has(weekday)) {
            isRestDay = true;
          } else if (numPlanDays > 0) {
            const row = allWorkoutRows.find((w: any) => w.day_of_week === weekday);
            planDayIdx = weekday;
            isRestDay = !row || (row.exercises ?? []).length === 0;
            plannedWorkoutName = row?.name ?? null;
          }
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
          isOutOfPlan: !inActivePlan,
        };
      });

      const currentMonth = new Date().toISOString().substring(0, 7) + '-01';
      const { data: tokens } = await supabase
        .from('skip_tokens').select('*').eq('user_id', user.id).eq('month', currentMonth).maybeSingle();

      const { data: history } = await supabase
        .from('plans').select('*').eq('user_id', user.id)
        .in('status', ['archived', 'completed']).order('updated_at', { ascending: false }).limit(60);

      // Group sibling rows (same group_id, or same name+start_date as fallback)
      // so the history tab shows one card per plan creation event.
      const groupMap = new Map<string, PlanGroup>();
      for (const row of (history ?? []) as Plan[]) {
        const key = row.group_id ?? `${row.name}__${row.start_date}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            key,
            name: row.name,
            status: row.status,
            start_date: row.start_date,
            end_date: row.end_date,
            updated_at: row.updated_at,
            plans: [],
          });
        }
        groupMap.get(key)!.plans.push(row);
      }
      const historyGroups: PlanGroup[] = Array.from(groupMap.values());

      // Refresh scheduled plans in Redux
      const { data: scheduled } = await supabase
        .from('plans').select('*').eq('user_id', user.id).eq('status', 'scheduled')
        .order('start_date', { ascending: true });
      dispatch(setScheduledPlans(scheduled ?? []));

      setScreenData({
        weekDays,
        skipTotal: tokens?.total_tokens ?? 2,
        skipUsed: tokens?.used_tokens ?? 0,
        historyGroups,
        allWorkoutRows,
        planStartDate,
        planEndDate,
      });
    } catch (e) {
      console.error('Plan screen load error:', e);
    } finally {
      setDataLoading(false);
    }
  }, [user, dispatch]);

  useEffect(() => { loadScreenData(); }, [loadScreenData]);

  // When the number of workout days changes (days added/removed in ConfigureDays),
  // reset rest days so the user is forced to re-pick them on the schedule step.
  // We track the previous count via a ref to avoid clearing on initial mount.
  const prevWorkoutDayCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (!creating) { prevWorkoutDayCountRef.current = null; return; }
    const count = form.workoutDays.length;
    if (prevWorkoutDayCountRef.current !== null && prevWorkoutDayCountRef.current !== count) {
      setForm(f => ({ ...f, restDays: [] }));
    }
    prevWorkoutDayCountRef.current = count;
  }, [form.workoutDays.length, creating]);

  // ── Edit Plan ─────────────────────────────────────────────────────────────

  const openEditWizard = useCallback(async (groupId: string) => {
    if (!user) return;
    // Fetch all plans in this group
    const { data: siblingPlans } = await supabase
      .from('plans')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user.id);
    if (!siblingPlans || siblingPlans.length === 0) return;

    const workoutPlan = siblingPlans.find((p: any) => p.type === 'workout');
    const mealPlan    = siblingPlans.find((p: any) => p.type === 'meal');
    const waterPlan   = siblingPlans.find((p: any) => p.type === 'water');
    const sleepPlan   = siblingPlans.find((p: any) => p.type === 'sleep');

    const anyPlan = siblingPlans[0];
    const cats: string[] = siblingPlans.map((p: any) => p.type);

    // Parse start date as local to avoid timezone shift
    const rawStart = anyPlan.start_date?.split('T')[0] ?? new Date().toISOString().split('T')[0];
    const [sy, sm, sd] = rawStart.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);

    // Derive duration mode back to a form id
    const durationMode = anyPlan.duration_mode ?? 'indefinite';
    let duration = 'indefinite';
    if (durationMode === '4w') duration = '4w';
    else if (durationMode === '8w') duration = '8w';
    else if (durationMode === '12w') duration = '12w';
    else if (durationMode === 'checkin') duration = 'checkin';

    // Hydrate workout days from latest version
    let workoutDays: WorkoutDayConfig[] = [];
    let restDays: number[] = [];
    let splitId = '';

    if (workoutPlan) {
      const cfg = workoutPlan.config ?? {};
      restDays = getActiveConfigValue(cfg.rest_day_versions, 'rest_days') ?? cfg.rest_days ?? [];
      splitId = cfg.split === 'CUSTOM' ? 'custom'
        : cfg.split === 'PPL' ? 'ppl'
        : cfg.split === 'UPPER_LOWER' ? 'ul'
        : cfg.split === 'FULL_BODY' ? 'fb'
        : cfg.split === 'BOXING' ? 'boxing'
        : cfg.split === 'RUNNING' ? 'running'
        : 'custom';

      const { data: workoutRows } = await supabase
        .from('workouts')
        .select('id, day_of_week, name, exercises')
        .eq('plan_id', workoutPlan.id)
        .order('day_of_week', { ascending: true });

      if (workoutRows && workoutRows.length > 0) {
        const allExIds = workoutRows.flatMap((w: any) =>
          getActiveVersion(w.exercises ?? []).map((e: any) => e.exercise_id).filter(Boolean)
        );
        let exInfoMap: Record<string, { name: string; muscle: string; metric_type: string }> = {};
        if (allExIds.length > 0) {
          const { data: exRows } = await supabase
            .from('exercises')
            .select('id, name, primary_muscle_group, metric_type')
            .in('id', allExIds);
          (exRows ?? []).forEach((ex: any) => {
            exInfoMap[ex.id] = { name: ex.name, muscle: ex.primary_muscle_group ?? '', metric_type: ex.metric_type ?? 'reps' };
          });
        }
        workoutDays = workoutRows.map((row: any) => ({
          name: row.name,
          exercises: getActiveVersion(row.exercises ?? []).map((ex: any) => {
            const info = exInfoMap[ex.exercise_id] ?? { name: 'Exercise', muscle: '', metric_type: 'reps' };
            const mt = (ex.metric_type ?? info.metric_type ?? 'reps') as 'reps' | 'duration' | 'distance';
            return {
              id: ex.exercise_id,
              name: info.name,
              muscle: info.muscle,
              sets: ex.sets ?? 3,
              reps: ex.reps ?? 8,
              metric_type: mt,
              duration_seconds: ex.duration_seconds ?? undefined,
              distance_meters: ex.distance_meters ?? undefined,
            };
          }),
        }));
      }

      // Always treat as custom when editing — the exercises are already hydrated
      // and we don't want the split step to re-initialize them from a template.
      splitId = 'custom';
    }

    // Hydrate meal slots
    let mealSlots: MealSlotConfig[] = defaultMealSlots;
    if (mealPlan) {
      const { data: slots } = await supabase
        .from('meal_slots')
        .select('name, time_of_day, meal_type')
        .eq('plan_id', mealPlan.id)
        .order('order_index', { ascending: true });
      if (slots && slots.length > 0) {
        mealSlots = slots.map((s: any) => ({ name: s.name, time: s.time_of_day, type: s.meal_type }));
      }
    }

    // Water / sleep goals from latest versions
    const waterGoalGlasses = waterPlan
      ? Math.round((getActiveConfigValue(waterPlan.config?.water_target_versions, 'daily_target_ml') ?? waterPlan.config?.daily_target_ml ?? 2000) / 250)
      : 8;
    const sleepGoalHours = sleepPlan
      ? (getActiveConfigValue(sleepPlan.config?.sleep_target_versions, 'target_hours') ?? sleepPlan.config?.target_hours ?? 8)
      : 8;

    setEditingPlanIds(siblingPlans.map((p: any) => p.id));
    setForm({
      name: anyPlan.name,
      categories: cats,
      split: splitId,
      duration,
      workoutDays,
      mealSlots,
      waterGoalGlasses,
      sleepGoalHours,
      startDate,
      restDays,
    });
    setStep(0);
    setIsEditing(true);
    setCreating(true);
  }, [user, defaultMealSlots]);

  const runEditPlan = useCallback(async (userId: string, f: typeof defaultForm) => {
    const todayStr = new Date().toISOString().split('T')[0];
    // Fetch the current sibling plans by their IDs
    const { data: siblingPlans } = await supabase
      .from('plans')
      .select('*')
      .in('id', editingPlanIds);
    if (!siblingPlans || siblingPlans.length === 0) throw new Error('Plans not found');

    const anyPlan = siblingPlans[0];
    const isActive = anyPlan.status === 'active';

    // Recalculate end_date if duration changed
    const durationMap: Record<string, number> = { '4w': 28, '8w': 56, '12w': 84 };
    const durationMode = f.duration;
    let endDate: string | null = null;
    if (durationMode !== 'indefinite' && durationMode !== 'checkin' && durationMap[durationMode]) {
      const s = new Date(f.startDate);
      s.setDate(s.getDate() + durationMap[durationMode] - 1);
      endDate = s.toISOString().split('T')[0];
    }

    for (const plan of siblingPlans) {
      if (plan.type === 'workout') {
        const cfg = plan.config ?? {};
        const newRestDays = f.restDays;
        const currentVersions: any[] = cfg.rest_day_versions ?? [];
        const latestRestDays = getActiveConfigValue(currentVersions, 'rest_days') ?? cfg.rest_days ?? [];
        const restDaysChanged = JSON.stringify([...newRestDays].sort()) !== JSON.stringify([...latestRestDays].sort());

        let updatedConfig = { ...cfg };
        if (restDaysChanged) {
          updatedConfig.rest_day_versions = [
            ...currentVersions,
            { effective_from: todayStr, rest_days: newRestDays },
          ];
        }
        // Remove legacy flat field to keep config clean
        delete updatedConfig.rest_days;

        await supabase
          .from('plans')
          .update({ name: f.name, duration_mode: durationMode, end_date: endDate, config: updatedConfig })
          .eq('id', plan.id);

        // Update workout rows exercises — only touch unlocked (future) days for active plans
        const isCustomSplit = f.split === 'custom';
        const splitKey = f.split === 'ppl' ? 'PPL'
          : f.split === 'ul' ? 'UPPER_LOWER'
          : f.split === 'fb' ? 'FULL_BODY'
          : f.split === 'boxing' ? 'BOXING'
          : f.split === 'running' ? 'RUNNING'
          : 'CUSTOM';
        const nonRestWeekdays = [0,1,2,3,4,5,6].filter(d => !f.restDays.includes(d));

        const { data: existingRows } = await supabase
          .from('workouts')
          .select('id, day_of_week, exercises')
          .eq('plan_id', plan.id)
          .order('day_of_week', { ascending: true });

        for (let idx = 0; idx < f.workoutDays.length; idx++) {
          const day = f.workoutDays[idx];
          const calWeekday = nonRestWeekdays[idx] ?? idx;
          const existingRow = (existingRows ?? []).find((r: any) => r.day_of_week === calWeekday);

          if (isActive && existingRow) {
            // Determine if today's weekday matches this workout day — if so it's locked
            const jsDow = new Date().getDay();
            const todayWeekday = jsDow === 0 ? 6 : jsDow - 1;
            if (calWeekday < todayWeekday) continue; // past day this week — locked
          }

          const newExercises = day.exercises.map(ex => ({
            exercise_id: ex.id,
            sets: ex.sets,
            reps: ex.metric_type === 'reps' ? ex.reps : 0,
            rest_seconds: 90,
            metric_type: ex.metric_type ?? 'reps',
            duration_seconds: ex.duration_seconds ?? null,
            distance_meters: ex.distance_meters ?? null,
          }));

          if (existingRow) {
            const prevVersions: any[] = existingRow.exercises ?? [];
            const isAlreadyVersioned = prevVersions.length > 0 && prevVersions[0]?.label !== undefined;
            let updatedExercises: any[];
            if (isAlreadyVersioned) {
              updatedExercises = [...prevVersions, { label: `edit-${todayStr}`, effective_from: todayStr, exercises: newExercises }];
            } else {
              updatedExercises = [
                { label: 'original', effective_from: anyPlan.start_date?.split('T')[0] ?? todayStr, exercises: prevVersions },
                { label: `edit-${todayStr}`, effective_from: todayStr, exercises: newExercises },
              ];
            }
            await supabase.from('workouts').update({ name: day.name, exercises: updatedExercises }).eq('id', existingRow.id);
          } else {
            // New workout day added — insert as versioned
            await supabase.from('workouts').insert({
              plan_id: plan.id,
              day_of_week: calWeekday,
              name: day.name,
              exercises: [{ label: 'original', effective_from: todayStr, exercises: newExercises }],
            });
          }
        }

      } else if (plan.type === 'meal') {
        await supabase.from('plans').update({ name: f.name, duration_mode: durationMode, end_date: endDate }).eq('id', plan.id);
        await supabase.from('meal_slots').delete().eq('plan_id', plan.id);
        const slots = f.mealSlots.map((slot, idx) => ({
          plan_id: plan.id, name: slot.name, time_of_day: slot.time, meal_type: slot.type, order_index: idx,
        }));
        if (slots.length > 0) await supabase.from('meal_slots').insert(slots);

      } else if (plan.type === 'water') {
        const cfg = plan.config ?? {};
        const newTarget = f.waterGoalGlasses * 250;
        const currentVersions: any[] = cfg.water_target_versions ?? [];
        const latestTarget = getActiveConfigValue(currentVersions, 'daily_target_ml') ?? cfg.daily_target_ml;
        let updatedConfig = { ...cfg };
        if (latestTarget !== newTarget) {
          updatedConfig.water_target_versions = [...currentVersions, { effective_from: todayStr, daily_target_ml: newTarget }];
          delete updatedConfig.daily_target_ml;
        }
        await supabase.from('plans').update({ name: f.name, duration_mode: durationMode, end_date: endDate, config: updatedConfig }).eq('id', plan.id);

      } else if (plan.type === 'sleep') {
        const cfg = plan.config ?? {};
        const newHours = f.sleepGoalHours;
        const currentVersions: any[] = cfg.sleep_target_versions ?? [];
        const latestHours = getActiveConfigValue(currentVersions, 'target_hours') ?? cfg.target_hours;
        let updatedConfig = { ...cfg };
        if (latestHours !== newHours) {
          updatedConfig.sleep_target_versions = [...currentVersions, { effective_from: todayStr, target_hours: newHours }];
          delete updatedConfig.target_hours;
        }
        await supabase.from('plans').update({ name: f.name, duration_mode: durationMode, end_date: endDate, config: updatedConfig }).eq('id', plan.id);
      }
    }
  }, [editingPlanIds]);

  const handleCreate = async () => {
    if (!user || !canAdvance) return;
    if (!isLastStep) {
      // Initialize workoutDays from split selection before entering configureDays
      if (currentStepId === 'split' && form.split !== 'custom') {
        const splitKey = form.split === 'ppl' ? 'PPL'
          : form.split === 'ul' ? 'UPPER_LOWER'
          : form.split === 'fb' ? 'FULL_BODY'
          : form.split === 'boxing' ? 'BOXING'
          : form.split === 'running' ? 'RUNNING'
          : 'FULL_BODY';
        const templateDays = SPLIT_EXERCISE_TEMPLATES[splitKey] ?? [];
        const allNames = [...new Set(templateDays.flat().map(e => e.name))];

        // Fetch IDs, muscle groups, and metric types for all template exercises
        let nameToId: Record<string, string> = {};
        let nameToMuscle: Record<string, string> = {};
        let nameToMetric: Record<string, string> = {};
        if (allNames.length > 0) {
          const { data: exRows } = await supabase
            .from('exercises')
            .select('id, name, primary_muscle_group, metric_type')
            .in('name', allNames);
          (exRows ?? []).forEach((ex: any) => {
            nameToId[ex.name] = ex.id;
            nameToMuscle[ex.name] = ex.primary_muscle_group;
            nameToMetric[ex.name] = ex.metric_type ?? 'reps';
          });
        }

        const days: WorkoutDayConfig[] = WORKOUT_SPLITS[splitKey].schedule.map((d, idx) => ({
          name: d.day,
          exercises: (templateDays[idx] ?? [])
            .filter(e => !!nameToId[e.name])
            .map(e => {
              const mt = (nameToMetric[e.name] ?? 'reps') as 'reps' | 'duration' | 'distance';
              return {
                id: nameToId[e.name],
                name: e.name,
                muscle: nameToMuscle[e.name] ?? '',
                sets: e.sets,
                reps: mt === 'reps' ? (e as any).reps ?? 0 : 0,
                metric_type: mt,
                duration_seconds: mt === 'duration' ? (e as any).duration_seconds : undefined,
                distance_meters: mt === 'distance' ? (e as any).distance_meters : undefined,
              };
            }),
        }));
        setForm(f => ({ ...f, workoutDays: days }));
      }
      // Custom split: seed empty days so ConfigureDays has something to render
      if (currentStepId === 'split' && form.split === 'custom' && form.workoutDays.length === 0) {
        const days: WorkoutDayConfig[] = Array.from({ length: DEFAULT_DAY_COUNT }, (_, i) => ({
          name: `Day ${i + 1}`, exercises: [],
        }));
        setForm(f => ({ ...f, workoutDays: days }));
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep(s => s + 1);
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await runEditPlan(user.id, form);
      } else {
        await runCreatePlans(user.id, form, dispatch);
      }
      setCreating(false);
      setIsEditing(false);
      setEditingPlanIds([]);
      setStep(0);
      setForm(defaultForm);
      await loadScreenData();
    } catch (err) {
      Alert.alert('Error', isEditing ? 'Failed to save changes. Please try again.' : 'Failed to create plan. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEndPlan = () => {
    Alert.alert(
      'End Plan',
      'This will archive all your active plans. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Plan',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            await supabase.from('plans').update({ status: 'archived' })
              .eq('user_id', user.id).eq('status', 'active');
            dispatch(setActivePlans({}));
            await loadScreenData();
          },
        },
      ]
    );
  };

  const handleSetEndDate = async (endDate: Date) => {
    if (!user) return;
    const endIso = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).toISOString();
    const { error } = await supabase
      .from('plans')
      .update({ end_date: endIso, duration_mode: 'fixed' })
      .eq('user_id', user.id)
      .eq('status', 'active');
    if (error) { Alert.alert('Error', 'Could not save end date.'); return; }
    setShowEndDatePicker(false);
    await loadScreenData();
  };

  const toggleCat = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCats(prev => {
      const isOpening = !prev.includes(id);
      if (isOpening) fetchCatDetail(id);
      return isOpening ? [...prev, id] : prev.filter(c => c !== id);
    });
  };

  const primaryPlan = activePlans.workout ?? activePlans.meal ?? activePlans.water ?? activePlans.sleep;
  const weekPct = primaryPlan ? getWeekProgress(primaryPlan) : 0;

  // Group scheduledPlans by group_id (or name+start_date fallback) so the
  // upcoming section shows one entry per scheduled plan creation event.
  const scheduledGroups: PlanGroup[] = (() => {
    const map = new Map<string, PlanGroup>();
    for (const row of scheduledPlans) {
      const key = row.group_id ?? `${row.name}__${row.start_date}`;
      if (!map.has(key)) {
        map.set(key, { key, name: row.name, status: row.status, start_date: row.start_date, end_date: row.end_date, updated_at: row.updated_at, plans: [] });
      }
      map.get(key)!.plans.push(row);
    }
    return Array.from(map.values());
  })();

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <DayDetailModal
        day={selectedDay}
        allWorkoutRows={screenData.allWorkoutRows}
        userId={user?.id ?? ''}
        planId={activePlans.workout?.id ?? null}
        onClose={() => setSelectedDay(null)}
      />

      {/* ── End Date Picker Modal ── */}
      <Modal visible={showEndDatePicker} transparent animationType="slide" onRequestClose={() => setShowEndDatePicker(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: '#0F0F11', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: C.white, fontSize: 15, fontWeight: '700', letterSpacing: 1 }}>SET END DATE</Text>
              <TouchableOpacity onPress={() => setShowEndDatePicker(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={20} color={C.textSec} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: C.textSec, fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
              Pick the date you want this plan to end. You can always change it later.
            </Text>
            {(() => {
              const today = new Date(); today.setHours(0,0,0,0);
              const planStart = primaryPlan ? new Date(primaryPlan.start_date) : today;
              planStart.setHours(0,0,0,0);
              const earliest = new Date(Math.max(today.getTime(), planStart.getTime()));
              earliest.setDate(earliest.getDate() + 1);
              const viewMonth = new Date(today.getFullYear(), today.getMonth() + endDatePickerMonth, 1);
              const viewYear = viewMonth.getFullYear();
              const viewMonthIdx = viewMonth.getMonth();
              const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              const firstDayJS = new Date(viewYear, viewMonthIdx, 1).getDay();
              const leadingBlanks = firstDayJS === 0 ? 6 : firstDayJS - 1;
              const daysInMonth = new Date(viewYear, viewMonthIdx + 1, 0).getDate();
              const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;
              return (
                <View>
                  <View style={s.schedMonthNav}>
                    <TouchableOpacity
                      onPress={() => setEndDatePickerMonth(m => Math.max(0, m - 1))}
                      disabled={endDatePickerMonth === 0}
                      style={[s.schedMonthNavBtn, endDatePickerMonth === 0 && { opacity: 0.2 }]}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialCommunityIcons name="chevron-left" size={20} color={C.white} />
                    </TouchableOpacity>
                    <Text style={s.schedMonthLabel}>{monthLabel}</Text>
                    <TouchableOpacity
                      onPress={() => setEndDatePickerMonth(m => m + 1)}
                      style={s.schedMonthNavBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialCommunityIcons name="chevron-right" size={20} color={C.white} />
                    </TouchableOpacity>
                  </View>
                  <View style={s.schedCalHeader}>
                    {WEEK_DAY_NAMES.map(n => <Text key={n} style={s.schedCalHeaderCell}>{n}</Text>)}
                  </View>
                  {Array.from({ length: totalCells / 7 }, (_, week) => (
                    <View key={week} style={s.schedCalRow}>
                      {Array.from({ length: 7 }, (_, col) => {
                        const cellIdx = week * 7 + col;
                        const dayNum = cellIdx - leadingBlanks + 1;
                        if (dayNum < 1 || dayNum > daysInMonth) return <View key={col} style={s.schedCalCell} />;
                        const d = new Date(viewYear, viewMonthIdx, dayNum);
                        const disabled = d < earliest;
                        const isToday = d.toDateString() === today.toDateString();
                        return (
                          <TouchableOpacity
                            key={col}
                            onPress={() => !disabled && handleSetEndDate(d)}
                            disabled={disabled}
                            activeOpacity={0.75}
                            style={[
                              s.schedCalCell,
                              isToday && s.schedCalCellToday,
                              disabled && s.schedCalCellPast,
                            ]}
                          >
                            <Text style={[
                              s.schedCalCellText,
                              isToday && { color: C.orange },
                              disabled && s.schedCalCellTextPast,
                            ]}>{dayNum}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ── Page Header ── */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>{creating ? (isEditing ? 'EDIT PLAN' : 'NEW PLAN') : 'MY PLAN'}</Text>
        {hasActivePlans && !creating && (
          <TouchableOpacity style={s.newPlanBtn} onPress={() => setCreating(true)} activeOpacity={0.8}>
            <Text style={s.newPlanBtnText}>+ NEW PLAN</Text>
          </TouchableOpacity>
        )}
        {creating && (
          <TouchableOpacity
            onPress={() => { setCreating(false); setIsEditing(false); setEditingPlanIds([]); setStep(0); setForm(defaultForm); }}
            activeOpacity={0.7}
          >
            <Text style={s.cancelText}>✕ CANCEL</Text>
          </TouchableOpacity>
        )}
      </View>

      {creating ? (
        /* ── Creation Wizard ── */
        <View style={{ flex: 1 }}>
          <StepDots total={steps.length} current={step} />

          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.wizardContent} showsVerticalScrollIndicator={false}>
            <View style={s.wizardSheet}>
              {currentStepId === 'name'       && <Step1_Name value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />}
              {currentStepId === 'categories' && <Step2_Categories selected={form.categories} onToggle={id => setForm(f => ({ ...f, categories: f.categories.includes(id) ? f.categories.filter(c => c !== id) : [...f.categories, id] }))} />}
              {currentStepId === 'split'          && <Step3_Split selected={form.split} onSelect={v => setForm(f => ({ ...f, split: v, workoutDays: [] }))} isEditing={isEditing} />}
              {currentStepId === 'configureDays' && (
                <ConfigureDays
                  days={form.workoutDays}
                  onChange={days => setForm(f => ({ ...f, workoutDays: days }))}
                  userId={user?.id ?? ''}
                />
              )}
              {currentStepId === 'configureMeals' && <ConfigureMeals slots={form.mealSlots} onChange={slots => setForm(f => ({ ...f, mealSlots: slots }))} />}
              {currentStepId === 'configureWater' && <ConfigureWater glasses={form.waterGoalGlasses} onChange={n => setForm(f => ({ ...f, waterGoalGlasses: n }))} />}
              {currentStepId === 'configureSleep' && <ConfigureSleep hours={form.sleepGoalHours} onChange={n => setForm(f => ({ ...f, sleepGoalHours: n }))} />}
              {currentStepId === 'duration'      && <Step4_Duration selected={form.duration} onSelect={v => setForm(f => ({ ...f, duration: v }))} />}
              {currentStepId === 'schedule'      && (
                <Step_Schedule
                  startDate={form.startDate}
                  restDays={form.restDays}
                  trainingDayCount={form.workoutDays.length}
                  currentPlanEndDate={!isEditing && activePlans.workout?.end_date ? new Date(activePlans.workout.end_date) : undefined}
                  currentPlanName={!isEditing ? activePlans.workout?.name : undefined}
                  onStartDate={d => setForm(f => ({ ...f, startDate: d }))}
                  onRestDays={r => setForm(f => ({ ...f, restDays: r }))}
                  lockStartDate={isEditing && (() => { const p = activePlans.workout ?? activePlans.meal ?? activePlans.water ?? activePlans.sleep; return p?.status === 'active'; })()}
                />
              )}
              {currentStepId === 'review' && (
                <Step5_Review
                  form={form}
                  isFutureStart={!isEditing && form.startDate > (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })()}
                  isEditing={isEditing}
                />
              )}
            </View>
          </ScrollView>

          <View style={s.wizardFooter}>
            <TouchableOpacity
              style={[s.continueBtn, (!canAdvance || saving) && { opacity: 0.35 }, isLastStep && form.startDate > (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })() && s.continueBtnScheduled]}
              onPress={handleCreate}
              disabled={!canAdvance || saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#000" size="small" />
                : isEditing && isLastStep
                  ? <Text style={s.continueBtnText}>💾  SAVE CHANGES</Text>
                  : isLastStep && form.startDate > (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })()
                    ? <Text style={[s.continueBtnText, { color: '#fff' }]}>📅  SCHEDULE PLAN</Text>
                    : <Text style={s.continueBtnText}>{isLastStep ? '🔥  START PLAN' : 'CONTINUE  →'}</Text>
              }
            </TouchableOpacity>
            {step > 0 && (
              <TouchableOpacity style={s.backBtn} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setStep(s => s - 1); }}>
                <Text style={s.backBtnText}>← BACK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        /* ── Main View ── */
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.mainContent} showsVerticalScrollIndicator={false}>

          {/* Tabs */}
          <View style={s.tabs}>
            {(['active', 'history'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[s.tab, tab === t && s.tabActive]}
                onPress={() => setTab(t)}
                activeOpacity={0.75}
              >
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'active' ? (
            !hasActivePlans ? (
              <EmptyState onStart={() => setCreating(true)} />
            ) : (
              <>
                {/* ── Active Plan Card ── */}
                {primaryPlan && (
                  <View style={s.planCard}>
                    {/* Plan name + badge */}
                    <View style={s.planCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.planName}>{primaryPlan.name.toUpperCase()}</Text>
                        <Text style={s.planStarted}>STARTED {formatDate(primaryPlan.start_date).toUpperCase()}</Text>
                      </View>
                      <TouchableOpacity
                        style={s.editPlanBtn}
                        onPress={() => primaryPlan.group_id && openEditWizard(primaryPlan.group_id)}
                        activeOpacity={0.75}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={14} color={C.orange} />
                        <Text style={s.editPlanBtnText}>EDIT</Text>
                      </TouchableOpacity>
                      <View style={s.activeBadge}>
                        <View style={s.activeDot} />
                        <Text style={s.activeBadgeText}>ACTIVE</Text>
                      </View>
                    </View>

                    {/* Progress bar */}
                    <View style={s.progressSection}>
                      <View style={s.progressLabelRow}>
                        <Text style={s.progressLabel}>PLAN PROGRESS</Text>
                        <Text style={s.weekInfo}>{getWeekInfo(primaryPlan)}</Text>
                      </View>
                      <View style={s.progressTrack}>
                        <View style={[s.progressFill, { width: `${Math.round(weekPct * 100)}%` }]} />
                      </View>
                      <View style={s.progressDates}>
                        <Text style={s.progressDate}>{formatDate(primaryPlan.start_date)}</Text>
                        {primaryPlan.end_date && <Text style={s.progressDate}>{formatDate(primaryPlan.end_date)}</Text>}
                      </View>
                    </View>

                    {/* This Week */}
                    {dataLoading ? (
                      <ActivityIndicator color={C.orange} size="small" style={{ marginVertical: 16 }} />
                    ) : (
                      <WeekViewStrip
                        activePlan={activePlans.workout ?? null}
                        allWorkoutRows={screenData.allWorkoutRows}
                        planStartDate={screenData.planStartDate}
                        planEndDate={screenData.planEndDate}
                        scheduledPlans={scheduledPlans}
                        currentWeekLogDates={new Set(screenData.weekDays.filter(d => d.hasLog).map(d => d.date.toDateString()))}
                        onDayPress={d => setSelectedDay(d)}
                        userId={user?.id ?? ''}
                      />
                    )}

                    {/* Started / Ends */}
                    <View style={s.infoRow}>
                      <View style={s.infoBox}>
                        <Text style={s.infoBoxLabel}>STARTED</Text>
                        <Text style={s.infoBoxValue}>{formatDate(primaryPlan.start_date)}</Text>
                      </View>
                      {primaryPlan.end_date ? (
                        <View style={s.infoBox}>
                          <Text style={s.infoBoxLabel}>ENDS</Text>
                          <Text style={s.infoBoxValue}>{formatDate(primaryPlan.end_date)}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[s.infoBox, { borderColor: '#2A2A2C' }]}
                          activeOpacity={0.7}
                          onPress={() => { setEndDatePickerMonth(0); setShowEndDatePicker(true); }}
                        >
                          <Text style={s.infoBoxLabel}>DURATION</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Text style={s.infoBoxValue}>{getDurationLabel(primaryPlan)}</Text>
                            <MaterialCommunityIcons name="pencil-outline" size={13} color={C.textSec} />
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Skip Tokens */}
                    <View style={s.skipRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.skipLabel}>SKIP TOKENS</Text>
                        <Text style={s.skipValue}>
                          {screenData.skipTotal - screenData.skipUsed} remaining this month
                        </Text>
                      </View>
                      <View style={s.tokenIcons}>
                        {Array.from({ length: screenData.skipTotal }).map((_, i) => {
                          const used = i < screenData.skipUsed;
                          return (
                            <View key={i} style={[s.tokenIcon, used && s.tokenIconUsed]}>
                              <MaterialCommunityIcons name="lightning-bolt" size={14} color={used ? '#333' : C.orange} />
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* End Plan */}
                    <TouchableOpacity style={s.endPlanBtn} onPress={handleEndPlan} activeOpacity={0.8}>
                      <Text style={s.endPlanText}>END PLAN</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── UPCOMING Scheduled Plans ── */}
                {scheduledGroups.length > 0 && (
                  <View style={s.upcomingSection}>
                    <View style={s.upcomingSectionHeader}>
                      <MaterialCommunityIcons name="calendar-clock" size={14} color="#6366F1" />
                      <Text style={s.upcomingSectionTitle}>UPCOMING</Text>
                    </View>
                    {scheduledGroups.map(group => {
                      const workoutPlan = group.plans.find(p => p.type === 'workout');
                      return (
                        <View key={group.key} style={s.upcomingCard}>
                          <View style={s.upcomingCardLeft}>
                            <View style={s.upcomingCardDot} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={s.upcomingCardNameRow}>
                              <Text style={s.upcomingCardName}>{group.name}</Text>
                              <TouchableOpacity
                                style={[s.editPlanBtn, { borderColor: '#6366F144', backgroundColor: '#6366F111' }]}
                                onPress={() => openEditWizard(group.key)}
                                activeOpacity={0.75}
                              >
                                <MaterialCommunityIcons name="pencil-outline" size={13} color="#6366F1" />
                                <Text style={[s.editPlanBtnText, { color: '#6366F1' }]}>EDIT</Text>
                              </TouchableOpacity>
                            </View>
                            {/* Category pills */}
                            <View style={[s.historyCatRow, { marginTop: 4, marginBottom: 4 }]}>
                              {group.plans.map(p => {
                                const cat = CATEGORIES.find(c => c.id === p.type);
                                return cat ? (
                                  <View key={p.id} style={[s.historyCatPill, { backgroundColor: cat.color + '18', borderColor: cat.color + '44' }]}>
                                    <MaterialCommunityIcons name={cat.icon as any} size={11} color={cat.color} />
                                    <Text style={[s.historyCatPillText, { color: cat.color }]}>{cat.label.toUpperCase()}</Text>
                                  </View>
                                ) : null;
                              })}
                            </View>
                            <Text style={s.upcomingCardDate}>
                              Starts {formatDate(group.start_date)}
                              {group.end_date ? ` · ends ${formatDate(group.end_date)}` : ''}
                            </Text>
                            {workoutPlan?.config?.split && (
                              <Text style={s.upcomingCardSplit}>
                                {workoutPlan.config.split === 'CUSTOM' ? 'Custom split' : workoutPlan.config.split.replace('_', '/')} ·{' '}
                                {(() => { const rd: number[] = getActiveConfigValue(workoutPlan.config?.rest_day_versions, 'rest_days') ?? workoutPlan.config?.rest_days ?? []; return `${rd.length} rest day${rd.length !== 1 ? 's' : ''}/week`; })()}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ── Categories ── */}
                <Text style={s.catSectionLabel}>CATEGORIES</Text>
                {CATEGORIES.filter(cat => !!(activePlans as any)[cat.id]).map(cat => {
                  const plan = (activePlans as any)[cat.id] as Plan;
                  const streak = (streaks as any)[cat.id];
                  const isExpanded = expandedCats.includes(cat.id);
                  const isLoading = catDetails.loadingCats.has(cat.id);

                  // Expanded content per category
                  let expandedContent: React.ReactNode = null;
                  if (isExpanded) {
                    if (isLoading) {
                      expandedContent = (
                        <View style={s.catDetailLoading}>
                          <ActivityIndicator size="small" color={cat.color} />
                        </View>
                      );
                    } else if (cat.id === 'workout') {
                      const days = catDetails.workout ?? [];
                      expandedContent = days.length === 0 ? (
                        <Text style={s.catDetailEmpty}>No exercises configured yet.</Text>
                      ) : (
                        <View style={s.catDetailWrap}>
                          {days.map((day, di) => (
                            <View key={di} style={[s.catDetailDayRow, di > 0 && s.catDetailDivider]}>
                              <View style={s.catDetailDayHeader}>
                                <View style={[s.catDetailDayBadge, { backgroundColor: cat.color + '22' }]}>
                                  <Text style={[s.catDetailDayNum, { color: cat.color }]}>{di + 1}</Text>
                                </View>
                                <Text style={s.catDetailDayName}>{day.name}</Text>
                                <Text style={s.catDetailExCount}>
                                  {day.exercises.length > 0 ? `${day.exercises.length} exercise${day.exercises.length !== 1 ? 's' : ''}` : 'Rest'}
                                </Text>
                              </View>
                              {day.exercises.map((ex, ei) => (
                                <View key={ei} style={s.catDetailExRow}>
                                  <View style={[s.catDetailExDot, { backgroundColor: cat.color + '50' }]} />
                                  <Text style={s.catDetailExName} numberOfLines={1}>{ex.name}</Text>
                                  <Text style={s.catDetailExMeta}>{ex.sets}×{ex.reps}</Text>
                                </View>
                              ))}
                            </View>
                          ))}
                        </View>
                      );
                    } else if (cat.id === 'meal') {
                      const slots = catDetails.meal ?? [];
                      expandedContent = slots.length === 0 ? (
                        <Text style={s.catDetailEmpty}>No meal slots configured.</Text>
                      ) : (
                        <View style={s.catDetailWrap}>
                          {slots.map((slot, si) => (
                            <View key={si} style={[s.catDetailMealRow, si > 0 && s.catDetailDivider]}>
                              <View style={[s.catDetailMealIcon, { backgroundColor: cat.color + '18' }]}>
                                <MaterialCommunityIcons
                                  name={slot.type === 'snack' ? 'food-apple' : slot.type === 'shake' ? 'cup' : 'silverware-fork-knife'}
                                  size={13} color={cat.color}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={s.catDetailMealName}>{slot.name}</Text>
                                <Text style={s.catDetailMealTime}>{slot.time}</Text>
                              </View>
                              <View style={[s.catDetailMealTypeBadge, { backgroundColor: cat.color + '18' }]}>
                                <Text style={[s.catDetailMealTypeText, { color: cat.color }]}>{slot.type}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    } else if (cat.id === 'water') {
                      const targetMl = getActiveConfigValue(plan.config?.water_target_versions, 'daily_target_ml') ?? plan.config?.daily_target_ml;
                      const glasses = targetMl ? Math.round(targetMl / 250) : 8;
                      expandedContent = (
                        <View style={s.catDetailWrap}>
                          <View style={s.catDetailGoalRow}>
                            <MaterialCommunityIcons name="cup-water" size={20} color={cat.color} />
                            <View style={{ flex: 1 }}>
                              <Text style={s.catDetailGoalLabel}>DAILY TARGET</Text>
                              <Text style={[s.catDetailGoalValue, { color: cat.color }]}>{glasses} glasses</Text>
                            </View>
                            <Text style={s.catDetailGoalSub}>{glasses * 250} ml</Text>
                          </View>
                          <View style={s.catDetailGlassRow}>
                            {Array.from({ length: glasses }).map((_, i) => (
                              <View key={i} style={[s.catDetailGlass, { borderColor: cat.color + '40' }]}>
                                <MaterialCommunityIcons name="water-outline" size={16} color={cat.color + '60'} />
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    } else if (cat.id === 'sleep') {
                      const hrs = getActiveConfigValue(plan.config?.sleep_target_versions, 'target_hours') ?? plan.config?.target_hours ?? 8;
                      expandedContent = (
                        <View style={s.catDetailWrap}>
                          <View style={s.catDetailGoalRow}>
                            <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={cat.color} />
                            <View style={{ flex: 1 }}>
                              <Text style={s.catDetailGoalLabel}>SLEEP TARGET</Text>
                              <Text style={[s.catDetailGoalValue, { color: cat.color }]}>{hrs} hours</Text>
                            </View>
                            <Text style={s.catDetailGoalSub}>{hrs * 60} min</Text>
                          </View>
                          <View style={s.catDetailSleepBar}>
                            {Array.from({ length: 10 }).map((_, i) => (
                              <View
                                key={i}
                                style={[
                                  s.catDetailSleepSegment,
                                  { backgroundColor: i < hrs ? cat.color : cat.color + '18' },
                                ]}
                              />
                            ))}
                          </View>
                          <Text style={s.catDetailSleepHint}>
                            {hrs >= 8 ? 'Excellent target — optimal recovery' : hrs >= 7 ? 'Good target for most adults' : 'Consider aiming for 7–9 hours'}
                          </Text>
                        </View>
                      );
                    }
                  }

                  return (
                    <View key={cat.id} style={[s.catRow, isExpanded && { borderColor: cat.color + '33' }]}>
                      <TouchableOpacity
                        style={s.catRowHeader}
                        onPress={() => toggleCat(cat.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[s.catRowIcon, { backgroundColor: cat.color + '18' }]}>
                          <MaterialCommunityIcons name={cat.icon as any} size={18} color={cat.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.catRowLabel}>{cat.label.toUpperCase()}</Text>
                          <Text style={s.catRowSub}>{getDurationLabel(plan)}</Text>
                        </View>
                        <View style={s.catRowRight}>
                          <Text style={s.catRowFlame}>🔥</Text>
                          <Text style={s.catRowStreak}>{streak?.current_count ?? 0}</Text>
                          <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#444" />
                        </View>
                      </TouchableOpacity>
                      {isExpanded && expandedContent}
                    </View>
                  );
                })}
              </>
            )
          ) : (
            /* ── History Tab ── */
            screenData.historyGroups.length === 0 ? (
              <View style={s.emptyWrap}>
                <MaterialCommunityIcons name="clock-outline" size={40} color="#333" />
                <Text style={[s.emptyTitle, { marginTop: 12, fontSize: 16 }]}>No history yet</Text>
                <Text style={s.emptySub}>Completed or archived plans will appear here.</Text>
              </View>
            ) : (
              screenData.historyGroups.map(group => {
                const isCompleted = group.status === 'completed';
                return (
                  <View key={group.key} style={s.historyCard}>
                    {/* Header: name + status badge */}
                    <View style={s.historyCardHeader}>
                      <Text style={s.historyCardName} numberOfLines={1}>{group.name.toUpperCase()}</Text>
                      <View style={[s.historyBadge, { backgroundColor: isCompleted ? C.green + '22' : '#222' }]}>
                        <Text style={[s.historyBadgeText, { color: isCompleted ? C.green : '#666' }]}>
                          {group.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {/* Category pills */}
                    <View style={s.historyCatRow}>
                      {group.plans.map(p => {
                        const cat = CATEGORIES.find(c => c.id === p.type);
                        return cat ? (
                          <View key={p.id} style={[s.historyCatPill, { backgroundColor: cat.color + '18', borderColor: cat.color + '44' }]}>
                            <MaterialCommunityIcons name={cat.icon as any} size={11} color={cat.color} />
                            <Text style={[s.historyCatPillText, { color: cat.color }]}>{cat.label.toUpperCase()}</Text>
                          </View>
                        ) : null;
                      })}
                    </View>
                    {/* Date range */}
                    <Text style={s.historyCardDate}>
                      {formatDate(group.start_date)} — {group.end_date ? formatDate(group.end_date) : 'Ended ' + formatDate(group.updated_at)}
                    </Text>
                  </View>
                );
              })
            )
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  pageTitle: { color: C.white, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  newPlanBtn: {
    borderRadius: 20, borderWidth: 1, borderColor: C.orange,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  newPlanBtnText: { color: C.orange, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  cancelText: { color: C.textSec, fontSize: 12, fontWeight: '600', letterSpacing: 1 },

  // Tabs
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 6 },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  tabActive: { backgroundColor: C.orange, borderColor: C.orange },
  tabText: { color: '#333', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  tabTextActive: { color: '#0A0A0C' },

  mainContent: { paddingHorizontal: 20, paddingBottom: 20 },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingTop: 8 },
  emptyHero: {
    width: '100%', padding: 28, borderRadius: 20, alignItems: 'center',
    backgroundColor: '#111113', borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  emptyIconRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  emptyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  emptyTitle: { color: C.white, fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  emptySub: { color: C.textSec, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  ctaBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: C.orange, marginBottom: 14,
  },
  ctaBtnText: { color: '#0A0A0C', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  emptyTip: { color: '#333', fontSize: 11, textAlign: 'center', letterSpacing: 0.5 },

  // Wizard
  stepDots: { flexDirection: 'row', gap: 5, justifyContent: 'center', paddingVertical: 16 },
  stepDot: { height: 4, borderRadius: 2 },
  wizardContent: { paddingHorizontal: 20, paddingBottom: 16 },
  wizardSheet: {
    backgroundColor: C.sheet, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: C.border,
  },
  wizardFooter: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 16 : 12, paddingTop: 8 },
  stepTitle: { color: C.white, fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  stepSub: { color: C.textSec, fontSize: 13, marginTop: 6, lineHeight: 19 },

  // Wizard inputs
  nameInput: {
    marginTop: 20, padding: 16, borderRadius: 13,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
    color: C.white, fontSize: 18, fontWeight: '600',
  },
  charCount: { color: '#333', fontSize: 11, textAlign: 'right', marginTop: 6, letterSpacing: 1 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 13, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },
  pillSelected: { borderColor: C.orange, backgroundColor: C.orange + '15' },
  pillLabel: { color: '#888', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  pillSub: { color: '#444', fontSize: 11, marginTop: 2, lineHeight: 15 },
  pillRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#2A2A2E',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  catToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 13, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },
  catIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catLabel: { color: '#666', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  catDesc: { color: '#333', fontSize: 11, marginTop: 2 },
  toggle: { width: 26, height: 14, borderRadius: 7, position: 'relative', flexShrink: 0 },
  toggleKnob: { position: 'absolute', top: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  // Custom split builder
  dayCountRow: { marginTop: 20, marginBottom: 4 },
  dayCountLabel: { color: C.textSec, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  dayCountBtns: { flexDirection: 'row', gap: 8 },
  dayCountBtn: {
    width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },
  dayCountBtnActive: { backgroundColor: C.orange, borderColor: C.orange },
  dayCountBtnText: { color: C.textSec, fontSize: 14, fontWeight: '700' },
  dayNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayNumBadge: {
    width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.orange + '22', flexShrink: 0,
  },
  dayNumText: { color: C.orange, fontSize: 12, fontWeight: '800' },
  dayNameInput: {
    flex: 1, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 11,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
    color: C.white, fontSize: 14, fontWeight: '600',
  },
  dayHint: { color: '#333', fontSize: 11, marginTop: 14, fontStyle: 'italic' },

  // ── Configure Days ──
  dayCard: {
    backgroundColor: C.card, borderRadius: 13, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden',
  },
  dayCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13,
  },
  dayCardBadge: {
    width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.orange + '22', flexShrink: 0,
  },
  dayCardBadgeText: { color: C.orange, fontSize: 11, fontWeight: '800' },
  dayCardName: { flex: 1, color: C.white, fontSize: 14, fontWeight: '700' },
  dayCardNameInput: {
    flex: 1, color: C.white, fontSize: 14, fontWeight: '700',
    paddingVertical: 0, paddingHorizontal: 0,
    borderBottomWidth: 1, borderBottomColor: C.orange + '66',
  },
  dayCardCount: { color: C.textSec, fontSize: 11 },
  addDayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 8, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1, borderStyle: 'dashed', borderColor: C.orange + '44',
    backgroundColor: C.orange + '08',
  },
  addDayBtnText: { color: C.orange, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  prefilledBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.orange + '18', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 3, marginRight: 6,
  },
  prefilledBadgeText: { color: C.orange, fontSize: 10, fontWeight: '700' },
  dayCardBody: { paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: C.border },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  exRowBorder: { borderTopWidth: 1, borderTopColor: '#1A1A1C' },
  exName: { color: C.white, fontSize: 13, fontWeight: '600' },
  exMuscle: { color: C.textSec, fontSize: 10, marginTop: 1 },
  counter: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1A1A1C', borderRadius: 8, padding: 3,
  },
  counterBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { color: C.orange, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  counterVal: { color: C.white, fontSize: 13, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  counterX: { color: C.textSec, fontSize: 12, fontWeight: '600' },
  // ── Category filter tabs ──
  catScroll: { marginTop: 10 },
  catScrollContent: { gap: 6, paddingRight: 4 },
  catPill: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  catPillActive: { backgroundColor: C.orange + '20', borderColor: C.orange },
  catPillText: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  catPillTextActive: { color: C.orange },

  exSearchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, paddingVertical: 9, paddingHorizontal: 12,
    backgroundColor: '#0F0F11', borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  exSearchInput: { flex: 1, color: C.white, fontSize: 13 },
  exResults: { marginTop: 6, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  exResult: { flexDirection: 'row', alignItems: 'center', padding: 11, backgroundColor: '#0F0F11' },
  exResultBorder: { borderTopWidth: 1, borderTopColor: C.border },
  exResultName: { color: C.white, fontSize: 13, fontWeight: '600' },
  exResultMuscle: { color: C.textSec, fontSize: 10, marginTop: 1 },
  exNoResults: { color: C.textSec, fontSize: 12, fontStyle: 'italic', marginTop: 8, paddingHorizontal: 2 },
  exCatBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6,
    backgroundColor: C.border, marginLeft: 4,
    borderWidth: 1, borderColor: 'transparent',
  },
  exCatBadgeText: { color: '#555', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Configure Meals ──
  mealSlotRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mealSlotName: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 10,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
    color: C.white, fontSize: 13, fontWeight: '600',
  },
  mealSlotTime: {
    width: 62, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
    color: C.white, fontSize: 13, fontWeight: '600', textAlign: 'center',
  },
  addSlotBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center',
    paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: C.green + '44',
    backgroundColor: C.green + '10',
  },
  addSlotText: { color: C.green, fontSize: 13, fontWeight: '700' },

  // ── Goal screens (water + sleep) ──
  goalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 28, marginBottom: 20,
  },
  goalBtn: {
    width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },
  goalBtnText: { color: C.orange, fontSize: 26, fontWeight: '300', lineHeight: 28 },
  goalCenter: { alignItems: 'center', flex: 1 },
  goalValue: { color: C.white, fontSize: 52, fontWeight: '900', lineHeight: 56 },
  goalUnit: { color: C.textSec, fontSize: 13, fontWeight: '600', marginTop: 2 },
  goalSub: { color: '#444', fontSize: 11, marginTop: 3 },
  quickRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  quickBtn: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },
  quickBtnActive: { backgroundColor: C.orange, borderColor: C.orange },
  quickBtnText: { color: C.textSec, fontSize: 13, fontWeight: '700' },

  continueBtn: {
    paddingVertical: 15, borderRadius: 13, alignItems: 'center',
    backgroundColor: C.orange,
  },
  continueBtnScheduled: {
    backgroundColor: '#6366F1',
  },
  continueBtnText: { color: '#0A0A0C', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  backBtn: { paddingVertical: 10, alignItems: 'center' },
  backBtnText: { color: C.textSec, fontSize: 12, fontWeight: '600', letterSpacing: 1.5 },

  // Schedule step
  schedSectionLabel: { color: C.textSec, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 22, marginBottom: 10 },
  schedCalendar: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', padding: 10,
  },
  schedMonthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, paddingBottom: 10,
  },
  schedMonthNavBtn: {
    padding: 4,
  },
  schedMonthLabel: {
    color: C.white, fontSize: 14, fontWeight: '700', letterSpacing: 0.3,
  },
  schedCalHeader: { flexDirection: 'row', marginBottom: 4 },
  schedCalHeaderCell: {
    flex: 1, textAlign: 'center', color: '#444',
    fontSize: 9, fontWeight: '700', letterSpacing: 1, paddingVertical: 4,
  },
  schedCalRow: { flexDirection: 'row', marginBottom: 4 },
  schedCalCell: {
    flex: 1, aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    margin: 1,
  },
  schedCalCellSelected: { backgroundColor: C.orange },
  schedCalCellToday: { borderWidth: 1.5, borderColor: C.orange },
  schedCalCellPast: { opacity: 0.25 },
  schedCalCellBlocked: { backgroundColor: '#1E1E3A', opacity: 0.6 },
  schedCalCellBlockedDot: {
    position: 'absolute', bottom: 3, width: 4, height: 4,
    borderRadius: 2, backgroundColor: '#6366F1',
  },
  schedCurrentPlanNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#1C1500', borderWidth: 1, borderColor: '#F59E0B44',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  schedCurrentPlanNoteText: {
    flex: 1, color: '#D4A017', fontSize: 12, lineHeight: 18,
  },
  schedCalCellText: { color: C.white, fontSize: 13, fontWeight: '600' },
  schedCalCellTextSelected: { color: '#000', fontWeight: '800' },
  schedCalCellTextPast: { color: '#444' },
  schedSelectedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 10, paddingHorizontal: 4,
  },
  schedSelectedText: { color: C.orange, fontSize: 13, fontWeight: '600' },
  schedRestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  schedRestQuota: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  schedRestQuotaNum: { color: C.orange, fontSize: 18, fontWeight: '900' },
  schedRestQuotaSep: { color: '#444', fontSize: 12, fontWeight: '600' },
  schedRestQuotaMax: { color: '#555', fontSize: 14, fontWeight: '700' },
  schedRestSub: { color: '#444', fontSize: 12, marginBottom: 10 },
  schedRestRow: { flexDirection: 'row', gap: 5 },
  schedRestBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },
  schedRestBtnActive: { backgroundColor: '#1A1A2E', borderColor: '#3B3B6B' },
  schedRestBtnDisabled: { backgroundColor: '#0F0F11', borderColor: '#161618', opacity: 0.4 },
  schedRestBtnLabel: { color: '#555', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  schedRestBtnLabelActive: { color: '#8888CC' },
  schedRestSummary: { color: '#555', fontSize: 11, fontStyle: 'italic', marginTop: 10 },
  schedRestLimitNote: { color: '#555', fontSize: 11, marginTop: 8, fontStyle: 'italic', paddingHorizontal: 4 },

  // Review
  reviewScheduledBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0E0E1A', borderWidth: 1, borderColor: '#6366F133',
    borderRadius: 10, padding: 12, marginBottom: 4, marginTop: 8,
  },
  reviewScheduledBannerText: {
    flex: 1, color: '#818CF8', fontSize: 13, lineHeight: 18,
  },
  reviewHero: {
    marginTop: 12, marginBottom: 12, padding: 18, borderRadius: 16,
    backgroundColor: C.orange + '18', borderWidth: 1.5, borderColor: C.orange + '44',
  },
  reviewName: { color: C.white, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  reviewTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  reviewTagText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 13, borderRadius: 11, backgroundColor: '#0F0F11',
    borderWidth: 1, borderColor: '#1A1A1C', marginBottom: 8,
  },
  reviewRowLabel: { color: '#555', fontSize: 10, letterSpacing: 2 },
  reviewRowValue: { color: '#CCC', fontSize: 14, fontWeight: '700' },

  // Active plan card
  planCard: {
    backgroundColor: C.card, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  planCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  planName: { color: C.white, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  planStarted: { color: C.textSec, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: 3 },
  editPlanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#F59E0B44', backgroundColor: '#F59E0B11',
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, marginRight: 6,
  },
  editPlanBtnText: {
    color: C.orange, fontSize: 10, fontWeight: '800', letterSpacing: 0.8,
  },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#0A2014', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  activeBadgeText: { color: C.green, fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  // Progress
  progressSection: { marginBottom: 16 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: C.textSec, fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
  weekInfo: { color: C.orange, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  progressTrack: { height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: C.orange, borderRadius: 2 },
  progressDates: { flexDirection: 'row', justifyContent: 'space-between' },
  progressDate: { color: C.textSec, fontSize: 10, fontWeight: '500' },

  // Week days
  weekSection: { marginBottom: 16 },
  weekLabel: { color: C.textSec, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDayCol: { alignItems: 'center', gap: 6 },
  weekDayLabel: { color: C.textSec, fontSize: 11, fontWeight: '600' },
  weekDayDot: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A1A1C',
  },
  weekDayDash: { color: '#333', fontSize: 13, fontWeight: '700' },

  // Info boxes
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  infoBox: { flex: 1, backgroundColor: '#0F0F11', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1A1A1C' },
  infoBoxLabel: { color: C.textSec, fontSize: 10, fontWeight: '600', letterSpacing: 1.5, marginBottom: 4 },
  infoBoxValue: { color: C.white, fontSize: 15, fontWeight: '700' },

  // Skip tokens
  skipRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F0F11', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#1A1A1C', marginBottom: 14,
  },
  skipLabel: { color: C.textSec, fontSize: 10, fontWeight: '600', letterSpacing: 1.5, marginBottom: 3 },
  skipValue: { color: C.white, fontSize: 14, fontWeight: '600' },
  tokenIcons: { flexDirection: 'row', gap: 8 },
  tokenIcon: {
    width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.orange + '22', borderWidth: 1, borderColor: C.orange + '44',
  },
  tokenIconUsed: { backgroundColor: '#1A1A1C', borderColor: '#2A2A2E' },

  // End plan button
  endPlanBtn: {
    paddingVertical: 14, borderRadius: 13, alignItems: 'center',
    borderWidth: 1, borderColor: C.red + '44',
  },
  endPlanText: { color: C.red, fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },

  // Upcoming scheduled plans
  upcomingSection: { marginBottom: 20 },
  upcomingSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
  },
  upcomingSectionTitle: {
    color: '#6366F1', fontSize: 11, fontWeight: '800', letterSpacing: 1.5,
  },
  upcomingCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#0E0E1A', borderWidth: 1, borderColor: '#6366F133',
    borderRadius: 12, padding: 14, marginBottom: 8, gap: 12,
  },
  upcomingCardLeft: {
    paddingTop: 5, alignItems: 'center',
  },
  upcomingCardDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#6366F1',
  },
  upcomingCardNameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3,
  },
  upcomingCardName: {
    color: C.white, fontSize: 14, fontWeight: '700', flex: 1,
  },
  upcomingCardBadge: {
    backgroundColor: '#6366F122', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  upcomingCardBadgeText: {
    color: '#6366F1', fontSize: 9, fontWeight: '800', letterSpacing: 1,
  },
  upcomingCardDate: { color: '#888', fontSize: 11, fontWeight: '500', marginBottom: 2 },
  upcomingCardSplit: { color: '#555', fontSize: 11, fontWeight: '500' },

  // Categories section
  catSectionLabel: {
    color: C.textSec, fontSize: 10, fontWeight: '700', letterSpacing: 2,
    marginBottom: 10,
  },
  catRow: {
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 8,
    overflow: 'hidden',
  },
  catRowHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
  },
  catRowIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catRowLabel: { color: C.white, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  catRowSub: { color: C.textSec, fontSize: 11, marginTop: 2 },
  catRowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  catRowFlame: { fontSize: 13 },
  catRowStreak: { color: C.white, fontSize: 14, fontWeight: '700', marginRight: 4 },

  // Category expanded detail
  catDetailLoading: { paddingVertical: 16, alignItems: 'center' },
  catDetailEmpty: { color: C.textSec, fontSize: 12, fontStyle: 'italic', padding: 14, paddingTop: 0 },
  catDetailWrap: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: C.border },
  catDetailDivider: { borderTopWidth: 1, borderTopColor: '#1A1A1C' },

  // Workout detail
  catDetailDayRow: { paddingTop: 12 },
  catDetailDayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  catDetailDayBadge: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catDetailDayNum: { fontSize: 11, fontWeight: '800' },
  catDetailDayName: { flex: 1, color: C.white, fontSize: 13, fontWeight: '700' },
  catDetailExCount: { color: C.textSec, fontSize: 11 },
  catDetailExRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingLeft: 34 },
  catDetailExDot: { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
  catDetailExName: { flex: 1, color: '#aaa', fontSize: 12 },
  catDetailExMeta: { color: C.textSec, fontSize: 11, fontWeight: '600', flexShrink: 0 },

  // Meal detail
  catDetailMealRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12 },
  catDetailMealIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catDetailMealName: { color: C.white, fontSize: 13, fontWeight: '600' },
  catDetailMealTime: { color: C.textSec, fontSize: 11, marginTop: 1 },
  catDetailMealTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, flexShrink: 0 },
  catDetailMealTypeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Water / Sleep detail
  catDetailGoalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12 },
  catDetailGoalLabel: { color: C.textSec, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  catDetailGoalValue: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  catDetailGoalSub: { color: C.textSec, fontSize: 12, alignSelf: 'flex-end', paddingBottom: 2 },
  catDetailGlassRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  catDetailGlass: { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  catDetailSleepBar: { flexDirection: 'row', gap: 4, marginTop: 12 },
  catDetailSleepSegment: { flex: 1, height: 6, borderRadius: 3 },
  catDetailSleepHint: { color: C.textSec, fontSize: 11, marginTop: 8, fontStyle: 'italic' },

  // Week navigation
  weekNavRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  weekNavBtn: {
    width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A1A1C',
  },
  weekNavBtnDisabled: { backgroundColor: '#111113' },
  weekNavCenter: { flex: 1, alignItems: 'center' },
  weekNavDateRange: { color: '#555', fontSize: 10, fontWeight: '500', marginTop: 2 },
  weekBackToNow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
    marginTop: 8, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 12, backgroundColor: C.orange + '12', borderWidth: 1, borderColor: C.orange + '33',
  },
  weekBackToNowText: { color: C.orange, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  weekLegend: { flexDirection: 'row', gap: 14, marginTop: 10 },
  weekLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weekLegendDot: { width: 8, height: 8, borderRadius: 4 },
  weekLegendText: { color: '#444', fontSize: 10, fontWeight: '500' },

  // Day detail modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#111113', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '80%', minHeight: 260,
    flex: 0,
  },
  modalBody: {
    paddingBottom: 8,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#333',
    alignSelf: 'center', marginTop: 10, marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1E1E22', marginBottom: 14,
  },
  modalDateLabel: { color: C.white, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  modalTodayBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4,
  },
  modalTodayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  modalTodayText: { color: C.green, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  // Rest day content
  modalRestWrap: { alignItems: 'center', paddingVertical: 20 },
  modalRestIcon: {
    width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#3B3B6B', marginBottom: 14,
  },
  modalRestTitle: { color: C.white, fontSize: 22, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  modalRestSub: { color: '#555', fontSize: 13, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  modalRestNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, backgroundColor: C.orange + '18', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  modalRestNoteText: { color: C.orange, fontSize: 12, fontWeight: '600' },

  // Training day content
  modalWorkoutBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1A1200', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.orange + '33', marginBottom: 12,
  },
  modalWorkoutName: { flex: 1, color: C.white, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  modalStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  modalStatusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  modalSummaryRow: {
    flexDirection: 'row', backgroundColor: '#0F0F11', borderRadius: 12,
    borderWidth: 1, borderColor: '#1E1E22', marginBottom: 12, overflow: 'hidden',
  },
  modalSummaryBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  modalSummaryVal: { color: C.white, fontSize: 24, fontWeight: '900' },
  modalSummaryLabel: { color: '#555', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },

  modalNoExercises: { color: '#555', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 12 },
  modalExList: {
    backgroundColor: '#0F0F11', borderRadius: 12,
    borderWidth: 1, borderColor: '#1E1E22', overflow: 'hidden',
  },
  modalExRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13,
  },
  modalExRowBorder: { borderTopWidth: 1, borderTopColor: '#1A1A1C' },
  modalExCheck: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  modalExName: { color: C.white, fontSize: 13, fontWeight: '600' },
  modalExTarget: { color: '#555', fontSize: 10, marginTop: 2 },
  modalExLogged: { color: C.orange, fontSize: 12, fontWeight: '700', flexShrink: 0 },
  modalExFuture: { color: '#444', fontSize: 12, fontWeight: '600', flexShrink: 0 },

  // History tab
  historyCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyCardName: { color: C.white, fontSize: 16, fontWeight: '800', flex: 1, marginRight: 8 },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  historyBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  historyCardDate: { color: '#555', fontSize: 11, marginTop: 8 },
  historyCatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  historyCatPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  historyCatPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
});
