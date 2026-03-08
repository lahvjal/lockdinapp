import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import WelcomeStep from './steps/WelcomeStep';
import ExperienceStep from './steps/ExperienceStep';
import AvailableDaysStep from './steps/AvailableDaysStep';
import EquipmentStep from './steps/EquipmentStep';
import DietStep from './steps/DietStep';
import PlanSetupStep from './steps/PlanSetupStep';
import ReviewStep from './steps/ReviewStep';
import { OnboardingData } from '../../utils/onboardingConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setOnboarded } from '../../store/slices/authSlice';
import { setActivePlans } from '../../store/slices/planSlice';
import { setStreaks } from '../../store/slices/streakSlice';
import { supabase } from '../../services/supabase';
import { RootState } from '../../store/store';
import { Plan, Streak } from '../../types';

export default function OnboardingScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  const totalSteps = 7;

  const handleNext = (data: Partial<OnboardingData>) => {
    setOnboardingData({ ...onboardingData, ...data });
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    // Load freshly created plans into Redux before navigating to home
    if (user) {
      const { data: plans } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (plans) {
        const activePlans: { workout?: Plan; meal?: Plan; water?: Plan; sleep?: Plan } = {};
        plans.forEach((plan: Plan) => {
          if (plan.type === 'workout') activePlans.workout = plan;
          else if (plan.type === 'meal') activePlans.meal = plan;
          else if (plan.type === 'water') activePlans.water = plan;
          else if (plan.type === 'sleep') activePlans.sleep = plan;
        });
        dispatch(setActivePlans(activePlans));
      }

      const { data: streakRows } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id);

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
      }
    }

    dispatch(setOnboarded(true));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return <ExperienceStep onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <AvailableDaysStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <EquipmentStep onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <DietStep onNext={handleNext} onBack={handleBack} />;
      case 5:
        return (
          <PlanSetupStep
            onNext={handleNext}
            onBack={handleBack}
            currentData={onboardingData}
          />
        );
      case 6:
        return (
          <ReviewStep
            onComplete={handleComplete}
            onBack={handleBack}
            data={onboardingData}
          />
        );
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar
        progress={(currentStep + 1) / totalSteps}
        style={styles.progress}
      />
      {renderStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progress: {
    height: 4,
  },
});
