

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AiMessage, FoodItem, TrainingProgram, Exercise, WorkoutPlanPreferences, SavedWorkout, ProgressionSuggestion, ProgressionPreference, Workout, NutritionPlanPreferences, GeneratedMealPlan } from "../types";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const WGER_API_KEY = import.meta.env.VITE_WGER_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.error("⚠️ GEMINI_API_KEY not found - AI features will not work");
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const foodItemSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The name of the food item, e.g., 'Scrambled Eggs'." },
    quantity: { type: Type.NUMBER, description: "The quantity of the food item." },
    unit: { type: Type.STRING, description: "The unit of measurement, e.g., 'slice', 'cup'." },
    calories: { type: Type.NUMBER, description: "Estimated calories for the item." },
    protein: { type: Type.NUMBER, description: "Estimated protein in grams." },
    carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams." },
    fat: { type: Type.NUMBER, description: "Estimated fat in grams." },
  },
  required: ['name', 'quantity', 'unit', 'calories', 'protein', 'carbs', 'fat']
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const logFoodWithNLP = async (text: string): Promise<FoodItem[]> => {
  try {
    if (!ai) {
      console.error('❌ Gemini API key not configured - logFoodWithNLP unavailable');
      return [];
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert nutritionist with access to the USDA FoodData Central database. Analyze the following text and extract a list of all food items mentioned. For each item, provide its name, quantity, unit, and its nutritional information (calories, protein, carbs, fat) based on the USDA data. Ensure you return values for protein, carbs, and fat, even if they are 0. Your response must be in JSON format that adheres to the provided schema. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: foodItemSchema
        },
      },
    });
    
    const jsonStr = response.text.trim();
    const parsed = JSON.parse(jsonStr) as FoodItem[];
    return parsed;
  } catch (error) {
    console.error("Error logging food with NLP:", error);
    return [];
  }
};

export const logFoodWithPhoto = async (imageFile: File): Promise<FoodItem[]> => {
  try {
    if (!ai) {
      console.error('❌ Gemini API key not configured - logFoodWithPhoto unavailable');
      return [];
    }
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: `You are a highly accurate nutrition logging assistant. Your task is to analyze the provided image and extract nutritional information. Follow these steps in order:

1.  **Detect Nutrition Label:** Meticulously scan the image for a nutrition facts label.
2.  **Extract from Label:** If a legible label is found, you MUST extract the data directly from it. Do not estimate.
    - **Item Name:** Identify the product name from the packaging.
    - **Serving Info:** Use the 'Serving Size' on the label to determine the 'quantity' and 'unit' (e.g., for "1 can (355mL)", quantity is 1 and unit is "can").
    - **Macros:** Extract the exact values for 'Calories', 'Protein', 'Carbs' (Total Carbohydrate), and 'Fat' (Total Fat) per serving.
3.  **Use USDA Data if No Label:** If and only if no nutrition label is visible or it is unreadable, identify the food and provide its nutritional content based on the USDA FoodData Central database. Use visual cues to determine the food and its quantity to provide the most accurate data.

Your response must be in JSON format that adheres to the provided schema. Ensure you return values for protein, carbs, and fat, even if they are 0.` },
          imagePart
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: foodItemSchema
        },
      }
    });

    const jsonStr = response.text.trim();
    const parsed = JSON.parse(jsonStr) as FoodItem[];
    return parsed;
  } catch (error) {
    console.error("Error logging food with photo:", error);
    return [];
  }
};

