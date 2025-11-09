
import React, { useState, useEffect } from 'react';
import { DailyMacros, MacroDayTarget, UserProfile, Workout, DailyLog, Meal, Screen, MacroTargets, SavedWorkout, TrainingProgram, WorkoutHistory, GamificationState, LevelInfo, Challenge } from '../types';
import { ArrowsRightLeftIcon, PencilIcon, ChevronRightIcon, PinIcon, TrophyIcon, ArrowLeftIcon, FireIcon } from '../components/Icons';

interface HomeScreenProps {
  user: UserProfile;
  macros: DailyMacros;
  macroTargets: MacroTargets;
  setMacroTargets: (targets: MacroTargets) => void;
  trainingProgram: TrainingProgram | null;
  dailyLogs: DailyLog[];
  meals: Meal[];
  setActiveScreen: (screen: Screen) => void;
  autoAdjustMacros: boolean;
  savedWorkouts: SavedWorkout[];
  startSavedWorkout: (workout: SavedWorkout) => void;
  workoutHistory: WorkoutHistory;
  gamificationData: GamificationState;
  levelInfo: LevelInfo;
}

type DayStatus = 'completed' | 'partial' | 'missed' | 'future';

const CalendarDay: React.FC<{
    date: Date;
    status: DayStatus;
    isToday: boolean;
}> = ({ date, status, isToday }) => {
    
    const dayAbbreviation = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayOfMonth = date.getDate();

    let ringColor = 'text-zinc-700'; // Default for past, non-completed days
    if (status === 'completed') ringColor = 'text-green-500';
    else if (status === 'partial') ringColor = 'text-yellow-500';
    else if (status === 'missed') ringColor = 'text-red-500';

    let ringShadowClass = '';
    // Override for today's special styling
    if (isToday) {
        ringColor = status === 'completed' ? 'text-green-500' : 'text-amber-400';
        ringShadowClass = status === 'completed' 
            ? 'drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]' // Green shadow for completed
            : 'drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]'; // Gold shadow for default today
    }

    const showRing = status !== 'future' || isToday;

    return (
        <div className="flex flex-col items-center space-y-2 w-12">
            <p className={`text-xs font-bold ${isToday ? 'text-white' : 'text-zinc-500'}`}>{dayAbbreviation}</p>
            <div className="relative w-10 h-10 flex items-center justify-center">
                {showRing && (
                    <svg className={`w-full h-full absolute ${ringShadowClass}`} viewBox="0 0 44 44">
                         <circle
                            className={`${ringColor} transition-colors duration-300`}
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="transparent"
                            r="20"
                            cx="22"
                            cy="22"
                        />
                    </svg>
                )}
                 <div className="w-9 h-9 rounded-full flex items-center justify-center">
                    <p className={`text-base font-bold ${isToday ? 'text-white' : 'text-zinc-300'}`}>{dayOfMonth}</p>
                </div>
            </div>
        </div>
    );
};

