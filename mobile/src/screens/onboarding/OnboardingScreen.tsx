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
import { useDispatch } from 'react-redux';
import { setOnboarded } from '../../store/slices/authSlice';

export default function OnboardingScreen() {
  const dispatch = useDispatch();
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

  const handleComplete = () => {
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