export const generateWorkoutPlan = async (preferences: WorkoutPlanPreferences): Promise<TrainingProgram | null> => {
    console.log('🏋️ generateWorkoutPlan called with preferences:', JSON.stringify(preferences, null, 2));
    
    try {
        if (!ai) {
            console.error('❌ Gemini API key not configured - generateWorkoutPlan unavailable');
            return null;
        }
        console.log('📡 Calling Gemini API for workout plan generation...');
        const prompt = `
        You are a world-class certified strength and conditioning specialist (CSCS) and personal trainer AI. Your task is to generate a highly customized, structured, and progressive 4-week training program based on the user's detailed screening inputs.

        **User Data:**
        \`\`\`json
        ${JSON.stringify(preferences, null, 2)}
        \`\`\`

        **GENERATION LOGIC & RULES (Follow these steps strictly):**

        **Step 1: Process Screening Inputs**
        - **Goal (\`${preferences.goal}\`):** This is the primary driver.
            - 'Build Strength': 4-5 sets of 4-6 reps, 2-3 min rest. Focus on heavy compound lifts.
            - 'Muscle Gain'/'Recomposition': 3-4 sets of 8-12 reps, 1-2 min rest. Balance of compound and isolation.
            - 'Fat Loss': 3-4 sets of 12-15+ reps, 0.5-1 min rest. Higher intensity, consider circuits.
            - 'Improve Endurance': 2-3 sets of 15-20+ reps, <1 min rest.
        - **Experience Level (\`${preferences.experienceLevel}\`):**
            - 'Beginner': Prioritize simple, foundational movements. Lower volume.
            - 'Intermediate': Introduce more complexity and volume.
            - 'Advanced': Assume high proficiency, can include complex movements and higher intensity techniques.
        - **Equipment (\`${preferences.equipment.join(', ')}\`):** STRICTLY limit exercise selection to the available equipment.
        - **Focus Areas (\`${preferences.focusAreas.join(', ')}\`):** Bias exercise selection to include more volume for these muscle groups.
        - **Training Style (\`${preferences.trainingStyle}\`):**
            - 'Progress Overload': The plan MUST show progression week-over-week (e.g., suggest adding weight/reps). For the description, add: "The key to this program is progressive overload. Aim to increase the weight or reps each week."
            - 'Balanced': A standard, structured plan.
            - 'Keep it Fun': More variety, maybe some circuit-style work.
        - **Injuries/Limitations (\`${preferences.injuriesText}\`):** AVOID any exercises that would strain the specified area. For "knee pain", prefer goblet squats over back squats.

        **Step 2: Smart Scheduling**
        - You MUST schedule workout days ONLY on the user-specified \`trainingDays\`: ${JSON.stringify(preferences.trainingDays)}.
        - Your response MUST contain a "workouts" array with exactly 7 objects (day: 1 for Monday to 7 for Sunday).
        - Days NOT in \`trainingDays\` are REST days. For these, set \`focus\` to "Day X - Rest / Recovery" and the \`exercises\` array MUST be empty \`[]\`.
        - Intelligently distribute workouts. For a 4-day split on Mon/Tue/Thu/Sat, a good split would be Upper/Lower/Upper/Lower. Avoid training the same major muscle groups on consecutive days.
        - The \`splitType\` field in your response should reflect this logic (e.g., "Upper/Lower", "Full Body", "Push/Pull/Legs").

        **Step 3: Build the Plan**
        - For each workout day, create a descriptive \`focus\` label (e.g., "Day 1 - Push: Chest, Shoulders, Triceps").
        - Prioritize compound exercises (squats, deadlifts, presses, rows). Add isolation work for focus areas.
        - Adhere to the set, rep, and rest time logic from Step 1.
        - Ensure the total workout time aligns with the user's \`timePerWorkout\`.

        **Step 4: Optional Add-Ons**
        - If the main workout is likely shorter than the user's \`timePerWorkout\`, suggest ONE optional add-on block from this list: ['Core Finisher', 'Cardio / Conditioning', 'Mobility / Stretching'].
        - The add-on must NOT make the total session exceed the selected time range.
        - Add this block to the \`optionalBlocks\` array for the relevant workout day. If no add-on is appropriate, this array should be empty.

        **Step 5: Final Response Validation**
        - Your response MUST be a single, valid JSON object that adheres to the provided schema.
        - Create a motivational \`programName\` and a brief, encouraging \`description\`.
        - Ensure the \`workouts\` array has exactly 7 entries.
        - CRITICAL: Any workout object where the 'focus' field does NOT contain "Rest / Recovery" MUST have a non-empty 'exercises' array.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        programName: { type: Type.STRING },
                        durationWeeks: { type: Type.NUMBER },
                        description: { type: Type.STRING },
                        splitType: { type: Type.STRING },
                        workouts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    day: { type: Type.NUMBER, description: "Day of the week, 1 for Monday, etc." },
                                    focus: { type: Type.STRING, description: "e.g., 'Day 1 - Push (Chest, Shoulders, Triceps)' or 'Day 3 - Rest / Recovery'" },
                                    completed: { type: Type.BOOLEAN },
                                    exercises: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                id: { type: Type.STRING },
                                                name: { type: Type.STRING },
                                                sets: { 
                                                    type: Type.ARRAY,
                                                    items: {
                                                        type: Type.OBJECT,
                                                        properties: {
                                                            id: { type: Type.NUMBER },
                                                            targetReps: { type: Type.STRING },
                                                            completed: { type: Type.BOOLEAN },
                                                            restMinutes: { type: Type.NUMBER, description: "Rest time in minutes after this set." }
                                                        },
                                                        required: ["id", "targetReps", "completed", "restMinutes"]
                                                    }
                                                }
                                            },
                                            required: ["id", "name", "sets"]
                                        }
                                    },
                                    optionalBlocks: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                type: { type: Type.STRING },
                                                durationMinutes: { type: Type.NUMBER },
                                                exercises: {
                                                    type: Type.ARRAY,
                                                    items: {
                                                        type: Type.OBJECT,
                                                        properties: {
                                                            id: { type: Type.STRING },
                                                            name: { type: Type.STRING },
                                                            sets: {
                                                                type: Type.ARRAY,
                                                                items: {
                                                                    type: Type.OBJECT,
                                                                    properties: {
                                                                        id: { type: Type.NUMBER },
                                                                        targetReps: { type: Type.STRING },
                                                                        completed: { type: Type.BOOLEAN },
                                                                        restMinutes: { type: Type.NUMBER }
                                                                    },
                                                                    required: ["id", "targetReps", "completed", "restMinutes"]
                                                                }
                                                            }
                                                        },
                                                        required: ["id", "name", "sets"]
                                                    }
                                                }
                                            },
                                            required: ["type", "durationMinutes", "exercises"]
                                        }
                                    }
                                },
                                required: ["id", "day", "focus", "completed", "exercises"]
                            }
                        }
                    },
                    required: ["programName", "durationWeeks", "description", "splitType", "workouts"]
                }
            }
        });
        
        console.log('✅ Gemini API responded successfully');
        const jsonStr = response.text.trim();
        console.log('📝 Response text length:', jsonStr.length, 'chars');
        
        const plan = JSON.parse(jsonStr) as TrainingProgram;
        console.log('✅ Parsed workout plan:', plan.programName);
        
        plan.preferences = preferences; // Attach preferences to the generated plan
        return plan;
    } catch (error: any) {
        console.error("❌ Error generating workout plan:");
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
        if (error?.response) {
            console.error("API Response error:", JSON.stringify(error.response, null, 2));
        }
        return null;
    }
};

export const generateMealPlan = async (preferences: NutritionPlanPreferences): Promise<GeneratedMealPlan | null> => {
    // Only use CRITICAL targets if ALL macro fields are populated (prevents NaN/undefined in prompt)
    const hasCompleteTargets = preferences.targetCalories && preferences.targetProtein && preferences.targetCarbs && preferences.targetFat;
    
    const macroTargetSection = hasCompleteTargets
        ? `
    **CRITICAL MACRO TARGETS (YOU MUST MATCH THESE EXACTLY):**
    - Target Calories: ${preferences.targetCalories} kcal (acceptable range: ${Math.round(preferences.targetCalories * 0.97)}-${Math.round(preferences.targetCalories * 1.03)} kcal, ±3%)
    - Target Protein: ${preferences.targetProtein}g (acceptable range: ${Math.round(preferences.targetProtein * 0.97)}-${Math.round(preferences.targetProtein * 1.03)}g, ±3%)
    - Target Carbs: ${preferences.targetCarbs}g (acceptable range: ${Math.round(preferences.targetCarbs * 0.97)}-${Math.round(preferences.targetCarbs * 1.03)}g, ±3%)
    - Target Fat: ${preferences.targetFat}g (acceptable range: ${Math.round(preferences.targetFat * 0.97)}-${Math.round(preferences.targetFat * 1.03)}g, ±3%)
    
    **CRITICAL REQUIREMENT:** 
    1. The dailyPlan.totalCalories, totalProtein, totalCarbs, and totalFat MUST be calculated by summing ALL individual food items across ALL meals
    2. These totals MUST fall within the acceptable target ranges above (±3%)
    3. Adjust food portions precisely so that when you sum all meal items, the totals match the targets
    4. DO NOT just copy the target values into the totals - calculate them from your actual meal items
    5. Verify your math: SUM(all breakfast + lunch + dinner + snacks calories) = dailyPlan.totalCalories (within ±3% of target)
    `
        : `
    Generate:
    1. Daily calorie target based on TDEE adjusted for goal pace.
    2. Macro breakdown in grams for Protein, Carbs, and Fats.
    `;

    const prompt = `
    Based on the following user profile:
    - Gender: ${preferences.gender}
    - Age: ${preferences.age}
    - Height: ${preferences.heightCm} cm
    - Weight: ${preferences.currentWeight} ${preferences.currentWeightUnit}
    - Target Weight: ${preferences.targetWeight || 'Not specified'} ${preferences.currentWeightUnit}
    - Goal: ${preferences.goal}
    - Activity Level: ${preferences.activityLevel}
    - Metabolism Type: ${preferences.metabolismType}
    - Eating Style: ${preferences.eatingPattern}
    - Preferred meals/day: ${preferences.mealsPerDay}
    - Dietary Restrictions: ${preferences.dietaryRestrictions || 'None'}
    - Dislikes: ${preferences.dislikes || 'None'}
    - Budget: ${preferences.foodBudget}
    - Simplicity: ${preferences.mealSimplicity}
    - Sleep: ${preferences.sleep}
    - Water intake: ${preferences.waterIntake}

${macroTargetSection}

    Generate:
    3. A full day's meal plan template for a single day, matching the preferred number of meals.
    4. Each meal with specific food items and quantities, tailored to budget, cooking frequency, simplicity, and preferences.
    5. The plan should be modular and repeatable for a full week.
    6. Include optional swaps and substitutions for 1-2 items per meal based on restrictions/dislikes.
    7. Output a clean JSON object that adheres to the provided schema. Do not include any text outside of the JSON object.
    `;

    const mealPlanSchema = {
        type: Type.OBJECT,
        properties: {
            planName: { type: Type.STRING, description: "A catchy name for the meal plan, e.g., 'Lean Body Fuel Plan'." },
            description: { type: Type.STRING, description: "A brief, encouraging description of the plan." },
            dailyPlan: {
                type: Type.OBJECT,
                properties: {
                    dayOfWeek: { type: Type.STRING, description: "The day this plan is for, e.g., 'Weekdays'." },
                    totalCalories: { type: Type.NUMBER },
                    totalProtein: { type: Type.NUMBER },
                    totalCarbs: { type: Type.NUMBER },
                    totalFat: { type: Type.NUMBER },
                    meals: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "e.g., 'Breakfast', 'Lunch', 'Snack 1'." },
                                items: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            food: { type: Type.STRING },
                                            quantity: { type: Type.STRING, description: "e.g., '1 cup', '150g'." },
                                            calories: { type: Type.NUMBER },
                                            protein: { type: Type.NUMBER },
                                            carbs: { type: Type.NUMBER },
                                            fat: { type: Type.NUMBER },
                                        },
                                        required: ['food', 'quantity', 'calories', 'protein', 'carbs', 'fat']
                                    }
                                },
                                swaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional food swaps." }
                            },
                            required: ['name', 'items']
                        }
                    }
                },
                required: ['totalCalories', 'totalProtein', 'totalCarbs', 'totalFat', 'meals']
            }
        },
        required: ['planName', 'description', 'dailyPlan']
    };

    try {
        if (!ai) {
            console.error('❌ Gemini API key not configured - generateMealPlan unavailable');
            return null;
        }
        // Use flash model for faster meal plan generation (3-5x faster than pro)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: mealPlanSchema
            }
        });

        const jsonStr = response.text.trim();
        const plan = JSON.parse(jsonStr) as GeneratedMealPlan;
        
        // CRITICAL: Validate and recalculate totals from actual meal items
        let actualTotalCalories = 0;
        let actualTotalProtein = 0;
        let actualTotalCarbs = 0;
        let actualTotalFat = 0;
        
        plan.dailyPlan.meals.forEach(meal => {
            meal.items.forEach(item => {
                actualTotalCalories += Number(item.calories) || 0;
                actualTotalProtein += Number(item.protein) || 0;
                actualTotalCarbs += Number(item.carbs) || 0;
                actualTotalFat += Number(item.fat) || 0;
            });
        });
        
        // Log warning if AI's totals don't match actual sums (±3% tolerance)
        const caloriesDiff = Math.abs(actualTotalCalories - plan.dailyPlan.totalCalories);
        const proteinDiff = Math.abs(actualTotalProtein - plan.dailyPlan.totalProtein);
        const carbsDiff = Math.abs(actualTotalCarbs - plan.dailyPlan.totalCarbs);
        const fatDiff = Math.abs(actualTotalFat - plan.dailyPlan.totalFat);
        
        if (caloriesDiff > plan.dailyPlan.totalCalories * 0.03 || 
            proteinDiff > plan.dailyPlan.totalProtein * 0.03 ||
            carbsDiff > plan.dailyPlan.totalCarbs * 0.03 ||
            fatDiff > plan.dailyPlan.totalFat * 0.03) {
            console.warn('⚠️ AI macro totals mismatch! Recalculating from meal items:', {
                aiCalories: plan.dailyPlan.totalCalories,
                actualCalories: actualTotalCalories,
                aiProtein: plan.dailyPlan.totalProtein,
                actualProtein: actualTotalProtein,
                aiCarbs: plan.dailyPlan.totalCarbs,
                actualCarbs: actualTotalCarbs,
                aiFat: plan.dailyPlan.totalFat,
                actualFat: actualTotalFat
            });
        }
        
        // Always use actual sums to ensure accuracy
        plan.dailyPlan.totalCalories = Math.round(actualTotalCalories);
        plan.dailyPlan.totalProtein = Math.round(actualTotalProtein);
        plan.dailyPlan.totalCarbs = Math.round(actualTotalCarbs);
        plan.dailyPlan.totalFat = Math.round(actualTotalFat);
        
        return plan;
    } catch (error) {
        console.error("Error generating meal plan:", error);
        return null;
    }
};

export const searchExercises = async (query: string): Promise<Exercise[]> => {
    if (!query.trim()) {
        return [];
    }
    
    const url = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(query)}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Token ${WGER_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`WGER API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        const suggestions = data.suggestions || [];

        return suggestions.map((suggestion: any): Exercise => ({
            id: suggestion.data.id.toString(),
            name: suggestion.value,
            category: suggestion.data.category_name,
            sets: [ // Generate default sets for immediate use in the app
                { id: 1, targetReps: '8-12 reps', completed: false, restMinutes: 1.5 },
                { id: 2, targetReps: '8-12 reps', completed: false, restMinutes: 1.5 },
                { id: 3, targetReps: '8-12 reps', completed: false, restMinutes: 1.5 },
            ],
        }));

    } catch (error) {
        console.error("Error searching WGER exercises:", error);
        return [];
    }
};

