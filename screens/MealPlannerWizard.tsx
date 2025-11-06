
import React, { useState } from 'react';
import { NutritionPlanPreferences, Gender, UserProfile, NutritionGoal, ActivityLevel, EatingPattern, MealsPerDay, MetabolismType, SleepDuration, WaterIntakeLevel, MealSimplicity, FoodBudget } from '../types';
import { ArrowLeftIcon } from '../components/Icons';

interface MealPlannerWizardProps {
    user: UserProfile;
    currentWeightKg: number;
    weightUnit: 'kg' | 'lbs';
    onClose: () => void;
    onGenerate: (preferences: NutritionPlanPreferences) => void;
}

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
        {icon && <span className="text-2xl">{icon}</span>}
        <p className={`font-semibold ${isSelected ? 'text-green-400' : 'text-zinc-300'}`}>{label}</p>
    </button>
);

const KG_TO_LBS = 2.20462;

const MealPlannerWizard: React.FC<MealPlannerWizardProps> = ({ user, currentWeightKg, weightUnit, onClose, onGenerate }) => {
    const [step, setStep] = useState(1);
    const totalSteps = 8;
    const [preferences, setPreferences] = useState<Partial<NutritionPlanPreferences>>({
        heightCm: user.heightCm,
        currentWeight: parseFloat((weightUnit === 'lbs' ? currentWeightKg * KG_TO_LBS : currentWeightKg).toFixed(1)),
        currentWeightUnit: weightUnit,
    });

    const updatePref = <K extends keyof NutritionPlanPreferences>(key: K, value: NutritionPlanPreferences[K]) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const isStepComplete = () => {
        switch (step) {
            case 1: return !!preferences.gender && !!preferences.age;
            case 2: return !!preferences.goal;
            case 3: return !!preferences.activityLevel;
            case 4: return !!preferences.eatingPattern && !!preferences.mealsPerDay;
            case 5: return !!preferences.metabolismType;
            case 6: return !!preferences.sleep && !!preferences.waterIntake;
            case 7: return !!preferences.mealSimplicity && !!preferences.foodBudget;
            case 8: return true; // Review step
            default: return false;
        }
    }
    
    const handleGenerate = () => {
        if(Object.keys(preferences).length < 15) {
            alert('Please complete all fields.');
            return;
        }
        onGenerate(preferences as NutritionPlanPreferences);
    }
    
    const renderStepContent = () => {
        switch (step) {
            case 1: return <Step1 prefs={preferences} update={updatePref} />;
            case 2: return <Step2 prefs={preferences} update={updatePref} />;
            case 3: return <Step3 prefs={preferences} update={updatePref} />;
            case 4: return <Step4 prefs={preferences} update={updatePref} />;
            case 5: return <Step5 prefs={preferences} update={updatePref} />;
            case 6: return <Step6 prefs={preferences} update={updatePref} />;
            case 7: return <Step7 prefs={preferences} update={updatePref} />;
            case 8: return <Step8 />;
            default: return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black flex flex-col p-4 z-50 animate-fade-in">
            <div className="w-full max-w-md mx-auto flex flex-col h-full">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                         <h2 className="text-xl font-bold text-white">AI Meal Planner</h2>
                         <button onClick={onClose} className="text-zinc-400 font-bold text-2xl">&times;</button>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2">{renderStepContent()}</div>

                <div className="flex justify-between items-center mt-8">
                    <button onClick={() => setStep(s => Math.max(s - 1, 1))} disabled={step === 1} className="p-3 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors disabled:opacity-50">
                        <ArrowLeftIcon className="w-5 h-5"/>
                    </button>
                    {step < totalSteps ? (
                        <button onClick={() => setStep(s => s + 1)} disabled={!isStepComplete()} className="px-6 py-3 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors disabled:opacity-50 flex-1 ml-4">
                            Next
                        </button>
                    ) : (
                        <button onClick={handleGenerate} className="px-6 py-3 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors flex-1 ml-4">
                            Generate My Plan
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const StepTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3 className="text-lg font-semibold text-center text-white mb-6">{children}</h3>;

const Step1: React.FC<{ prefs: Partial<NutritionPlanPreferences>, update: Function }> = ({ prefs, update }) => {
    const genders: Gender[] = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];
    return <div className="space-y-6">
        <StepTitle>Basic Info</StepTitle>
        <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Gender</label>
            <div className="grid grid-cols-2 gap-2">
                {genders.map(g => <StepOptionButton key={g} label={g} isSelected={prefs.gender === g} onClick={() => update('gender', g)} className="text-sm p-3" />)}
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Age</label>
            <input type="number" value={prefs.age || ''} onChange={e => update('age', parseInt(e.target.value))} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" />
        </div>
        <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Target Weight (Optional)</label>
            <input type="number" value={prefs.targetWeight || ''} onChange={e => update('targetWeight', parseFloat(e.target.value) || undefined)} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" />
        </div>
    </div>;
};

const Step2: React.FC<{ prefs: Partial<NutritionPlanPreferences>, update: Function }> = ({ prefs, update }) => {
    const goals: { name: NutritionGoal; icon: string; }[] = [ { name: 'Lose Body Fat', icon: '🔥' }, { name: 'Gain Muscle / Weight', icon: '💪' }, { name: 'Maintain / Recomp', icon: '⚡' } ];
    return <div><StepTitle>What is your main nutrition goal?</StepTitle><div className="space-y-3">{goals.map(g => <StepOptionButton key={g.name} label={g.name} icon={g.icon} isSelected={prefs.goal === g.name} onClick={() => update('goal', g.name)} />)}</div></div>;
};

const Step3: React.FC<{ prefs: Partial<NutritionPlanPreferences>, update: Function }> = ({ prefs, update }) => {
    const levels: ActivityLevel[] = ['Little to no exercise', '1–2 days/week', '3–4 days/week', '5+ days/week'];
    return <div><StepTitle>How active are you in a typical week?</StepTitle><div className="space-y-3">{levels.map(l => <StepOptionButton key={l} label={l} isSelected={prefs.activityLevel === l} onClick={() => update('activityLevel', l)} />)}</div></div>;
};

const Step4: React.FC<{ prefs: Partial<NutritionPlanPreferences>, update: Function }> = ({ prefs, update }) => {
    const patterns: EatingPattern[] = ['I mostly eat out', 'I cook sometimes', 'I cook most meals', 'I follow a structured meal routine'];
    const meals: MealsPerDay[] = ['2 meals', '3 meals', '4+ meals'];
    return <div className="space-y-8">
        <div><StepTitle>How would you describe your current eating pattern?</StepTitle><div className="space-y-3">{patterns.map(p => <StepOptionButton key={p} label={p} isSelected={prefs.eatingPattern === p} onClick={() => update('eatingPattern', p)} />)}</div></div>
        <div><StepTitle>How many meals per day do you prefer?</StepTitle><div className="space-y-3">{meals.map(m => <StepOptionButton key={m} label={m} isSelected={prefs.mealsPerDay === m} onClick={() => update('mealsPerDay', m)} />)}</div></div>
        <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Any dietary restrictions or allergies?</label>
            <input type="text" value={prefs.dietaryRestrictions || ''} onChange={e => update('dietaryRestrictions', e.target.value)} placeholder="e.g., gluten-free, vegetarian" className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" />
        </div>
         <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Foods you dislike or avoid?</label>
            <input type="text" value={prefs.dislikes || ''} onChange={e => update('dislikes', e.target.value)} placeholder="e.g., mushrooms, spicy food" className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" />
        </div>
    </div>;
};

const Step5: React.FC<{ prefs: Partial<NutritionPlanPreferences>, update: Function }> = ({ prefs, update }) => {
    const types: MetabolismType[] = ['I gain fat easily', 'I struggle to gain weight', 'I gain/lose fairly evenly'];
    return <div><StepTitle>Which one best describes your body?</StepTitle><div className="space-y-3">{types.map(t => <StepOptionButton key={t} label={t} isSelected={prefs.metabolismType === t} onClick={() => update('metabolismType', t)} />)}</div></div>;
};

const Step6: React.FC<{ prefs: Partial<NutritionPlanPreferences>, update: Function }> = ({ prefs, update }) => {
    const sleep: SleepDuration[] = ['Less than 6 hours', '6–8 hours', '8+ hours'];
    const water: WaterIntakeLevel[] = ['Low (<60 oz/day)', 'Moderate (60–100 oz/day)', 'High (100+ oz/day)'];
    return <div className="space-y-8">
        <div><StepTitle>Sleep (avg per night)</StepTitle><div className="space-y-3">{sleep.map(s => <StepOptionButton key={s} label={s} isSelected={prefs.sleep === s} onClick={() => update('sleep', s)} />)}</div></div>
        <div><StepTitle>Water Intake</StepTitle><div className="space-y-3">{water.map(w => <StepOptionButton key={w} label={w} isSelected={prefs.waterIntake === w} onClick={() => update('waterIntake', w)} />)}</div></div>
    </div>;
};

const Step7: React.FC<{ prefs: Partial<NutritionPlanPreferences>, update: Function }> = ({ prefs, update }) => {
    const simplicity: MealSimplicity[] = ['Very simple (repeat meals)', 'Moderate variety', 'High variety'];
    const budget: FoodBudget[] = ['$50–80/week', '$80–150/week', '$150+/week'];
     return <div className="space-y-8">
        <div><StepTitle>How simple should your meal plan be?</StepTitle><div className="space-y-3">{simplicity.map(s => <StepOptionButton key={s} label={s} isSelected={prefs.mealSimplicity === s} onClick={() => update('mealSimplicity', s)} />)}</div></div>
        <div><StepTitle>Food Budget</StepTitle><div className="space-y-3">{budget.map(b => <StepOptionButton key={b} label={b} isSelected={prefs.foodBudget === b} onClick={() => update('foodBudget', b)} />)}</div></div>
    </div>;
};

const Step8 = () => (
    <div className="text-center p-4 flex flex-col items-center justify-center h-full">
        <div className="text-6xl mb-6">✅</div>
        <h3 className="text-2xl font-bold text-white mb-4">You're All Set!</h3>
        <p className="text-zinc-400">We have everything we need to build your personalized plan. Hit generate to let the AI work its magic.</p>
    </div>
);

export default MealPlannerWizard;
