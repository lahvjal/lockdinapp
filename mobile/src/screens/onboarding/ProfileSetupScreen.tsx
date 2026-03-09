import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../../services/supabase';
import { setOnboarded } from '../../store/slices/authSlice';
import { RootState } from '../../store/store';

const C = {
  bg: '#0D0D0D',
  card: '#161616',
  border: '#222222',
  orange: '#F5A023',
  white: '#F5F5F5',
  textSec: '#777',
  textDim: '#444',
};

const TOTAL_STEPS = 5;

type Gender = 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say';
type HeightUnit = 'cm' | 'ft';
type WeightUnit = 'kg' | 'lb';

interface ProfileData {
  name: string;
  age: string;
  gender: Gender | null;
  heightCm: string;
  heightFt: string;
  heightIn: string;
  heightUnit: HeightUnit;
  weightValue: string;
  weightUnit: WeightUnit;
}

// ─── Step: Name ───────────────────────────────────────────────────────────────

function NameStep({ value, onChange, onNext }: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.stepContainer} keyboardShouldPersistTaps="handled">
        <Text style={s.stepEmoji}>👋</Text>
        <Text style={s.stepTitle}>What's your name?</Text>
        <Text style={s.stepSub}>We'll use this to personalise your experience.</Text>
        <TextInput
          style={s.textInput}
          value={value}
          onChangeText={onChange}
          placeholder="Your first name"
          placeholderTextColor={C.textDim}
          autoFocus
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => value.trim() && onNext()}
        />
        <TouchableOpacity
          style={[s.nextBtn, !value.trim() && s.nextBtnDisabled]}
          onPress={onNext}
          disabled={!value.trim()}
          activeOpacity={0.85}
        >
          <Text style={s.nextBtnText}>CONTINUE</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#000" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step: Age ────────────────────────────────────────────────────────────────