export const processWorkoutCommand = async (transcript: string, currentExercises: string[], savedWorkoutNames: string[]): Promise<{ name: string; args: any; } | null> => {
    const logExerciseTool: FunctionDeclaration = {
        name: 'logExercise',
        parameters: {
            type: Type.OBJECT,
            description: 'Logs one or more sets for a specific exercise the user just performed.',
            properties: {
                exerciseName: { type: Type.STRING, description: `The name of the exercise. If the user is vague, infer from the current workout's exercise list: [${currentExercises.join(', ')}]` },
                sets: {
                    type: Type.ARRAY,
                    description: 'An array of sets performed.',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            weight: { type: Type.NUMBER, description: 'Weight used for the set. Assume lbs if not specified.' },
                            reps: { type: Type.NUMBER, description: 'Number of repetitions completed.' }
                        },
                        required: ['weight', 'reps']
                    }
                }
            },
            required: ['exerciseName', 'sets']
        }
    };
    
    const startSavedWorkoutTool: FunctionDeclaration = {
        name: 'startSavedWorkout',
        parameters: {
            type: Type.OBJECT,
            description: 'Starts a workout from the user\'s saved library.',
            properties: {
                workoutName: { type: Type.STRING, description: `The name of the saved workout. Must be one of: [${savedWorkoutNames.join(', ')}]` }
            },
            required: ['workoutName']
        }
    };

    const setupWorkoutTool: FunctionDeclaration = {
        name: 'setupWorkout',
        parameters: {
            type: Type.OBJECT,
            description: 'Creates a new workout for the current day with a list of exercises.',
            properties: {
                exercises: {
                    type: Type.ARRAY,
                    description: 'An array of exercise names mentioned by the user.',
                    items: { type: Type.STRING }
                }
            },
            required: ['exercises']
        }
    };

    const prompt = `You are a voice-activated workout assistant. Analyze the user's command and call the most appropriate function.
    User's command: "${transcript}"
    Context:
    - Current workout exercises available for logging: [${currentExercises.join(', ')}]
    - User's library of saved workouts: [${savedWorkoutNames.join(', ')}]
    
    Instructions:
    - For logging, be precise. If a user says "135 for 10, 8, 6", it means three sets.
    - If the user wants to start a saved workout, use their exact workout name.
    - If the user lists exercises for a new workout (e.g., "Leg day with squats and lunges"), use the setupWorkout tool.
    - If the command is ambiguous, do not call any function.`;

    try {
        if (!ai) {
            console.error('❌ Gemini API key not configured - processWorkoutCommand unavailable');
            return null;
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ functionDeclarations: [logExerciseTool, startSavedWorkoutTool, setupWorkoutTool] }],
            },
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
            const fc = response.functionCalls[0];
            console.log("Gemini function call:", fc);
            return { name: fc.name, args: fc.args };
        }
        return null;

    } catch (error) {
        console.error("Error processing workout command:", error);
        return null;
    }
};

