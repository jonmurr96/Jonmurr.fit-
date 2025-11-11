import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFormData, OnboardingStep } from '../../types/onboarding';
import { calculateOnboardingResults, calculateAge } from '../../utils/onboardingCalculations';
import { saveOnboardingData } from '../../services/onboardingService';
import { useAuth } from '../../contexts/AuthContext';
import ProgressIndicator from '../../components/onboarding/ProgressIndicator';
import StepNavigation from '../../components/onboarding/StepNavigation';
import PersonalInfoStep from './PersonalInfoStep';
import FitnessGoalsStep from './FitnessGoalsStep';
import BodyTypeStep from './BodyTypeStep';
import WorkoutPreferencesStep from './WorkoutPreferencesStep';
import DietLifestyleStep from './DietLifestyleStep';
import SmartSummaryStep from './SmartSummaryStep';

const INITIAL_FORM_DATA: Partial<OnboardingFormData> = {
  focusAreas: [],
  medicalConditions: [],
  dietaryRestrictions: [],
  hasInjuries: false,
  timelineMonths: 6,
  dietQuality: 3,
  averageSleepHours: 7.5,
};

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal_info');
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>(INITIAL_FORM_DATA);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: keyof OnboardingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validatePersonalInfo = (): boolean => {
    return !!(
      formData.dateOfBirth &&
      formData.gender &&
      formData.heightFt &&
      formData.heightFt >= 3 &&
      formData.heightIn !== undefined &&
      formData.heightIn >= 0 &&
      formData.weightLbs &&
      formData.weightLbs > 0
    );
  };

  const validateFitnessGoals = (): boolean => {
    return !!(
      formData.mainGoal &&
      formData.activeDaysPerWeek &&
      formData.activeDaysPerWeek >= 1 &&
      formData.activeDaysPerWeek <= 7
    );
  };

  const validateWorkoutPreferences = (): boolean => {
    return !!(
      formData.equipmentAccess &&
      formData.workoutDuration
    );
  };

  const isStepValid = (step: OnboardingStep): boolean => {
    switch (step) {
      case 'personal_info':
        return validatePersonalInfo();
      case 'fitness_goals':
        return validateFitnessGoals();
      case 'body_type':
        return true; // Optional step
      case 'workout_preferences':
        return validateWorkoutPreferences();
      case 'diet_lifestyle':
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid(currentStep)) {
      return;
    }

    const stepOrder: OnboardingStep[] = [
      'personal_info',
      'fitness_goals',
      'body_type',
      'workout_preferences',
      'diet_lifestyle',
      'summary',
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      
      // If moving to summary, calculate results
      if (nextStep === 'summary') {
        calculateResults();
      }
      
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    const stepOrder: OnboardingStep[] = [
      'personal_info',
      'fitness_goals',
      'body_type',
      'workout_preferences',
      'diet_lifestyle',
      'summary',
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const calculateResults = () => {
    if (!formData.dateOfBirth || !formData.gender || !formData.heightFt || 
        formData.heightIn === undefined || !formData.weightLbs || !formData.mainGoal || 
        !formData.activeDaysPerWeek) {
      return;
    }

    const age = calculateAge(new Date(formData.dateOfBirth));
    
    const results = calculateOnboardingResults(
      {
        age,
        gender: formData.gender,
        heightFt: formData.heightFt,
        heightIn: formData.heightIn,
        weightLbs: formData.weightLbs,
      },
      {
        mainGoal: formData.mainGoal,
        activeDaysPerWeek: formData.activeDaysPerWeek,
      }
    );

    setFormData(prev => ({ ...prev, ...results }));
  };

  const handleConfirmOnboarding = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      // Save onboarding data to Supabase
      const response = await saveOnboardingData(user.id, formData as OnboardingFormData);
      
      if (!response.success) {
        console.error('Failed to save onboarding data:', response.error);
        alert('Failed to save your data. Please try again.');
        return;
      }

      // TODO: Generate AI workout plan here
      // const workoutPlan = await generateWorkoutPlan(formData);
      
      // Navigate to home screen
      navigate('/');
    } catch (error) {
      console.error('Error during onboarding confirmation:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'personal_info':
        return <PersonalInfoStep formData={formData as OnboardingFormData} onChange={handleChange} />;
      case 'fitness_goals':
        return <FitnessGoalsStep formData={formData as OnboardingFormData} onChange={handleChange} />;
      case 'body_type':
        return <BodyTypeStep formData={formData as OnboardingFormData} onChange={handleChange} />;
      case 'workout_preferences':
        return <WorkoutPreferencesStep formData={formData as OnboardingFormData} onChange={handleChange} />;
      case 'diet_lifestyle':
        return <DietLifestyleStep formData={formData as OnboardingFormData} onChange={handleChange} />;
      case 'summary':
        return (
          <SmartSummaryStep 
            formData={formData as OnboardingFormData} 
            onConfirm={handleConfirmOnboarding}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Jonmurr.fit</h1>
          <p className="text-gray-400">Let's personalize your fitness journey</p>
        </div>

        {/* Progress Indicator */}
        {currentStep !== 'summary' && (
          <ProgressIndicator currentStep={currentStep} />
        )}

        {/* Step Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        {currentStep !== 'summary' && (
          <StepNavigation
            onBack={currentStep !== 'personal_info' ? handleBack : undefined}
            onNext={handleNext}
            nextLabel={currentStep === 'diet_lifestyle' ? 'See My Results' : 'Next'}
            isNextDisabled={!isStepValid(currentStep)}
            showBack={currentStep !== 'personal_info'}
          />
        )}
      </div>
    </div>
  );
}
