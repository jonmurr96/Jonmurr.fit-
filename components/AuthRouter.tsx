import React, { useState } from 'react';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

type AuthView = 'signin' | 'signup' | 'forgot-password';

export const AuthRouter: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('signin');

  switch (currentView) {
    case 'signup':
      return <SignUpScreen onNavigateToSignIn={() => setCurrentView('signin')} />;
    
    case 'forgot-password':
      return (
        <ForgotPasswordScreen
          onNavigateToSignIn={() => setCurrentView('signin')}
        />
      );
    
    case 'signin':
    default:
      return (
        <SignInScreen
          onNavigateToSignUp={() => setCurrentView('signup')}
          onNavigateToForgotPassword={() => setCurrentView('forgot-password')}
        />
      );
  }
};
