
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { WeightLog, DailyLog, MacroDayTarget, UserProfile, PhotoBundle, PhotoAngle, PhotoEntry, WaterLog, Milestone, MilestoneType, GamificationState, LevelInfo, EarnedBadge } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import { WaterDropIcon, PencilIcon, ChevronRightIcon, SelfieIcon, TrashIcon, CameraIcon, ArrowsRightLeftIcon, ListIcon, ChartBarIconOutline, TrophyIcon, FireIcon, PlusIcon } from '../components/Icons';
import { ALL_BADGES } from '../utils/gamification';
import { FullHeatMap } from '../components/heatmap/FullHeatMap';
import { useHeatMap } from '../hooks/useHeatMap';

type WeightUnit = 'kg' | 'lbs';
type WaterUnit = 'oz' | 'ml';

const KG_TO_LBS = 2.20462;
const OZ_TO_ML = 29.5735;

interface ProgressScreenProps {
  user: UserProfile;
  weightLogs: WeightLog[];
  // FIX: Allow functional updates for setWeightLogs
  setWeightLogs: (logs: WeightLog[] | ((prev: WeightLog[]) => WeightLog[])) => void;
  currentWeightKg: number;
  setCurrentWeightKg: (weight: number) => void;
  weightGoalKg: number;
  setWeightGoalKg: (goal: number) => void;
  photos: PhotoBundle[];
  setPhotos: (bundles: PhotoBundle[] | ((prev: PhotoBundle[]) => PhotoBundle[])) => void;
  dailyLogs: DailyLog[];
  macroTargets: MacroDayTarget;
  waterIntake: number;
  // FIX: Allow functional updates for setWaterIntake
  setWaterIntake: (oz: number | ((prev: number) => number)) => void;
  waterGoal: number;
  setWaterGoal: (goal: number) => void;
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  waterUnit: WaterUnit;
  setWaterUnit: (unit: WaterUnit) => void;
  waterLogs: WaterLog[];
  milestones: Milestone[];
  addMilestone: (milestone: Omit<Milestone, 'id' | 'date'>) => void;
  celebrationMilestone: Milestone | null;
  setCelebrationMilestone: (milestone: Milestone | null) => void;
  gamificationData: GamificationState;
  levelInfo: LevelInfo;
  awardXp: (amount: number) => void;
  unlockBadge: (badgeId: string) => void;
}

const getIconForMilestone = (type: MilestoneType) => {
    switch (type) {
        case 'WEIGHT_GOAL': return '🏆';
        case 'WATER_STREAK': return '💧';
        case 'FIRST_PHOTOS': return '📸';
        case 'CONSISTENCY_STREAK': return '🔥';
        case 'WATER_GOAL_TODAY': return '🎉';
        case 'BADGE_UNLOCKED': return '🌟';
        default: return '⭐';
    }
};

const CelebrationModal: React.FC<{ milestone: Milestone, onClose: () => void }> = ({ milestone, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-sm border border-zinc-700 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-green-500/20 to-transparent"></div>
                <div className="relative">
                    <div className="text-6xl mb-4 animate-bounce">{getIconForMilestone(milestone.type)}</div>
                    <h2 className="text-2xl font-bold mb-2 text-white">{milestone.title}</h2>
                    <p className="text-zinc-300 mb-6">{milestone.description}</p>
                    <button onClick={onClose} className="px-8 py-2 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors">
                        Awesome!
                    </button>
                </div>
            </div>
        </div>
    );
};

