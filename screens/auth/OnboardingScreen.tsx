import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const FITNESS_GOALS = [
  { value: 'Muscle Gain', label: 'Build Muscle', emoji: '💪' },
  { value: 'Fat Loss', label: 'Lose Fat', emoji: '🔥' },
  { value: 'Build Strength', label: 'Get Stronger', emoji: '🏋️' },
  { value: 'Improve Endurance', label: 'Improve Endurance', emoji: '🏃' },
  { value: 'Recomposition', label: 'Body Recomposition', emoji: '⚡' },
  { value: 'General Fitness', label: 'General Fitness', emoji: '🎯' },
];

export const OnboardingScreen: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!selectedGoal || !user) {
      setError('Please select a fitness goal');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await authService.updateUserProfile(user.id, {
        fitness_goal: selectedGoal,
        onboarding_complete: true,
      });

      if (updateError) {
        setError('Failed to save your preferences. Please try again.');
        console.error('Onboarding update error:', updateError);
        return;
      }

      await refreshUserProfile();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to Jonmurr<span className="text-green-500">.fit</span>!
          </h1>
          <p className="text-zinc-400 text-lg">Let's personalize your fitness journey</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">What's your main fitness goal?</h2>
            <p className="text-zinc-400 text-sm">
              Choose your primary focus. You can always change this later in settings.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {FITNESS_GOALS.map((goal) => (
              <button
                key={goal.value}
                onClick={() => setSelectedGoal(goal.value)}
                disabled={loading}
                className={`p-6 rounded-2xl border-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  selectedGoal === goal.value
                    ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{goal.emoji}</div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">{goal.label}</h3>
                  </div>
                  {selectedGoal === goal.value && (
                    <div className="ml-auto">
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleComplete}
            disabled={loading || !selectedGoal}
            className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-green-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              "Let's Go! 🚀"
            )}
          </button>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          This helps us personalize your workout and meal recommendations
        </p>
      </div>
    </div>
  );
};
