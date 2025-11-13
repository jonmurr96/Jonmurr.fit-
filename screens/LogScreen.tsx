import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Meal, FoodItem, GeneratedMealPlan, MacroTargets, NutritionPlanPreferences, UserProfile } from '../types';
import { CameraIcon, MicrophoneIcon, TrashIcon, PlusIcon } from '../components/Icons';
import { logFoodWithNLP, logFoodWithPhoto } from '../services/geminiService';
import MealPlannerWidget from '../components/MealPlannerWidget';
import MealPlannerWizard from './MealPlannerWizard';
import MealPlanView from './MealPlanView';
import ActiveMealPlanWidget from '../components/ActiveMealPlanWidget';
import MealPlanEditor from './MealPlanEditor';
import ManualMealPlanBuilder from '../components/ManualMealPlanBuilder';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type NewQuickAddItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface LogScreenProps {
  user: UserProfile;
  currentWeightKg: number;
  weightUnit: 'kg' | 'lbs';
  meals: Meal[];
  addMeal: (type: Meal['type'], items: FoodItem[]) => void;
  removeFoodItem: (mealId: string, itemIndex: number) => void;
  quickAddMeals: { name: string, items: FoodItem[] }[];
  addQuickAddMeal: (item: NewQuickAddItem) => void;
  onGenerateMealPlan: (preferences: NutritionPlanPreferences) => Promise<void>;
  isGeneratingMealPlan: boolean;
  generatedMealPlan: GeneratedMealPlan | null;
  onActivateMealPlan: (plan: GeneratedMealPlan) => void;
  activeMealPlan: GeneratedMealPlan | null;
  onDeactivateMealPlan: () => void;
  onUpdateActiveMealPlan: (plan: GeneratedMealPlan) => void;
}