const LogWeightModal: React.FC<{
    currentWeightKg: number;
    goalKg: number;
    onSave: (newWeight: number, newGoal: number) => void;
    onClose: () => void;
    unit: WeightUnit;
    setUnit: (unit: WeightUnit) => void;
}> = ({ currentWeightKg, goalKg, onSave, onClose, unit, setUnit }) => {
    const [modalUnit, setModalUnit] = useState<WeightUnit>(unit);

    const convertToUnit = (kg: number, targetUnit: WeightUnit) => (targetUnit === 'lbs' ? kg * KG_TO_LBS : kg);
    const convertToKg = (val: number, sourceUnit: WeightUnit) => (sourceUnit === 'lbs' ? val / KG_TO_LBS : val);

    const [weight, setWeight] = useState(
        (currentWeightKg || 0) > 0 ? convertToUnit(currentWeightKg || 0, modalUnit).toFixed(1) : ''
    );
    const [goal, setGoal] = useState(convertToUnit(goalKg || 0, modalUnit).toFixed(1));
    
    const handleSave = () => {
        const weightInKg = weight ? convertToKg(parseFloat(weight), modalUnit) : currentWeightKg;
        const goalInKg = goal ? convertToKg(parseFloat(goal), modalUnit) : goalKg;
        onSave(weightInKg || 0, goalInKg || 0);
    };

    const handleUnitChange = (newUnit: WeightUnit) => {
        if (newUnit === modalUnit) return;
        
        const oldUnit = modalUnit;
        setModalUnit(newUnit);
        setUnit(newUnit);

        const currentWeightNum = parseFloat(weight);
        if (!isNaN(currentWeightNum)) {
            const weightInKg = convertToKg(currentWeightNum, oldUnit);
            setWeight(convertToUnit(weightInKg, newUnit).toFixed(1));
        }

        const currentGoalNum = parseFloat(goal);
        if (!isNaN(currentGoalNum)) {
            const goalInKg = convertToKg(currentGoalNum, oldUnit);
            setGoal(convertToUnit(goalInKg, newUnit).toFixed(1));
        }
    };

    const UnitToggle: React.FC = () => (
        <div className="flex items-center space-x-1 bg-zinc-800 p-1 rounded-md">
            <button onClick={() => handleUnitChange('kg')} className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${modalUnit === 'kg' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>kg</button>
            <button onClick={() => handleUnitChange('lbs')} className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${modalUnit === 'lbs' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>lbs</button>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-800" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Update Weight</h2>
                    <UnitToggle />
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Current Weight ({modalUnit})</label>
                        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" placeholder="Enter weight"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Goal Weight ({modalUnit})</label>
                        <input type="number" value={goal} onChange={e => setGoal(e.target.value)} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500"/>
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

const EditWaterGoalModal: React.FC<{
    currentGoal: number; // Goal is always in oz in state
    onSave: (newGoal: number) => void;
    onClose: () => void;
    unit: WaterUnit;
}> = ({ currentGoal, onSave, onClose, unit }) => {
    const isMl = unit === 'ml';
    const goalInUnit = isMl ? Math.round(currentGoal * OZ_TO_ML) : currentGoal;
    const [goal, setGoal] = useState(goalInUnit.toString());

    const handleSave = () => {
        const goalNum = parseInt(goal, 10) || 0;
        const goalInOz = isMl ? Math.round(goalNum / OZ_TO_ML) : goalNum;
        onSave(goalInOz);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-800" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-white text-center">Update Daily Water Goal</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Daily Goal ({unit})</label>
                        <input type="number" value={goal} onChange={e => setGoal(e.target.value)} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500"/>
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

const AddCustomWaterModal: React.FC<{
    onSave: (amountToAdd: number) => void;
    onClose: () => void;
    unit: WaterUnit;
}> = ({ onSave, onClose, unit }) => {
    const [amount, setAmount] = useState('');

    const handleSave = () => {
        const amountNum = parseInt(amount, 10) || 0;
        const amountInOz = unit === 'ml' ? Math.round(amountNum / OZ_TO_ML) : amountNum;
        onSave(amountInOz);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-800" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-white text-center">Add Custom Amount</h2>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Amount ({unit})</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500"/>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors">Add</button>
                </div>
            </div>
        </div>
    );
};

const WeightGoalCard: React.FC<{
    currentWeightKg: number;
    weightGoalKg: number;
    onLogWeight: () => void;
    unit: WeightUnit;
    setUnit: (unit: WeightUnit) => void;
}> = ({ currentWeightKg, weightGoalKg, onLogWeight, unit, setUnit }) => {
    const displayWeight = unit === 'lbs' ? ((currentWeightKg || 0) * KG_TO_LBS).toFixed(1) : (currentWeightKg || 0).toFixed(1);
    const displayGoal = unit === 'lbs' ? ((weightGoalKg || 0) * KG_TO_LBS).toFixed(1) : (weightGoalKg || 0).toFixed(1);

    return (
        <div className="bg-zinc-900 rounded-2xl p-4 flex justify-between items-center">
            <div className="flex gap-6 items-center">
                <div>
                    <p className="text-sm text-zinc-400">My Weight</p>
                    <p className="text-2xl font-bold">{displayWeight} <span className="text-base font-normal text-zinc-500">{unit}</span></p>
                </div>
                <div>
                    <p className="text-sm text-zinc-400">Goal</p>
                    <p className="text-2xl font-bold">{displayGoal} <span className="text-base font-normal text-zinc-500">{unit}</span></p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center space-x-1 bg-zinc-800 p-1 rounded-md">
                    <button onClick={() => setUnit('kg')} className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${unit === 'kg' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>kg</button>
                    <button onClick={() => setUnit('lbs')} className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${unit === 'lbs' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>lbs</button>
                </div>
                <button onClick={onLogWeight} className="flex items-center gap-2 text-green-400 font-semibold hover:text-green-300 transition-colors">
                    <span className="hidden sm:inline">Log Weight</span>
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

const WaterTrendChartCard: React.FC<{ logs: WaterLog[], goal: number, unit: WaterUnit }> = ({ logs, goal, unit }) => {
    const last7DaysData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const log = logs.find(l => l.date === dateStr);
            const intakeInOz = log?.intake ?? 0;
            data.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                intake: unit === 'ml' ? Math.round(intakeInOz * OZ_TO_ML) : intakeInOz,
            });
        }
        return data;
    }, [logs, unit]);
    
    const goalInUnit = unit === 'ml' ? Math.round(goal * OZ_TO_ML) : goal;

    return (
      <div className="bg-zinc-900 rounded-2xl p-4">
        <h2 className="text-xl font-bold">Hydration Chart</h2>
        <p className="text-sm text-zinc-400 mb-4">Your intake over the last 7 days.</p>
        <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7DaysData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                    <YAxis stroke="#a1a1aa" fontSize={12} />
                    <Tooltip cursor={{fill: '#3f3f4680'}} contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46'}} labelFormatter={() => ''} formatter={(value: number) => [`${value.toFixed(1)} ${unit}`, 'Intake']} />
                    <ReferenceLine y={goalInUnit} label={{ value: `Goal`, position: 'insideTopLeft', fill: '#f97316' }} stroke="#f97316" strokeDasharray="3 3" />
                    <Bar dataKey="intake" name={`Intake (${unit})`}>
                        {last7DaysData.map((entry, index) => (
                            <Bar key={`cell-${index}`} fill={entry.intake >= goalInUnit ? "#34d399" : "#38bdf8"} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    );
};

const HydrationStreakCard: React.FC<{ logs: WaterLog[], goal: number }> = ({ logs, goal }) => {
    const streak = useMemo(() => {
        if (goal <= 0) return 0;
        let count = 0;
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const sortedLogs = [...logs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const logMap = new Map(sortedLogs.map(log => [log.date, log]));

        for (let i = 0; i < 365; i++) { // Check up to a year
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const log = logMap.get(dateStr);

            if (log && log.intake >= goal) {
                count++;
            } else {
                // If it's today and the goal isn't met, don't break the streak from yesterday.
                // If it's a past day and the goal isn't met, break.
                if (i > 0) {
                    break;
                }
            }
        }
        return count;
    }, [logs, goal]);

    return (
        <div className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-4">
            <WaterDropIcon className={`w-10 h-10 text-sky-400 ${streak > 0 ? 'animate-pulse' : ''}`} />
            <div>
                <p className="text-xl font-bold text-white">{streak} Day Streak</p>
                <p className="text-sm text-zinc-400">Keep hitting your hydration goal!</p>
            </div>
        </div>
    );
};


const WaterTrackerCard: React.FC<{
    intake: number;
    goal: number;
    unit: WaterUnit;
    onAddWater: (amountInOz: number) => void;
    onEditGoal: () => void;
    onAddCustom: () => void;
    setUnit: (unit: WaterUnit) => void;
}> = ({ intake, goal, unit, onAddWater, onEditGoal, onAddCustom, setUnit }) => {
    const percentage = goal > 0 ? Math.min((intake / goal) * 100, 100) : 0;
    const radius = 38; const circumference = 2 * Math.PI * radius;
    
    const isMl = unit === 'ml';
    const intakeInUnit = isMl ? Math.round(intake * OZ_TO_ML) : parseFloat(intake.toFixed(1));
    const goalInUnit = isMl ? Math.round(goal * OZ_TO_ML) : goal;

    const quickAddSizesOz = [12, 16.9, 20, 33.8];

    return (
        <div className="bg-zinc-900 rounded-2xl p-4 relative">
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold">Water Intake</h2>
                 <button onClick={onEditGoal} className="text-zinc-500 hover:text-white transition-colors">
                    <PencilIcon className="w-5 h-5"/>
                </button>
            </div>
            <div className="flex items-center justify-between">
                <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 80 80">
                        <circle className="text-zinc-700" strokeWidth="6" stroke="currentColor" fill="transparent" r={radius} cx="40" cy="40" />
                        <circle className="text-sky-400 transition-all duration-500" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={circumference - (percentage / 100) * circumference} strokeLinecap="round" transform="rotate(-90 40 40)" stroke="currentColor" fill="transparent" r={radius} cx="40" cy="40" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <WaterDropIcon className="w-6 h-6 text-sky-400" />
                        <p className="text-xs text-zinc-400 mt-1">{Math.round(percentage)}%</p>
                    </div>
                </div>
                <div className="flex-1 text-center pl-4">
                    <p className="text-3xl font-bold">{intakeInUnit}<span className="text-base text-zinc-400"> / {goalInUnit} {unit}</span></p>
                     <div className="flex items-center justify-center space-x-1 bg-zinc-800 p-1 rounded-md mt-2 w-24 mx-auto">
                        <button onClick={() => setUnit('oz')} className={`w-1/2 py-0.5 text-xs rounded-sm transition-colors ${unit === 'oz' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>oz</button>
                        <button onClick={() => setUnit('ml')} className={`w-1/2 py-0.5 text-xs rounded-sm transition-colors ${unit === 'ml' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>ml</button>
                    </div>
                </div>
            </div>
             <div className="mt-4 space-y-2">
                <div className="grid grid-cols-4 gap-2">
                    {quickAddSizesOz.map(sizeOz => (
                        <button key={sizeOz} onClick={() => onAddWater(sizeOz)} className="bg-zinc-800 hover:bg-zinc-700 rounded-lg py-2 font-semibold transition-colors text-sm">
                            +{isMl ? Math.round(sizeOz * OZ_TO_ML) : sizeOz}
                        </button>
                    ))}
                </div>
                <button onClick={onAddCustom} className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-lg py-2 font-semibold transition-colors text-sm flex items-center justify-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Custom
                </button>
            </div>
        </div>
    )
}

const StreakCard: React.FC<{ dailyLogs: DailyLog[], targets: MacroDayTarget }> = ({ dailyLogs, targets }) => {
    let streak = 0; const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const log of [...dailyLogs].reverse()) {
        const logDate = new Date(log.date + 'T00:00:00');
        if (logDate > today) continue;
        const lowerBound = targets.calories * 0.95;
        if (logDate.getTime() === today.getTime() && log.macros.calories < lowerBound) continue;
        if (log.macros.calories >= lowerBound) streak++; else if (logDate < today) break;
    }
    return (
        <div className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-4xl">🔥</span>
            <div>
                <p className="text-xl font-bold text-white">{streak} Day Streak</p>
                <p className="text-sm text-zinc-400">Keep up the consistency!</p>
            </div>
        </div>
    );
};

// Extracted from ProgressScreen to avoid re-definition on render
const CustomWeightTooltip: React.FC<any> = ({ active, payload, label, unit }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 p-2 border border-zinc-700 rounded-md">
          <p className="label text-white">{`${label}`}</p>
          <p className="intro text-green-400">{`Weight: ${payload[0].value} ${unit}`}</p>
        </div>
      );
    }
    return null;
};

const WeightTrendCard: React.FC<{ weightLogs: WeightLog[], unit: WeightUnit, goalKg: number }> = ({ weightLogs, unit, goalKg }) => {
    const isLbs = unit === 'lbs';
    const displayGoal = isLbs ? (goalKg * KG_TO_LBS) : goalKg;

    const chartData = weightLogs.map(log => ({
        date: log.date,
        displayWeight: parseFloat((isLbs ? (log.weightKg * KG_TO_LBS) : log.weightKg).toFixed(1))
    }));

    return (
        <div className="bg-zinc-900 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">Weight Trend</h2>
            <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip content={<CustomWeightTooltip unit={unit} />} />
                <ReferenceLine y={displayGoal} label={{ value: `Goal`, position: 'insideTopLeft', fill: '#f97316' }} stroke="#f97316" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="displayWeight" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: '#34d399' }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
            </div>
      </div>
    );
};

const PhotoInput: React.FC<{ angle: PhotoAngle, preview: string | undefined, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ angle, preview, onChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="text-center">
            <p className="font-semibold capitalize mb-2 text-zinc-300">{angle}</p>
            <button
                onClick={() => inputRef.current?.click()}
                className="w-24 h-32 bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 overflow-hidden hover:bg-zinc-600 transition-colors"
            >
                {preview ? (
                    <img src={preview} alt={`${angle} preview`} className="w-full h-full object-cover" />
                ) : (
                    <CameraIcon className="w-8 h-8" />
                )}
            </button>
            <input type="file" accept="image/*" ref={inputRef} onChange={onChange} className="hidden" />
        </div>
    );
};

const UploadPhotoBundleModal: React.FC<{
    onClose: () => void;
    onSave: (data: { date: string; files: Record<PhotoAngle, File> }) => void;
}> = ({ onClose, onSave }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [previews, setPreviews] = useState<Partial<Record<PhotoAngle, string>>>({});
    const [files, setFiles] = useState<Partial<Record<PhotoAngle, File>>>({});

    const handleFileChange = (angle: PhotoAngle, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFiles(prev => ({ ...prev, [angle]: file }));
            setPreviews(prev => ({ ...prev, [angle]: URL.createObjectURL(file) }));
        }
    };

    const canSave = files.front && files.side && files.back;

    const handleSave = () => {
        if (!canSave) return;
        onSave({ date, files: files as Record<PhotoAngle, File> });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-800" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-2 text-white text-center">Upload Progress Photos</h2>
                <p className="text-sm text-zinc-400 text-center mb-6">Add all three angles for a complete snapshot of your progress.</p>
                
                <div className="mb-6 flex justify-center">
                    <div className="w-full max-w-xs">
                        <label className="block text-sm font-medium text-zinc-400 mb-1 text-left">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500 text-center"/>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <PhotoInput angle="front" preview={previews.front} onChange={(e) => handleFileChange('front', e)} />
                    <PhotoInput angle="side" preview={previews.side} onChange={(e) => handleFileChange('side', e)} />
                    <PhotoInput angle="back" preview={previews.back} onChange={(e) => handleFileChange('back', e)} />
                </div>
                
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={!canSave} className="px-6 py-2 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed">
                        Save Bundle
                    </button>
                </div>
            </div>
        </div>
    );
};

const PhotoBundleDetailModal: React.FC<{
    bundle: PhotoBundle;
    onClose: () => void;
    onDelete: (date: string) => void;
    onStartCompare: (bundle: PhotoBundle) => void;
}> = ({ bundle, onClose, onDelete, onStartCompare }) => {
    const formattedDate = new Date(bundle.date + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-800 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 flex-shrink-0 border-b border-zinc-800">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Progress on {formattedDate}</h2>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                     <div className="space-y-4">
                        {(['front', 'side', 'back'] as PhotoAngle[]).map(angle => (
                            <div key={angle} className="text-left">
                                <p className="font-semibold capitalize mb-2 text-zinc-300">{angle}</p>
                                <div className="aspect-[3/4] bg-zinc-800 rounded-lg overflow-hidden w-full">
                                    {bundle.photos[angle] ? (
                                        <img src={bundle.photos[angle]?.url} alt={`${angle} view on ${bundle.date}`} className="w-full h-full object-cover" />
                                    ) : <div className="w-full h-full flex items-center justify-center text-zinc-500">Not provided</div> }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 flex justify-between items-center flex-shrink-0 border-t border-zinc-800">
                    <button onClick={() => onDelete(bundle.date)} className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 font-semibold hover:bg-red-600/40 hover:text-red-300 transition-colors flex items-center gap-2">
                        <TrashIcon className="w-5 h-5"/>
                        <span>Delete Bundle</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={() => onStartCompare(bundle)} className="px-4 py-2 rounded-lg bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-colors flex items-center gap-2">
                            <ArrowsRightLeftIcon className="w-5 h-5"/>
                            <span>Compare</span>
                        </button>
                        <button onClick={onClose} className="px-6 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ComparisonView: React.FC<{ angle: PhotoAngle, before: PhotoBundle, after: PhotoBundle }> = ({ angle, before, after }) => (
    <div>
        <h3 className="text-lg font-bold text-center capitalize mb-3 text-zinc-300">{angle}</h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
                <div className="aspect-[3/4] bg-zinc-800 rounded-lg overflow-hidden">
                    {before.photos[angle] ? (
                        <img src={before.photos[angle]?.url} alt={`Before ${angle}`} className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-zinc-500">Not provided</div>}
                </div>
            </div>
            <div className="text-center">
                <div className="aspect-[3/4] bg-zinc-800 rounded-lg overflow-hidden">
                    {after.photos[angle] ? (
                        <img src={after.photos[angle]?.url} alt={`After ${angle}`} className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-zinc-500">Not provided</div>}
                </div>
            </div>
        </div>
    </div>
);

const PhotoComparisonModal: React.FC<{
    before: PhotoBundle;
    after: PhotoBundle;
    onClose: () => void;
}> = ({ before, after, onClose }) => {
    const formatDate = (dateStr: string) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl w-full max-w-4xl border border-zinc-800 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 flex-shrink-0 border-b border-zinc-800 text-center">
                    <h2 className="text-2xl font-bold text-white">Comparison</h2>
                    <p className="text-zinc-400">{formatDate(before.date)} vs. {formatDate(after.date)}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <ComparisonView angle="front" before={before} after={after} />
                    <ComparisonView angle="side" before={before} after={after} />
                    <ComparisonView angle="back" before={before} after={after} />
                </div>
                <div className="p-6 text-right flex-shrink-0 border-t border-zinc-800">
                     <button onClick={onClose} className="px-6 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};

const ProgressPhotosCard: React.FC<{
  photos: PhotoBundle[];
  setPhotos: (bundles: PhotoBundle[] | ((prev: PhotoBundle[]) => PhotoBundle[])) => void;
  awardXp: (amount: number) => void;
  unlockBadge: (badgeId: string) => void;
}> = ({ photos, setPhotos, awardXp, unlockBadge }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [viewingBundle, setViewingBundle] = useState<PhotoBundle | null>(null);
  const [comparisonSelection, setComparisonSelection] = useState<PhotoBundle | null>(null);
  const [comparisonView, setComparisonView] = useState<{ before: PhotoBundle; after: PhotoBundle } | null>(null);

  const handleSaveUpload = ({ date, files }: { date: string, files: Record<PhotoAngle, File> }) => {
    if (photos.length === 0) {
        unlockBadge('photogenic');
    }
    awardXp(30);

    const newBundle: PhotoBundle = {
        date,
        photos: {
            front: { id: `${date}-front`, url: URL.createObjectURL(files.front) },
            side: { id: `${date}-side`, url: URL.createObjectURL(files.side) },
            back: { id: `${date}-back`, url: URL.createObjectURL(files.back) },
        }
    };
    
    setPhotos(prev => {
        const newPhotos = prev.filter(b => b.date !== date);
        newPhotos.push(newBundle);
        return newPhotos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    setIsUploading(false);
  };
  
  const handleDeleteBundle = (date: string) => {
    setPhotos(prev => prev.filter(b => b.date !== date));
    setViewingBundle(null);
  };

  const handleStartCompare = (bundle: PhotoBundle) => {
    setComparisonSelection(bundle);
    setViewingBundle(null);
  };

  const handleCancelCompare = () => {
    setComparisonSelection(null);
  };

  const handleSelectForComparison = (secondBundle: PhotoBundle) => {
    if (!comparisonSelection || secondBundle.date === comparisonSelection.date) return;
    const firstDate = new Date(comparisonSelection.date);
    const secondDate = new Date(secondBundle.date);
    const [before, after] = firstDate < secondDate ? [comparisonSelection, secondBundle] : [secondBundle, comparisonSelection];
    setComparisonView({ before, after });
    setComparisonSelection(null);
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-4">
      <h2 className="text-xl font-bold">Progress Photos</h2>
      <p className="text-sm text-zinc-400 mt-1 mb-4">
        Upload front, side, and back photos to track your body transformation clearly. All three will be grouped by date.
      </p>

      {comparisonSelection && (
        <div className="bg-sky-900/50 border border-sky-700 rounded-lg p-3 text-center mb-4">
            <p className="text-sky-200 font-semibold">
                Comparing with {new Date(comparisonSelection.date + 'T00:00:00').toLocaleDateString()}.
            </p>
            <p className="text-sky-300">Now, select another photo bundle to compare it with.</p>
            <button onClick={handleCancelCompare} className="text-xs mt-2 text-sky-400 hover:underline">Cancel Comparison</button>
        </div>
      )}
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <button onClick={() => setIsUploading(true)} className="aspect-square bg-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
          <SelfieIcon className="w-8 h-8" />
          <span className="text-sm mt-2 font-semibold">Add Photos</span>
        </button>
        {photos.map(bundle => (
          <button 
            key={bundle.date} 
            onClick={() => comparisonSelection ? handleSelectForComparison(bundle) : setViewingBundle(bundle)}
            className={`aspect-square rounded-lg overflow-hidden relative group ${comparisonSelection ? 'ring-2 ring-sky-500' : ''}`}
            >
            <img src={bundle.photos.front?.url} alt={`Progress on ${bundle.date}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white font-bold text-center">
                {new Date(bundle.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
              </span>
            </div>
          </button>
        ))}
      </div>
      
      {isUploading && <UploadPhotoBundleModal onClose={() => setIsUploading(false)} onSave={handleSaveUpload} />}
      {viewingBundle && <PhotoBundleDetailModal bundle={viewingBundle} onClose={() => setViewingBundle(null)} onDelete={handleDeleteBundle} onStartCompare={handleStartCompare} />}
      {comparisonView && <PhotoComparisonModal before={comparisonView.before} after={comparisonView.after} onClose={() => setComparisonView(null)} />}
    </div>
  );
};

const BadgeGrid: React.FC<{ earnedBadges: EarnedBadge[] }> = ({ earnedBadges }) => {
    const earnedIds = new Set(earnedBadges.map(b => b.id));
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {ALL_BADGES.map(badge => {
                const isEarned = earnedIds.has(badge.id);
                const earnedInfo = earnedBadges.find(b => b.id === badge.id);
                return (
                    <div key={badge.id} className={`p-4 rounded-lg text-center transition-opacity ${isEarned ? 'bg-zinc-800' : 'bg-zinc-900 opacity-60'}`} title={badge.description}>
                        <span className="text-4xl">{badge.icon}</span>
                        <p className="font-bold text-sm mt-2 h-10 flex items-center justify-center">{badge.name}</p>
                        {isEarned && <p className="text-xs text-zinc-400 mt-1">Earned {new Date(earnedInfo!.earnedOn + 'T00:00:00').toLocaleDateString()}</p>}
                    </div>
                );
            })}
        </div>
    );
};

const AchievementsView: React.FC<{ gamificationData: GamificationState; levelInfo: LevelInfo }> = ({ gamificationData, levelInfo }) => (
    <div className="space-y-6">
        <div className="bg-zinc-900 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2 text-sm">
                <p className="font-bold text-green-400">{levelInfo.level}</p>
                <p className="font-mono text-zinc-400">
                    <span className="font-bold text-white">{gamificationData.xp}</span> / {isFinite(levelInfo.xpForNext) ? levelInfo.xpForNext : 'MAX'} XP
                </p>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${levelInfo.progress}%` }}></div>
            </div>
        </div>
        
        <div className="bg-zinc-900 rounded-2xl p-4">
            <h3 className="text-xl font-bold mb-3">Trophy Case</h3>
            <BadgeGrid earnedBadges={gamificationData.earnedBadges} />
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4">
            <h3 className="text-xl font-bold mb-3">Weekly Challenges</h3>
            <div className="space-y-3">
                {gamificationData.challenges.map(c => (
                     <div key={c.id}>
                        <p className="text-sm text-zinc-300 font-semibold">{c.title}</p>
                         <div className="flex justify-between items-center mb-1 text-xs text-zinc-400">
                             <span>Progress</span>
                             <span>{c.progress} / {c.goal}</span>
                         </div>
                         <div className="w-full bg-zinc-700 rounded-full h-2">
                            <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${(c.progress / c.goal) * 100}%` }}></div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ProgressTabs: React.FC<{
  activeTab: 'summary' | 'weight' | 'photos' | 'water' | 'achievements' | 'heatmap';
  setActiveTab: (tab: 'summary' | 'weight' | 'photos' | 'water' | 'achievements' | 'heatmap') => void;
}> = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'summary' as const, label: 'Summary', icon: <ListIcon className="w-5 h-5" /> },
        { id: 'weight' as const, label: 'Weight', icon: <ChartBarIconOutline className="w-5 h-5" /> },
        { id: 'photos' as const, label: 'Photos', icon: <CameraIcon className="w-5 h-5" /> },
        { id: 'water' as const, label: 'Water', icon: <WaterDropIcon className="w-5 h-5" /> },
        { id: 'heatmap' as const, label: 'Activity', icon: <FireIcon className="w-5 h-5" /> },
        { id: 'achievements' as const, label: 'Achievements', icon: <TrophyIcon className="w-5 h-5" /> },
    ];
    return (
        <div className="flex justify-around bg-zinc-900 p-2 rounded-xl">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === tab.id ? 'bg-green-500 text-black' : 'text-zinc-400 hover:bg-zinc-800'
                }`}
            >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
            </button>
        ))}
        </div>
    );
};

const ProgressScreenComponent: React.FC<ProgressScreenProps> = ({
  user,
  weightLogs,
  setWeightLogs,
  currentWeightKg,
  setCurrentWeightKg,
  weightGoalKg,
  setWeightGoalKg,
  photos,
  setPhotos,
  dailyLogs,
  macroTargets,
  waterIntake,
  setWaterIntake,
  waterGoal,
  setWaterGoal,
  weightUnit,
  setWeightUnit,
  waterUnit,
  setWaterUnit,
  waterLogs,
  milestones,
  addMilestone,
  celebrationMilestone,
  setCelebrationMilestone,
  gamificationData,
  levelInfo,
  awardXp,
  unlockBadge,
}) => {
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  const [isEditingWaterGoal, setIsEditingWaterGoal] = useState(false);
  const [isAddingCustomWater, setIsAddingCustomWater] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'weight' | 'photos' | 'water' | 'achievements' | 'heatmap'>('summary');
  
  const { heatMapData } = useHeatMap(user.id, 90);
  
  const handleSaveWeight = useCallback((newWeightKg: number, newGoalKg: number) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Milestone Check: Weight Goal
    if (weightGoalKg > 0 && currentWeightKg >= weightGoalKg && newWeightKg < weightGoalKg) {
        addMilestone({
            type: 'WEIGHT_GOAL',
            title: 'Weight Goal Reached!',
            description: `You've hit your goal of ${newGoalKg}kg. Incredible dedication!`
        });
    }

    awardXp(30);

    setCurrentWeightKg(newWeightKg);
    setWeightGoalKg(newGoalKg);
    setWeightLogs(prev => {
        const newLogs = prev.filter(log => log.date !== today);
        newLogs.push({ date: today, weightKg: newWeightKg });
        return newLogs.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    setIsLoggingWeight(false);
  }, [setCurrentWeightKg, setWeightGoalKg, setWeightLogs, addMilestone, currentWeightKg, weightGoalKg, awardXp]);

  const handleAddWater = useCallback((amountOz: number) => {
    setWaterIntake(prev => prev + amountOz);
  }, [setWaterIntake]);

  return (
    <div className="p-4 space-y-6 text-white pb-24">
      <h1 className="text-3xl font-bold">Progress</h1>
      
      <ProgressTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'summary' && (
          <div className="space-y-6">
            <WeightGoalCard currentWeightKg={currentWeightKg} weightGoalKg={weightGoalKg} onLogWeight={() => setIsLoggingWeight(true)} unit={weightUnit} setUnit={setWeightUnit} />
            <StreakCard dailyLogs={dailyLogs} targets={macroTargets} />
            <WaterTrackerCard intake={waterIntake} goal={waterGoal} onAddWater={handleAddWater} onEditGoal={() => setIsEditingWaterGoal(true)} unit={waterUnit} setUnit={setWaterUnit} onAddCustom={() => setIsAddingCustomWater(true)} />
          </div>
      )}
      {activeTab === 'weight' && (
        <div className="space-y-6">
            <WeightGoalCard currentWeightKg={currentWeightKg} weightGoalKg={weightGoalKg} onLogWeight={() => setIsLoggingWeight(true)} unit={weightUnit} setUnit={setWeightUnit} />
            <WeightTrendCard weightLogs={weightLogs} unit={weightUnit} goalKg={weightGoalKg} />
        </div>
      )}
      {activeTab === 'photos' && <ProgressPhotosCard photos={photos} setPhotos={setPhotos} awardXp={awardXp} unlockBadge={unlockBadge}/>}
      {activeTab === 'water' && (
        <div className="space-y-6">
            <WaterTrackerCard intake={waterIntake} goal={waterGoal} onAddWater={handleAddWater} onEditGoal={() => setIsEditingWaterGoal(true)} unit={waterUnit} setUnit={setWaterUnit} onAddCustom={() => setIsAddingCustomWater(true)} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WaterTrendChartCard logs={waterLogs} goal={waterGoal} unit={waterUnit} />
                <HydrationStreakCard logs={waterLogs} goal={waterGoal} />
            </div>
        </div>
      )}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Daily Activity Calendar</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Track your consistency across workouts, meals, and hydration. Tap any day to see details.
            </p>
            <FullHeatMap days={heatMapData} />
          </div>
        </div>
      )}
      {activeTab === 'achievements' && <AchievementsView gamificationData={gamificationData} levelInfo={levelInfo} />}

      {isLoggingWeight && <LogWeightModal currentWeightKg={currentWeightKg} goalKg={weightGoalKg} onSave={handleSaveWeight} onClose={() => setIsLoggingWeight(false)} unit={weightUnit} setUnit={setWeightUnit} />}
      {isEditingWaterGoal && <EditWaterGoalModal currentGoal={waterGoal} onSave={(g) => { setWaterGoal(g); setIsEditingWaterGoal(false); }} onClose={() => setIsEditingWaterGoal(false)} unit={waterUnit} />}
      {isAddingCustomWater && <AddCustomWaterModal onSave={(amount) => handleAddWater(amount)} onClose={() => setIsAddingCustomWater(false)} unit={waterUnit} />}
      {celebrationMilestone && <CelebrationModal milestone={celebrationMilestone} onClose={() => setCelebrationMilestone(null)} />}
    </div>
  );
};

// FIX: Changed default export to named export for consistency.
export const ProgressScreen = React.memo(ProgressScreenComponent);
