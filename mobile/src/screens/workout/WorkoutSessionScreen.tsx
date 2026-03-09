import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Platform, UIManager, Vibration,
  KeyboardAvoidingView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import {
  startSession, endSession, discardSession, clearSession,
  setRestMode, setWeightUnit, setBarWeight,
  updateSetWeight, completeSet, completeTimedSet, finishRest, skipRest, addRestTime,
  addExerciseOnFly, setExerciseLogId, setPreviousBest,
  setActiveExercise,
  type WeightUnit, type RestMode, type ExerciseSession, type SetLog, type MetricType,
} from '../../store/slices/workoutSessionSlice';
import { supabase } from '../../services/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: '#0A0A0C',
  card: '#111113',
  orange: '#F59E0B',
  green: '#10B981',
  red: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  white: '#F5F5F5',
  textSec: '#666',
  border: '#1E1E22',
  sheet: '#0F0F11',
};

const PLATES_LB = [45, 35, 25, 10, 5, 2.5];
const PLATES_KG = [20, 15, 10, 5, 2.5, 1.25];

function lbToKg(lb: number) { return Math.round(lb / 2.2046 * 4) / 4; }
function kgToLb(kg: number) { return Math.round(kg * 2.2046 * 4) / 4; }
function epley1RM(weight: number, reps: number) {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function fmtTime(seconds: number) {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? '+' : '';
  return `${sign}${m}:${String(s).padStart(2, '0')}`;
}

// ─── Plate Calculator Modal ───────────────────────────────────────────────────

interface PlateCalcProps {
  visible: boolean;
  unit: WeightUnit;
  barWeightLb: number;
  initialWeight: number;
  onConfirm: (weight: number) => void;
  onClose: () => void;
}

function PlateCalculator({ visible, unit, barWeightLb, initialWeight, onConfirm, onClose }: PlateCalcProps) {
  const barLb = barWeightLb;
  const barKg = lbToKg(barLb);
  const plates = unit === 'lb' ? PLATES_LB : PLATES_KG;
  const [platesPerSide, setPlatesPerSide] = useState<number[]>([]);

  useEffect(() => {
    if (visible) setPlatesPerSide([]);
  }, [visible]);

  const addPlate = (p: number) => setPlatesPerSide(prev => [...prev, p]);
  const removePlate = (p: number) => {
    const idx = platesPerSide.lastIndexOf(p);
    if (idx >= 0) setPlatesPerSide(prev => prev.filter((_, i) => i !== idx));
  };
  const countOf = (p: number) => platesPerSide.filter(x => x === p).length;

  const totalWeight = unit === 'lb'
    ? barLb + platesPerSide.reduce((a, b) => a + b, 0) * 2
    : barKg + platesPerSide.reduce((a, b) => a + b, 0) * 2;

  const confirm = () => {
    onConfirm(Math.round(totalWeight * 10) / 10);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={pc.overlay}>
        <View style={pc.sheet}>
          <View style={pc.header}>
            <Text style={pc.title}>PLATE CALCULATOR</Text>
            <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={20} color="#666" /></TouchableOpacity>
          </View>

          {/* Total weight display */}
          <View style={pc.totalRow}>
            <Text style={pc.totalNum}>{totalWeight % 1 === 0 ? totalWeight : totalWeight.toFixed(1)}</Text>
            <Text style={pc.totalUnit}>{unit}</Text>
          </View>

          {/* Barbell visual */}
          <View style={pc.barbell}>
            <View style={pc.bbCap} />
            {[...platesPerSide].reverse().map((p, i) => (
              <View key={i} style={[pc.bbPlate, { height: 20 + p * 0.6, backgroundColor: p >= 45 ? C.red : p >= 25 ? C.orange : p >= 10 ? C.blue : C.green }]}>
                <Text style={pc.bbPlateText}>{p}</Text>
              </View>
            ))}
            <View style={pc.bbBar}><Text style={pc.bbBarText}>{unit === 'lb' ? `${barLb}lb bar` : `${barKg}kg bar`}</Text></View>
            {platesPerSide.map((p, i) => (
              <View key={i} style={[pc.bbPlate, { height: 20 + p * 0.6, backgroundColor: p >= 45 ? C.red : p >= 25 ? C.orange : p >= 10 ? C.blue : C.green }]}>
                <Text style={pc.bbPlateText}>{p}</Text>
              </View>
            ))}
            <View style={pc.bbCap} />
          </View>

          {/* Plate grid */}
          <View style={pc.plateGrid}>
            {plates.map(p => {
              const count = countOf(p);
              return (
                <View key={p} style={pc.plateItem}>
                  <TouchableOpacity style={[pc.plateBtn, { backgroundColor: p >= (unit === 'lb' ? 45 : 20) ? C.red + '22' : p >= (unit === 'lb' ? 25 : 10) ? C.orange + '22' : C.blue + '22' }]} onPress={() => addPlate(p)} activeOpacity={0.7}>
                    <Text style={pc.plateBtnText}>{p}</Text>
                    <Text style={pc.plateBtnUnit}>{unit}</Text>
                  </TouchableOpacity>
                  <View style={pc.plateCountRow}>
                    <TouchableOpacity onPress={() => removePlate(p)} style={pc.plateCountBtn} disabled={count === 0}>
                      <Text style={[pc.plateCountBtnText, count === 0 && { opacity: 0.2 }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={pc.plateCount}>{count}</Text>
                    <TouchableOpacity onPress={() => addPlate(p)} style={pc.plateCountBtn}>
                      <Text style={pc.plateCountBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Clear + Confirm */}
          <View style={pc.actions}>
            <TouchableOpacity style={pc.clearBtn} onPress={() => setPlatesPerSide([])} activeOpacity={0.7}>
              <Text style={pc.clearBtnText}>CLEAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pc.confirmBtn} onPress={confirm} activeOpacity={0.8}>
              <Text style={pc.confirmBtnText}>USE {totalWeight % 1 === 0 ? totalWeight : totalWeight.toFixed(1)} {unit.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Add Exercise Modal ───────────────────────────────────────────────────────

function AddExerciseModal({ visible, onAdd, onClose }: {
  visible: boolean;
  onAdd: (ex: { exerciseId: string; name: string; muscle: string; sets: number; reps: number }) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(8);
  const [selected, setSelected] = useState<any | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) { setQuery(''); setResults([]); setSelected(null); }
  }, [visible]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase.from('exercises')
        .select('id, name, primary_muscle_group, equipment_category')
        .ilike('name', `%${query}%`).limit(10);
      setResults(data ?? []);
      setSearching(false);
    }, 300);
  }, [query]);

  const confirm = () => {
    if (!selected) return;
    onAdd({ exerciseId: selected.id, name: selected.name, muscle: selected.primary_muscle_group, sets, reps });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={ae.overlay}>
        <View style={ae.sheet}>
          <View style={ae.header}>
            <Text style={ae.title}>ADD EXERCISE</Text>
            <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={20} color="#666" /></TouchableOpacity>
          </View>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search exercises…" placeholderTextColor="#444" style={ae.input} autoFocus />
          <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
            {results.map(ex => (
              <TouchableOpacity key={ex.id} style={[ae.result, selected?.id === ex.id && ae.resultSelected]} onPress={() => setSelected(ex)} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={ae.resultName}>{ex.name}</Text>
                  <Text style={ae.resultMuscle}>{ex.primary_muscle_group}</Text>
                </View>
                {selected?.id === ex.id && <MaterialCommunityIcons name="check-circle" size={16} color={C.orange} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selected && (
            <View style={ae.config}>
              <Text style={ae.configLabel}>SETS & REPS</Text>
              <View style={ae.configRow}>
                <View style={ae.counter}>
                  <TouchableOpacity onPress={() => setSets(s => Math.max(1, s - 1))} style={ae.cBtn}><Text style={ae.cBtnT}>−</Text></TouchableOpacity>
                  <Text style={ae.cVal}>{sets} sets</Text>
                  <TouchableOpacity onPress={() => setSets(s => s + 1)} style={ae.cBtn}><Text style={ae.cBtnT}>+</Text></TouchableOpacity>
                </View>
                <View style={ae.counter}>
                  <TouchableOpacity onPress={() => setReps(r => Math.max(1, r - 1))} style={ae.cBtn}><Text style={ae.cBtnT}>−</Text></TouchableOpacity>
                  <Text style={ae.cVal}>{reps} reps</Text>
                  <TouchableOpacity onPress={() => setReps(r => r + 1)} style={ae.cBtn}><Text style={ae.cBtnT}>+</Text></TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={ae.addBtn} onPress={confirm} activeOpacity={0.8}>
                <Text style={ae.addBtnText}>ADD TO WORKOUT</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Rest Timer ───────────────────────────────────────────────────────────────

function RestTimerBar() {
  const dispatch = useDispatch();
  const { restMode, restStartedAt, restTargetSeconds, isResting } = useSelector((s: RootState) => s.workoutSession);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isResting || !restStartedAt) { setElapsed(0); return; }
    const iv = setInterval(() => {
      const e = Math.floor((Date.now() - restStartedAt) / 1000);
      setElapsed(e);
      if (restMode === 'strict' && e >= restTargetSeconds) {
        clearInterval(iv);
        Vibration.vibrate([0, 200, 100, 200]);
        dispatch(finishRest());
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [isResting, restStartedAt, restTargetSeconds, restMode, dispatch]);

  if (!isResting) return null;

  const remaining = restTargetSeconds - elapsed;
  const pct = Math.min(1, elapsed / restTargetSeconds);
  const isOvertime = elapsed > restTargetSeconds;

  return (
    <View style={rt.wrap}>
      <View style={rt.bar}>
        <View style={rt.track} />
        <Animated.View style={[rt.fill, { width: `${Math.min(100, pct * 100)}%` as any, backgroundColor: isOvertime ? C.orange : C.green }]} />
      </View>
      <View style={rt.info}>
        <View>
          <Text style={rt.label}>{isOvertime ? 'OVERTIME' : 'REST'}</Text>
          <Text style={[rt.time, isOvertime && { color: C.orange }]}>
            {isOvertime ? `+${fmtTime(elapsed - restTargetSeconds)}` : fmtTime(remaining)}
          </Text>
        </View>
        <View style={rt.actions}>
          <TouchableOpacity style={rt.btn} onPress={() => dispatch(addRestTime(30))} activeOpacity={0.7}>
            <Text style={rt.btnText}>+30s</Text>
          </TouchableOpacity>
          {restMode === 'flexible' && (
            <TouchableOpacity style={[rt.btn, rt.btnSkip]} onPress={() => dispatch(finishRest())} activeOpacity={0.7}>
              <Text style={[rt.btnText, { color: C.orange }]}>START NEXT →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Set Timer Row (for duration-based exercises) ────────────────────────────

interface SetTimerRowProps {
  set: SetLog;
  exIdx: number;
  setIdx: number;
  isResting: boolean;
}

function SetTimerRow({ set, exIdx, setIdx, isResting }: SetTimerRowProps) {
  const dispatch = useDispatch();
  const session = useSelector((s: RootState) => s.workoutSession);
  const { user } = useSelector((s: RootState) => s.auth);

  const targetSec = set.targetDurationSeconds || 60;
  const [timerActive, setTimerActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  // Is this the set being pre-staged during rest?
  const isNextDuringRest = isResting
    && set.status === 'pending'
    && exIdx === session.activeExerciseIdx
    && setIdx === session.activeSetIdx;

  useEffect(() => {
    if (!timerActive) return;
    const iv = setInterval(() => {
      const e = Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000);
      setElapsed(e);
      // When countdown hits 0, vibrate but keep running (user taps to log)
      if (e === targetSec) {
        Vibration.vibrate([0, 200, 100, 200, 100, 200]);
      }
    }, 200);
    return () => clearInterval(iv);
  }, [timerActive, targetSec]);

  const handleStart = () => {
    startedAtRef.current = Date.now();
    setElapsed(0);
    setTimerActive(true);
  };

  const handleLogSet = async () => {
    setTimerActive(false);
    const durationSec = elapsed;

    const ex = session.exercises[exIdx];
    let logId = ex.logId ?? '';

    if (user && ex && session.workoutId && session.sessionId) {
      const setsData = ex.sets
        .filter(s => s.status === 'done' || s.status === 'resting')
        .map(s => ({
          set_number: s.setNumber,
          weight_value: 0,
          weight_unit: 'lb',
          reps_completed: null,
          duration_completed: s.durationCompleted,
          rest_seconds_taken: s.restSecondsTaken,
          is_pr: false,
        }));
      setsData.push({
        set_number: set.setNumber,
        weight_value: 0,
        weight_unit: 'lb',
        reps_completed: null,
        duration_completed: durationSec,
        rest_seconds_taken: null,
        is_pr: false,
      });
      setsData.sort((a, b) => a.set_number - b.set_number);

      if (logId) {
        await supabase.from('workout_logs').update({ sets_data: setsData }).eq('id', logId);
      } else {
        const { data: newLog } = await supabase.from('workout_logs').insert({
          user_id: user.id,
          workout_id: session.workoutId,
          exercise_id: ex.exerciseId,
          session_id: session.sessionId,
          sets_data: setsData,
        }).select('id').single();
        if (newLog?.id) {
          logId = newLog.id;
          dispatch(setExerciseLogId({ exIdx, logId: newLog.id }));
        }
      }
    }

    dispatch(completeTimedSet({ exIdx, setIdx, durationCompleted: durationSec, logId }));
    setElapsed(0);
  };

  // ── Pending (not next-during-rest) ─────────────────────────────────────────
  if (set.status === 'pending' && !isNextDuringRest) {
    return (
      <View style={sr.row}>
        <View style={sr.numBox}><Text style={sr.num}>{set.setNumber}</Text></View>
        <Text style={sr.pending}>—</Text>
        <Text style={sr.pending}>{fmtTime(targetSec)}</Text>
      </View>
    );
  }

  // ── Pending next-during-rest ────────────────────────────────────────────────
  if (set.status === 'pending' && isNextDuringRest) {
    return (
      <View style={sr.activeWrap}>
        <View style={sr.activeHeader}>
          <View style={[sr.numBox, sr.numBoxActive]}><Text style={[sr.num, { color: C.orange }]}>{set.setNumber}</Text></View>
          <Text style={sr.activeLabel}>NEXT UP · SET {set.setNumber} · {fmtTime(targetSec)}</Text>
        </View>
        <View style={[sr.restConfirmedRow]}>
          <MaterialCommunityIcons name="timer-outline" size={16} color={C.orange} />
          <Text style={sr.restConfirmedText}>Timer ready — starts when rest ends</Text>
        </View>
      </View>
    );
  }

  // ── Done / resting ──────────────────────────────────────────────────────────
  if (set.status === 'done' || set.status === 'resting') {
    const completed = set.durationCompleted ?? 0;
    const pct = Math.min(1, completed / targetSec);
    return (
      <View style={[sr.row, sr.rowDone]}>
        <View style={[sr.numBox, sr.numBoxDone]}>
          <MaterialCommunityIcons name="check" size={12} color={C.green} />
        </View>
        <Text style={sr.doneWeight}>{fmtTime(completed)}</Text>
        <Text style={sr.doneReps}>of {fmtTime(targetSec)}</Text>
        <View style={[sr.timerDoneBar, { width: `${Math.round(pct * 100)}%` as any }]} />
      </View>
    );
  }

  // ── Active ──────────────────────────────────────────────────────────────────
  const remaining = targetSec - elapsed;
  const isOvertime = elapsed > targetSec;
  const pct = Math.min(1, elapsed / targetSec);

  if (!timerActive) {
    return (
      <View style={sr.activeWrap}>
        <View style={sr.activeHeader}>
          <View style={[sr.numBox, sr.numBoxActive]}><Text style={[sr.num, { color: C.orange }]}>{set.setNumber}</Text></View>
          <Text style={sr.activeLabel}>SET {set.setNumber} · {fmtTime(targetSec)} TARGET</Text>
        </View>
        <TouchableOpacity style={sr.timerStartBtn} onPress={handleStart} activeOpacity={0.85}>
          <MaterialCommunityIcons name="play-circle" size={22} color="#000" />
          <Text style={sr.timerStartBtnText}>START TIMER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={sr.activeWrap}>
      <View style={sr.activeHeader}>
        <View style={[sr.numBox, sr.numBoxActive]}><Text style={[sr.num, { color: C.orange }]}>{set.setNumber}</Text></View>
        <Text style={sr.activeLabel}>
          {isOvertime ? 'OVERTIME' : `SET ${set.setNumber} · REMAINING`}
        </Text>
      </View>

      {/* Countdown display */}
      <View style={sr.timerFaceWrap}>
        <View style={[sr.timerTrack]}>
          <View style={[sr.timerFill, {
            width: `${Math.min(100, pct * 100)}%` as any,
            backgroundColor: isOvertime ? C.orange : elapsed / targetSec > 0.75 ? C.green : C.blue,
          }]} />
        </View>
        <Text style={[sr.timerCountdown, isOvertime && { color: C.orange }]}>
          {isOvertime ? `+${fmtTime(elapsed - targetSec)}` : fmtTime(remaining)}
        </Text>
        <Text style={sr.timerElapsedLabel}>{fmtTime(elapsed)} elapsed</Text>
      </View>

      <TouchableOpacity style={sr.logBtn} onPress={handleLogSet} activeOpacity={0.85}>
        <Text style={sr.logBtnText}>LOG SET ✓</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Set Row ──────────────────────────────────────────────────────────────────

interface SetRowProps {
  set: SetLog;
  exIdx: number;
  setIdx: number;
  unit: WeightUnit;
  barWeightLb: number;
  isResting: boolean;
  metricType: MetricType;
}

function SetRow({ set, exIdx, setIdx, unit, barWeightLb, isResting, metricType }: SetRowProps) {
  // Route timed sets to the dedicated timer UI
  if (metricType === 'duration') {
    return <SetTimerRow set={set} exIdx={exIdx} setIdx={setIdx} isResting={isResting} />;
  }
  const dispatch = useDispatch();
  const [weightInput, setWeightInput] = useState(set.weightValue > 0 ? String(set.weightValue) : '');
  const [repsInput, setRepsInput] = useState('');
  const [showCalc, setShowCalc] = useState(false);
  const [repsPhase, setRepsPhase] = useState(false);
  const { user } = useSelector((s: RootState) => s.auth);
  const session = useSelector((s: RootState) => s.workoutSession);

  // Is this the set being pre-staged during rest?
  const isNextDuringRest = isResting
    && set.status === 'pending'
    && exIdx === session.activeExerciseIdx
    && setIdx === session.activeSetIdx;

  // Use a ref so the status-change effect always sees the latest value without
  // re-subscribing (avoids the pending→active transition missing the flag).
  const [weightConfirmedDuringRest, setWeightConfirmedDuringRest] = useState(false);
  const weightConfirmedRef = useRef(false);

  useEffect(() => {
    if (set.weightValue > 0) setWeightInput(String(set.weightValue));
  }, [set.weightValue]);

  // When rest ends and this set becomes active, jump straight to reps if weight
  // was already confirmed during rest.
  useEffect(() => {
    if (set.status === 'active' && weightConfirmedRef.current) {
      setRepsPhase(true);
    }
  }, [set.status]);

  const handleWeightConfirm = () => {
    const w = parseFloat(weightInput) || 0;
    dispatch(updateSetWeight({ exIdx, setIdx, weight: w }));
    setRepsPhase(true);
  };

  const handleLogSet = async () => {
    const reps = parseInt(repsInput, 10);
    if (!reps || reps <= 0) { Alert.alert('Enter reps', 'Please enter how many reps you completed.'); return; }
    const weight = parseFloat(weightInput) || 0;
    const weightLb = unit === 'lb' ? weight : kgToLb(weight);

    // PR check — query previous best for this exercise
    const ex = session.exercises[exIdx];
    let isPR = false;
    let logId = ex.logId ?? '';

    if (user && ex) {
      const { data: prData } = await supabase
        .from('personal_records')
        .select('weight_value, weight_unit, reps, estimated_1rm')
        .eq('user_id', user.id)
        .eq('exercise_id', ex.exerciseId)
        .order('achieved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const prev1RM = prData ? epley1RM(
        prData.weight_unit === 'lb' ? prData.weight_value : kgToLb(prData.weight_value),
        prData.reps
      ) : 0;
      const current1RM = epley1RM(weightLb, reps);
      isPR = current1RM > prev1RM;

      // Upsert workout_logs row for this exercise
      const setsData = ex.sets
        .filter(s => s.status === 'done' || s.status === 'resting')
        .map(s => ({
          set_number: s.setNumber,
          weight_value: s.weightValue,
          weight_unit: s.weightUnit,
          reps_completed: s.repsCompleted,
          rest_seconds_taken: s.restSecondsTaken,
          is_pr: s.isPR,
        }));
      setsData.push({
        set_number: set.setNumber,
        weight_value: weight,
        weight_unit: unit,
        reps_completed: reps,
        rest_seconds_taken: null,
        is_pr: isPR,
      });
      // Always sort by set_number before writing so the array order in the DB
      // matches set order regardless of when each set was logged.
      setsData.sort((a, b) => a.set_number - b.set_number);

      if (logId) {
        await supabase.from('workout_logs').update({ sets_data: setsData })
          .eq('id', logId);
      } else if (session.workoutId && session.sessionId) {
        const { data: newLog } = await supabase.from('workout_logs').insert({
          user_id: user.id,
          workout_id: session.workoutId,
          exercise_id: ex.exerciseId,
          session_id: session.sessionId,
          sets_data: setsData,
        }).select('id').single();
        if (newLog?.id) {
          logId = newLog.id;
          dispatch(setExerciseLogId({ exIdx, logId: newLog.id }));
        }
      }

      // Save PR if it's a new record
      if (isPR && user && session.sessionId) {
        await supabase.from('personal_records').insert({
          user_id: user.id,
          exercise_id: ex.exerciseId,
          weight_value: weight,
          weight_unit: unit,
          reps,
          estimated_1rm: epley1RM(weightLb, reps),
          session_id: session.sessionId,
        });
      }
    }

    dispatch(completeSet({ exIdx, setIdx, repsCompleted: reps, isPR, logId }));
    setRepsPhase(false);
    setRepsInput('');
    if (isPR) Vibration.vibrate([0, 100, 50, 100, 50, 300]);
  };

  // ── Pending ──────────────────────────────────────────────────────────────
  if (set.status === 'pending') {
    // Show weight input during rest so user can pre-set next set's weight
    if (isNextDuringRest) {
      // Show a "confirmed" view once the user has locked in the weight
      if (weightConfirmedDuringRest) {
        return (
          <View style={sr.activeWrap}>
            <View style={sr.activeHeader}>
              <View style={[sr.numBox, { backgroundColor: C.orange + '30' }]}>
                <MaterialCommunityIcons name="check" size={12} color={C.orange} />
              </View>
              <Text style={sr.activeLabel}>SET {set.setNumber} READY · {set.targetReps} REPS</Text>
            </View>
            <View style={[sr.restConfirmedRow]}>
              <MaterialCommunityIcons name="weight-lifter" size={16} color={C.orange} />
              <Text style={sr.restConfirmedText}>{weightInput || '0'} {unit} confirmed — waiting for rest to end</Text>
              <TouchableOpacity onPress={() => {
                setWeightConfirmedDuringRest(false);
                weightConfirmedRef.current = false;
              }} activeOpacity={0.7}>
                <Text style={sr.restConfirmedEdit}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      return (
        <View style={sr.activeWrap}>
          <View style={sr.activeHeader}>
            <View style={[sr.numBox, sr.numBoxActive]}><Text style={[sr.num, { color: C.orange }]}>{set.setNumber}</Text></View>
            <Text style={sr.activeLabel}>NEXT UP · SET {set.setNumber} · TARGET {set.targetReps} REPS</Text>
          </View>
          <View style={sr.inputGroup}>
            <Text style={sr.inputLabel}>SET WEIGHT FOR NEXT SET ({unit.toUpperCase()})</Text>
            <View style={sr.weightRow}>
              <TextInput
                style={sr.weightInput}
                value={weightInput}
                onChangeText={v => {
                  setWeightInput(v);
                  const w = parseFloat(v) || 0;
                  dispatch(updateSetWeight({ exIdx, setIdx, weight: w }));
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#444"
              />
              <TouchableOpacity style={sr.calcBtn} onPress={() => setShowCalc(true)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="calculator-variant" size={18} color={C.orange} />
                <Text style={sr.calcBtnText}>PLATES</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={sr.nextBtn}
              onPress={() => {
                const w = parseFloat(weightInput) || 0;
                dispatch(updateSetWeight({ exIdx, setIdx, weight: w }));
                weightConfirmedRef.current = true;
                setWeightConfirmedDuringRest(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={sr.nextBtnText}>CONFIRM WEIGHT →</Text>
            </TouchableOpacity>
          </View>
          <PlateCalculator
            visible={showCalc}
            unit={unit}
            barWeightLb={barWeightLb}
            initialWeight={parseFloat(weightInput) || 0}
            onConfirm={w => {
              setWeightInput(String(w));
              dispatch(updateSetWeight({ exIdx, setIdx, weight: w }));
            }}
            onClose={() => setShowCalc(false)}
          />
        </View>
      );
    }
    return (
      <View style={sr.row}>
        <View style={sr.numBox}><Text style={sr.num}>{set.setNumber}</Text></View>
        <Text style={sr.pending}>—</Text>
        <Text style={sr.pending}>—</Text>
        <Text style={sr.pending}>{set.targetReps} reps</Text>
      </View>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (set.status === 'done' || set.status === 'resting') {
    return (
      <View style={[sr.row, sr.rowDone]}>
        <View style={[sr.numBox, sr.numBoxDone]}>
          <MaterialCommunityIcons name={set.isPR ? 'trophy' : 'check'} size={12} color={set.isPR ? C.orange : C.green} />
        </View>
        <Text style={sr.doneWeight}>{set.weightValue} {unit}</Text>
        <Text style={sr.doneReps}>{set.repsCompleted} reps</Text>
        {set.isPR && <View style={sr.prBadge}><Text style={sr.prText}>PR 🏆</Text></View>}
      </View>
    );
  }

  // ── Active ────────────────────────────────────────────────────────────────
  return (
    <View style={sr.activeWrap}>
      <View style={sr.activeHeader}>
        <View style={[sr.numBox, sr.numBoxActive]}><Text style={[sr.num, { color: C.orange }]}>{set.setNumber}</Text></View>
        <Text style={sr.activeLabel}>SET {set.setNumber} · TARGET {set.targetReps} REPS</Text>
      </View>

      {!repsPhase ? (
        <View style={sr.inputGroup}>
          <Text style={sr.inputLabel}>WEIGHT ({unit.toUpperCase()})</Text>
          <View style={sr.weightRow}>
            <TextInput
              style={sr.weightInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#444"
            />
            <TouchableOpacity style={sr.calcBtn} onPress={() => setShowCalc(true)} activeOpacity={0.8}>
              <MaterialCommunityIcons name="calculator-variant" size={18} color={C.orange} />
              <Text style={sr.calcBtnText}>PLATES</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={sr.nextBtn} onPress={handleWeightConfirm} activeOpacity={0.85}>
            <Text style={sr.nextBtnText}>CONFIRM WEIGHT →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={sr.inputGroup}>
          <Text style={sr.inputLabel}>REPS COMPLETED</Text>
          <View style={sr.repsRow}>
            {[1,2,3,4,5,6,7,8,9,10,12,15].map(r => (
              <TouchableOpacity key={r} style={[sr.repChip, repsInput === String(r) && sr.repChipActive]} onPress={() => setRepsInput(String(r))} activeOpacity={0.7}>
                <Text style={[sr.repChipText, repsInput === String(r) && sr.repChipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={sr.repsInput}
            value={repsInput}
            onChangeText={setRepsInput}
            keyboardType="number-pad"
            placeholder="or type reps…"
            placeholderTextColor="#444"
          />
          <TouchableOpacity
            style={[sr.logBtn, (!repsInput || parseInt(repsInput) <= 0) && { opacity: 0.4 }]}
            onPress={handleLogSet}
            activeOpacity={0.85}
            disabled={!repsInput || parseInt(repsInput) <= 0}
          >
            <Text style={sr.logBtnText}>LOG SET ✓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sr.backWeightBtn} onPress={() => setRepsPhase(false)} activeOpacity={0.7}>
            <Text style={sr.backWeightText}>← Change weight ({weightInput} {unit})</Text>
          </TouchableOpacity>
        </View>
      )}

      <PlateCalculator
        visible={showCalc}
        unit={unit}
        barWeightLb={barWeightLb}
        initialWeight={parseFloat(weightInput) || 0}
        onConfirm={w => setWeightInput(String(w))}
        onClose={() => setShowCalc(false)}
      />
    </View>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({ ex, exIdx }: { ex: ExerciseSession; exIdx: number }) {
  const dispatch = useDispatch();
  const { activeExerciseIdx, isResting, weightUnit, barWeightLb } = useSelector((s: RootState) => s.workoutSession);
  const isActive = exIdx === activeExerciseIdx;
  const doneSets = ex.sets.filter(s => s.status === 'done').length;

  return (
    <TouchableOpacity
      style={[ec.card, isActive && ec.cardActive, ex.isComplete && ec.cardDone]}
      onPress={() => dispatch(setActiveExercise(exIdx))}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={ec.header}>
        <View style={[ec.iconBox, isActive && { backgroundColor: C.orange + '25' }]}>
          <MaterialCommunityIcons name="dumbbell" size={16} color={isActive ? C.orange : '#555'} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={isActive ? ec.nameActive : ec.name}>{ex.name}</Text>
            {isActive && !ex.isComplete && (
              <View style={ec.activePill}>
                <Text style={ec.activePillText}>● ACTIVE</Text>
              </View>
            )}
            {ex.isAddedOnFly && <View style={ec.addedBadge}><Text style={ec.addedBadgeText}>ADDED</Text></View>}
          </View>
          <Text style={[ec.sub, isActive && { color: '#666' }]}>{ex.muscle ? `${ex.muscle} · ` : ''}{ex.targetSets} sets × {ex.metricType === 'duration' ? fmtTime(ex.targetDurationSeconds) : `${ex.targetReps} reps`}</Text>
        </View>
        <View style={ec.progress}>
          <Text style={[ec.progressText, doneSets === ex.targetSets && { color: C.green }]}>
            {doneSets}/{ex.targetSets}
          </Text>
          {ex.isComplete && <MaterialCommunityIcons name="check-circle" size={16} color={C.green} />}
        </View>
      </View>

      {/* Sets (only show when active) */}
      {isActive && (
        <View style={ec.sets}>
          {ex.sets.map((set, setIdx) => (
            <SetRow
              key={setIdx}
              set={set}
              exIdx={exIdx}
              setIdx={setIdx}
              unit={weightUnit}
              barWeightLb={barWeightLb}
              isResting={isResting}
              metricType={ex.metricType}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Setup View ───────────────────────────────────────────────────────────────

function SetupView({ onStart }: { onStart: (restMode: RestMode) => void }) {
  const dispatch = useDispatch();
  const { restMode, weightUnit, barWeightLb, workoutName, exercises, isResuming } = useSelector((s: RootState) => s.workoutSession);

  return (
    <View style={sv.wrap}>
      <Text style={sv.title}>{workoutName.toUpperCase()}</Text>
      <Text style={sv.sub}>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''} planned</Text>

      {/* Weight unit */}
      <View style={sv.section}>
        <Text style={sv.label}>WEIGHT UNIT</Text>
        <View style={sv.toggle}>
          {(['lb', 'kg'] as WeightUnit[]).map(u => (
            <TouchableOpacity
              key={u}
              style={[sv.toggleBtn, weightUnit === u && sv.toggleBtnActive]}
              onPress={() => dispatch(setWeightUnit(u))}
              activeOpacity={0.8}
            >
              <Text style={[sv.toggleText, weightUnit === u && sv.toggleTextActive]}>{u.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bar weight */}
      <View style={sv.section}>
        <Text style={sv.label}>BARBELL WEIGHT</Text>
        <View style={sv.barRow}>
          {(weightUnit === 'lb' ? [35, 45] : [15, 20]).map(w => (
            <TouchableOpacity
              key={w}
              style={[sv.barChip, barWeightLb === (weightUnit === 'lb' ? w : kgToLb(w)) && sv.barChipActive]}
              onPress={() => dispatch(setBarWeight(weightUnit === 'lb' ? w : kgToLb(w)))}
              activeOpacity={0.8}
            >
              <Text style={[sv.barChipText, barWeightLb === (weightUnit === 'lb' ? w : kgToLb(w)) && sv.barChipTextActive]}>
                {w} {weightUnit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Rest mode */}
      <View style={sv.section}>
        <Text style={sv.label}>REST TIMER MODE</Text>
        {([
          { id: 'flexible', title: 'Flexible', desc: 'Timer tracks rest, you start the next set when ready. Actual rest time is logged.' },
          { id: 'strict',   title: 'Strict',   desc: 'Next set auto-starts when rest time completes. Keeps you disciplined to your plan.' },
        ] as { id: RestMode; title: string; desc: string }[]).map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[sv.modeCard, restMode === opt.id && sv.modeCardActive]}
            onPress={() => dispatch(setRestMode(opt.id))}
            activeOpacity={0.8}
          >
            <View style={[sv.modeRadio, restMode === opt.id && sv.modeRadioActive]}>
              {restMode === opt.id && <View style={sv.modeRadioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sv.modeTitle, restMode === opt.id && { color: C.white }]}>{opt.title}</Text>
              <Text style={sv.modeDesc}>{opt.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={sv.startBtn} onPress={() => onStart(restMode)} activeOpacity={0.85}>
        <Text style={sv.startBtnText}>{isResuming ? '▶  CONTINUE WORKOUT' : '🔥  START WORKOUT'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Summary View ─────────────────────────────────────────────────────────────

function SummaryView({ onDone }: { onDone: () => void }) {
  const session = useSelector((s: RootState) => s.workoutSession);
  const durationSec = session.endedAt && session.startedAt
    ? Math.round((session.endedAt - session.startedAt) / 1000) : 0;
  const totalSets = session.exercises.reduce((a, ex) => a + ex.sets.filter(s => s.status === 'done').length, 0);
  const totalVol = session.exercises.reduce((a, ex) =>
    a + ex.sets.filter(s => s.status === 'done').reduce((b, s) => {
      const lb = s.weightUnit === 'lb' ? s.weightValue : kgToLb(s.weightValue);
      return b + lb * (s.repsCompleted ?? 0);
    }, 0), 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={sum.wrap}>
      <Text style={sum.emoji}>💪</Text>
      <Text style={sum.title}>WORKOUT COMPLETE</Text>

      <View style={sum.stats}>
        <View style={sum.stat}>
          <Text style={sum.statVal}>{fmtTime(durationSec)}</Text>
          <Text style={sum.statLabel}>DURATION</Text>
        </View>
        <View style={sum.statDiv} />
        <View style={sum.stat}>
          <Text style={sum.statVal}>{totalSets}</Text>
          <Text style={sum.statLabel}>SETS</Text>
        </View>
        <View style={sum.statDiv} />
        <View style={sum.stat}>
          <Text style={sum.statVal}>{Math.round(totalVol).toLocaleString()}</Text>
          <Text style={sum.statLabel}>VOL (lb)</Text>
        </View>
      </View>

      {session.prsAchieved.length > 0 && (
        <View style={sum.prSection}>
          <Text style={sum.prTitle}>🏆 PERSONAL RECORDS</Text>
          {session.prsAchieved.map((pr, i) => (
            <View key={i} style={sum.prRow}>
              <MaterialCommunityIcons name="trophy" size={14} color={C.orange} />
              <Text style={sum.prText}>
                {pr.exerciseName} — {pr.weightValue} {pr.weightUnit} × {pr.reps} reps
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Exercise breakdown */}
      {session.exercises.map((ex, i) => {
        const doneSets = ex.sets.filter(s => s.status === 'done');
        if (doneSets.length === 0) return null;
        return (
          <View key={i} style={sum.exCard}>
            <Text style={sum.exName}>{ex.name}</Text>
            {doneSets.map((s, si) => (
              <Text key={si} style={sum.exSet}>
                {ex.metricType === 'duration'
                  ? `Set ${s.setNumber}: ${fmtTime(s.durationCompleted ?? 0)} (target ${fmtTime(ex.targetDurationSeconds)})`
                  : `Set ${s.setNumber}: ${s.weightValue} ${s.weightUnit} × ${s.repsCompleted} reps${s.isPR ? ' 🏆' : ''}`
                }
              </Text>
            ))}
          </View>
        );
      })}

      <TouchableOpacity style={sum.doneBtn} onPress={onDone} activeOpacity={0.85}>
        <Text style={sum.doneBtnText}>DONE</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WorkoutSessionScreen() {
  const dispatch = useDispatch();
  const session = useSelector((s: RootState) => s.workoutSession);
  const { user } = useSelector((s: RootState) => s.auth);
  const [elapsed, setElapsed] = useState(0);
  const [showAddEx, setShowAddEx] = useState(false);

  // Stopwatch
  useEffect(() => {
    if (session.status !== 'active' || !session.startedAt) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - session.startedAt!) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [session.status, session.startedAt]);

  const handleStart = useCallback(async (restMode: RestMode) => {
    if (!user || !session.workoutId || !session.planId) return;

    if (session.isResuming && session.sessionId) {
      // Resuming after a crash — reuse the existing DB session row, jump straight
      // to active without reinitialising exercise state.
      dispatch(startSession({ sessionId: session.sessionId, restMode: session.restMode }));
      return;
    }

    // Create a new session in DB
    const { data: dbSession } = await supabase.from('workout_sessions').insert({
      user_id: user.id,
      workout_id: session.workoutId,
      plan_id: session.planId,
      rest_mode: restMode,
      weight_unit: session.weightUnit,
    }).select('id').single();

    dispatch(startSession({ sessionId: dbSession?.id ?? crypto.randomUUID(), restMode }));
  }, [user, session.workoutId, session.planId, session.weightUnit, session.isResuming, session.sessionId, session.restMode, dispatch]);

  const handleEnd = useCallback(async () => {
    Alert.alert('End Workout?', 'This will save your session and end the workout.', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'End Workout', style: 'destructive', onPress: async () => {
          dispatch(endSession());
          // Update session in DB
          if (session.sessionId && session.startedAt) {
            const durationSec = Math.round((Date.now() - session.startedAt) / 1000);
            const totalSets = session.exercises.reduce((a, ex) => a + ex.sets.filter(s => s.status === 'done').length, 0);
            const totalVol = session.exercises.reduce((a, ex) =>
              a + ex.sets.filter(s => s.status === 'done').reduce((b, s) => {
                const lb = s.weightUnit === 'lb' ? s.weightValue : kgToLb(s.weightValue);
                return b + lb * (s.repsCompleted ?? 0);
              }, 0), 0);
            await supabase.from('workout_sessions').update({
              ended_at: new Date().toISOString(),
              duration_seconds: durationSec,
              total_sets: totalSets,
              total_volume_lb: Math.round(totalVol),
            }).eq('id', session.sessionId);
          }
        },
      },
    ]);
  }, [dispatch, session]);

  const handleDiscard = () => {
    Alert.alert('Discard Workout?', 'All progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => dispatch(discardSession()) },
    ]);
  };

  const handleDone = () => dispatch(clearSession());

  const handleAddExercise = (ex: { exerciseId: string; name: string; muscle: string; sets: number; reps: number }) => {
    dispatch(addExerciseOnFly({
      exerciseId: ex.exerciseId, name: ex.name, muscle: ex.muscle,
      targetSets: ex.sets, targetReps: ex.reps,
    }));
  };

  if (session.status === 'idle') return null;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>{session.workoutName.toUpperCase()}</Text>
            {session.status === 'active' && (
              <Text style={styles.headerTimer}>{fmtTime(elapsed)}</Text>
            )}
          </View>
          {session.status === 'active' && (
            <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.8}>
              <Text style={styles.endBtnText}>END</Text>
            </TouchableOpacity>
          )}
          {session.status === 'setup' && (
            <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard} activeOpacity={0.7}>
              <Text style={styles.discardText}>CANCEL</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Views ── */}
        {session.status === 'setup' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <SetupView onStart={handleStart} />
          </ScrollView>
        )}

        {session.status === 'active' && (
          <>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {session.exercises.map((ex, exIdx) => (
                  <ExerciseCard key={exIdx} ex={ex} exIdx={exIdx} />
                ))}
                {/* Add exercise */}
                <TouchableOpacity style={styles.addExBtn} onPress={() => setShowAddEx(true)} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={16} color={C.orange} />
                  <Text style={styles.addExText}>ADD EXERCISE</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Rest timer (pinned above keyboard) */}
            <RestTimerBar />
          </>
        )}

        {session.status === 'complete' && (
          <SummaryView onDone={handleDone} />
        )}
      </SafeAreaView>

      <AddExerciseModal
        visible={showAddEx}
        onAdd={handleAddExercise}
        onClose={() => setShowAddEx(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.bg, zIndex: 1000 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerName: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  headerTimer: { color: C.orange, fontSize: 26, fontWeight: '900', letterSpacing: -1, marginTop: 2 },
  endBtn: { backgroundColor: C.red + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.red + '40' },
  endBtnText: { color: C.red, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  discardBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  discardText: { color: C.textSec, fontSize: 12, fontWeight: '700' },
  scrollPad: { padding: 16, paddingBottom: 40 },
  addExBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: C.orange + '33', borderStyle: 'dashed', justifyContent: 'center', marginTop: 8 },
  addExText: { color: C.orange, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
});

// Plate calculator styles
const pc = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0F0F11', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: C.white, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 16 },
  totalNum: { color: C.white, fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  totalUnit: { color: C.textSec, fontSize: 18, fontWeight: '700' },
  barbell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 20, height: 60 },
  bbCap: { width: 10, height: 30, backgroundColor: '#555', borderRadius: 3 },
  bbBar: { height: 12, flex: 1, backgroundColor: '#333', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  bbBarText: { color: '#666', fontSize: 9, fontWeight: '600' },
  bbPlate: { width: 18, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  bbPlateText: { color: '#fff', fontSize: 7, fontWeight: '800', transform: [{ rotate: '-90deg' }] },
  plateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 20 },
  plateItem: { alignItems: 'center', gap: 4 },
  plateBtn: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  plateBtnText: { color: C.white, fontSize: 16, fontWeight: '800' },
  plateBtnUnit: { color: '#aaa', fontSize: 9, fontWeight: '600' },
  plateCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  plateCountBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222', borderRadius: 6 },
  plateCountBtnText: { color: C.white, fontSize: 14, fontWeight: '700' },
  plateCount: { color: C.white, fontSize: 13, fontWeight: '700', minWidth: 14, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  clearBtn: { flex: 0.35, paddingVertical: 14, borderRadius: 13, backgroundColor: '#1A1A1C', alignItems: 'center' },
  clearBtnText: { color: '#666', fontSize: 13, fontWeight: '700' },
  confirmBtn: { flex: 0.65, paddingVertical: 14, borderRadius: 13, backgroundColor: C.orange, alignItems: 'center' },
  confirmBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
});

// Add exercise styles
const ae = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0F0F11', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: C.white, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  input: { backgroundColor: '#1A1A1C', color: C.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  result: { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center' },
  resultSelected: { backgroundColor: C.orange + '10' },
  resultName: { color: C.white, fontSize: 14, fontWeight: '600' },
  resultMuscle: { color: C.textSec, fontSize: 11, marginTop: 1 },
  config: { marginTop: 14, gap: 10 },
  configLabel: { color: C.textSec, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  configRow: { flexDirection: 'row', gap: 12 },
  counter: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1C', borderRadius: 10, padding: 8, gap: 10 },
  cBtn: { width: 28, height: 28, backgroundColor: '#2A2A2E', borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  cBtnT: { color: C.white, fontSize: 18, fontWeight: '600' },
  cVal: { flex: 1, color: C.white, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  addBtn: { backgroundColor: C.orange, paddingVertical: 14, borderRadius: 13, alignItems: 'center' },
  addBtnText: { color: '#000', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
});

// Rest timer styles
const rt = StyleSheet.create({
  wrap: { borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 12 },
  bar: { height: 4, backgroundColor: '#1A1A1C', borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  track: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#1A1A1C' },
  fill: { height: '100%', borderRadius: 2 },
  info: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: C.textSec, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  time: { color: C.green, fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#1A1A1C', borderRadius: 10, borderWidth: 1, borderColor: C.border },
  btnSkip: { borderColor: C.orange + '44', backgroundColor: C.orange + '10' },
  btnText: { color: C.textSec, fontSize: 12, fontWeight: '700' },
});

// Set row styles
const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12, borderTopWidth: 1, borderTopColor: '#1A1A1C' },
  rowDone: { opacity: 0.7 },
  numBox: { width: 26, height: 26, borderRadius: 7, backgroundColor: '#1A1A1C', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  numBoxActive: { backgroundColor: C.orange + '20' },
  numBoxDone: { backgroundColor: '#1A2A1A' },
  num: { color: C.textSec, fontSize: 11, fontWeight: '800' },
  pending: { color: '#333', fontSize: 13, flex: 1 },
  doneWeight: { flex: 1, color: '#aaa', fontSize: 13, fontWeight: '600' },
  doneReps: { flex: 1, color: '#aaa', fontSize: 13 },
  prBadge: { backgroundColor: C.orange + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  prText: { color: C.orange, fontSize: 10, fontWeight: '800' },
  activeWrap: { marginTop: 10, borderRadius: 12, backgroundColor: C.orange + '08', borderWidth: 1, borderColor: C.orange + '35', padding: 12 },
  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  activeLabel: { color: C.orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  inputGroup: { gap: 10 },
  inputLabel: { color: C.textSec, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  weightRow: { flexDirection: 'row', gap: 10 },
  weightInput: { flex: 1, backgroundColor: '#1A1A1C', color: C.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 22, fontWeight: '800', borderWidth: 1, borderColor: C.border, textAlign: 'center' },
  calcBtn: { backgroundColor: '#1A1A1C', borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, gap: 2 },
  calcBtnText: { color: C.orange, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  nextBtn: { backgroundColor: C.orange + '20', borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: C.orange + '40' },
  nextBtnText: { color: C.orange, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  repsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  repChip: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#1A1A1C', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  repChipActive: { backgroundColor: C.orange + '20', borderColor: C.orange },
  repChipText: { color: '#555', fontSize: 15, fontWeight: '700' },
  repChipTextActive: { color: C.orange },
  repsInput: { backgroundColor: '#1A1A1C', color: C.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: C.border, textAlign: 'center' },
  logBtn: { backgroundColor: C.green, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  logBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  backWeightBtn: { alignItems: 'center', paddingVertical: 6 },
  backWeightText: { color: C.textSec, fontSize: 11 },
  restConfirmedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.orange + '12', borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.orange + '30' },
  restConfirmedText: { flex: 1, color: C.orange, fontSize: 12, fontWeight: '600' },
  restConfirmedEdit: { color: C.textSec, fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },
  // Timer-specific
  timerStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.blue, borderRadius: 13, paddingVertical: 15 },
  timerStartBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  timerFaceWrap: { alignItems: 'center', gap: 6, marginBottom: 4 },
  timerTrack: { height: 6, borderRadius: 3, backgroundColor: '#1A1A1C', overflow: 'hidden', width: '100%' },
  timerFill: { height: '100%', borderRadius: 3 },
  timerCountdown: { color: C.blue, fontSize: 48, fontWeight: '900', letterSpacing: -2, lineHeight: 56 },
  timerElapsedLabel: { color: C.textSec, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  timerDoneBar: { height: 3, backgroundColor: C.green + '60', borderRadius: 2 },
});

// Exercise card styles
const ec = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  cardActive: { borderColor: C.orange + '90', backgroundColor: '#130F00', borderWidth: 1.5 },
  cardDone: { opacity: 0.5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1A1C', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name: { color: '#888', fontSize: 14, fontWeight: '700' },
  nameActive: { color: C.white, fontSize: 14, fontWeight: '800' },
  sub: { color: C.textSec, fontSize: 11, marginTop: 2 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressText: { color: C.textSec, fontSize: 13, fontWeight: '700' },
  sets: { marginTop: 12 },
  addedBadge: { backgroundColor: C.purple + '22', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  addedBadgeText: { color: C.purple, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  activePill: { backgroundColor: C.orange + '22', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: C.orange + '50' },
  activePillText: { color: C.orange, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
});

// Setup view styles
const sv = StyleSheet.create({
  wrap: { gap: 24 },
  title: { color: C.white, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  sub: { color: C.textSec, fontSize: 13, marginTop: -16 },
  section: { gap: 10 },
  label: { color: C.textSec, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  toggle: { flexDirection: 'row', backgroundColor: '#1A1A1C', borderRadius: 12, padding: 4, gap: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: C.orange },
  toggleText: { color: '#555', fontSize: 14, fontWeight: '800' },
  toggleTextActive: { color: '#000' },
  barRow: { flexDirection: 'row', gap: 10 },
  barChip: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1A1A1C', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  barChipActive: { borderColor: C.orange, backgroundColor: C.orange + '15' },
  barChipText: { color: '#555', fontSize: 14, fontWeight: '700' },
  barChipTextActive: { color: C.orange },
  modeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 14, backgroundColor: '#1A1A1C', borderRadius: 14, borderWidth: 1.5, borderColor: C.border },
  modeCardActive: { borderColor: C.orange, backgroundColor: C.orange + '08' },
  modeRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#444', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  modeRadioActive: { borderColor: C.orange },
  modeRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.orange },
  modeTitle: { color: '#888', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  modeDesc: { color: C.textSec, fontSize: 12, lineHeight: 17 },
  startBtn: { backgroundColor: C.orange, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  startBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
});

// Summary styles
const sum = StyleSheet.create({
  wrap: { padding: 24, alignItems: 'center', gap: 20, paddingBottom: 50 },
  emoji: { fontSize: 48, marginTop: 20 },
  title: { color: C.white, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  stats: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 16, padding: 20, width: '100%', borderWidth: 1, borderColor: C.border },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { color: C.white, fontSize: 22, fontWeight: '900' },
  statLabel: { color: C.textSec, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  statDiv: { width: 1, backgroundColor: C.border },
  prSection: { width: '100%', backgroundColor: C.orange + '10', borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: C.orange + '30' },
  prTitle: { color: C.orange, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  prRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prText: { color: '#ccc', fontSize: 13 },
  exCard: { width: '100%', backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  exName: { color: C.white, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  exSet: { color: C.textSec, fontSize: 12, paddingVertical: 3 },
  doneBtn: { backgroundColor: C.orange, borderRadius: 16, paddingVertical: 17, paddingHorizontal: 60, alignItems: 'center', marginTop: 10 },
  doneBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});
