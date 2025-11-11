import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthRouter } from './components/AuthRouter';
import OnboardingScreen from './screens/onboarding/OnboardingScreen';
import App from './App';

const AuthenticatedApp: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-lg mx-auto bg-black min-h-screen flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-zinc-700 border-t-green-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthRouter />;
  }

  if (!userProfile) {
    return (
      <div className="max-w-lg mx-auto bg-black min-h-screen flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-zinc-700 border-t-green-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 text-lg">Loading your profile...</p>
      </div>
    );
  }

  if (!userProfile.onboarding_complete) {
    return <OnboardingScreen />;
  }

  return <App />;
};

export const AppWithAuth: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};
