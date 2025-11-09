
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { BottomNav } from './components/BottomNav';
import { Screen, UserProfile, MacroTargets, DailyMacros, Meal, TrainingProgram, WeightLog, PhotoBundle, FoodItem, DailyLog, WaterLog, Milestone, WorkoutPlanPreferences, SavedWorkout, WorkoutHistory, ProgressionPreference, Workout, Exercise, WorkoutDraft, GeneratedMealPlan, NutritionPlanPreferences, GamificationState, EarnedBadge, LevelInfo, ExtendedLevelInfo, UnlockedLoot } from './types';
import { generateWorkoutPlan, generateMealPlan } from './services/geminiService';
import { userService, mealService, workoutService, progressService, mealPlanService } from './services/database';
import { useGamification } from './hooks/useGamification';
import { GamificationFeedback } from './components/gamification/GamificationFeedback';
import { checkDatabaseHealth } from './services/database/healthCheck';
import SetupModal from './components/SetupModal';


// Lazy load screen components for better performance
const HomeScreen = React.lazy(() => import('./screens/HomeScreen').then(module => ({ default: module.HomeScreen })));
const TrainScreen = React.lazy(() => import('./screens/TrainScreen').then(module => ({ default: module.TrainScreen })));
const LogScreen = React.lazy(() => import('./screens/LogScreen').then(module => ({ default: module.LogScreen })));
const ProgressScreen = React.lazy(() => import('./screens/ProgressScreen').then(module => ({ default: module.ProgressScreen })));
const CoachScreen = React.lazy(() => import('./screens/CoachScreen').then(module => ({ default: module.CoachScreen })));
const GamificationScreen = React.lazy(() => import('./screens/GamificationScreen').then(module => ({ default: module.GamificationScreen })));


const MOCK_USER: UserProfile = {
  name: 'Jon',
  avatarUrl: 'https://picsum.photos/id/237/100/100',
  heightCm: 180,
};

const INITIAL_MOCK_TARGETS: MacroTargets = {
  rest: { calories: 2200, protein: 180, carbs: 200, fat: 70 },
  training: { calories: 2800, protein: 180, carbs: 300, fat: 100 },
};

const INITIAL_QUICK_ADD_MEALS: {name: string, items: FoodItem[]}[] = [
    { name: "Protein Shake", items: [{ name: 'Whey Protein', quantity: 1, unit: 'scoop', calories: 120, protein: 25, carbs: 2, fat: 1.5 }] },
    { name: "Chicken & Rice", items: [
        { name: 'Grilled Chicken Breast', quantity: 150, unit: 'g', calories: 248, protein: 47, carbs: 0, fat: 5 },
        { name: 'White Rice', quantity: 1, unit: 'cup', calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
    ]},
    { name: "Greek Yogurt Bowl", items: [
        { name: 'Fage 0% Greek Yogurt', quantity: 1, unit: 'cup', calories: 100, protein: 18, carbs: 6, fat: 0 },
        { name: 'Blueberries', quantity: 0.5, unit: 'cup', calories: 42, protein: 0.5, carbs: 11, fat: 0.2 },
    ]},
    { name: "Scrambled Eggs", items: [
        { name: 'Large Eggs', quantity: 3, unit: 'large', calories: 210, protein: 18, carbs: 1.5, fat: 15 },
        { name: 'Slice of Toast', quantity: 1, unit: 'slice', calories: 80, protein: 3, carbs: 14, fat: 1 },
    ]},
];

// Generates logs for the current week, from Sunday to Saturday.
const getWeekLogs = (macrosToday: DailyMacros): DailyLog[] => {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 for Sunday, 6 for Saturday
  const todayDateStr = today.toISOString().split('T')[0];
  today.setHours(0, 0, 0, 0);

  const sunday = new Date(today);
  sunday.setDate(today.getDate() - currentDayOfWeek);

  const pastCaloriesPattern = [2500, 1500, 2800, 2600, 1200, 3100, 1900];

  return Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    const dateStr = day.toISOString().split('T')[0];

    const isPast = day < today;
    const isToday = dateStr === todayDateStr;

    let macros: DailyMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (isToday) {
      macros = macrosToday;
    } else if (isPast) {
      const calories = pastCaloriesPattern[i];
      macros = {
        calories: calories,
        protein: Math.round((calories * 0.3) / 4),
        carbs: Math.round((calories * 0.4) / 4),
        fat: Math.round((calories * 0.3) / 9),
      };
    }
    
    return { date: dateStr, macros };
  });
};