const DashboardHeader: React.FC<{
    user: UserProfile;
    dailyLogs: DailyLog[];
    macroTargets: MacroTargets;
    trainingProgram: TrainingProgram | null;
    workoutHistory: WorkoutHistory;
    autoAdjustMacros: boolean;
    gamificationData: GamificationState;
}> = ({ user, dailyLogs, macroTargets, trainingProgram, workoutHistory, autoAdjustMacros, gamificationData }) => {
    const [displayDate, setDisplayDate] = useState(new Date());

    const getDayStatus = (date: Date): DayStatus => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateCopy = new Date(date);
        dateCopy.setHours(0, 0, 0, 0);

        if (dateCopy > today) return 'future';

        const dateStr = dateCopy.toISOString().split('T')[0];
        const dayOfWeek = dateCopy.getDay() === 0 ? 7 : dateCopy.getDay();

        // Check Macro Completion
        const log = dailyLogs.find(l => l.date === dateStr);
        const workoutForDay = trainingProgram?.workouts.find(w => w.day === dayOfWeek);
        const isTrainingDayForLog = autoAdjustMacros && !!(workoutForDay && workoutForDay.exercises.length > 0);
        const targetsForDay = isTrainingDayForLog ? macroTargets.training : macroTargets.rest;
        
        const macrosMet = log && targetsForDay.protein > 0 &&
                          log.macros.protein >= targetsForDay.protein;

        // Check Workout Completion
        let workoutCompleted = false;
        if (workoutForDay && workoutForDay.exercises.length > 0) {
            if (dateCopy.getTime() === today.getTime()) {
                workoutCompleted = workoutForDay.completed;
            } else {
                // Check history for past workouts
                workoutCompleted = workoutHistory.some(w => w.dateCompleted === dateStr && w.id === workoutForDay.id);
            }
        } else {
             // For a rest day, workout completion is trivially true if macros are met.
            workoutCompleted = true;
        }

        if (isTrainingDayForLog) { // It's a training day
            if (macrosMet && workoutCompleted) return 'completed';
            if (macrosMet || workoutCompleted) return 'partial';
            if (dateCopy < today) return 'missed';
        } else { // It's a rest day
            if (macrosMet) return 'completed';
            if (dateCopy < today) return 'missed';
        }

        return 'future'; // Default for today if no action taken
    };
    
    const changeWeek = (direction: 'prev' | 'next') => {
        setDisplayDate(current => {
            const newDate = new Date(current);
            newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
            return newDate;
        });
    };

    const weekDays: Date[] = [];
    const startOfWeek = new Date(displayDate);
    const dayOfWeek = displayDate.getDay();
    startOfWeek.setDate(displayDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Set to Monday

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        weekDays.push(date);
    }
    const today = new Date();
    
    const overallStreak = Math.max(gamificationData.streaks.meal.current, gamificationData.streaks.workout.current, gamificationData.streaks.water.current);

    return (
        <div>
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold">Jonmurr.fit</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{overallStreak}</span>
                    <span className="text-2xl" role="img" aria-label="streak flame">🔥</span>
                </div>
            </div>
            
            <p className="text-zinc-400 mt-2">Hello {user.name}, ready to crush your goals?</p>

            <div className="flex items-center justify-between mt-4">
                <button onClick={() => changeWeek('prev')} className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex justify-around flex-1">
                    {weekDays.map(date => (
                        <CalendarDay
                            key={date.toISOString()}
                            date={date}
                            status={getDayStatus(date)}
                            isToday={date.toDateString() === today.toDateString()}
                        />
                    ))}
                </div>
                <button onClick={() => changeWeek('next')} className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


const MacroInput: React.FC<{label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({label, value, onChange}) => (
    <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">{label}</label>
        <input 
            type="number"
            value={value}
            onChange={onChange}
            className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500"
        />
    </div>
);

const EditMacrosModal: React.FC<{
  initialTargets: MacroTargets;
  onSave: (newTargets: MacroTargets) => void;
  onClose: () => void;
}> = ({ initialTargets, onSave, onClose }) => {
  const [targets, setTargets] = useState(initialTargets);

  const handleSave = () => {
    // Basic validation to ensure numbers are not negative
    const sanitizedTargets = {
        rest: {
            calories: Math.max(0, targets.rest.calories),
            protein: Math.max(0, targets.rest.protein),
            carbs: Math.max(0, targets.rest.carbs),
            fat: Math.max(0, targets.rest.fat),
        },
        training: {
            calories: Math.max(0, targets.training.calories),
            protein: Math.max(0, targets.training.protein),
            carbs: Math.max(0, targets.training.carbs),
            fat: Math.max(0, targets.training.fat),
        }
    };
    onSave(sanitizedTargets);
    onClose();
  };

  const handleInputChange = (day: 'rest' | 'training', macro: keyof MacroDayTarget, value: string) => {
    setTargets(prev => ({
        ...prev,
        [day]: {
            ...prev[day],
            [macro]: parseInt(value, 10) || 0
        }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-800" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6 text-white text-center">Edit Macro Goals</h2>
        
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-green-400 mb-3 text-lg">Rest Day</h3>
                <div className="grid grid-cols-2 gap-4">
                    <MacroInput label="Calories" value={targets.rest.calories} onChange={e => handleInputChange('rest', 'calories', e.target.value)} />
                    <MacroInput label="Protein (g)" value={targets.rest.protein} onChange={e => handleInputChange('rest', 'protein', e.target.value)} />
                    <MacroInput label="Carbs (g)" value={targets.rest.carbs} onChange={e => handleInputChange('rest', 'carbs', e.target.value)} />
                    <MacroInput label="Fat (g)" value={targets.rest.fat} onChange={e => handleInputChange('rest', 'fat', e.target.value)} />
                </div>
            </div>
            
            <div>
                <h3 className="font-semibold text-green-400 mt-6 mb-3 text-lg">Training Day</h3>
                <div className="grid grid-cols-2 gap-4">
                    <MacroInput label="Calories" value={targets.training.calories} onChange={e => handleInputChange('training', 'calories', e.target.value)} />
                    <MacroInput label="Protein (g)" value={targets.training.protein} onChange={e => handleInputChange('training', 'protein', e.target.value)} />
                    <MacroInput label="Carbs (g)" value={targets.training.carbs} onChange={e => handleInputChange('training', 'carbs', e.target.value)} />
                    <MacroInput label="Fat (g)" value={targets.training.fat} onChange={e => handleInputChange('training', 'fat', e.target.value)} />
                </div>
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

const GoalCompleteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
        <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-sm border border-zinc-700 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-green-500/20 to-transparent"></div>
            <div className="relative">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-2xl font-bold mb-2 text-white">Macros Goal Complete!</h2>
                <p className="text-zinc-300 mb-6">Incredible work today! You've hit all your macro targets. Keep fueling your progress.</p>
                <button onClick={onClose} className="px-8 py-2 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors">
                    Awesome!
                </button>
            </div>
        </div>
    </div>
);

const MacroProgress: React.FC<{ label: string; value: number; target: number; color: string }> = ({ label, value, target, color }) => {
  const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const progressColorClass = percentage >= 95 ? 'bg-green-400' : color;
  const isOverTarget = value > target;

  return (
    <div className="text-center">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-base font-bold text-white">
        <span className={isOverTarget ? 'pulse-orange' : ''}>{Math.round(value)}g</span> / <span className="text-zinc-400">{Math.round(target)}g</span>
      </p>
      <div className="w-full bg-zinc-700 rounded-full h-1.5 mt-2">
        <div className={`${progressColorClass} transition-all duration-300`} style={{ width: `${percentage}%`, height: '100%', borderRadius: 'inherit' }}></div>
      </div>
    </div>
  );
};

const MealIcon: React.FC<{type: Meal['type']}> = ({type}) => {
    let emoji = '🍽️';
    if (type === 'Breakfast') emoji = '🥐';
    else if (type === 'Lunch') emoji = '🥪';
    else if (type === 'Dinner') emoji = '🍝';
    else if (type === 'Snacks') emoji = '🥨';
    return <span className="text-3xl">{emoji}</span>
};

const RecentMealCard: React.FC<{ meals: Meal[]; setActiveScreen: (screen: Screen) => void }> = ({ meals, setActiveScreen }) => {
  const lastMeal = meals.length > 0 ? meals[meals.length - 1] : null;

  return (
    <div
      className="bg-zinc-900 rounded-2xl p-4 mt-4 cursor-pointer hover:bg-zinc-800 transition-colors"
      onClick={() => setActiveScreen('log')}
      role="button"
      aria-label="View and log meals"
    >
      {lastMeal ? (
        <div className="relative h-20 flex justify-center items-center">
            <div className="absolute w-[90%] bg-zinc-800 h-full rounded-xl transform -translate-y-2"></div>
            <div className="absolute w-[95%] bg-zinc-700/80 h-full rounded-xl transform -translate-y-1"></div>
            <div className="relative w-full bg-zinc-700 h-full rounded-xl flex items-center p-4">
                <div className="bg-zinc-600 p-3 rounded-lg flex-shrink-0">
                    <MealIcon type={lastMeal.type} />
                </div>
                <div className="ml-4 flex-1 overflow-hidden">
                    <p className={`font-bold truncate ${{
                        Breakfast: 'text-yellow-400',
                        Lunch: 'text-sky-400',
                        Dinner: 'text-purple-400',
                        Snacks: 'text-zinc-400',
                    }[lastMeal.type]}`}>{lastMeal.type}</p>
                    <p className="text-sm text-zinc-300 truncate">
                        {lastMeal.items.map(i => i.name).join(', ')}
                    </p>
                </div>
                <p className="font-semibold text-green-400 pl-2">
                    {Math.round(lastMeal.items.reduce((s,i) => s + i.calories, 0))} kcal
                </p>
            </div>
        </div>
      ) : (
        <div className="text-center">
            <div className="relative h-20 flex justify-center items-center">
                <div className="absolute w-[90%] bg-zinc-800/80 h-full rounded-xl transform -translate-y-2"></div>
                <div className="absolute w-[95%] bg-zinc-800/90 h-full rounded-xl transform -translate-y-1"></div>
                <div className="relative w-full bg-zinc-800 h-full rounded-xl flex items-center p-4">
                    <div className="bg-zinc-700 p-3 rounded-lg">
                        <span className="text-3xl">🥗</span>
                    </div>
                    <div className="ml-4 flex-1 space-y-2">
                        <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                        <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
            <p className="mt-4 text-zinc-500">Tap + to add your first meal of the day</p>
        </div>
      )}
    </div>
  );
};

const QuickStartCard: React.FC<{
    savedWorkouts: SavedWorkout[];
    onStart: (workout: SavedWorkout) => void;
}> = ({ savedWorkouts, onStart }) => {
    const pinnedOrRecent = savedWorkouts
        .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (a.lastPerformed && b.lastPerformed) return new Date(b.lastPerformed).getTime() - new Date(a.lastPerformed).getTime();
            if (a.lastPerformed) return -1;
            if (b.lastPerformed) return 1;
            return 0;
        })
        .slice(0, 2);

    if (pinnedOrRecent.length === 0) {
        return null;
    }

    return (
        <div>
            <h2 className="text-xl font-bold">Quick Start</h2>
            <div className="mt-4 space-y-3">
                {pinnedOrRecent.map(workout => (
                    <button 
                        key={workout.id} 
                        onClick={() => onStart(workout)}
                        className="w-full bg-zinc-900 rounded-2xl p-4 text-left hover:bg-zinc-800 transition-colors flex items-center gap-4"
                    >
                        <div className="p-3 bg-zinc-800 rounded-lg">
                            <TrophyIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-white flex items-center gap-2">
                                {workout.programName}
                                {workout.isPinned && <PinIcon className="w-4 h-4 text-amber-400 fill-amber-400" />}
                            </p>
                            <p className="text-sm text-zinc-400">
                                {workout.workouts.length} days &bull; {workout.tags.slice(0, 2).join(', ')}
                            </p>
                        </div>
                        <ChevronRightIcon className="w-6 h-6 text-zinc-600" />
                    </button>
                ))}
            </div>
        </div>
    );
};

const XPBar: React.FC<{
    gamificationData: GamificationState;
    levelInfo: LevelInfo;
    setActiveScreen: (screen: Screen) => void;
}> = ({ gamificationData, levelInfo, setActiveScreen }) => (
    <div
        className="bg-zinc-900 rounded-2xl p-4 cursor-pointer hover:bg-zinc-800 transition-colors active:scale-[0.98]"
        onClick={() => setActiveScreen('gamification')}
        role="button"
        aria-label="View gamification dashboard"
        tabIndex={0}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveScreen('gamification');
            }
        }}
    >
        <div className="flex justify-between items-center mb-2 text-sm">
            <p className="font-bold text-green-400">{levelInfo.level}: LVL {levelInfo.numericLevel}</p>
            <p className="font-mono text-zinc-400">
                <span className="font-bold text-white">{gamificationData.xp}</span> / {isFinite(levelInfo.xpForNext) ? levelInfo.xpForNext : 'MAX'} XP
            </p>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${levelInfo.progress}%` }}></div>
        </div>
        <div className="mt-2 text-center text-xs text-green-400 opacity-70">Tap to view full stats</div>
    </div>
);

const StreaksWidget: React.FC<{ streaks: GamificationState['streaks'] }> = ({ streaks }) => (
    <div className="bg-zinc-900 rounded-2xl p-4">
        <h3 className="font-bold text-white mb-3 text-lg">Daily Streaks</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-2xl">🏋️</p>
                <p className="font-bold text-xl">{streaks.workout.current}</p>
                <p className="text-xs text-zinc-400">Workouts</p>
            </div>
            <div>
                <p className="text-2xl">🥗</p>
                <p className="font-bold text-xl">{streaks.meal.current}</p>
                <p className="text-xs text-zinc-400">Meals</p>
            </div>
            <div>
                <p className="text-2xl">💧</p>
                <p className="font-bold text-xl">{streaks.water.current}</p>
                <p className="text-xs text-zinc-400">Water</p>
            </div>
        </div>
    </div>
);

const ChallengesWidget: React.FC<{ challenges: Challenge[]; }> = ({ challenges }) => {
    const activeChallenge = challenges.find(c => !c.isCompleted);
    if (!activeChallenge) return null;

    const progress = (activeChallenge.progress / activeChallenge.goal) * 100;

    return (
        <div className="bg-zinc-900 rounded-2xl p-4">
            <h3 className="font-bold text-white mb-2 text-lg">Weekly Challenge</h3>
            <p className="text-sm text-zinc-300 font-semibold">{activeChallenge.title}</p>
            <p className="text-xs text-zinc-400 mb-3">{activeChallenge.description}</p>
            <div className="flex justify-between items-center mb-1 text-xs text-zinc-400">
                <span>Progress</span>
                <span>{activeChallenge.progress} / {activeChallenge.goal}</span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
                <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};

const HomeScreenComponent: React.FC<HomeScreenProps> = ({ user, macros, macroTargets, setMacroTargets, trainingProgram, dailyLogs, meals, setActiveScreen, autoAdjustMacros, savedWorkouts, startSavedWorkout, workoutHistory, gamificationData, levelInfo }) => {
  const [isEditingMacros, setIsEditingMacros] = useState(false);
  const [showGoalCompleteModal, setShowGoalCompleteModal] = useState(false);
  
  const todayRaw = new Date();
  const todayDayIndex = todayRaw.getDay() === 0 ? 7 : todayRaw.getDay(); // Monday: 1, Sunday: 7

  const isTrainingDay = !!(trainingProgram?.workouts.find(w => w.day === todayDayIndex) && trainingProgram.workouts.find(w => w.day === todayDayIndex)!.exercises.length > 0);
  const activeTargetsForDay = autoAdjustMacros && isTrainingDay ? macroTargets.training : macroTargets.rest;
  const activeGoalType = autoAdjustMacros && isTrainingDay ? 'training' : 'rest';

  const [goalView, setGoalView] = useState<'rest' | 'training'>(activeGoalType);
  const displayedTargets = macroTargets[goalView];
  
  useEffect(() => {
    const newActiveGoalType = autoAdjustMacros && isTrainingDay ? 'training' : 'rest';
    setGoalView(newActiveGoalType);
  }, [autoAdjustMacros, isTrainingDay]);

  const proteinGoalMet = macros.protein >= displayedTargets.protein;
  const carbsGoalMet = macros.carbs >= displayedTargets.carbs;
  const fatGoalMet = macros.fat >= displayedTargets.fat;

  // Goal for UI display, based on the toggle view
  const goalReached = proteinGoalMet && carbsGoalMet && fatGoalMet && displayedTargets.protein > 0;

  // Goal for modal logic, based on the actual day's targets
  const goalReachedForDay = 
      macros.protein >= activeTargetsForDay.protein &&
      macros.carbs >= activeTargetsForDay.carbs &&
      macros.fat >= activeTargetsForDay.fat &&
      activeTargetsForDay.protein > 0;
      
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const goalMetKey = `jonmurrfit-goalMet-${today}`;

    if (goalReachedForDay && !localStorage.getItem(goalMetKey)) {
        setShowGoalCompleteModal(true);
        localStorage.setItem(goalMetKey, 'true');
    }
  }, [goalReachedForDay]);

  const exceededMacros = [];
  if (macros.protein > displayedTargets.protein) exceededMacros.push('Protein');
  if (macros.carbs > displayedTargets.carbs) exceededMacros.push('Carbs');
  if (macros.fat > displayedTargets.fat) exceededMacros.push('Fat');
  
  // Show the warning only if some macros are over, but the overall goal isn't met yet.
  const showExceededWarning = exceededMacros.length > 0 && !goalReached;

  const caloriesConsumed = macros.calories;
  const calorieTarget = displayedTargets.calories;
  const caloriePercentage = calorieTarget > 0 ? (caloriesConsumed / calorieTarget) * 100 : 0;
  
  const remaining = {
    protein: Math.max(0, displayedTargets.protein - macros.protein),
    carbs: Math.max(0, displayedTargets.carbs - macros.carbs),
    fat: Math.max(0, displayedTargets.fat - macros.fat),
  };
  
  const calorieRingColor = goalReached ? 'text-amber-400' : 'text-green-400';
  const calorieRingAnimation = goalReached ? 'animate-pulse' : '';

  const handleStartWorkout = (workout: SavedWorkout) => {
    startSavedWorkout(workout);
  };

  return (
    <div className="p-4 space-y-6 text-white pb-24">
      <DashboardHeader 
        user={user} 
        dailyLogs={dailyLogs} 
        macroTargets={macroTargets} 
        trainingProgram={trainingProgram} 
        workoutHistory={workoutHistory} 
        autoAdjustMacros={autoAdjustMacros}
        gamificationData={gamificationData}
      />

      <XPBar gamificationData={gamificationData} levelInfo={levelInfo} setActiveScreen={setActiveScreen} />

      <div className="bg-zinc-900 rounded-2xl p-6 flex flex-col items-center relative">
        <button onClick={() => setIsEditingMacros(true)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10" aria-label="Edit macro goals">
            <PencilIcon className="w-5 h-5" />
        </button>
        
        {showExceededWarning && (
            <div className="text-center text-yellow-500 text-xs font-semibold mb-3">
                <p>⚠️ You’ve gone over your macro goal for: {exceededMacros.join(', ')}</p>
            </div>
        )}

        <div className="flex items-center justify-between w-full">
            {/* Left Panel: Daily Goal */}
            <div className="text-left text-sm space-y-1 w-28">
                 <button 
                    onClick={() => setGoalView(prev => prev === 'rest' ? 'training' : 'rest')}
                    className="flex items-center space-x-2 text-zinc-400 font-semibold mb-2 hover:text-white transition-colors group"
                    aria-label={`Switch to view ${goalView === 'rest' ? 'training' : 'rest'} day goals`}
                >
                    <span>{goalView === 'rest' ? 'Rest Goal' : 'Train Goal'}</span>
                    <ArrowsRightLeftIcon className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </button>
                <p className="text-zinc-300">P: <span className="font-bold text-white">{displayedTargets.protein}g</span></p>
                <p className="text-zinc-300">C: <span className="font-bold text-white">{displayedTargets.carbs}g</span></p>
                <p className="text-zinc-300">F: <span className="font-bold text-white">{displayedTargets.fat}g</span></p>
            </div>

            {/* Center: Calorie Circle */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-zinc-700"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className={`${calorieRingColor} ${calorieRingAnimation} transition-all duration-500`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${caloriePercentage}, 100`}
                  strokeLinecap="round"
                  transform="rotate(90 18 18)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{Math.round(caloriesConsumed)}</span>
                <span className="text-zinc-400 text-sm">kcal</span>
              </div>
            </div>

            {/* Right Panel: You Still Need */}
            <div className="text-right text-sm space-y-1 w-28">
                {goalReached ? (
                     <div className="h-full flex items-center justify-center">
                        <p className="text-green-400 font-semibold text-center">Goal Complete! 🎉</p>
                    </div>
                ) : (
                    <>
                        <p className="text-zinc-400 font-semibold mb-2">You still need</p>
                        <p className="font-semibold text-sky-400">{Math.round(remaining.protein)}g P</p>
                        <p className="font-semibold text-orange-400">{Math.round(remaining.carbs)}g C</p>
                        <p className="font-semibold text-pink-400">{Math.round(remaining.fat)}g F</p>
                    </>
                )}
            </div>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full pt-4">
            <MacroProgress label="Protein" value={macros.protein} target={displayedTargets.protein} color="bg-sky-400" />
            <MacroProgress label="Carbs" value={macros.carbs} target={displayedTargets.carbs} color="bg-orange-400" />
            <MacroProgress label="Fat" value={macros.fat} target={displayedTargets.fat} color="bg-pink-400" />
        </div>
      </div>
      
      {isEditingMacros && <EditMacrosModal initialTargets={macroTargets} onSave={setMacroTargets} onClose={() => setIsEditingMacros(false)} />}
      {showGoalCompleteModal && <GoalCompleteModal onClose={() => setShowGoalCompleteModal(false)} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StreaksWidget streaks={gamificationData.streaks} />
        <ChallengesWidget challenges={gamificationData.challenges} />
      </div>

      <QuickStartCard savedWorkouts={savedWorkouts} onStart={handleStartWorkout} />

      <div>
        <h2 className="text-xl font-bold">Recently uploaded</h2>
        <RecentMealCard meals={meals} setActiveScreen={setActiveScreen} />
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Today's Workout</h2>
        {(() => {
            if (!trainingProgram) {
                return (
                    <div className="text-center py-4">
                        <p className="text-zinc-400 mb-4">No active training plan.</p>
                        <button
                          onClick={() => setActiveScreen('train')}
                          className="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                          Create Workout Plan
                        </button>
                    </div>
                );
            }

            const todaysWorkout = trainingProgram.workouts.find(w => w.day === todayDayIndex);
            const isWorkoutScheduledToday = todaysWorkout && todaysWorkout.exercises.length > 0;

            if (isWorkoutScheduledToday) {
                if (todaysWorkout.completed) {
                    return (
                        <div className="text-center py-4">
                            <div className="text-5xl mb-2" role="img" aria-label="Checkmark">✅</div>
                            <p className="font-semibold text-green-400">Workout Completed!</p>
                            <p className="text-zinc-400">Awesome job, come back tomorrow.</p>
                        </div>
                    );
                }
                return (
                    <div>
                        <p className="text-lg font-semibold text-green-400">{todaysWorkout.focus}</p>
                        <p className="text-zinc-400">
                            {`${todaysWorkout.exercises.length} exercises`}
                        </p>
                        <button
                          onClick={() => setActiveScreen('train')}
                          className="mt-4 w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg transition-colors"
                        >
                          Start Workout
                        </button>
                    </div>
                );
            } else {
                // It's a rest day, find the next workout
                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const scheduledWorkouts = trainingProgram.workouts
                    .filter(w => w.exercises.length > 0)
                    .sort((a, b) => a.day - b.day);
                
                if (scheduledWorkouts.length === 0) {
                     return (
                        <div className="text-center py-4">
                            <p className="text-zinc-400">Your plan has no scheduled workouts.</p>
                        </div>
                    );
                }

                let nextWorkout = scheduledWorkouts.find(w => w.day > todayDayIndex);
                if (!nextWorkout) {
                    nextWorkout = scheduledWorkouts[0]; // Wrap around to the start of the week
                }
                
                const nextWorkoutDayName = dayNames[nextWorkout.day % 7];

                return (
                     <div className="text-center py-4">
                        <p className="text-zinc-300 font-semibold">Today is a Rest Day</p>
                        <p className="text-zinc-400 mt-1">
                            Next up: <span className="font-semibold text-zinc-300">{nextWorkout.focus}</span> on {nextWorkoutDayName}.
                        </p>
                    </div>
                );
            }
        })()}
      </div>
    </div>
  );
};
export const HomeScreen = React.memo(HomeScreenComponent);