export const getProgressionSuggestions = async (
    exercise: Exercise, 
    formattedHistory: string,
    preference: ProgressionPreference,
    weightUnit: 'kg' | 'lbs'
): Promise<ProgressionSuggestion[]> => {
    const prompt = `You are an expert AI strength coach. Your goal is to apply the principles of progressive overload. Analyze the user's performance history for an exercise and suggest a progression for today's workout.

User's Progression Preference: ${preference}

Exercise: ${exercise.name}
${formattedHistory}

Follow these rules STRICTLY:
1.  **Weight Progression**: If the user successfully completed all target reps for all sets in the last 1-2 sessions with a reported RPE of 8 or less, suggest a small weight increase.
    - For compound lifts (squat, bench, deadlift, overhead press, rows), suggest a 2.5-5 ${weightUnit} increase.
    - For isolation lifts, suggest a 2.5 ${weightUnit} increase.
    - Adhere to the user's preference: 'Aggressive' aims for a 5${weightUnit} jump, 'Conservative' for 2.5${weightUnit}.
2.  **Rep Progression**: For bodyweight or fixed-weight exercises, if the user met or exceeded rep targets last session, suggest adding 1-2 reps to each set.
3.  **Set Progression**: If the user consistently reports a low Rate of Perceived Exertion (RPE < 7) across all sets for the last 2 sessions, suggest adding one additional work set.
4.  **Deload Logic**: If the user's performance (reps or weight) has declined for 2 consecutive sessions OR they reported an RPE > 9 for 2 consecutive sessions, suggest a deload: reduce the weight by 10-15%.
5.  **No Suggestion**: If no progression criteria are clearly met, or if there is insufficient history (less than 2 sessions), do not provide a suggestion. Return an empty array.

Your response MUST be a JSON object that adheres to the provided schema. Only return a suggestion if a clear progression is warranted.`;

    try {
        if (!ai) {
            console.error('❌ Gemini API key not configured - getProgressionSuggestions unavailable');
            return [];
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            exerciseId: { type: Type.STRING },
                            exerciseName: { type: Type.STRING },
                            type: { type: Type.STRING, description: "One of 'weight', 'reps', 'sets', or 'deload'" },
                            reason: { type: Type.STRING, description: "A brief, encouraging explanation for the suggestion. e.g., 'You hit all your reps easily last time!'" },
                            action: {
                                type: Type.OBJECT,
                                properties: {
                                    targetWeight: { type: Type.NUMBER, description: "The new suggested weight." },
                                    targetReps: { type: Type.STRING, description: "The new suggested rep range." },
                                    addSet: { type: Type.BOOLEAN, description: "Whether to add a new set." }
                                }
                            }
                        },
                        required: ['exerciseId', 'exerciseName', 'type', 'reason', 'action']
                    }
                }
            }
        });
        const jsonStr = response.text.trim();
        const suggestions = JSON.parse(jsonStr) as Omit<ProgressionSuggestion, 'exerciseId'>[];
        return suggestions.map(s => ({...s, exerciseId: exercise.id }));

    } catch (error) {
        console.error("Error getting progression suggestions:", error);
        return [];
    }
};