const MealCard: React.FC<{ meal: Meal; removeFoodItem: (mealId: string, itemIndex: number) => void; }> = ({ meal, removeFoodItem }) => {
  const totalCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);
  return (
    <div className="bg-zinc-900 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-white">{meal.type}</h3>
        <p className="text-green-400 font-semibold">{Math.round(totalCalories)} kcal</p>
      </div>
      <div className="space-y-1">
        {meal.items.map((item, index) => (
          <div key={index} className="group rounded-lg hover:bg-zinc-800/50 p-2 -mx-2 transition-colors">
            <div className="flex justify-between items-center text-sm">
              <p className="text-zinc-300 flex-1 truncate pr-2">{item.name} <span className="text-zinc-500">({item.quantity} {item.unit})</span></p>
              <div className="flex items-center space-x-2">
                <p className="text-zinc-400 font-medium w-20 text-right">{Math.round(item.calories)} kcal</p>
                <button 
                  onClick={() => removeFoodItem(meal.id, index)} 
                  className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Remove ${item.name}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex justify-end text-xs space-x-4 mt-1" style={{ paddingRight: '36px' }}>
                <span className="text-zinc-500">P: <span className="font-medium text-sky-400">{Math.round(item.protein)}g</span></span>
                <span className="text-zinc-500">C: <span className="font-medium text-orange-400">{Math.round(item.carbs)}g</span></span>
                <span className="text-zinc-500">F: <span className="font-medium text-pink-400">{Math.round(item.fat)}g</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VoiceTipModal: React.FC<{ onStart: () => void; onClose: () => void; }> = ({ onStart, onClose }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
        <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700 text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-white">Voice Tip</h2>
            <p className="text-zinc-300 mb-6">“Try to be specific for best results — e.g. ‘1 grilled chicken breast with brown rice and a side of broccoli.’ We’ll calculate the macros and log it for you automatically.”</p>
            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-6 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors">Cancel</button>
                <button onClick={onStart} className="px-6 py-2 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors">Start Listening</button>
            </div>
        </div>
    </div>
);

const ListeningModal: React.FC<{ onCancel: () => void }> = ({ onCancel }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-sm border border-zinc-700 text-center" onClick={e => e.stopPropagation()}>
            <MicrophoneIcon className="w-16 h-16 text-red-500 animate-pulse mx-auto" />
            <p className="mt-4 text-white text-lg font-semibold">Listening...</p>
            <p className="text-sm text-zinc-400 mt-1">Speak your meal now</p>
            <button onClick={onCancel} className="mt-6 px-8 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors">
                Cancel
            </button>
        </div>
    </div>
);

const MacroInput: React.FC<{label: string, value: string, onChange: (val: string) => void}> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">{label}</label>
        <input 
            type="text"
            inputMode="decimal"
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" />
    </div>
);

const AddQuickAddModal: React.FC<{ onClose: () => void; onSave: (item: NewQuickAddItem) => void; }> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
    });
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => nameInputRef.current?.focus(), 100);
        return () => clearTimeout(timer);
    }, []);
    
    const handleChange = (field: keyof typeof formData, value: string) => {
        if (field !== 'name' && value && !/^\d*\.?\d*$/.test(value)) {
            return;
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        const { name, calories, protein, carbs, fat } = formData;
        if (!name.trim() || !calories || !protein || !carbs || !fat) {
            alert("Please fill out all fields.");
            return;
        }
        onSave({
            name: name.trim(),
            calories: parseFloat(calories) || 0,
            protein: parseFloat(protein) || 0,
            carbs: parseFloat(carbs) || 0,
            fat: parseFloat(fat) || 0,
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" 
            onClick={onClose}
        >
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-800" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-white text-center">Save a Frequent Meal</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Meal Name</label>
                        <input 
                            ref={nameInputRef}
                            type="text" 
                            value={formData.name} 
                            onChange={(e) => handleChange('name', e.target.value)} 
                            placeholder="e.g., Post-Workout Shake" 
                            className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-green-500" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <MacroInput label="Calories (kcal)" value={formData.calories} onChange={(val) => handleChange('calories', val)} />
                        <MacroInput label="Protein (g)" value={formData.protein} onChange={(val) => handleChange('protein', val)} />
                        <MacroInput label="Carbs (g)" value={formData.carbs} onChange={(val) => handleChange('carbs', val)} />
                        <MacroInput label="Fat (g)" value={formData.fat} onChange={(val) => handleChange('fat', val)} />
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

const GenerationLoadingModal: React.FC = () => {
    const messages = [
        "Analyzing your nutrition goals...",
        "Calculating your calorie needs...",
        "Selecting the perfect foods...",
        "Building your personalized meal plan...",
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
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-[60] animate-fade-in">
            <div className="w-16 h-16 border-4 border-zinc-700 border-t-green-500 rounded-full animate-spin"></div>
            <p className="text-white text-lg font-semibold mt-6 text-center transition-opacity duration-500">{currentMessage}</p>
        </div>
    );
};


const LogScreenComponent: React.FC<LogScreenProps> = (props) => {
  const { meals, addMeal, removeFoodItem, quickAddMeals, addQuickAddMeal, onGenerateMealPlan, isGeneratingMealPlan, generatedMealPlan, onActivateMealPlan, activeMealPlan, onDeactivateMealPlan, onUpdateActiveMealPlan, user, currentWeightKg, weightUnit } = props;
  const [nlpInput, setNlpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMealType, setActiveMealType] = useState<Meal['type']>('Breakfast');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [showVoiceTip, setShowVoiceTip] = useState(false);
  const [showAddQuickAddModal, setShowAddQuickAddModal] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [showMealPlanner, setShowMealPlanner] = useState(false);
  const [showManualBuilder, setShowManualBuilder] = useState(false);
  const [isEditingMealPlan, setIsEditingMealPlan] = useState(false);


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice transcript:", transcript);
        setIsListening(false);
        setIsLoading(true);
        const items = await logFoodWithNLP(transcript);
        if (items.length > 0) {
          addMeal(activeMealType, items);
        } else {
          alert("Could not detect food items from your speech. Please try a different description.");
        }
        setIsLoading(false);
    };

    recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== 'aborted') {
            alert(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
    }

    recognitionRef.current = recognition;
  }, [addMeal, activeMealType]);

  const handleNlpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim()) return;
    setIsLoading(true);
    const items = await logFoodWithNLP(nlpInput);
    if (items.length > 0) {
      addMeal(activeMealType, items);
      setNlpInput('');
    } else {
      alert("Could not detect food items. Please try a different description.");
    }
    setIsLoading(false);
  };
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const items = await logFoodWithPhoto(file);
    if (items.length > 0) {
      addMeal(activeMealType, items);
    } else {
      alert("Could not detect food from the image. Please try again.");
    }
    setIsLoading(false);
    e.target.value = '';
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleQuickAdd = (items: FoodItem[]) => {
    if (isLoading) return;
    addMeal(activeMealType, items);
  };

  const startListening = () => {
    if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
    }
  };
  
  const handleVoiceLogClick = () => {
      if (isLoading || isListening) return;
  
      if (!recognitionRef.current) {
          alert("Sorry, your browser doesn't support voice logging.");
          return;
      }
      
      const hasSeenTip = localStorage.getItem('jonmurrfit-voiceTipSeen');
      if (!hasSeenTip) {
          setShowVoiceTip(true);
      } else {
          startListening();
      }
  };

  const handleStartFromTip = () => {
      localStorage.setItem('jonmurrfit-voiceTipSeen', 'true');
      setShowVoiceTip(false);
      startListening();
  };

  const handleCloseAddQuickAddModal = useCallback(() => {
    setShowAddQuickAddModal(false);
  }, []);

  const handleSaveQuickAddMeal = useCallback((item: NewQuickAddItem) => {
    addQuickAddMeal(item);
    setShowAddQuickAddModal(false);
  }, [addQuickAddMeal]);

  const handleGeneratePlan = async (preferences: NutritionPlanPreferences) => {
      await onGenerateMealPlan(preferences);
      setShowMealPlanner(false);
  };

  const handleSaveMealPlanEdits = (updatedPlan: GeneratedMealPlan) => {
      onUpdateActiveMealPlan(updatedPlan);
      setIsEditingMealPlan(false);
  };

  const handleSaveManualPlan = (plan: GeneratedMealPlan) => {
      onActivateMealPlan(plan);
      setShowManualBuilder(false);
  };

  const mealTypes: Meal['type'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  return (
    <div className="p-4 space-y-6 text-white pb-24">
      <h1 className="text-3xl font-bold">Log Your Meal</h1>

      <div className="bg-zinc-900 rounded-xl p-4 space-y-4">
        <div>
            <h2 className="text-xl font-semibold mb-3">Add to</h2>
            <div className="flex space-x-2">
            {mealTypes.map(type => (
                <button key={type} onClick={() => setActiveMealType(type)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeMealType === type ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                {type}
                </button>
            ))}
            </div>
        </div>
        <form onSubmit={handleNlpSubmit} className="relative">
          <input
            type="text"
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            placeholder='e.g., "2 eggs and 1 slice of toast"'
            className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-3 pl-4 pr-24 text-white focus:outline-none focus:border-green-500"
            disabled={isLoading || isListening}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-black font-bold py-2 px-4 rounded-md" disabled={isLoading || isListening}>
            {isLoading && !isListening ? '...' : 'Log'}
          </button>
        </form>
         <button onClick={triggerFileInput} disabled={isLoading || isListening} className="w-full flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-lg transition-colors disabled:opacity-50">
            <CameraIcon className="w-5 h-5" />
            <span>Log with Photo</span>
        </button>
        <button onClick={handleVoiceLogClick} disabled={isLoading || isListening} className="w-full flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-lg transition-colors disabled:opacity-50">
            <MicrophoneIcon className="w-5 h-5" />
            <span>Log with Voice</span>
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
      </div>

      <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Quick Add</h2>
            <button
                onClick={() => setShowAddQuickAddModal(true)}
                className="text-zinc-400 hover:text-green-400 transition-colors"
                title="Add your own go-to meals for one-tap logging."
            >
                <PlusIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
            {quickAddMeals.map(meal => (
                <button
                    key={meal.name}
                    onClick={() => handleQuickAdd(meal.items)}
                    disabled={isLoading || isListening}
                    className="bg-zinc-800 p-3 rounded-lg text-left hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                    <p className="font-semibold text-white truncate">{meal.name}</p>
                    <p className="text-xs text-zinc-400">{Math.round(meal.items.reduce((acc, item) => acc + item.calories, 0))} kcal &bull; {Math.round(meal.items.reduce((acc, item) => acc + item.protein, 0))}g P</p>
                </button>
            ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Today's Log</h2>
        {meals.length > 0 ? (
          [...meals].reverse().map(meal => <MealCard key={meal.id} meal={meal} removeFoodItem={removeFoodItem} />)
        ) : (
          <div className="text-center py-10 bg-zinc-900 rounded-xl">
            <p className="text-zinc-400">No meals logged yet today.</p>
          </div>
        )}
        <MealPlannerWidget onClick={() => setShowMealPlanner(true)} />
        
        {!activeMealPlan && (
          <button
            onClick={() => setShowManualBuilder(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg"
          >
            🍽️ Build Manual Meal Plan
          </button>
        )}
        
        {activeMealPlan && (
          <ActiveMealPlanWidget 
            plan={activeMealPlan}
            addMeal={addMeal}
            mealsToday={meals}
            onDeactivate={onDeactivateMealPlan}
            onEdit={() => setIsEditingMealPlan(true)}
            onPlanUpdate={onUpdateActiveMealPlan}
          />
        )}
      </div>

      {isListening && <ListeningModal onCancel={stopListening} />}
      {showVoiceTip && <VoiceTipModal onStart={handleStartFromTip} onClose={() => setShowVoiceTip(false)} />}
      {showAddQuickAddModal && <AddQuickAddModal onClose={handleCloseAddQuickAddModal} onSave={handleSaveQuickAddMeal} />}
      {showMealPlanner && <MealPlannerWizard user={user} currentWeightKg={currentWeightKg} weightUnit={weightUnit} onClose={() => setShowMealPlanner(false)} onGenerate={handleGeneratePlan}/>}
      {showManualBuilder && <ManualMealPlanBuilder onClose={() => setShowManualBuilder(false)} onSave={handleSaveManualPlan} />}
      {isGeneratingMealPlan && <GenerationLoadingModal />}
      {generatedMealPlan && !activeMealPlan && <MealPlanView plan={generatedMealPlan} onActivate={onActivateMealPlan} />}
      {isEditingMealPlan && activeMealPlan && (
        <MealPlanEditor
          plan={activeMealPlan}
          onSave={handleSaveMealPlanEdits}
          onClose={() => setIsEditingMealPlan(false)}
        />
      )}
    </div>
  );
};
export const LogScreen = React.memo(LogScreenComponent);