const ScreenLoader: React.FC = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-zinc-700 border-t-green-500 rounded-full animate-spin"></div>
    </div>
);

const App: React.FC = () => {
    const useStickyState = <T,>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
        const [value, setValue] = useState<T>(() => {
            try {
                const stickyValue = window.localStorage.getItem(key);
                return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
            } catch {
                return defaultValue;
            }
        });
        useEffect(() => {
            window.localStorage.setItem(key, JSON.stringify(value));
        }, [key, value]);
        return [value, setValue];
    };

    const [activeScreen, setActiveScreen] = useState<Screen>('home');
    const [user, setUser] = useState<UserProfile>(MOCK_USER);
    const [isInitializing, setIsInitializing] = useState(true);
    const [showSetupModal, setShowSetupModal] = useState(false);
    
    const [meals, setMeals] = useStickyState<Meal[]>([], 'jonmurrfit-meals');
    const [macroTargets, setMacroTargets] = useStickyState<MacroTargets>(INITIAL_MOCK_TARGETS, 'jonmurrfit-macroTargets');
    const [trainingProgram, setTrainingProgram] = useStickyState<TrainingProgram | null>(null, 'jonmurrfit-program');
    const [weightLogs, setWeightLogs] = useStickyState<WeightLog[]>([
        { date: '2024-07-01', weightKg: 86.0 },
        { date: '2024-07-08', weightKg: 85.2 },
        { date: '2024-07-15', weightKg: 85.0 },
        { date: '2024-07-22', weightKg: 84.4 },
        { date: '2024-07-29', weightKg: 84.1 },
    ], 'jonmurrfit-weightLogs');
    const [photos, setPhotos] = useStickyState<PhotoBundle[]>([], 'jonmurrfit-photos');
    const [autoAdjustMacros, setAutoAdjustMacros] = useStickyState<boolean>(true, 'jonmurrfit-autoAdjustMacros');
    const [quickAddMeals, setQuickAddMeals] = useStickyState<{name: string, items: FoodItem[]}[]>(INITIAL_QUICK_ADD_MEALS, 'jonmurrfit-quickAddMeals');
    
    const [waterLogs, setWaterLogs] = useStickyState<WaterLog[]>([], 'jonmurrfit-waterLogs');
    const [waterGoal, setWaterGoal] = useStickyState<number>(128, 'jonmurrfit-waterGoal');
    const [milestones, setMilestones] = useStickyState<Milestone[]>([], 'jonmurrfit-milestones');
    const [celebrationMilestone, setCelebrationMilestone] = useState<Milestone | null>(null);

    const [weightUnit, setWeightUnit] = useStickyState<'kg' | 'lbs'>('kg', 'jonmurrfit-weightUnit');
    const [waterUnit, setWaterUnit] = useStickyState<'oz' | 'ml'>('oz', 'jonmurrfit-waterUnit');
    const [isLoadingPlan, setIsLoadingPlan] = useState(false);
    
    const lastWeightLog = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weightKg : 84;
    const [currentWeightKg, setCurrentWeightKg] = useStickyState<number>(lastWeightLog, 'jonmurrfit-currentWeight');
    const [weightGoalKg, setWeightGoalKg] = useStickyState<number>(80, 'jonmurrfit-weightGoal');

    const [savedWorkouts, setSavedWorkouts] = useStickyState<SavedWorkout[]>([], 'jonmurrfit-savedWorkouts');
    const [workoutHistory, setWorkoutHistory] = useStickyState<WorkoutHistory>([], 'jonmurrfit-workoutHistory');
    const [progressionPreference, setProgressionPreference] = useStickyState<ProgressionPreference>('Balanced', 'jonmurrfit-progressionPreference');

    const [favoriteExercises, setFavoriteExercises] = useStickyState<Exercise[]>([], 'jonmurrfit-favorites');
    const [drafts, setDrafts] = useStickyState<WorkoutDraft[]>([], 'jonmurrfit-drafts');

    const [generatedMealPlan, setGeneratedMealPlan] = useStickyState<GeneratedMealPlan | null>(null, 'jonmurrfit-generatedMealPlan');
    const [activeMealPlan, setActiveMealPlan] = useStickyState<GeneratedMealPlan | null>(null, 'jonmurrfit-activeMealPlan');
    const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);
    
    const { 
        gamificationData, 
        levelInfo, 
        lootInventory, 
        feedbackQueue, 
        awardXpWithContext, 
        updateStreak, 
        logAIUsage, 
        dismissFeedback 
    } = useGamification();

    useEffect(() => {
        const needsNormalization = savedWorkouts.some(sw => sw.status === undefined || sw.status === null);
        if (needsNormalization) {
            setSavedWorkouts(prev => prev.map(sw => ({
                ...sw,
                status: sw.status ?? 'inactive'
            })));
        }
    }, []);

    useEffect(() => {
        const initializeFromDatabase = async () => {
            try {
                const healthCheck = await checkDatabaseHealth();
                
                if (healthCheck.missingTables) {
                    setShowSetupModal(true);
                    setIsInitializing(false);
                    return;
                }
                
                const todayDate = new Date().toISOString().split('T')[0];
                
                const profile = await userService.getProfile();
                if (profile) {
                    setUser(profile);
                } else {
                    await userService.updateProfile(MOCK_USER);
                }

                const targets = await userService.getMacroTargets();
                if (targets) {
                    setMacroTargets(targets);
                } else {
                    await userService.updateMacroTargets(INITIAL_MOCK_TARGETS);
                }

                const todaysMeals = await mealService.getMealsForDate(todayDate);
                setMeals(todaysMeals);

                const program = await workoutService.getActiveProgram();
                setTrainingProgram(program);

                const weights = await progressService.getWeightLogs();
                setWeightLogs(weights);

                const allWaterLogs = await progressService.getAllWaterLogs();
                setWaterLogs(allWaterLogs);

                const quickMeals = await mealService.getQuickAddMeals();
                if (quickMeals.length > 0) {
                    setQuickAddMeals(quickMeals);
                } else {
                    for (const meal of INITIAL_QUICK_ADD_MEALS) {
                        await mealService.addQuickAddMeal(meal.name, meal.items);
                    }
                }

                const activePlan = await mealPlanService.getActiveMealPlan();
                if (activePlan) {
                    setActiveMealPlan(activePlan);
                }

                setIsInitializing(false);
            } catch (error) {
                console.error('Error initializing from database:', error);
                setIsInitializing(false);
            }
        };

        initializeFromDatabase();
    }, []);

    const handleRetrySetup = async () => {
        setShowSetupModal(false);
        setIsInitializing(true);
        
        const healthCheck = await checkDatabaseHealth();
        
        if (healthCheck.missingTables) {
            setShowSetupModal(true);
            setIsInitializing(false);
            return;
        }
        
        window.location.reload();
    };

    // Note: Date-based meal clearing removed - now handled by Supabase getMealsForDate() filter

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysWaterIntake = waterLogs.find(log => log.date === todayStr)?.intake ?? 0;

    const setTodaysWaterIntake = useCallback(async (intakeOrCallback: number | ((prev: number) => number)) => {
        const oldIntake = waterLogs.find(log => log.date === todayStr)?.intake ?? 0;
        const newIntake = typeof intakeOrCallback === 'function' ? intakeOrCallback(oldIntake) : intakeOrCallback;
        
        try {
            await progressService.updateWaterLog(todayStr, newIntake);
            setWaterLogs(prevLogs => {
                const newLogs = prevLogs.filter(log => log.date !== todayStr);
                newLogs.push({ date: todayStr, intake: newIntake });
                return newLogs;
            });

            // Count water days EXCLUDING today, then add today if it meets goal
            const waterDaysExcludingToday = waterLogs.filter(log => 
                log.date !== todayStr && log.intake >= waterGoal
            ).length;
            
            await awardXpWithContext(10, 'Logged water intake', 'water_log', {
                waterDays: waterDaysExcludingToday + (newIntake >= waterGoal ? 1 : 0)
            });
            
            if(oldIntake < waterGoal && newIntake >= waterGoal) {
                await updateStreak('water');
            }
        } catch (error) {
            console.error('Error updating water intake:', error);
        }
    }, [setWaterLogs, todayStr, waterLogs, awardXpWithContext, updateStreak, waterGoal]);

    const addMilestone = useCallback((newMilestone: Omit<Milestone, 'id' | 'date'>) => {
        const date = new Date().toISOString().split('T')[0];
        const id = `${date}-${newMilestone.type}`;
        setMilestones(prev => {
            if (prev.some(m => m.id === id)) return prev;
            const fullMilestone: Milestone = { ...newMilestone, id, date };
            setCelebrationMilestone(fullMilestone);
            return [...prev, fullMilestone].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
    }, [setMilestones]);
    
    useEffect(() => {
        if (waterGoal > 0 && todaysWaterIntake >= waterGoal) {
            addMilestone({
                type: 'WATER_GOAL_TODAY',
                title: 'Hydration Goal Reached!',
                description: `Great job hitting your water intake of ${waterGoal}oz today.`,
            });
        }
    }, [todaysWaterIntake, waterGoal, addMilestone]);

    const macrosToday: DailyMacros = meals.reduce((acc, meal) => {
        meal.items.forEach(item => {
            acc.calories += item.calories;
            acc.protein += item.protein;
            acc.carbs += item.carbs;
            acc.fat += item.fat;
        });
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const dailyLogs = getWeekLogs(macrosToday);
    const todaysWorkout = trainingProgram?.workouts.find(w => w.day === (new Date().getDay() || 7));
    const isTrainingDay = !!todaysWorkout;
    const activeMacroTargets = autoAdjustMacros && isTrainingDay ? macroTargets.training : macroTargets.rest;

    useEffect(() => {
        const checkMacroGoalCompletion = async () => {
            if (meals.length === 0) return;
            
            const tolerance = 0.05;
            const caloriesMatch = Math.abs(macrosToday.calories - activeMacroTargets.calories) / activeMacroTargets.calories <= tolerance;
            const proteinMatch = macrosToday.protein >= activeMacroTargets.protein * 0.95;
            const carbsMatch = Math.abs(macrosToday.carbs - activeMacroTargets.carbs) / activeMacroTargets.carbs <= tolerance;
            const fatMatch = Math.abs(macrosToday.fat - activeMacroTargets.fat) / activeMacroTargets.fat <= tolerance;
            
            const allMacrosHit = caloriesMatch && proteinMatch && carbsMatch && fatMatch;
            
            if (allMacrosHit) {
                const lastMacroAwardDate = localStorage.getItem('jonmurrfit-lastMacroAward');
                const todayDate = new Date().toISOString().split('T')[0];
                
                if (lastMacroAwardDate !== todayDate) {
                    await awardXpWithContext(50, 'Hit all macro goals', 'macro_complete', {
                        macrosHit: true,
                        proteinHit: proteinMatch,
                        caloriesHit: caloriesMatch
                    });
                    localStorage.setItem('jonmurrfit-lastMacroAward', todayDate);
                }
            } else if (proteinMatch) {
                const lastProteinDate = localStorage.getItem('jonmurrfit-lastProteinCheck');
                const todayDate = new Date().toISOString().split('T')[0];
                
                if (lastProteinDate !== todayDate) {
                    await awardXpWithContext(0, 'Check protein badge', 'protein_check', {
                        proteinHit: true
                    });
                    localStorage.setItem('jonmurrfit-lastProteinCheck', todayDate);
                }
            }
        };
        
        checkMacroGoalCompletion();
    }, [macrosToday, activeMacroTargets, meals.length, awardXpWithContext]);

    const addMeal = useCallback(async (type: Meal['type'], items: FoodItem[]) => {
        if (items.length === 0) return;
        const newMeal: Meal = { id: new Date().toISOString(), type, items, timestamp: new Date() };
        
        try {
            const savedMeal = await mealService.addMeal(newMeal);
            const newMealCount = meals.length + 1;
            setMeals(prevMeals => [...prevMeals, savedMeal]);
            
            await awardXpWithContext(30, 'Logged meal', 'meal_log', {
                mealCount: newMealCount
            });
            await updateStreak('meal');
        } catch (error) {
            console.error('Error adding meal:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
                alert('⚠️ Database Setup Required\n\nYour database tables need to be created first. Please follow the setup instructions in the modal to apply the schema.sql file to your Supabase project.');
                setShowSetupModal(true);
            } else {
                alert('Failed to save meal. Please check your database connection.');
            }
        }
    }, [setMeals, awardXpWithContext, updateStreak, meals.length, setShowSetupModal]);
    
    const removeFoodItem = useCallback(async (mealId: string, itemIndex: number) => {
        try {
            const meal = meals.find(m => m.id === mealId);
            if (!meal) return;
            
            const newItems = meal.items.filter((_, index) => index !== itemIndex);
            
            if (newItems.length === 0) {
                await mealService.deleteMeal(mealId, meal.timestamp);
                setMeals(prevMeals => prevMeals.filter(m => m.id !== mealId));
            } else {
                await mealService.deleteMeal(mealId, meal.timestamp);
                const updatedMealData = { type: meal.type, items: newItems, timestamp: meal.timestamp };
                const savedMeal = await mealService.addMeal(updatedMealData);
                setMeals(prevMeals => prevMeals.map(m => m.id === mealId ? savedMeal : m));
            }
        } catch (error) {
            console.error('Error removing food item:', error);
        }
    }, [meals, setMeals]);
    
    const addQuickAddMeal = useCallback((item: { name: string, calories: number, protein: number, carbs: number, fat: number }) => {
        const newFoodItem: FoodItem = { ...item, quantity: 1, unit: 'serving' };
        setQuickAddMeals(prev => [...prev, { name: item.name, items: [newFoodItem] }]);
    }, [setQuickAddMeals]);

    const addSavedWorkout = useCallback((program: TrainingProgram, name: string, tags: string[], showAlert: boolean = true) => {
        const newSavedWorkout: SavedWorkout = { ...program, id: `sw-${Date.now()}`, programName: name, tags, isPinned: false, status: 'inactive' };
        setSavedWorkouts(prev => {
            if (prev.some(sw => sw.programName === newSavedWorkout.programName && JSON.stringify(sw.workouts) === JSON.stringify(newSavedWorkout.workouts))) {
                if(showAlert) alert(`${name} is already in your library.`);
                return prev;
            }
            if(showAlert) alert(`${name} has been saved to your library!`);
            return [...prev, newSavedWorkout];
        });
    }, [setSavedWorkouts]);
    
    const generatePlan = async (preferences: WorkoutPlanPreferences) => {
        setIsLoadingPlan(true);
        const plan = await generateWorkoutPlan(preferences);
        if (plan) {
            setTrainingProgram(plan);
            await logAIUsage('workout_plan');
        } else {
            alert("Failed to generate a workout plan. Please try again.");
        }
        setIsLoadingPlan(false);
    };

    const handleGenerateMealPlan = async (preferences: NutritionPlanPreferences) => {
        setIsGeneratingMealPlan(true);
        setGeneratedMealPlan(null);
        const plan = await generateMealPlan(preferences);
        if (plan) {
            setGeneratedMealPlan(plan);
            await logAIUsage('meal_plan');
        } else {
            alert("Failed to generate a meal plan. Please try again.");
        }
        setIsGeneratingMealPlan(false);
    };

    const handleActivateMealPlan = (plan: GeneratedMealPlan) => {
        setActiveMealPlan(plan);
        const newTargets = { calories: plan.dailyPlan.totalCalories, protein: plan.dailyPlan.totalProtein, carbs: plan.dailyPlan.totalCarbs, fat: plan.dailyPlan.totalFat };
        setMacroTargets({ rest: newTargets, training: newTargets });
        setGeneratedMealPlan(null);
        alert(`${plan.planName} has been activated!`);
    };
    
    const handleDeactivateMealPlan = () => setActiveMealPlan(null);

    const updateActiveMealPlan = useCallback((updatedPlan: GeneratedMealPlan) => {
        setActiveMealPlan(updatedPlan);
        const newTargets = { calories: updatedPlan.dailyPlan.totalCalories, protein: updatedPlan.dailyPlan.totalProtein, carbs: updatedPlan.dailyPlan.totalCarbs, fat: updatedPlan.dailyPlan.totalFat };
        setMacroTargets({ rest: newTargets, training: newTargets });
    }, [setActiveMealPlan, setMacroTargets]);

    const activateGeneratedProgram = useCallback((program: TrainingProgram) => {
        const newSavedWorkout: SavedWorkout = { ...program, id: `sw-${Date.now()}`, programName: program.programName, tags: program.preferences?.goal ? [program.preferences.goal] : [], isPinned: false, status: 'inactive' };
        setSavedWorkouts(prev => prev.some(sw => sw.programName === newSavedWorkout.programName) ? prev : [...prev, newSavedWorkout]);
        const activeProgram: TrainingProgram = { ...program };
        delete activeProgram.preferences;
        setTrainingProgram(activeProgram);
        setActiveScreen('home');
    }, [setSavedWorkouts, setTrainingProgram]);

    const updateSavedWorkout = useCallback((updatedWorkout: SavedWorkout) => {
        setSavedWorkouts(prev => prev.map(sw => sw.id === updatedWorkout.id ? updatedWorkout : sw));
    }, [setSavedWorkouts]);

    const setActiveWorkout = useCallback((workoutId: string) => {
        setSavedWorkouts(prev => prev.map(sw => ({
            ...sw,
            status: sw.id === workoutId ? 'active' : (sw.status === 'draft' ? 'draft' : 'inactive')
        })));
    }, [setSavedWorkouts]);

    const deleteSavedWorkout = useCallback((workoutId: string) => {
        setSavedWorkouts(prev => prev.filter(sw => sw.id !== workoutId));
    }, [setSavedWorkouts]);

    const startSavedWorkout = useCallback((workout: SavedWorkout) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const programToStart: TrainingProgram = JSON.parse(JSON.stringify(workout));
        programToStart.workouts.forEach(w => {
            w.completed = false;
            w.exercises.forEach(e => e.sets.forEach(s => { s.completed = false; delete s.actualReps; delete s.actualWeight; delete s.rpe; }));
        });
        setTrainingProgram(programToStart);
        updateSavedWorkout({ ...workout, lastPerformed: todayStr });
        setActiveScreen('train');
    }, [setTrainingProgram, updateSavedWorkout]);

    const completeWorkout = useCallback(async (completedWorkout: Workout) => {
        const dateCompleted = new Date().toISOString().split('T')[0];
        const newHistory = [...workoutHistory, { ...completedWorkout, dateCompleted }];
        setWorkoutHistory(newHistory);
        
        await awardXpWithContext(200, 'Completed workout', 'workout_complete', {
            workoutCount: newHistory.length
        });
        await updateStreak('workout');
    }, [workoutHistory, setWorkoutHistory, awardXpWithContext, updateStreak]);

    const toggleFavoriteExercise = useCallback((exercise: Exercise) => {
        setFavoriteExercises(prev => {
            const isFavorite = prev.some(fav => fav.name.toLowerCase() === exercise.name.toLowerCase());
            if (isFavorite) return prev.filter(fav => fav.name.toLowerCase() !== exercise.name.toLowerCase());
            const cleanExercise: Exercise = { id: exercise.id, name: exercise.name, category: exercise.category, isFavorite: true, sets: exercise.sets.map(({ id, targetReps, restMinutes }) => ({ id, targetReps, restMinutes, completed: false })) };
            return [...prev, cleanExercise];
        });
    }, [setFavoriteExercises]);

    const saveDraft = useCallback((program: TrainingProgram, draftId?: string) => {
        if (!program.programName && !program.workouts.some(w => w.exercises.length > 0)) return;
        setDrafts(prev => {
            const now = new Date();
            const newDraft: WorkoutDraft = { ...program, id: draftId || `draft-${now.getTime()}`, lastModified: now.toISOString() };
            const existingIndex = prev.findIndex(d => d.id === newDraft.id);
            let updatedDrafts;
            if (existingIndex > -1) {
                updatedDrafts = prev.filter(d => d.id !== newDraft.id);
                updatedDrafts.unshift(newDraft);
            } else updatedDrafts = [newDraft, ...prev];
            return updatedDrafts.slice(0, 5);
        });
    }, [setDrafts]);

    const deleteDraft = useCallback((draftId: string) => setDrafts(prev => prev.filter(d => d.id !== draftId)), [setDrafts]);

    const renderScreen = () => {
        switch (activeScreen) {
            case 'home': return <HomeScreen user={user} macros={macrosToday} macroTargets={macroTargets} setMacroTargets={setMacroTargets} trainingProgram={trainingProgram} dailyLogs={dailyLogs} meals={meals} setActiveScreen={setActiveScreen} autoAdjustMacros={autoAdjustMacros} savedWorkouts={savedWorkouts} startSavedWorkout={startSavedWorkout} workoutHistory={workoutHistory} gamificationData={gamificationData} levelInfo={levelInfo} lootInventory={lootInventory} />;
            case 'train': return <TrainScreen program={trainingProgram} setProgram={setTrainingProgram} generatePlan={generatePlan} activateGeneratedProgram={activateGeneratedProgram} isLoading={isLoadingPlan} weightUnit={weightUnit} savedWorkouts={savedWorkouts} addSavedWorkout={addSavedWorkout} updateSavedWorkout={updateSavedWorkout} setActiveWorkout={setActiveWorkout} deleteSavedWorkout={deleteSavedWorkout} startSavedWorkout={startSavedWorkout} workoutHistory={workoutHistory} completeWorkout={completeWorkout} progressionPreference={progressionPreference} setProgressionPreference={setProgressionPreference} favoriteExercises={favoriteExercises} toggleFavoriteExercise={toggleFavoriteExercise} drafts={drafts} saveDraft={saveDraft} deleteDraft={deleteDraft} />;
            case 'log': return <LogScreen meals={meals} addMeal={addMeal} removeFoodItem={removeFoodItem} quickAddMeals={quickAddMeals} addQuickAddMeal={addQuickAddMeal} onGenerateMealPlan={handleGenerateMealPlan} isGeneratingMealPlan={isGeneratingMealPlan} generatedMealPlan={generatedMealPlan} onActivateMealPlan={handleActivateMealPlan} activeMealPlan={activeMealPlan} onDeactivateMealPlan={handleDeactivateMealPlan} onUpdateActiveMealPlan={updateActiveMealPlan} user={user} currentWeightKg={currentWeightKg} weightUnit={weightUnit}/>;
            case 'progress': return <ProgressScreen user={user} photos={photos} setPhotos={setPhotos} dailyLogs={dailyLogs} macroTargets={activeMacroTargets} weightLogs={weightLogs} setWeightLogs={setWeightLogs} currentWeightKg={currentWeightKg} setCurrentWeightKg={setCurrentWeightKg} weightGoalKg={weightGoalKg} setWeightGoalKg={setWeightGoalKg} waterIntake={todaysWaterIntake} setWaterIntake={setTodaysWaterIntake} waterGoal={waterGoal} setWaterGoal={setWaterGoal} weightUnit={weightUnit} setWeightUnit={setWeightUnit} waterUnit={waterUnit} setWaterUnit={setWaterUnit} waterLogs={waterLogs} milestones={milestones} addMilestone={addMilestone} celebrationMilestone={celebrationMilestone} setCelebrationMilestone={setCelebrationMilestone} gamificationData={gamificationData} levelInfo={levelInfo} lootInventory={lootInventory} />;
            case 'coach': return <CoachScreen />;
            case 'gamification': return <GamificationScreen gamificationData={gamificationData} levelInfo={levelInfo} lootInventory={lootInventory} />;
            default: return <HomeScreen user={user} macros={macrosToday} macroTargets={macroTargets} setMacroTargets={setMacroTargets} trainingProgram={trainingProgram} dailyLogs={dailyLogs} meals={meals} setActiveScreen={setActiveScreen} autoAdjustMacros={autoAdjustMacros} savedWorkouts={savedWorkouts} startSavedWorkout={startSavedWorkout} workoutHistory={workoutHistory} gamificationData={gamificationData} levelInfo={levelInfo} lootInventory={lootInventory} />;
        }
    };

    if (isInitializing) {
        return (
            <div className="max-w-lg mx-auto bg-black min-h-screen flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-zinc-700 border-t-green-500 rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-400 text-lg">Loading your fitness data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto bg-black min-h-screen font-sans">
            {showSetupModal && <SetupModal onRetry={handleRetrySetup} />}
            <main className="h-full">
                <Suspense fallback={<ScreenLoader />}>
                    {renderScreen()}
                </Suspense>
            </main>
            <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
            {feedbackQueue[0] && <GamificationFeedback feedback={feedbackQueue[0]} onDismiss={dismissFeedback} />}
        </div>
    );
};

export default App;
