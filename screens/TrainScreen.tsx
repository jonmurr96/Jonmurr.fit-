import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TrainingProgram, Workout, Exercise, WorkoutSet, WorkoutPlanPreferences, FitnessGoal, Equipment, SavedWorkout, ProgressionPreference, ProgressionSuggestion, WorkoutHistory, WorkoutDraft, Gender, SessionDuration, FocusArea, TrainingStyle, WeightBehavior, MedicalCondition, ExperienceLevel, OptionalBlock } from '../types';
import { searchExercises, processWorkoutCommand, getProgressionSuggestions, getPostWorkoutRecap } from '../services/geminiService';
import { TrashIcon, ArrowsRightLeftIcon, PlusIcon, InformationCircleIcon, ArrowLeftIcon, GripVerticalIcon, ClipboardListIcon, BookmarkIcon, MicrophoneIcon, PinIcon, ChevronRightIcon, SettingsIcon, SparklesIcon, PencilIcon, HeartIcon, DocumentIcon } from '../components/Icons';
import { getExerciseHistory, formatHistoryForPrompt } from '../utils/progressionEngine';
import { HeroSection } from '../components/train/HeroSection';
import { ActionCard } from '../components/train/ActionCard';
import { SuggestionsStrip } from '../components/train/SuggestionsStrip';
import { ImportWorkoutModal } from '../components/import/ImportWorkoutModal';


declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// --- WORKOUT TEMPLATES ---
const createSets = (count: number, reps: string, rest: number): WorkoutSet[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1, targetReps: reps, completed: false, restMinutes: rest,
    }));
};
const createExercise = (id: string, name: string, setCount: number, reps: string, rest: number): Exercise => ({
    id, name, sets: createSets(setCount, reps, rest)
});

const workoutTemplates: TrainingProgram[] = [
    {
        programName: 'Full-Body Split',
        description: '2–4 days/week. Hits every muscle group in each session.',
        durationWeeks: 4,
        workouts: [
            { id: 't1-w1', day: 1, focus: 'Full Body A', completed: false, exercises: [
                createExercise('t1-e1', 'Barbell Squat', 3, '5-8 reps', 2.5),
                createExercise('t1-e2', 'Barbell Bench Press', 3, '5-8 reps', 2),
                createExercise('t1-e3', 'Bent Over Row', 3, '8-12 reps', 2),
                createExercise('t1-e5', 'Plank', 3, '30-60 sec', 1),
            ]},
            { id: 't1-w2', day: 3, focus: 'Full Body B', completed: false, exercises: [
                createExercise('t1-e6', 'Deadlift', 3, '4-6 reps', 3),
                createExercise('t1-e7', 'Overhead Press', 3, '5-8 reps', 2),
                createExercise('t1-e8', 'Pull-Up', 3, 'AMRAP', 2),
                createExercise('t1-e10', 'Calf Raise', 3, '15-20 reps', 1),
            ]},
        ]
    },
    {
        programName: 'Upper/Lower Split',
        description: '4 days/week. Splits training between upper and lower body.',
        durationWeeks: 4,
        workouts: [
             { id: 't2-w1', day: 1, focus: 'Upper Body A', completed: false, exercises: [
                createExercise('t2-e1', 'Barbell Bench Press', 3, '5-8 reps', 2),
                createExercise('t2-e2', 'Bent Over Row', 3, '8-12 reps', 2),
                createExercise('t2-e3', 'Overhead Press', 3, '6-10 reps', 2),
                createExercise('t2-e4', 'Lat Pulldown', 3, '8-12 reps', 1.5),
             ]},
             { id: 't2-w2', day: 2, focus: 'Lower Body A', completed: false, exercises: [
                createExercise('t2-e5', 'Barbell Squat', 3, '5-8 reps', 2.5),
                createExercise('t2-e6', 'Romanian Deadlift', 3, '8-12 reps', 2),
                createExercise('t2-e7', 'Leg Press', 3, '10-15 reps', 1.5),
             ]},
             { id: 't2-w3', day: 4, focus: 'Upper Body B', completed: false, exercises: [
                createExercise('t2-e9', 'Incline Dumbbell Press', 3, '8-12 reps', 2),
                createExercise('t2-e10', 'Pull-Up', 3, 'AMRAP', 2),
                createExercise('t2-e11', 'Dumbbell Lateral Raise', 3, '12-15 reps', 1.5),
             ]},
             { id: 't2-w4', day: 5, focus: 'Lower Body B', completed: false, exercises: [
                createExercise('t2-e14', 'Front Squat', 3, '6-10 reps', 2.5),
                createExercise('t2-e15', 'Lying Leg Curl', 3, '10-15 reps', 1.5),
                createExercise('t2-e17', 'Hanging Leg Raise', 3, '10-15 reps', 1),
             ]},
        ]
    },
];

interface TrainScreenProps {
  program: TrainingProgram | null;
  setProgram: React.Dispatch<React.SetStateAction<TrainingProgram | null>>;
  generatePlan: (preferences: WorkoutPlanPreferences) => Promise<void>;
  activateGeneratedProgram: (program: TrainingProgram) => void;
  isLoading: boolean;
  weightUnit: 'kg' | 'lbs';
  savedWorkouts: SavedWorkout[];
  addSavedWorkout: (program: TrainingProgram, name: string, tags: string[], showAlert?: boolean) => void;
  updateSavedWorkout: (workout: SavedWorkout) => void;
  deleteSavedWorkout: (workoutId: string) => void;
  startSavedWorkout: (workout: SavedWorkout) => void;
  workoutHistory: WorkoutHistory;
  completeWorkout: (workout: Workout) => void;
  progressionPreference: ProgressionPreference;
  setProgressionPreference: (preference: ProgressionPreference) => void;
  favoriteExercises: Exercise[];
  toggleFavoriteExercise: (exercise: Exercise) => void;
  drafts: WorkoutDraft[];
  saveDraft: (program: TrainingProgram, draftId?: string) => void;
  deleteDraft: (draftId: string) => void;
}

// --- AI PLAN GENERATION WIZARD ---
const StepOptionButton: React.FC<{
    label: string;
    isSelected: boolean;
    onClick: () => void;
    icon?: string;
    className?: string;
}> = ({ label, isSelected, onClick, icon, className }) => (
    <button
        onClick={onClick}
        className={`p-4 rounded-lg border-2 text-left transition-colors w-full flex items-center gap-4 ${className} ${isSelected ? 'bg-green-500/10 border-green-500' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'}`}
    >
        {icon && <span className="text-3xl">{icon}</span>}
        <p className={`font-semibold ${isSelected ? 'text-green-400' : 'text-zinc-300'}`}>{label}</p>
    </button>
);