function AgeStep({ value, onChange, onNext, onBack }: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const age = parseInt(value, 10);
  const valid = !isNaN(age) && age >= 13 && age <= 100;

  const adjust = (delta: number) => {
    const curr = parseInt(value, 10) || 25;
    const next = Math.min(100, Math.max(13, curr + delta));
    onChange(String(next));
  };

  return (
    <ScrollView contentContainerStyle={s.stepContainer}>
      <Text style={s.stepEmoji}>🎂</Text>
      <Text style={s.stepTitle}>How old are you?</Text>
      <Text style={s.stepSub}>Helps us tailor intensity and recovery.</Text>

      <View style={s.ageRow}>
        <TouchableOpacity style={s.ageBtn} onPress={() => adjust(-1)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="minus" size={22} color={C.orange} />
        </TouchableOpacity>
        <TextInput
          style={s.ageInput}
          value={value}
          onChangeText={v => onChange(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={3}
          textAlign="center"
          placeholderTextColor={C.textDim}
          placeholder="25"
        />
        <TouchableOpacity style={s.ageBtn} onPress={() => adjust(1)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="plus" size={22} color={C.orange} />
        </TouchableOpacity>
      </View>

      <View style={s.btnRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={C.textSec} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.nextBtn, s.nextBtnFlex, !valid && s.nextBtnDisabled]}
          onPress={onNext}
          disabled={!valid}
          activeOpacity={0.85}
        >
          <Text style={s.nextBtnText}>CONTINUE</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Step: Gender ─────────────────────────────────────────────────────────────

const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: 'male',              label: 'Male',              icon: 'gender-male' },
  { value: 'female',            label: 'Female',            icon: 'gender-female' },
  { value: 'nonbinary',         label: 'Non-binary',        icon: 'gender-non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: 'eye-off-outline' },
];

function GenderStep({ value, onChange, onNext, onBack }: {
  value: Gender | null;
  onChange: (v: Gender) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={s.stepContainer}>
      <Text style={s.stepEmoji}>🧬</Text>
      <Text style={s.stepTitle}>What's your gender?</Text>
      <Text style={s.stepSub}>Used for accurate fitness metrics.</Text>

      <View style={s.optionsGrid}>
        {GENDER_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.optionCard, value === opt.value && s.optionCardSelected]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={opt.icon as any}
              size={26}
              color={value === opt.value ? C.orange : C.textSec}
            />
            <Text style={[s.optionLabel, value === opt.value && s.optionLabelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.btnRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={C.textSec} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.nextBtn, s.nextBtnFlex, !value && s.nextBtnDisabled]}
          onPress={onNext}
          disabled={!value}
          activeOpacity={0.85}
        >
          <Text style={s.nextBtnText}>CONTINUE</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Step: Height ─────────────────────────────────────────────────────────────

function HeightStep({ data, onChange, onNext, onBack }: {
  data: Pick<ProfileData, 'heightCm' | 'heightFt' | 'heightIn' | 'heightUnit'>;
  onChange: (patch: Partial<ProfileData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { heightUnit, heightCm, heightFt, heightIn } = data;
  const isMetric = heightUnit === 'cm';

  const valid = isMetric
    ? (parseFloat(heightCm) >= 100 && parseFloat(heightCm) <= 250)
    : (parseInt(heightFt, 10) >= 3 && parseInt(heightFt, 10) <= 8);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.stepContainer} keyboardShouldPersistTaps="handled">
        <Text style={s.stepEmoji}>📏</Text>
        <Text style={s.stepTitle}>What's your height?</Text>
        <Text style={s.stepSub}>Used to calculate fitness metrics.</Text>

        <View style={s.unitToggle}>
          {(['cm', 'ft'] as HeightUnit[]).map(u => (
            <TouchableOpacity
              key={u}
              style={[s.unitBtn, heightUnit === u && s.unitBtnActive]}
              onPress={() => onChange({ heightUnit: u })}
            >
              <Text style={[s.unitBtnText, heightUnit === u && s.unitBtnTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isMetric ? (
          <View style={s.inputRow}>
            <TextInput
              style={[s.textInput, s.inputFlex]}
              value={heightCm}
              onChangeText={v => onChange({ heightCm: v.replace(/[^0-9.]/g, '') })}
              keyboardType="decimal-pad"
              placeholder="175"
              placeholderTextColor={C.textDim}
              autoFocus
            />
            <Text style={s.unitLabel}>cm</Text>
          </View>
        ) : (
          <View style={s.inputRow}>
            <TextInput
              style={[s.textInput, { width: 80 }]}
              value={heightFt}
              onChangeText={v => onChange({ heightFt: v.replace(/[^0-9]/g, '') })}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={C.textDim}
              maxLength={1}
              autoFocus
            />
            <Text style={s.unitLabel}>ft</Text>
            <TextInput
              style={[s.textInput, { width: 80, marginLeft: 12 }]}
              value={heightIn}
              onChangeText={v => onChange({ heightIn: v.replace(/[^0-9]/g, '') })}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={C.textDim}
              maxLength={2}
            />
            <Text style={s.unitLabel}>in</Text>
          </View>
        )}

        <View style={s.btnRow}>
          <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={C.textSec} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.nextBtn, s.nextBtnFlex, !valid && s.nextBtnDisabled]}
            onPress={onNext}
            disabled={!valid}
            activeOpacity={0.85}
          >
            <Text style={s.nextBtnText}>CONTINUE</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step: Weight ─────────────────────────────────────────────────────────────

function WeightStep({ data, onChange, onNext, onBack, saving }: {
  data: Pick<ProfileData, 'weightValue' | 'weightUnit'>;
  onChange: (patch: Partial<ProfileData>) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  const { weightUnit, weightValue } = data;
  const weight = parseFloat(weightValue);
  const valid = !isNaN(weight) && weight > 20 && weight < 500;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.stepContainer} keyboardShouldPersistTaps="handled">
        <Text style={s.stepEmoji}>⚖️</Text>
        <Text style={s.stepTitle}>What's your weight?</Text>
        <Text style={s.stepSub}>Helps personalise your workout targets.</Text>

        <View style={s.unitToggle}>
          {(['kg', 'lb'] as WeightUnit[]).map(u => (
            <TouchableOpacity
              key={u}
              style={[s.unitBtn, weightUnit === u && s.unitBtnActive]}
              onPress={() => onChange({ weightUnit: u })}
            >
              <Text style={[s.unitBtnText, weightUnit === u && s.unitBtnTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.inputRow}>
          <TextInput
            style={[s.textInput, s.inputFlex]}
            value={weightValue}
            onChangeText={v => onChange({ weightValue: v.replace(/[^0-9.]/g, '') })}
            keyboardType="decimal-pad"
            placeholder={weightUnit === 'kg' ? '75' : '165'}
            placeholderTextColor={C.textDim}
            autoFocus
          />
          <Text style={s.unitLabel}>{weightUnit}</Text>
        </View>

        <View style={s.btnRow}>
          <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={C.textSec} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.nextBtn, s.nextBtnFlex, (!valid || saving) && s.nextBtnDisabled]}
            onPress={onNext}
            disabled={!valid || saving}
            activeOpacity={0.85}
          >
            <Text style={s.nextBtnText}>{saving ? 'SAVING…' : "LET'S GO"}</Text>
            <MaterialCommunityIcons name="check" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    age: '',
    gender: null,
    heightCm: '',
    heightFt: '',
    heightIn: '',
    heightUnit: 'cm',
    weightValue: '',
    weightUnit: 'lb',
  });

  const patch = (data: Partial<ProfileData>) => setProfile(p => ({ ...p, ...data }));

  const toHeightCm = (): number => {
    if (profile.heightUnit === 'cm') return parseFloat(profile.heightCm);
    const ft = parseInt(profile.heightFt, 10) || 0;
    const inch = parseInt(profile.heightIn, 10) || 0;
    return Math.round((ft * 30.48) + (inch * 2.54));
  };

  const toWeightKg = (): number => {
    const w = parseFloat(profile.weightValue);
    return profile.weightUnit === 'kg' ? w : Math.round(w * 0.453592 * 10) / 10;
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        id: user.id,
        full_name: profile.name.trim(),
        age: parseInt(profile.age, 10),
        gender: profile.gender,
        height_cm: toHeightCm(),
        weight_kg: toWeightKg(),
        weight_unit: profile.weightUnit === 'lb' ? 'lb' : 'kg',
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      dispatch(setOnboarded(true));
    } catch (err: any) {
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = (step + 1) / TOTAL_STEPS;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Step counter */}
      <View style={s.stepCounter}>
        <Text style={s.stepCounterText}>{step + 1} / {TOTAL_STEPS}</Text>
      </View>

      {step === 0 && (
        <NameStep
          value={profile.name}
          onChange={v => patch({ name: v })}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <AgeStep
          value={profile.age}
          onChange={v => patch({ age: v })}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <GenderStep
          value={profile.gender}
          onChange={v => patch({ gender: v })}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <HeightStep
          data={profile}
          onChange={patch}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <WeightStep
          data={profile}
          onChange={patch}
          onNext={handleComplete}
          onBack={() => setStep(3)}
          saving={saving}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  progressTrack: { height: 3, backgroundColor: '#1A1A1A' },
  progressFill: { height: 3, backgroundColor: C.orange, borderRadius: 2 },

  stepCounter: { alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 12 },
  stepCounterText: { color: C.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  stepContainer: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },

  stepEmoji: { fontSize: 44, marginBottom: 20 },
  stepTitle: { color: C.white, fontSize: 28, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  stepSub: { color: C.textSec, fontSize: 14, marginBottom: 36, lineHeight: 20 },

  textInput: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    color: C.white,
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 28,
  },

  // Age stepper
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  ageBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  ageInput: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    color: C.white,
    fontSize: 32,
    fontWeight: '700',
    paddingVertical: 14,
    textAlign: 'center',
  },

  // Gender options
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  optionCard: {
    width: '47%',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  optionCardSelected: {
    borderColor: C.orange,
    backgroundColor: C.orange + '12',
  },
  optionLabel: { color: C.textSec, fontSize: 13, fontWeight: '600' },
  optionLabelSelected: { color: C.orange },

  // Unit toggle
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 4,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  unitBtn: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 9,
  },
  unitBtnActive: { backgroundColor: C.orange },
  unitBtnText: { color: C.textSec, fontSize: 13, fontWeight: '700' },
  unitBtnTextActive: { color: '#000' },

  // Height/weight inputs
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  inputFlex: { flex: 1, marginBottom: 0 },
  unitLabel: { color: C.textSec, fontSize: 16, fontWeight: '600', minWidth: 28 },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 'auto' as any },
  backBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.orange,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 'auto' as any,
  },
  nextBtnFlex: { flex: 1 },
  nextBtnDisabled: { backgroundColor: '#2A1A00', opacity: 0.5 },
  nextBtnText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});