export const getPostWorkoutRecap = async (workout: Workout): Promise<string> => {
    const progressedExercises = workout.exercises.filter(ex => 
        ex.sets.some(s => s.completed && s.actualWeight && s.actualReps && (s.actualWeight > (s.targetWeight || 0) || s.actualReps > parseInt(s.targetReps)))
    ).length;

    const completedExercises = workout.exercises.filter(ex => ex.sets.every(s => s.completed)).length;

    let prompt = `You are Jonmurr.fit, an encouraging AI fitness coach. The user just finished their workout. Give them a brief, motivating recap.
    
    - Total exercises in workout: ${workout.exercises.length}
    - Exercises fully completed: ${completedExercises}
    - Exercises where they progressed (lifted heavier or did more reps than target): ${progressedExercises}
    
    Generate one single encouraging sentence.`;

    if (progressedExercises > 0) {
        prompt += ` Acknowledge their progress.`;
    } else if (completedExercises === workout.exercises.length) {
        prompt += ` Acknowledge their consistency.`;
    } else {
        prompt += ` Encourage them for the effort they put in.`;
    }

    try {
        if (!ai) {
            console.error('❌ Gemini API key not configured - getPostWorkoutRecap unavailable');
            return "Great work today! Consistency is key.";
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting post-workout recap:", error);
        return "Great work today! Consistency is key.";
    }
};

// FIX: Add missing getAICoachResponse function
export const getAICoachResponse = async (history: AiMessage[], newQuestion: string): Promise<string> => {
    const fullHistory = [...history, { role: 'user' as const, content: newQuestion }];

    const promptHistory = fullHistory.map(msg => {
        const prefix = msg.role === 'user' ? 'User' : 'Coach';
        return `${prefix}: ${msg.content}`;
    }).join('\n');

    const prompt = `You are Jonmurr.fit, an expert AI fitness coach. You are encouraging, knowledgeable, and provide safe, evidence-based advice. Keep your responses concise and helpful.
    
Here is the conversation history:
${promptHistory}

Coach:`;

    try {
        if (!ai) {
            console.error('❌ Gemini API key not configured - getAICoachResponse unavailable');
            return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting AI coach response:", error);
        return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }
};

export interface ParsedWorkout {
  program: TrainingProgram;
  unmatchedExercises: string[];
}

export interface ParsedWorkoutWithReview {
  program: TrainingProgram;
  unmatchedExercises: string[];
  review: {
    feedback: string;
    balanceScore: number;
    volumeAssessment: 'appropriate' | 'too high' | 'too low';
    missingGroups: string[];
    recoveryConcerns: boolean;
    severity: 'info' | 'warning';
    recommendedFocusAreas: string[];
  };
}

export const parseWorkoutText = async (text: string): Promise<ParsedWorkout | null> => {
  try {
    const prompt = `You are an expert AI workout plan parser. Your task is to analyze the provided workout text and extract structured workout data.

**Input Text:**
${text}

**Instructions:**
1. Extract the program name (or create one if not specified, e.g., "Imported Workout Plan")
2. Determine the duration in weeks (default to 4 if not specified)
3. Parse all exercises with their sets, reps, and rest times
4. Organize into workout days (Day 1, Day 2, etc.) based on the text structure
5. For each exercise, extract:
   - Exercise name
   - Number of sets
   - Rep range (e.g., "8-12 reps" or "AMRAP")
   - Rest time in minutes (default to 1.5 if not specified)
6. Infer the split type (e.g., "Push/Pull/Legs", "Full Body", "Upper/Lower")
7. Create a description summarizing the program

**Format Rules:**
- Each workout day should have a "day" number (1-7 for Mon-Sun)
- The "focus" field should describe the day (e.g., "Day 1 - Push (Chest, Shoulders, Triceps)")
- Exercise names should be standardized (e.g., "Bench Press" not "bench")
- If text mentions "Day 1: Push", assign day=1, focus="Push (Chest, Shoulders, Triceps)"
- If no specific days mentioned, create a logical split

Your response MUST be valid JSON adhering to the provided schema.`;

    if (!ai) {
      console.error('❌ Gemini API key not configured - parseWorkoutText unavailable');
      return null;
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            programName: { type: Type.STRING },
            durationWeeks: { type: Type.NUMBER },
            description: { type: Type.STRING },
            splitType: { type: Type.STRING },
            workouts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  day: { type: Type.NUMBER },
                  focus: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        sets: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.NUMBER },
                              targetReps: { type: Type.STRING },
                              completed: { type: Type.BOOLEAN },
                              restMinutes: { type: Type.NUMBER }
                            },
                            required: ["id", "targetReps", "completed", "restMinutes"]
                          }
                        }
                      },
                      required: ["id", "name", "sets"]
                    }
                  }
                },
                required: ["id", "day", "focus", "completed", "exercises"]
              }
            }
          },
          required: ["programName", "durationWeeks", "description", "splitType", "workouts"]
        }
      }
    });

    const jsonStr = response.text.trim();
    const program = JSON.parse(jsonStr) as TrainingProgram;
    
    return {
      program,
      unmatchedExercises: []
    };
  } catch (error) {
    console.error("Error parsing workout text:", error);
    return null;
  }
};