const CheckboxOption: React.FC<{ label: string; isSelected: boolean; onClick: () => void; }> = ({ label, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className="p-4 rounded-lg bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-600 flex items-center gap-3 w-full"
    >
        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-green-500 border-green-500' : 'border-zinc-500'}`}>
            {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
        </div>
        <span className={`font-semibold ${isSelected ? 'text-green-400' : 'text-zinc-300'}`}>{label}</span>
    </button>
);


const defaultPlanPreferences: WorkoutPlanPreferences = {
    goal: 'Muscle Gain',
    experienceLevel: 'Intermediate',
    daysPerWeek: 4,
    trainingDays: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
    timePerWorkout: '45-60 min',
    equipment: ['Full Gym'],
    focusAreas: [],
    trainingStyle: 'Progress Overload',
    injuriesText: '',
    medicalConditions: ['None'],
    currentWeightUnit: 'lbs'
};

const GenerationLoadingModal: React.FC = () => {
    const messages = [
        "Analyzing your fitness goals...",
        "Selecting the best exercises for you...",
        "Structuring your weekly schedule...",
        "Building your personalized plan...",
        "Finalizing the details..."
    ];
    const [currentMessage, setCurrentMessage] = useState(messages[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessage(prev => {
                const currentIndex = messages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % messages.length;
                return messages[nextIndex];
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-[60] animate-fade-in">
            <div className="w-16 h-16 border-4 border-zinc-700 border-t-green-500 rounded-full animate-spin"></div>
            <p className="text-white text-lg font-semibold mt-6 text-center transition-opacity duration-500">{currentMessage}</p>
        </div>
    );
};

const GeneratePlanWizard: React.FC<{
    initialPreferences: WorkoutPlanPreferences | null;
    onClose: (prefs: WorkoutPlanPreferences) => void;
    onGenerate: (preferences: WorkoutPlanPreferences) => void;
    isLoading: boolean;
}> = ({ initialPreferences, onClose, onGenerate, isLoading }) => {
    const [step, setStep] = useState(1);
    const [preferences, setPreferences] = useState<WorkoutPlanPreferences>(initialPreferences || defaultPlanPreferences);
    const totalSteps = 12;

    const updatePref = <K extends keyof WorkoutPlanPreferences>(key: K, value: WorkoutPlanPreferences[K]) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const handleMultiSelect = <T,>(key: keyof WorkoutPlanPreferences, value: T, currentValues: T[], limit?: number) => {
        let newValues: T[];
        if (currentValues.includes(value)) {
            newValues = currentValues.filter(item => item !== value);
        } else {
            newValues = [...currentValues, value];
        }
        if (limit && newValues.length > limit) {
            newValues.shift(); // Remove the oldest item if limit is exceeded
        }
        updatePref(key as any, newValues);
    };

    const renderStep = () => {
        const props = { preferences, updatePref, handleMultiSelect, setPreferences };
        switch (step) {
            case 1: return <div className="text-center p-4">
                <h3 className="text-2xl font-bold text-white mb-2">Personalized Training Plan</h3>
                <p className="text-zinc-400 mb-6">This will take less than 2 minutes. We'll ask a few quick questions to fit your exact goals, schedule, and training style.</p>
            </div>;
            case 2: return <PersonalInfoStep {...props} />;
            case 3: return <GoalStep {...props} />;
            case 4: return <ExperienceLevelStep {...props} />;
            case 5: return <CommitmentStep {...props} />;
            case 6: return <DaySelectionStep {...props} />;
            case 7: return <EquipmentStep {...props} />;
            case 8: return <FocusAreaStep {...props} />;
            case 9: return <TrainingStyleStep {...props} />;
            case 10: return <WeightBehaviorStep {...props} />;
            case 11: return <MedicalStep {...props} />;
            case 12: return <ReviewStep prefs={preferences} />;
            default: return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black flex flex-col p-4 z-50 animate-fade-in">
            {isLoading && <GenerationLoadingModal />}
            <div className="w-full max-w-md mx-auto flex flex-col h-full">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                         <h2 className="text-xl font-bold text-white">Create Your Plan</h2>
                         <button onClick={() => onClose(preferences)} className="text-zinc-400 font-bold text-2xl">&times;</button>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2">{renderStep()}</div>

                <div className="flex justify-between items-center mt-8">
                    <button onClick={() => setStep(s => Math.max(s - 1, 1))} disabled={step === 1 || isLoading} className="px-6 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors disabled:opacity-50">Back</button>
                    {step < totalSteps ? (
                        <button onClick={() => setStep(s => Math.min(s + 1, totalSteps))} disabled={isLoading} className="px-6 py-2 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors disabled:opacity-50">
                            {step === 1 ? "Let's Begin" : "Next"}
                        </button>
                    ) : (
                        <button 
                            onClick={() => onGenerate(preferences)} 
                            disabled={isLoading} 
                            className="w-full ml-4 px-6 py-3 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors flex items-center justify-center h-12 whitespace-nowrap disabled:bg-zinc-600 disabled:cursor-not-allowed"
                        >
                            Generate My Plan
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- WIZARD STEPS ---
const StepTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3 className="text-lg font-semibold text-center text-white mb-6">{children}</h3>;
const PersonalInfoStep: React.FC<{ preferences: WorkoutPlanPreferences, updatePref: Function, setPreferences: Function }> = ({ preferences, updatePref, setPreferences }) => {
    const genders: Gender[] = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];
    return <div className="space-y-6">
        <StepTitle>Let's start with the basics.</StepTitle>
        <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">What's your gender?</label>
            <div className="grid grid-cols-2 gap-2">
                {genders.map(g => <StepOptionButton key={g} label={g} isSelected={preferences.gender === g} onClick={() => updatePref('gender', g)} className="text-sm p-3" />)}
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">How old are you?</label>
            <input type="number" value={preferences.age || ''} onChange={e => updatePref('age', parseInt(e.target.value) || undefined)} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" />
        </div>
        <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">What’s your current weight?</label>
            <div className="flex gap-2">
                <input type="number" value={preferences.currentWeight || ''} onChange={e => updatePref('currentWeight', parseFloat(e.target.value) || undefined)} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" />
                <div className="flex items-center space-x-1 bg-zinc-800 p-1 rounded-md">
                    <button onClick={() => updatePref('currentWeightUnit', 'kg')} className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${preferences.currentWeightUnit === 'kg' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>kg</button>
                    <button onClick={() => updatePref('currentWeightUnit', 'lbs')} className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${preferences.currentWeightUnit === 'lbs' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>lbs</button>
                </div>
            </div>
        </div>
        <div>
            <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-zinc-400">What’s your target weight? (Optional)</label>
                 <button onClick={() => updatePref('targetWeight', undefined)} className="text-xs text-zinc-500 hover:text-white">Skip</button>
            </div>
            <input type="number" value={preferences.targetWeight || ''} onChange={e => updatePref('targetWeight', parseFloat(e.target.value) || undefined)} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" />
        </div>
    </div>
};
const GoalStep: React.FC<{ preferences: WorkoutPlanPreferences, updatePref: Function }> = ({ preferences, updatePref }) => {
    const goals: { name: FitnessGoal; icon: string; }[] = [
        { name: 'Muscle Gain', icon: '💪' }, { name: 'Fat Loss', icon: '🔥' }, { name: 'Build Strength', icon: '🏋️' },
        { name: 'Improve Endurance', icon: '🏃' }, { name: 'Recomposition', icon: '⚡' }, { name: 'General Fitness', icon: '❤️' }
    ];
    return <div>
        <StepTitle>What’s your main fitness goal?</StepTitle>
        <div className="space-y-3">
            {goals.map(goal => <StepOptionButton key={goal.name} label={goal.name} icon={goal.icon} isSelected={preferences.goal === goal.name} onClick={() => updatePref('goal', goal.name)} />)}
        </div>
    </div>
};
const ExperienceLevelStep: React.FC<{ preferences: WorkoutPlanPreferences, updatePref: Function }> = ({ preferences, updatePref }) => {
    const levels: { name: ExperienceLevel; desc: string }[] = [
        { name: 'Beginner', desc: 'Just starting out, or inconsistent' },
        { name: 'Intermediate', desc: 'Consistent for 6+ months' },
        { name: 'Advanced', desc: 'Years of structured training' },
    ];
    return <div>
        <StepTitle>What's your fitness experience level?</StepTitle>
        <div className="space-y-3">
            {levels.map(l => <button key={l.name} onClick={() => updatePref('experienceLevel', l.name)} className={`p-4 rounded-lg border-2 text-left transition-colors w-full ${preferences.experienceLevel === l.name ? 'bg-green-500/10 border-green-500' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'}`}>
                <p className={`font-semibold ${preferences.experienceLevel === l.name ? 'text-green-400' : 'text-zinc-300'}`}>{l.name}</p>
                <p className="text-sm text-zinc-500">{l.desc}</p>
            </button>)}
        </div>
    </div>
};
const CommitmentStep: React.FC<{ preferences: WorkoutPlanPreferences, updatePref: Function }> = ({ preferences, updatePref }) => {
    const durations: SessionDuration[] = ['20-30 min', '30-45 min', '45-60 min', '60-90+ min'];
    return <div className="space-y-8">
        <div>
            <StepTitle>How many days per week can you realistically train?</StepTitle>
            <div className="text-center text-4xl font-bold text-green-400 mb-6">{preferences.daysPerWeek} {preferences.daysPerWeek === 1 ? 'day' : 'days'}</div>
            <input type="range" min="1" max="7" value={preferences.daysPerWeek} onChange={e => updatePref('daysPerWeek', parseInt(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-green-500" />
        </div>
        <div>
            <StepTitle>And how long are your sessions?</StepTitle>
            <div className="grid grid-cols-2 gap-3">
                {durations.map(d => <StepOptionButton key={d} label={d} isSelected={preferences.timePerWorkout === d} onClick={() => updatePref('timePerWorkout', d)} />)}
            </div>
        </div>
    </div>
};
const DaySelectionStep: React.FC<{ preferences: WorkoutPlanPreferences, updatePref: Function }> = ({ preferences, updatePref }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const selectedDays = preferences.trainingDays || [];
    const limit = preferences.daysPerWeek;

    const handleDayClick = (dayIndex: number) => {
        const dayNumber = dayIndex + 1;
        let newSelection = [...selectedDays];
        if (newSelection.includes(dayNumber)) {
            newSelection = newSelection.filter(d => d !== dayNumber);
        } else if (newSelection.length < limit) {
            newSelection.push(dayNumber);
        }
        updatePref('trainingDays', newSelection.sort());
    };
    
    return <div>
        <StepTitle>Which days do you prefer to train?</StepTitle>
        <p className="text-center text-zinc-400 text-sm -mt-4 mb-6">Select {limit} day{limit > 1 ? 's' : ''}.</p>
        <div className="grid grid-cols-4 gap-3">
            {days.map((day, index) => {
                const dayNumber = index + 1;
                const isSelected = selectedDays.includes(dayNumber);
                const isDisabled = !isSelected && selectedDays.length >= limit;
                return (
                    <button 
                        key={day}
                        onClick={() => handleDayClick(index)}
                        disabled={isDisabled}
                        className={`p-4 rounded-lg border-2 text-center transition-colors flex flex-col items-center justify-center
                            ${isSelected ? 'bg-green-500/10 border-green-500' : 'bg-zinc-800 border-zinc-700'}
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-zinc-600'}
                        `}
                    >
                        <span className={`font-bold ${isSelected ? 'text-green-400' : 'text-zinc-300'}`}>{day}</span>
                    </button>
                )
            })}
        </div>
    </div>
};
const EquipmentStep: React.FC<{ preferences: WorkoutPlanPreferences, handleMultiSelect: Function }> = ({ preferences, handleMultiSelect }) => {
    const equipment: Equipment[] = ['Bodyweight', 'Dumbbells', 'Resistance Bands', 'Barbells / Gym Machines', 'Full Gym'];
    return <div>
        <StepTitle>What equipment do you have access to? (Select all that apply)</StepTitle>
        <div className="space-y-3">
            {equipment.map(e => <CheckboxOption key={e} label={e} isSelected={preferences.equipment.includes(e)} onClick={() => handleMultiSelect('equipment', e, preferences.equipment)} />)}
        </div>
    </div>
};
const FocusAreaStep: React.FC<{ preferences: WorkoutPlanPreferences, handleMultiSelect: Function, updatePref: Function }> = ({ preferences, handleMultiSelect, updatePref }) => {
    const areas: FocusArea[] = ['Arms', 'Chest', 'Shoulders', 'Back', 'Core / Abs', 'Glutes', 'Legs', 'Full Body'];
    return <div>
        <StepTitle>What areas would you like to focus on? (Choose up to 3)</StepTitle>
        <div className="grid grid-cols-2 gap-3">
            {areas.map(a => <CheckboxOption key={a} label={a} isSelected={preferences.focusAreas.includes(a)} onClick={() => handleMultiSelect('focusAreas', a, preferences.focusAreas, 3)} />)}
        </div>
        <input type="text" placeholder="Other (optional)" value={preferences.focusAreasOther || ''} onChange={e => updatePref('focusAreasOther', e.target.value)} className="w-full mt-4 bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" />
    </div>
};
const TrainingStyleStep: React.FC<{ preferences: WorkoutPlanPreferences, updatePref: Function }> = ({ preferences, updatePref }) => {
    const styles: { name: TrainingStyle; desc: string }[] = [
        { name: 'Keep it Fun', desc: 'Light & engaging' },
        { name: 'Balanced', desc: 'Mix of fun + structure' },
        { name: 'Progress Overload', desc: 'Recommended for best results' },
    ];
    return <div>
        <StepTitle>How do you want your workouts to feel?</StepTitle>
        <div className="space-y-3">
            {styles.map(s => <button key={s.name} onClick={() => updatePref('trainingStyle', s.name)} className={`p-4 rounded-lg border-2 text-left transition-colors w-full ${preferences.trainingStyle === s.name ? 'bg-green-500/10 border-green-500' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'}`}>
                <p className={`font-semibold ${preferences.trainingStyle === s.name ? 'text-green-400' : 'text-zinc-300'}`}>{s.name}</p>
                <p className="text-sm text-zinc-500">{s.desc}</p>
            </button>)}
        </div>
    </div>
};
const WeightBehaviorStep: React.FC<{ preferences: WorkoutPlanPreferences, updatePref: Function }> = ({ preferences, updatePref }) => {
    const behaviors: WeightBehavior[] = ['I gain weight easily, lose it slowly', 'I lose weight easily, gain it slowly', 'Somewhere in the middle - I want guidance'];
    return <div>
        <StepTitle>How does your body typically respond to weight change?</StepTitle>
        <div className="space-y-3">
            {behaviors.map(b => <StepOptionButton key={b} label={b} isSelected={preferences.weightBehavior === b} onClick={() => updatePref('weightBehavior', b)} />)}
        </div>
    </div>
};
const MedicalStep: React.FC<{ preferences: WorkoutPlanPreferences, updatePref: Function, handleMultiSelect: Function }> = ({ preferences, updatePref, handleMultiSelect }) => {
    const conditions: MedicalCondition[] = ['Asthma', 'High Blood Pressure', 'Diabetes', 'None'];
    return <div className="space-y-6">
        <div>
            <StepTitle>Do you have any injuries or physical limitations?</StepTitle>
            <div className="grid grid-cols-2 gap-3">
                <StepOptionButton label="Yes" isSelected={!!preferences.injuriesText} onClick={() => { if (!preferences.injuriesText) updatePref('injuriesText', ' ') }} />
                <StepOptionButton label="No" isSelected={!preferences.injuriesText} onClick={() => updatePref('injuriesText', '')} />
            </div>
            {!!preferences.injuriesText && <textarea placeholder="e.g., right shoulder pain" value={preferences.injuriesText.trim()} onChange={e => updatePref('injuriesText', e.target.value)} className="w-full mt-4 h-24 bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-green-500" />}
        </div>
        <div>
            <StepTitle>Any medical conditions we should be aware of?</StepTitle>
            <div className="grid grid-cols-2 gap-3">
                {conditions.map(c => <CheckboxOption key={c} label={c} isSelected={preferences.medicalConditions.includes(c)} onClick={() => handleMultiSelect('medicalConditions', c, preferences.medicalConditions)} />)}
            </div>
            <input type="text" placeholder="Other (optional)" value={preferences.medicalConditionsOther || ''} onChange={e => updatePref('medicalConditionsOther', e.target.value)} className="w-full mt-4 bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" />
        </div>
    </div>
};
const ReviewStep: React.FC<{ prefs: WorkoutPlanPreferences }> = ({ prefs }) => (
    <div className="text-center p-4">
        <h3 className="text-2xl font-bold text-white mb-4">All set!</h3>
        <p className="text-zinc-400 mb-6">We’re generating a fully customized workout plan based on your:</p>
        <ul className="text-left space-y-2 text-green-400 w-fit mx-auto">
            <li>✅ Equipment & Schedule</li>
            <li>✅ Experience Level</li>
            <li>✅ Goals + focus areas</li>
            <li>✅ Recovery + medical needs</li>
        </ul>
    </div>
);
// --- END WIZARD STEPS ---

const PlanPreview: React.FC<{
    plan: TrainingProgram;
    onConfirm: (finalPlan: TrainingProgram) => void;
    onEdit: () => void;
}> = ({ plan, onConfirm, onEdit }) => {
    const [finalPlan, setFinalPlan] = useState(plan);

    const toggleAddon = (day: number, blockType: OptionalBlock['type']) => {
        setFinalPlan(prevPlan => {
            const newWorkouts = prevPlan.workouts.map(w => {
                if (w.day === day && w.optionalBlocks) {
                    const blockIndex = w.optionalBlocks.findIndex(b => b.type === blockType);
                    if (blockIndex > -1) {
                        // If block exists, remove it
                        const newBlocks = [...w.optionalBlocks];
                        newBlocks.splice(blockIndex, 1);
                        return { ...w, optionalBlocks: newBlocks };
                    }
                }
                return w;
            });
            // This logic is simplified; a real version might need to re-add it from a source
            // For this UI, we assume toggling OFF is the only action from the preview.
            // A more complex implementation would be needed to toggle ON.
            return { ...prevPlan, workouts: newWorkouts };
        });
    };

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="fixed inset-0 bg-black flex flex-col p-4 z-50 animate-fade-in">
            <div className="w-full max-w-md mx-auto flex flex-col h-full">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-white">Your Plan is Ready!</h2>
                    <p className="text-zinc-400 mt-1">{plan.description}</p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4 mb-6 text-center">
                    <h3 className="font-bold text-lg text-green-400">{plan.programName}</h3>
                    <p className="text-zinc-300 text-sm">{plan.splitType} Split</p>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2">
                    <h3 className="font-bold text-lg text-white">Weekly Schedule</h3>
                    {finalPlan.workouts.sort((a,b) => a.day - b.day).map(w => (
                        <div key={w.id} className="bg-zinc-900 p-3 rounded-lg">
                            <p className="font-bold text-white">{dayNames[w.day % 7]}: <span className="text-zinc-400 font-normal">{w.focus.replace(/Day \d+ - /, '')}</span></p>
                            {w.optionalBlocks && w.optionalBlocks.length > 0 && (
                                <div className="mt-2 pl-4 border-l-2 border-zinc-700">
                                    <p className="text-xs font-bold text-zinc-500 uppercase">Optional Finisher</p>
                                    {w.optionalBlocks.map(block => (
                                        <div key={block.type} className="flex items-center justify-between mt-1">
                                            <p className="text-sm text-sky-400">{block.type} ({block.durationMinutes} min)</p>
                                            {/* Toggle switch for addon - state management needed */}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 space-y-3">
                    <button onClick={() => onConfirm(finalPlan)} className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg transition-colors">Confirm & Start Plan</button>
                    <button onClick={onEdit} className="w-full text-zinc-400 hover:text-white font-semibold py-2 rounded-lg transition-colors">Go Back & Edit</button>
                </div>
            </div>
        </div>
    );
};


const SetRow: React.FC<{
  set: WorkoutSet;
  onToggle: () => void;
  onUpdate: (field: 'actualWeight' | 'actualReps' | 'rpe', value: string) => void;
  weightUnit: 'kg' | 'lbs';
  onDelete: () => void;
}> = ({ set, onToggle, onUpdate, weightUnit, onDelete }) => {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-zinc-800 rounded-md gap-2">
      <span className="font-mono text-zinc-400 w-6 text-center">{set.id}</span>
      <span className="text-white font-medium w-24 truncate">{set.targetReps}</span>
      
      <div className="flex-1">
        <input
            type="text"
            inputMode="decimal"
            placeholder={`Wt (${weightUnit})`}
            value={set.actualWeight ?? ''}
            onChange={(e) => onUpdate('actualWeight', e.target.value)}
            className="w-full bg-zinc-700 border-zinc-600 border rounded-md py-1 px-2 text-white text-center focus:outline-none focus:border-green-500 placeholder:text-zinc-500"
        />
      </div>
      <div className="flex-1">
        <input
            type="text"
            inputMode="numeric"
            placeholder="Reps"
            value={set.actualReps ?? ''}
            onChange={(e) => onUpdate('actualReps', e.target.value)}
            className="w-full bg-zinc-700 border-zinc-600 border rounded-md py-1 px-2 text-white text-center focus:outline-none focus:border-green-500 placeholder:text-zinc-500"
        />
      </div>
       <div className="flex-1">
        <input
            type="text"
            inputMode="numeric"
            placeholder="RPE"
            value={set.rpe ?? ''}
            onChange={(e) => onUpdate('rpe', e.target.value)}
            className="w-full bg-zinc-700 border-zinc-600 border rounded-md py-1 px-2 text-white text-center focus:outline-none focus:border-green-500 placeholder:text-zinc-500"
        />
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onToggle} className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${set.completed ? 'bg-green-500 border-green-500' : 'border-zinc-500'}`}>
          {set.completed && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
        </button>
        <button onClick={onDelete} className="text-zinc-500 hover:text-red-500 transition-colors p-1" aria-label={`Delete set ${set.id}`}>
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const ExerciseCard: React.FC<{
  exercise: Exercise;
  onSetToggle: (exerciseId: string, setId: number) => void;
  onSetUpdate: (exerciseId: string, setId: number, field: 'actualWeight' | 'actualReps' | 'rpe', value: string) => void;
  weightUnit: 'kg' | 'lbs';
  onDelete: (exerciseId: string) => void;
  onReplace: (exerciseId: string) => void;
  onSetAdd: (exerciseId: string) => void;
  onSetDelete: (exerciseId: string, setId: number) => void;
  onViewAnimation: (exercise: Exercise) => void;
}> = ({ exercise, onSetToggle, onSetUpdate, weightUnit, onDelete, onReplace, onSetAdd, onSetDelete, onViewAnimation }) => {
  return (
    <div className="bg-zinc-900 rounded-xl p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-white">{exercise.name}</h3>
            <button onClick={() => onViewAnimation(exercise)} className="text-zinc-500 hover:text-sky-400 transition-colors" aria-label={`View animation for ${exercise.name}`}>
                <InformationCircleIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
            <button onClick={() => onReplace(exercise.id)} className="text-zinc-500 hover:text-green-400 transition-colors" aria-label={`Replace ${exercise.name}`}>
                <ArrowsRightLeftIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onDelete(exercise.id)} className="text-zinc-500 hover:text-red-400 transition-colors" aria-label={`Delete ${exercise.name}`}>
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {exercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            onToggle={() => onSetToggle(exercise.id, set.id)}
            onUpdate={(field, value) => onSetUpdate(exercise.id, set.id, field, value)}
            weightUnit={weightUnit}
            onDelete={() => onSetDelete(exercise.id, set.id)}
          />
        ))}
      </div>
      <div className="mt-4">
        <button
          onClick={() => onSetAdd(exercise.id)}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-green-400 font-semibold py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Set
        </button>
      </div>
    </div>
  );
};

const WorkoutView: React.FC<{
  workout: Workout,
  onSetToggle: (workoutId: string, exerciseId: string, setId: number) => void;
  onSetUpdate: (workoutId: string, exerciseId: string, setId: number, field: 'actualWeight' | 'actualReps' | 'rpe', value: string) => void;
  weightUnit: 'kg' | 'lbs';
  onDeleteExercise: (workoutId: string, exerciseId: string) => void;
  onReplaceExercise: (exerciseId: string) => void;
  onAddSet: (workoutId: string, exerciseId: string) => void;
  onDeleteSet: (workoutId: string, exerciseId: string, setId: number) => void;
  onViewAnimation: (exercise: Exercise) => void;
  onFinish: () => void;
}> = ({ workout, onSetToggle, onSetUpdate, weightUnit, onDeleteExercise, onReplaceExercise, onAddSet, onDeleteSet, onViewAnimation, onFinish }) => (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold text-green-400">{workout.focus}</h2>
        <div className="space-y-4">
        {workout.exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onSetToggle={(exerciseId, setId) => onSetToggle(workout.id, exerciseId, setId)}
              onSetUpdate={(exerciseId, setId, field, value) => onSetUpdate(workout.id, exerciseId, setId, field, value)}
              weightUnit={weightUnit}
              onDelete={(exerciseId) => onDeleteExercise(workout.id, exerciseId)}
              onReplace={onReplaceExercise}
              onSetAdd={(exerciseId) => onAddSet(workout.id, exerciseId)}
              onSetDelete={(exerciseId, setId) => onDeleteSet(workout.id, exerciseId, setId)}
              onViewAnimation={onViewAnimation}
            />
        ))}
        </div>
        <button
            onClick={onFinish}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg mt-6 transition-colors"
        >
            Finish Workout
        </button>
    </div>
);

const exerciseNameMap: { [key: string]: string } = {
    'romanian deadlift': 'barbellromaniandeadlift',
    'rdl': 'barbellromaniandeadlift',
    'leg press': 'legpress',
    'back squat': 'barbellsquat',
    'squat': 'barbellsquat',
    'pull up': 'pullup',
    'chin up': 'chinup',
    'bench press': 'barbellbenchpress',
    'overhead press': 'barbelloverheadpress',
    'military press': 'barbelloverheadpress',
    'deadlift': 'barbellconventionaldeadlift',
    'bent over row': 'barbellbentoverrow',
    'hip thrust': 'barbellhipthrust',
    'leg extension': 'legextension',
    'leg curl': 'seatedlegcurl',
    'lying leg curl': 'lyinglegcurl',
    'lat pulldown': 'latpulldown',
    'lateral raise': 'dumbbelllateralraise',
    'bicep curl': 'dumbbellbicepcurl',
    'tricep extension': 'cabletriceppushdown',
    'face pull': 'facepull',
    'plank': 'plank',
    'crunch': 'crunch',
    'push up': 'pushup',
};

const formatExerciseNameForUrl = (name: string) => {
    const lowerCaseName = name.toLowerCase().trim();
    const sortedMapKeys = Object.keys(exerciseNameMap).sort((a, b) => b.length - a.length);
    for (const key of sortedMapKeys) {
        if (lowerCaseName.includes(key)) {
            return exerciseNameMap[key];
        }
    }
    return lowerCaseName.replace(/[^a-z0-9]/g, '');
};


const ExerciseAnimationModal: React.FC<{
  exercise: Exercise;
  onClose: () => void;
}> = ({ exercise, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const animationUrl = `https://www.yuvutu.be/workouts/exercises/${formatExerciseNameForUrl(exercise.name)}.gif`;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-800" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-white text-center">{exercise.name}</h2>
        <div className="aspect-square bg-zinc-800 rounded-lg flex items-center justify-center">
          {isLoading && !hasError && <div className="text-zinc-400">Loading animation...</div>}
          <img
            src={animationUrl}
            alt={`${exercise.name} animation`}
            className={`w-full h-full object-contain ${isLoading || hasError ? 'hidden' : ''}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
          {hasError && <div className="text-center text-red-400 p-4">Sorry, an animation for this exercise could not be found.</div>}
        </div>
        <button onClick={onClose} className="mt-6 w-full px-6 py-2 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors">Close</button>
      </div>
    </div>
  );
};


const EditableSetRow: React.FC<{
  set: WorkoutSet;
  setNumber: number;
  onUpdate: (setId: number, field: keyof WorkoutSet, value: string) => void;
  onDelete: (setId: number) => void;
}> = ({ set, setNumber, onUpdate, onDelete }) => {
    return (
        <div className="flex items-center gap-2 bg-zinc-800 p-2 rounded-lg">
            <span className="font-mono text-zinc-400 w-6 text-center">{setNumber}</span>
            <input
                type="text"
                value={set.targetReps}
                onChange={(e) => onUpdate(set.id, 'targetReps', e.target.value)}
                placeholder="Reps"
                className="w-full bg-zinc-700 border-zinc-600 border rounded-md py-1 px-2 text-white text-center focus:outline-none focus:border-green-500 placeholder:text-zinc-500"
            />
            <input
                type="text"
                inputMode="decimal"
                value={set.restMinutes ?? ''}
                onChange={(e) => onUpdate(set.id, 'restMinutes', e.target.value)}
                placeholder="Rest (min)"
                className="w-full bg-zinc-700 border-zinc-600 border rounded-md py-1 px-2 text-white text-center focus:outline-none focus:border-green-500 placeholder:text-zinc-500"
            />
            <button onClick={() => onDelete(set.id)} className="text-zinc-500 hover:text-red-500 p-1">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const EditableExerciseCard: React.FC<{
  exercise: Exercise;
  isFavorite: boolean;
  onUpdate: (updatedExercise: Exercise) => void;
  onDelete: () => void;
  onToggleFavorite: (exercise: Exercise) => void;
  onDragStart: (e: React.DragEvent, exerciseId: string) => void;
  onDrop: (e: React.DragEvent, exerciseId: string) => void;
}> = ({ exercise, isFavorite, onUpdate, onDelete, onToggleFavorite, onDragStart, onDrop }) => {

    const handleSetUpdate = (setId: number, field: keyof WorkoutSet, value: string) => {
        const newSets = exercise.sets.map(s => {
            if (s.id === setId) {
                const updatedSet = { ...s };
                if (field === 'restMinutes') {
                    const numValue = parseFloat(value);
                    updatedSet.restMinutes = value === '' || isNaN(numValue) ? undefined : numValue;
                } else if (field === 'targetReps') {
                    updatedSet.targetReps = value;
                }
                return updatedSet;
            }
            return s;
        });
        onUpdate({ ...exercise, sets: newSets });
    };

    const handleAddSet = () => {
        const newSetId = exercise.sets.length > 0 ? Math.max(...exercise.sets.map(s => s.id)) + 1 : 1;
        const newSet: WorkoutSet = {
            id: newSetId,
            targetReps: '8-12 reps',
            restMinutes: 1.5,
            completed: false,
        };
        onUpdate({ ...exercise, sets: [...exercise.sets, newSet] });
    };

    const handleDeleteSet = (setId: number) => {
        onUpdate({ ...exercise, sets: exercise.sets.filter(s => s.id !== setId) });
    };

    return (
        <div
            className="bg-zinc-900 rounded-xl p-4"
            draggable="true"
            onDragStart={(e) => onDragStart(e, exercise.id)}
            onDrop={(e) => onDrop(e, exercise.id)}
            onDragOver={(e) => e.preventDefault()}
        >
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <GripVerticalIcon className="w-6 h-6 text-zinc-500 cursor-grab" />
                    <h3 className="font-bold text-lg text-white">{exercise.name}</h3>
                    <button onClick={() => onToggleFavorite(exercise)} className="text-zinc-500 hover:text-pink-400">
                        <HeartIcon className={`w-5 h-5 transition-colors ${isFavorite ? 'text-pink-500 fill-pink-500' : ''}`} />
                    </button>
                </div>
                <button onClick={onDelete} className="text-zinc-500 hover:text-red-400">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 text-xs text-zinc-400">
                    <span className="w-6 text-center">Set</span>
                    <span className="flex-1 text-center">Target Reps</span>
                    <span className="flex-1 text-center">Rest</span>
                    <span className="w-8"></span>
                </div>
                {exercise.sets.map((set, index) => (
                    <EditableSetRow
                        key={set.id}
                        set={set}
                        setNumber={index + 1}
                        onUpdate={handleSetUpdate}
                        onDelete={handleDeleteSet}
                    />
                ))}
            </div>
            <button onClick={handleAddSet} className="w-full mt-3 bg-zinc-800 hover:bg-zinc-700 text-green-400 font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                <PlusIcon className="w-4 h-4" /> Add Set
            </button>
        </div>
    );
};

const TemplateSelectionModal: React.FC<{
    onClose: () => void;
    onSelect: (template: TrainingProgram) => void;
}> = ({ onClose, onSelect }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-800 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white text-center">Select a Workout Template</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {workoutTemplates.map(template => (
                        <div key={template.programName} className="bg-zinc-800 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-green-400">{template.programName}</h3>
                                <p className="text-sm text-zinc-400">{template.description}</p>
                            </div>
                            <button onClick={() => onSelect(template)} className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-1 px-4 rounded-md text-sm transition-colors flex-shrink-0 ml-4">
                                Select
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-zinc-800 flex-shrink-0 text-right">
                     <button onClick={onClose} className="px-6 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onCancel}>
        <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700 text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
            <p className="text-zinc-300 mb-6">{message}</p>
            <div className="flex justify-center gap-3">
                <button onClick={onCancel} className="px-6 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors">{cancelText}</button>
                <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">{confirmText}</button>
            </div>
        </div>
    </div>
);

const WorkoutBuilder: React.FC<{
    initialProgram: TrainingProgram | WorkoutDraft | null;
    favoriteExercises: Exercise[];
    onSave: (program: TrainingProgram) => void;
    onExit: (currentProgram: TrainingProgram, draftId?: string) => void;
    onToggleFavorite: (exercise: Exercise) => void;
}> = ({ initialProgram, favoriteExercises, onSave, onExit, onToggleFavorite }) => {
    const emptyProgram: TrainingProgram = {
        programName: 'My Custom Plan',
        durationWeeks: 4,
        workouts: [{ id: 'workout-1', day: 1, focus: 'Monday Workout', completed: false, exercises: [] }]
    };
    const [program, setProgram] = useState<TrainingProgram>(initialProgram ? JSON.parse(JSON.stringify(initialProgram)) : emptyProgram);
    const draftId = 'id' in (initialProgram || {}) ? (initialProgram as WorkoutDraft).id : undefined;

    const [activeDay, setActiveDay] = useState(1); // 1 for Monday, 7 for Sunday
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Exercise[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [draggedExerciseId, setDraggedExerciseId] = useState<string | null>(null);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [confirmingTemplate, setConfirmingTemplate] = useState<TrainingProgram | null>(null);
    const [confirmingDeleteDay, setConfirmingDeleteDay] = useState<number | null>(null);
    
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const handleProgramNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProgram(p => ({ ...p, programName: e.target.value }));
    };

    const handleWorkoutFocusChange = (day: number, focus: string) => {
        setProgram(p => ({
            ...p,
            workouts: p.workouts.map(w => w.day === day ? { ...w, focus } : w)
        }));
    };

    const handleAddWorkoutToDay = (dayNumber: number) => {
        const dayName = daysOfWeek[dayNumber - 1];
        const newWorkout: Workout = { 
            id: `workout-${Date.now()}`, 
            day: dayNumber, 
            focus: `${dayName} Workout`, 
            completed: false, 
            exercises: [] 
        };
        setProgram(p => ({ 
            ...p, 
            workouts: [...p.workouts, newWorkout].sort((a, b) => a.day - b.day) 
        }));
    };

    const handleDeleteWorkoutFromDay = (dayNumber: number) => {
        setProgram(p => ({
            ...p,
            workouts: p.workouts.filter(w => w.day !== dayNumber)
        }));
        setConfirmingDeleteDay(null);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResults([]);
        const results = await searchExercises(searchQuery);
        setSearchResults(results.map(r => ({ ...r, sets: r.sets.map(s => ({...s, restMinutes: 1.5})) })));
        setIsSearching(false);
      };

    const handleAddExercise = (exercise: Exercise) => {
        const newExercise = { ...exercise, id: `ex-${Date.now()}` };
        setProgram(p => ({
            ...p,
            workouts: p.workouts.map(w => {
                if (w.day === activeDay) {
                    return { ...w, exercises: [...w.exercises, newExercise] };
                }
                return w;
            })
        }));
        setSearchQuery('');
        setSearchResults([]);
    };
    
    const handleUpdateExercise = (updatedExercise: Exercise) => {
        setProgram(p => ({
            ...p,
            workouts: p.workouts.map(w => {
                if (w.day === activeDay) {
                    return { ...w, exercises: w.exercises.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex) };
                }
                return w;
            })
        }));
    };
    
    const handleDeleteExercise = (exerciseId: string) => {
         setProgram(p => ({
            ...p,
            workouts: p.workouts.map(w => {
                if (w.day === activeDay) {
                    return { ...w, exercises: w.exercises.filter(ex => ex.id !== exerciseId) };
                }
                return w;
            })
        }));
    };

    const handleDragStart = (e: React.DragEvent, exerciseId: string) => {
        setDraggedExerciseId(exerciseId);
    };

    const handleDrop = (e: React.DragEvent, droppedOnExerciseId: string) => {
        e.preventDefault();
        if (!draggedExerciseId || draggedExerciseId === droppedOnExerciseId) {
            setDraggedExerciseId(null);
            return;
        }

        const activeWorkout = program.workouts.find(w => w.day === activeDay);
        if (!activeWorkout) return;

        const exercises = [...activeWorkout.exercises];
        const draggedIndex = exercises.findIndex(ex => ex.id === draggedExerciseId);
        const droppedOnIndex = exercises.findIndex(ex => ex.id === droppedOnExerciseId);

        if (draggedIndex === -1 || droppedOnIndex === -1) return;

        const [draggedItem] = exercises.splice(draggedIndex, 1);
        exercises.splice(droppedOnIndex, 0, draggedItem);
        
        setProgram(prev => ({
            ...prev,
            workouts: prev.workouts.map(w => w.day === activeDay ? { ...w, exercises } : w)
        }));
        
        setDraggedExerciseId(null);
    };

    const handleSelectTemplate = (template: TrainingProgram) => {
        setShowTemplatesModal(false);
        setConfirmingTemplate(template);
    }
    
    const handleConfirmTemplate = () => {
        if (!confirmingTemplate) return;
        const newProgram = JSON.parse(JSON.stringify(confirmingTemplate));
        newProgram.workouts.forEach((w: Workout) => w.exercises.forEach((e: Exercise) => e.sets.forEach((s: any) => delete s.rpe)));
        setProgram(newProgram);
        setActiveDay(newProgram.workouts[0]?.day || 1);
        setConfirmingTemplate(null);
    };
    
    const activeWorkout = program.workouts.find(w => w.day === activeDay);
    const isFavorite = (exercise: Exercise) => favoriteExercises.some(fav => fav.name.toLowerCase() === exercise.name.toLowerCase());

    return (
        <div className="p-4 space-y-4 text-white pb-24 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <button onClick={() => onExit(program, draftId)} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Workout Builder</h1>
                <button onClick={() => onSave(program)} className="bg-green-500 text-black font-bold py-2 px-4 rounded-lg">
                    Save Plan
                </button>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={program.programName}
                    onChange={handleProgramNameChange}
                    placeholder="Program Name"
                    className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-4 text-white font-bold text-2xl focus:outline-none focus:border-green-500"
                />
                <button onClick={() => setShowTemplatesModal(true)} className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex-shrink-0" title="Load from Template">
                    <ClipboardListIcon className="w-6 h-6"/>
                </button>
            </div>
            
            <div className="flex justify-around items-center gap-1 pb-2 flex-shrink-0">
                {daysOfWeek.map((dayName, index) => {
                    const dayNumber = index + 1;
                    const isWorkoutDay = program.workouts.some(w => w.day === dayNumber);
                    
                    return (
                        <button 
                            key={dayNumber} 
                            onClick={() => setActiveDay(dayNumber)} 
                            className={`relative flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-colors
                                ${activeDay === dayNumber ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}
                            `}
                        >
                            {dayName}
                            {isWorkoutDay && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-sky-400 rounded-full"></div>}
                        </button>
                    );
                })}
            </div>
            
            {activeWorkout ? (
                <>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={activeWorkout.focus}
                            onChange={(e) => handleWorkoutFocusChange(activeWorkout.day, e.target.value)}
                            placeholder="e.g. Chest & Triceps"
                            className="w-full bg-zinc-800/50 border-b-2 border-zinc-700 py-1 px-1 text-white text-lg font-semibold focus:outline-none focus:border-green-500"
                        />
                         <button onClick={() => setConfirmingDeleteDay(activeWorkout.day)} className="text-zinc-500 hover:text-red-400 p-2 rounded-lg bg-zinc-800 transition-colors" title="Delete Day's Workout">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto -mx-4 px-4">
                        {activeWorkout.exercises.map(ex => (
                            <EditableExerciseCard
                                key={ex.id}
                                exercise={ex}
                                isFavorite={isFavorite(ex)}
                                onUpdate={handleUpdateExercise}
                                onDelete={() => handleDeleteExercise(ex.id)}
                                onToggleFavorite={onToggleFavorite}
                                onDragStart={handleDragStart}
                                onDrop={handleDrop}
                            />
                        ))}
                        {activeWorkout.exercises.length === 0 && (
                            <div className="text-center py-10 text-zinc-500">
                                <p>This day is empty.</p>
                                <p>Add exercises below to build your workout.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 bg-zinc-900/50 rounded-xl">
                    <p className="text-lg font-semibold">This is a Rest Day 😴</p>
                    <button onClick={() => handleAddWorkoutToDay(activeDay)} className="mt-4 bg-green-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
                        Add Workout
                    </button>
                </div>
            )}
            
            {activeWorkout && (
                 <div className="bg-zinc-900 rounded-xl p-4 mt-auto">
                     <h2 className="text-lg font-bold">Add Exercise</h2>
                     <form onSubmit={handleSearch} className="flex gap-2 mt-2">
                         <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for 'Bench Press'"
                            className="flex-grow bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                            disabled={isSearching}
                         />
                         <button type="submit" className="bg-green-500 text-black font-bold py-2 px-4 rounded-lg disabled:opacity-50" disabled={isSearching || !searchQuery.trim()}>
                            {isSearching ? '...' : 'Search'}
                         </button>
                     </form>
                     {isSearching && <p className="text-zinc-400 text-center animate-pulse pt-2">Searching...</p>}
                     {searchResults.length > 0 && (
                         <div className="space-y-2 pt-2 max-h-40 overflow-y-auto">
                            {searchResults.map(ex => (
                                <div key={ex.id} className="flex items-center justify-between bg-zinc-800 p-3 rounded-md">
                                    <p className="text-white font-medium">{ex.name}</p>
                                    <button onClick={() => handleAddExercise(ex)} className="bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-green-700 transition-colors">
                                        Add
                                    </button>
                                </div>
                            ))}
                         </div>
                     )}
                </div>
            )}

            {showTemplatesModal && <TemplateSelectionModal onClose={() => setShowTemplatesModal(false)} onSelect={handleSelectTemplate} />}
            {confirmingTemplate && <ConfirmationModal title="Load Template" message="This will replace your current custom workout. Are you sure?" onConfirm={handleConfirmTemplate} onCancel={() => setConfirmingTemplate(null)} confirmText="Replace"/>}
            {confirmingDeleteDay !== null && (
                <ConfirmationModal 
                    title="Delete Workout Day"
                    message={`Are you sure you want to delete the workout for ${daysOfWeek[confirmingDeleteDay-1]}? This will make it a rest day.`}
                    confirmText="Delete"
                    onConfirm={() => handleDeleteWorkoutFromDay(confirmingDeleteDay)} 
                    onCancel={() => setConfirmingDeleteDay(null)}
                />
            )}
        </div>
    );
};

const SaveWorkoutModal: React.FC<{
    program: TrainingProgram;
    onSave: (name: string, tags: string[]) => void;
    onClose: () => void;
}> = ({ program, onSave, onClose }) => {
    const [name, setName] = useState(program.programName || 'My Workout');
    const [tags, setTags] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            alert("Please enter a name for your workout.");
            return;
        }
        const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        onSave(name, tagsArray);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-800" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-white text-center">Save Workout</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Workout Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Tags (comma-separated)</label>
                        <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. gym, push, hypertrophy" className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500"/>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors">Save</button>
                </div>
            </div>
        </div>
    );
};

const SavedWorkoutsView: React.FC<{
    drafts: WorkoutDraft[];
    savedWorkouts: SavedWorkout[];
    onBack: () => void;
    onStart: (workout: SavedWorkout) => void;
    onEdit: (workout: SavedWorkout | WorkoutDraft) => void;
    onDelete: (workoutId: string) => void;
    onPin: (workoutId: string) => void;
    onDeleteDraft: (draftId: string) => void;
}> = ({ drafts, savedWorkouts, onBack, onStart, onEdit, onDelete, onPin, onDeleteDraft }) => {
    const sortedWorkouts = [...savedWorkouts].sort((a,b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    
    const timeSince = (dateStr: string) => {
        const date = new Date(dateStr);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div className="p-4 space-y-6 text-white pb-24 h-full flex flex-col">
            <div className="flex items-center">
                <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-center flex-1">Load Workout</h1>
                <div className="w-6"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6">
                {drafts.length > 0 && (
                    <div>
                        <h2 className="font-bold text-zinc-400 mb-3">DRAFTS</h2>
                        <div className="space-y-3">
                        {drafts.map(draft => (
                            <div key={draft.id} className="bg-zinc-900 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-white">{draft.programName}</p>
                                    <p className="text-xs text-zinc-500">Last modified: {timeSince(draft.lastModified)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onEdit(draft)} className="text-green-400 font-semibold text-sm">Resume</button>
                                    <button onClick={() => onDeleteDraft(draft.id)}><TrashIcon className="w-5 h-5 text-zinc-500 hover:text-red-400"/></button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                
                <div>
                    <h2 className="font-bold text-zinc-400 mb-3">MY LIBRARY</h2>
                     <div className="space-y-3">
                    {sortedWorkouts.length > 0 ? sortedWorkouts.map(workout => (
                        <div key={workout.id} className="bg-zinc-900 rounded-xl p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-white flex items-center gap-2">
                                        {workout.programName}
                                        {workout.isPinned && <PinIcon className="w-4 h-4 text-amber-400 fill-amber-400" />}
                                    </p>
                                    <p className="text-sm text-zinc-400">{workout.workouts.length} days &bull; {workout.tags.slice(0, 2).join(', ')}</p>
                                    {workout.lastPerformed && <p className="text-xs text-zinc-500 mt-1">Last performed: {timeSince(workout.lastPerformed)}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onPin(workout.id)} title="Pin workout"><PinIcon className={`w-5 h-5 ${workout.isPinned ? 'text-amber-400 fill-amber-400' : 'text-zinc-500 hover:text-amber-400'}`} /></button>
                                    <button onClick={() => onDelete(workout.id)} title="Delete workout"><TrashIcon className="w-5 h-5 text-zinc-500 hover:text-red-400"/></button>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => onEdit(workout)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 rounded-lg text-sm">Edit</button>
                                <button onClick={() => onStart(workout)} className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded-lg text-sm">Start</button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-zinc-500 text-center py-8">No saved workouts yet. Create one or generate one with AI!</p>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FavoritesView: React.FC<{
    favoriteExercises: Exercise[];
    onBack: () => void;
    onStartWorkout: (exercises: Exercise[]) => void;
    onToggleFavorite: (exercise: Exercise) => void;
}> = ({ favoriteExercises, onBack, onStartWorkout, onToggleFavorite }) => {
    const [selected, setSelected] = useState<string[]>([]);

    const toggleSelection = (exercise: Exercise) => {
        setSelected(prev => 
            prev.includes(exercise.name)
            ? prev.filter(name => name !== exercise.name)
            : [...prev, exercise.name]
        );
    };

    const handleStart = () => {
        const exercisesToStart = favoriteExercises.filter(fav => selected.includes(fav.name));
        onStartWorkout(exercisesToStart);
    };

    return (
        <div className="p-4 space-y-4 text-white pb-24 h-full flex flex-col">
            <div className="flex items-center">
                <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-center flex-1">Favorite Exercises</h1>
                <div className="w-6"></div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
                {favoriteExercises.length > 0 ? favoriteExercises.map(ex => (
                    <div key={ex.name} className={`bg-zinc-900 p-3 rounded-lg flex items-center gap-3 transition-colors ${selected.includes(ex.name) ? 'ring-2 ring-green-500' : ''}`} onClick={() => toggleSelection(ex)}>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${selected.includes(ex.name) ? 'bg-green-500 border-green-500' : 'border-zinc-600'}`}>
                            {selected.includes(ex.name) && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <p className="flex-1 font-semibold">{ex.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(ex); }} className="text-pink-500"><HeartIcon className="w-6 h-6 fill-current"/></button>
                    </div>
                )) : <p className="text-zinc-500 text-center py-10">You haven't favorited any exercises yet. Tap the heart icon while building a workout!</p>}
            </div>
            {selected.length > 0 && (
                <button onClick={handleStart} className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg">
                    Start Workout with {selected.length} Exercise{selected.length > 1 ? 's' : ''}
                </button>
            )}
        </div>
    );
};

const GridButton: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; isPrimary?: boolean }> = ({ title, icon, onClick, isPrimary }) => (
    <button
        onClick={onClick}
        className={`rounded-2xl p-6 flex flex-col items-center justify-center text-center aspect-square transition-all duration-200 transform hover:scale-105
            ${isPrimary ? 'bg-green-500 hover:bg-green-600 text-black' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
    >
        <div className="mb-3">{icon}</div>
        <p className="font-bold">{title}</p>
    </button>
);

const RecentPlans: React.FC<{
    workouts: SavedWorkout[];
    onStart: (workout: SavedWorkout) => void;
}> = ({ workouts, onStart }) => {
    const recent = workouts
        .filter(w => w.lastPerformed)
        .sort((a, b) => new Date(b.lastPerformed!).getTime() - new Date(a.lastPerformed!).getTime())
        .slice(0, 2);

    if (recent.length === 0) return null;

    return (
        <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-3">Recent Plans</h2>
            <div className="space-y-3">
                {recent.map(w => (
                    <button key={w.id} onClick={() => onStart(w)} className="w-full bg-zinc-900 rounded-2xl p-4 text-left hover:bg-zinc-800 transition-colors flex items-center justify-between">
                        <div>
                            <p className="font-bold text-white">{w.programName}</p>
                            <p className="text-sm text-zinc-400">{w.workouts.length} days &bull; {w.tags[0]}</p>
                        </div>
                        <ChevronRightIcon className="w-6 h-6 text-zinc-600" />
                    </button>
                ))}
            </div>
        </div>
    );
};

interface TrainingHomeProps {
  onGenerate: () => void;
  onBuild: () => void;
  onLoad: () => void;
  onFavorites: () => void;
  onImport: () => void;
  savedWorkouts: SavedWorkout[];
  onStart: (workout: SavedWorkout) => void;
}

const TrainingHome: React.FC<TrainingHomeProps> = ({ onGenerate, onBuild, onLoad, onFavorites, onImport, savedWorkouts, onStart }) => {
    const handleSuggestionSelect = (label: string) => {
        onGenerate();
    };

    return (
        <div className="p-4 pb-8">
            <RecentPlans workouts={savedWorkouts} onStart={onStart} />
            
            <HeroSection />
            
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                <div className="md:col-span-2">
                    <ActionCard
                        title="Generate Plan With AI"
                        subtitle="Smart, personalized workout in seconds"
                        icon={<SparklesIcon className="w-full h-full" />}
                        onClick={onGenerate}
                        isPrimary
                    />
                </div>
                
                <ActionCard
                    title="Build Workout Manually"
                    subtitle="Customize every detail of your split"
                    icon={<PencilIcon className="w-full h-full" />}
                    onClick={onBuild}
                />
                
                <ActionCard
                    title="Import Workout Plan"
                    subtitle="Bring in plans from text, files, or photos"
                    icon={<DocumentIcon className="w-full h-full" />}
                    onClick={onImport}
                />
                
                <ActionCard
                    title="Load Saved Workouts"
                    subtitle="Load your past AI or manual plans"
                    icon={<BookmarkIcon className="w-full h-full" />}
                    onClick={onLoad}
                />
                
                <ActionCard
                    title="Favorite Exercises"
                    subtitle="Quick access to your go-to movements"
                    icon={<HeartIcon className="w-full h-full" />}
                    onClick={onFavorites}
                />
            </div>
            
            <SuggestionsStrip onSelect={handleSuggestionSelect} />
        </div>
    );
}

const getWeekDateNumbers = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1));
    return Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        return day.getDate();
    });
};

const DayTab: React.FC<{
  dayAbbr: string;
  dateNumber: number;
  isWorkoutDay: boolean;
  isCompleted: boolean;
  isSelected: boolean;
  onClick: () => void;
}> = ({ dayAbbr, dateNumber, isWorkoutDay, isCompleted, isSelected, onClick }) => {
  let statusClasses = '';
  if (isSelected) {
    statusClasses = 'bg-green-500 text-black';
  } else if (isCompleted) {
    statusClasses = 'bg-green-500/20 text-green-300';
  } else if (isWorkoutDay) {
    statusClasses = 'bg-yellow-500/20 text-yellow-300';
  } else { // Rest day or unassigned
    statusClasses = 'bg-zinc-800 text-zinc-400';
  }

  return (
    <button onClick={onClick} className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-lg transition-all transform hover:scale-105 ${statusClasses}`}>
      <span className="text-xs font-medium uppercase">{dayAbbr}</span>
      <span className="text-xl font-bold">{dateNumber}</span>
    </button>
  );
};


const TrainScreenComponent: React.FC<TrainScreenProps> = (props) => {
    const { program, setProgram, generatePlan, activateGeneratedProgram, isLoading, weightUnit, savedWorkouts, addSavedWorkout, updateSavedWorkout, deleteSavedWorkout, startSavedWorkout, drafts, saveDraft, deleteDraft, favoriteExercises, toggleFavoriteExercise, workoutHistory, completeWorkout } = props;
    
    type TrainView = 'home' | 'generatePlan' | 'workoutBuilder' | 'savedWorkouts' | 'favorites';
    const [view, setView] = useState<TrainView>('home');
    const [editingProgram, setEditingProgram] = useState<TrainingProgram | WorkoutDraft | null>(null);
    const [confirmExit, setConfirmExit] = useState<{ program: TrainingProgram, draftId?: string } | null>(null);
    const [exerciseForAnimation, setExerciseForAnimation] = useState<Exercise | null>(null);
    const [postWorkoutRecap, setPostWorkoutRecap] = useState<string | null>(null);

    const [generatedPlan, setGeneratedPlan] = useState<TrainingProgram | null>(null);
    const [generationPrefs, setGenerationPrefs] = useState<WorkoutPlanPreferences | null>(null);
    
    const [showImportModal, setShowImportModal] = useState(false);
    
    const todayDay = useMemo(() => new Date().getDay() || 7, []);
    const [selectedDay, setSelectedDay] = useState<number>(todayDay);
    const weekDateNumbers = useMemo(() => getWeekDateNumbers(), []);
    
    useEffect(() => {
        if (program) {
            const isNewlyGenerated = !!program.preferences;
            if (isNewlyGenerated && !generatedPlan) {
                 setGeneratedPlan(program);
            }
            
            const workoutForToday = program.workouts.find(w => w.day === todayDay);
            if (workoutForToday && workoutForToday.exercises.length > 0) {
                setSelectedDay(todayDay);
            } else {
                const sortedWorkouts = [...program.workouts]
                    .filter(w => w.exercises.length > 0)
                    .sort((a,b) => a.day - b.day);
                const nextWorkout = sortedWorkouts.find(w => w.day > todayDay);
                setSelectedDay(nextWorkout?.day || sortedWorkouts[0]?.day || todayDay);
            }

        } else {
            setGeneratedPlan(null);
        }
    }, [program, todayDay, generatedPlan]);
    
    const handleStartSavedWorkoutAndShow = (workout: SavedWorkout) => {
        startSavedWorkout(workout);
        setView('home');
    };

    const handleEditProgram = (p: SavedWorkout | WorkoutDraft) => {
        setEditingProgram(p);
        setView('workoutBuilder');
    };

    const handleImportWorkout = (program: TrainingProgram, aiReview?: string) => {
        addSavedWorkout(program);
        setShowImportModal(false);
        setView('home');
    };

    const handleSaveFromBuilder = (p: TrainingProgram) => {
        const isExisting = savedWorkouts.some(sw => sw.programName === p.programName);
        if (isExisting) {
            const existing = savedWorkouts.find(sw => sw.programName === p.programName)!;
            updateSavedWorkout({ ...existing, ...p });
             alert(`${p.programName} has been updated!`);
        } else {
            addSavedWorkout(p, p.programName, p.preferences?.goal ? [p.preferences.goal] : []);
        }
        
        if ('lastModified' in p && (p as WorkoutDraft).id) {
            deleteDraft((p as WorkoutDraft).id);
        }
        
        setProgram(p);
        setView('home');
    };

    const handleExitBuilder = (currentProgram: TrainingProgram, draftId?: string) => {
        const hasContent = currentProgram.programName !== 'My Custom Plan' || currentProgram.workouts.some(w => w.exercises.length > 0);
        if (hasContent) {
            setConfirmExit({ program: currentProgram, draftId });
        } else {
            setView('home');
        }
    };
    
    const confirmAndSaveDraft = () => {
        if (confirmExit) {
            saveDraft(confirmExit.program, confirmExit.draftId);
            alert("Draft saved!");
            setConfirmExit(null);
            setView('home');
        }
    };
    
    const exitWithoutSaving = () => {
        setConfirmExit(null);
        setView('home');
    };

    const handleStartFavoriteWorkout = (exercises: Exercise[]) => {
        const newProgram: TrainingProgram = {
            programName: "Favorites Workout",
            durationWeeks: 1,
            workouts: [{
                id: `workout-${Date.now()}`,
                day: new Date().getDay() || 7,
                focus: "Favorites Mix",
                completed: false,
                exercises: JSON.parse(JSON.stringify(exercises)) // Deep copy
            }]
        };
        setProgram(newProgram);
        setView('home');
    };

    const handleSetUpdate = (workoutId: string, exerciseId: string, setId: number, field: 'actualWeight' | 'actualReps' | 'rpe', value: string) => {
        if (!program) return;
        const newProgram = JSON.parse(JSON.stringify(program));
        const workout = newProgram.workouts.find((w: Workout) => w.id === workoutId);
        const exercise = workout?.exercises.find((e: Exercise) => e.id === exerciseId);
        const set = exercise?.sets.find((s: WorkoutSet) => s.id === setId);
        if (set) {
            const numValue = parseFloat(value);
            (set as any)[field] = value === '' ? undefined : (isNaN(numValue) ? (set as any)[field] : numValue);
            setProgram(newProgram);
        }
    };
    
    const handleSetToggle = (workoutId: string, exerciseId: string, setId: number) => {
        if (!program) return;
        const newProgram = JSON.parse(JSON.stringify(program));
        const workout = newProgram.workouts.find((w: Workout) => w.id === workoutId);
        const exercise = workout?.exercises.find((e: Exercise) => e.id === exerciseId);
        const set = exercise?.sets.find((s: WorkoutSet) => s.id === setId);
        if (set) {
            set.completed = !set.completed;
            setProgram(newProgram);
        }
    };
    
    const handleDeleteExercise = (workoutId: string, exerciseId: string) => {
        if (!program) return;
        const newProgram = JSON.parse(JSON.stringify(program));
        const workout = newProgram.workouts.find((w: Workout) => w.id === workoutId);
        if (workout) {
            workout.exercises = workout.exercises.filter((e: Exercise) => e.id !== exerciseId);
            setProgram(newProgram);
        }
    };
    
    const handleAddSet = (workoutId: string, exerciseId: string) => {
        if (!program) return;
        const newProgram = JSON.parse(JSON.stringify(program));
        const workout = newProgram.workouts.find((w: Workout) => w.id === workoutId);
        const exercise = workout?.exercises.find((e: Exercise) => e.id === exerciseId);
        if (exercise) {
            const lastSet = exercise.sets[exercise.sets.length - 1];
            const newSet: WorkoutSet = {
                id: (lastSet?.id || 0) + 1,
                targetReps: lastSet?.targetReps || '8-12 reps',
                completed: false,
                restMinutes: lastSet?.restMinutes || 1.5
            };
            exercise.sets.push(newSet);
            setProgram(newProgram);
        }
    };
    
    const handleDeleteSet = (workoutId: string, exerciseId: string, setId: number) => {
         if (!program) return;
        const newProgram = JSON.parse(JSON.stringify(program));
        const workout = newProgram.workouts.find((w: Workout) => w.id === workoutId);
        const exercise = workout?.exercises.find((e: Exercise) => e.id === exerciseId);
        if (exercise) {
            exercise.sets = exercise.sets.filter((s: WorkoutSet) => s.id !== setId);
            setProgram(newProgram);
        }
    };

    const handleReplaceExercise = (exerciseId: string) => {
        alert("Replace exercise functionality is not yet implemented.");
    };

    const handleFinishWorkout = async (workout: Workout) => {
        const recap = await getPostWorkoutRecap(workout);
        setPostWorkoutRecap(recap);
        completeWorkout(workout);
    
        setProgram(prev => {
            if (!prev) return null;
            return {...prev, workouts: prev.workouts.map(w => w.id === workout.id ? {...w, completed: true} : w) };
        });

        setTimeout(() => {
          setPostWorkoutRecap(null);
        }, 4000);
    };

    const handleConfirmPlan = (finalPlan: TrainingProgram) => {
        activateGeneratedProgram(finalPlan);
        setGeneratedPlan(null);
        setGenerationPrefs(null);
    };

    if (generatedPlan) {
        return <PlanPreview
            plan={generatedPlan}
            onConfirm={handleConfirmPlan}
            onEdit={() => {
                if (generatedPlan?.preferences) {
                    setGenerationPrefs(generatedPlan.preferences);
                }
                setGeneratedPlan(null);
                setView('generatePlan');
            }}
        />
    }
    
    if (program && view === 'home') {
        const workoutToShow = program.workouts.find(w => w.day === selectedDay);
        
        return (
            <div className="p-4 space-y-4 pb-24 h-full flex flex-col">
                <div className="flex justify-between items-center flex-shrink-0 gap-4">
                    <button onClick={() => setProgram(null)} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors" aria-label="Go back to training menu">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold truncate text-center flex-1">{program.programName}</h1>
                    <div className="w-10"></div>
                </div>

                <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayAbbr, index) => {
                        const dayNumber = index + 1;
                        const workoutForDay = program.workouts.find(w => w.day === dayNumber);
                        const isWorkout = !!workoutForDay && workoutForDay.exercises.length > 0;
                        const isCompleted = workoutHistory.some(h => h.id === workoutForDay?.id);

                        return (
                           <DayTab
                                key={dayNumber}
                                dayAbbr={dayAbbr}
                                dateNumber={weekDateNumbers[index]}
                                isWorkoutDay={isWorkout}
                                isCompleted={isCompleted || (workoutForDay?.completed ?? false)}
                                isSelected={selectedDay === dayNumber}
                                onClick={() => setSelectedDay(dayNumber)}
                            />
                        )
                    })}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {workoutToShow && workoutToShow.exercises.length > 0 ? (
                        <WorkoutView
                            workout={workoutToShow}
                            onSetToggle={handleSetToggle}
                            onSetUpdate={handleSetUpdate}
                            weightUnit={weightUnit}
                            onDeleteExercise={handleDeleteExercise}
                            onReplaceExercise={handleReplaceExercise}
                            onAddSet={handleAddSet}
                            onDeleteSet={handleDeleteSet}
                            onViewAnimation={setExerciseForAnimation}
                            onFinish={() => handleFinishWorkout(workoutToShow)}
                        />
                    ) : (
                        <div className="text-center py-20 bg-zinc-900 rounded-xl mt-4">
                            <h2 className="text-2xl font-bold">{workoutToShow?.focus || "Rest Day"}</h2>
                            <p className="text-zinc-400 mt-2">Take it easy today. Light movement or stretching is optional.</p>
                        </div>
                    )}
                </div>
                
                {exerciseForAnimation && <ExerciseAnimationModal exercise={exerciseForAnimation} onClose={() => setExerciseForAnimation(null)} />}
                {postWorkoutRecap && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-sm border border-zinc-700 text-center">
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-2xl font-bold mb-2 text-white">Workout Complete!</h2>
                            <p className="text-zinc-300">{postWorkoutRecap}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const renderContent = () => {
        switch (view) {
            case 'generatePlan':
                return <GeneratePlanWizard
                            initialPreferences={generationPrefs}
                            onClose={(prefs) => {
                                // Logic to save draft if changes were made could go here
                                setView('home');
                            }}
                            onGenerate={(prefs) => {
                                setGenerationPrefs(prefs);
                                generatePlan(prefs);
                            }}
                            isLoading={isLoading}
                        />;
            case 'workoutBuilder':
                return <WorkoutBuilder 
                            initialProgram={editingProgram} 
                            favoriteExercises={favoriteExercises}
                            onSave={handleSaveFromBuilder} 
                            onExit={handleExitBuilder}
                            onToggleFavorite={toggleFavoriteExercise}
                        />;
            case 'savedWorkouts':
                return <SavedWorkoutsView 
                            drafts={drafts}
                            savedWorkouts={savedWorkouts}
                            onBack={() => setView('home')}
                            onStart={handleStartSavedWorkoutAndShow}
                            onEdit={handleEditProgram}
                            onDelete={deleteSavedWorkout}
                            onPin={(id) => updateSavedWorkout({...savedWorkouts.find(s=>s.id===id)!, isPinned: !savedWorkouts.find(s=>s.id===id)!.isPinned})}
                            onDeleteDraft={deleteDraft}
                        />;
            case 'favorites':
                return <FavoritesView 
                            favoriteExercises={favoriteExercises} 
                            onBack={() => setView('home')} 
                            onStartWorkout={handleStartFavoriteWorkout}
                            onToggleFavorite={toggleFavoriteExercise}
                        />;
            case 'home':
            default:
                return <TrainingHome 
                            onGenerate={() => { setGenerationPrefs(null); setView('generatePlan'); }}
                            onBuild={() => { setEditingProgram(null); setView('workoutBuilder'); }}
                            onLoad={() => setView('savedWorkouts')}
                            onFavorites={() => setView('favorites')}
                            onImport={() => setShowImportModal(true)}
                            savedWorkouts={savedWorkouts}
                            onStart={handleStartSavedWorkoutAndShow}
                        />;
        }
    };

    return (
        <div className="text-white h-full">
            {renderContent()}
            {confirmExit && (
                 <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700 text-center">
                        <h2 className="text-xl font-bold mb-4 text-white">Unsaved Changes</h2>
                        <p className="text-zinc-300 mb-6">Would you like to save your work as a draft before exiting?</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={confirmAndSaveDraft} className="px-6 py-2 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors">Save Draft & Exit</button>
                            <button onClick={exitWithoutSaving} className="px-6 py-2 rounded-lg bg-red-600/40 text-red-400 font-semibold hover:bg-red-600/40 hover:text-red-300 transition-colors">Discard & Exit</button>
                            <button onClick={() => setConfirmExit(null)} className="mt-2 text-zinc-400 text-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            <ImportWorkoutModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImportWorkout}
            />
        </div>
    );
};
export const TrainScreen = React.memo(TrainScreenComponent);