export const reviewImportedWorkout = async (program: TrainingProgram): Promise<string> => {
  try {
    const workoutSummary = program.workouts.map(w => 
      `${w.focus}: ${w.exercises.length} exercises`
    ).join(', ');

    const prompt = `You are an expert AI fitness coach reviewing an imported workout plan. Provide brief, constructive feedback.

**Program:** ${program.programName}
**Split:** ${program.splitType}
**Workouts:** ${workoutSummary}

Analyze for:
1. Muscle group balance (push/pull ratio, upper/lower balance)
2. Volume appropriateness (too high or too low)
3. Missing muscle groups or days
4. Recovery concerns

Provide 2-3 short, actionable suggestions. Be encouraging but honest. Keep it under 100 words.`;

    if (!ai) {
      console.error('❌ Gemini API key not configured - reviewImportedWorkout unavailable');
      return "Great job importing your workout! Make sure to balance push and pull exercises, and don't forget leg day!";
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error reviewing imported workout:", error);
    return "Great job importing your workout! Make sure to balance push and pull exercises, and don't forget leg day!";
  }
};

export const parseAndReviewWorkout = async (text: string): Promise<ParsedWorkoutWithReview | null> => {
  try {
    const prompt = `You are an expert AI workout plan parser and fitness coach. Your task is to:
1. Parse the workout text into structured data
2. Analyze and review the workout plan quality

**Input Text:**
${text}

**TASK 1 - PARSE WORKOUT:**
Extract the program name (or create "Imported Workout Plan"), duration in weeks (default 4), exercises with sets/reps/rest, organize into workout days, infer split type, and create a description.

**Format Rules:**
- Each workout day: "day" number (1-7), "focus" field (e.g., "Push (Chest, Shoulders, Triceps)")
- Standardize exercise names (e.g., "Bench Press" not "bench")
- Rest time default: 1.5 minutes if not specified
- Rep range examples: "8-12 reps" or "AMRAP"

**TASK 2 - REVIEW WORKOUT:**
Analyze the parsed workout for:
1. Muscle group balance (push/pull ratio, upper/lower balance) - Rate 0-10
2. Volume appropriateness - Classify as "appropriate", "too high", or "too low"
3. Missing muscle groups - List any missing (e.g., ["legs", "back"])
4. Recovery concerns - Boolean (true if insufficient rest days)
5. Severity - "info" (looks good) or "warning" (has issues)
6. Recommended focus areas - List 1-3 areas to improve (e.g., ["Add leg day", "Increase back volume"])

Provide 2-3 short, actionable suggestions in feedback. Be encouraging but honest. Keep it under 100 words.

Your response MUST be valid JSON adhering to the provided schema.`;

    if (!ai) {
      console.error('❌ Gemini API key not configured - parseAndReviewWorkout unavailable');
      return null;
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            programName: { type: Type.STRING },
            durationWeeks: { type: Type.NUMBER },
            description: { type: Type.STRING },
            splitType: { type: Type.STRING },
            workouts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  day: { type: Type.NUMBER },
                  focus: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        sets: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.NUMBER },
                              targetReps: { type: Type.STRING },
                              completed: { type: Type.BOOLEAN },
                              restMinutes: { type: Type.NUMBER }
                            },
                            required: ["id", "targetReps", "completed", "restMinutes"]
                          }
                        }
                      },
                      required: ["id", "name", "sets"]
                    }
                  }
                },
                required: ["id", "day", "focus", "completed", "exercises"]
              }
            },
            review: {
              type: Type.OBJECT,
              properties: {
                feedback: { type: Type.STRING },
                balanceScore: { type: Type.NUMBER },
                volumeAssessment: { type: Type.STRING },
                missingGroups: { type: Type.ARRAY, items: { type: Type.STRING } },
                recoveryConcerns: { type: Type.BOOLEAN },
                severity: { type: Type.STRING },
                recommendedFocusAreas: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["feedback", "balanceScore", "volumeAssessment", "missingGroups", "recoveryConcerns", "severity", "recommendedFocusAreas"]
            }
          },
          required: ["programName", "durationWeeks", "description", "splitType", "workouts", "review"]
        }
      }
    });

    const jsonStr = response.text.trim();
    const parsed = JSON.parse(jsonStr);
    
    const program: TrainingProgram = {
      programName: parsed.programName,
      durationWeeks: parsed.durationWeeks,
      description: parsed.description,
      splitType: parsed.splitType,
      workouts: parsed.workouts
    };
    
    const review = {
      feedback: parsed.review.feedback || "Great job importing your workout!",
      balanceScore: Math.max(0, Math.min(10, parsed.review.balanceScore || 5)),
      volumeAssessment: (parsed.review.volumeAssessment as 'appropriate' | 'too high' | 'too low') || 'appropriate',
      missingGroups: parsed.review.missingGroups || [],
      recoveryConcerns: parsed.review.recoveryConcerns || false,
      severity: (parsed.review.severity as 'info' | 'warning') || 'info',
      recommendedFocusAreas: parsed.review.recommendedFocusAreas || []
    };
    
    return {
      program,
      unmatchedExercises: [],
      review
    };
  } catch (error) {
    console.error("Error parsing and reviewing workout:", error);
    return null;
  }
};