import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { GoogleSignInButton, AppleSignInButton, OAuthDivider } from '../../components/OAuthButtons';

interface SignUpScreenProps {
  onNavigateToSignIn: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToSignIn }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.fullName.trim()) {
      return 'Please enter your full name';
    }
    if (!formData.username.trim()) {
      return 'Please enter a username';
    }
    if (formData.username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (!formData.email.trim()) {
      return 'Please enter your email address';
    }
    if (!formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { user, error: signUpError } = await authService.signUp({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else if (signUpError.message.includes('invalid email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(signUpError.message || 'Failed to create account. Please try again.');
        }
        return;
      }

      if (user) {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setOauthLoading(true);

    try {
      const { error: signInError } = await authService.signInWithGoogle();
      if (signInError) {
        setError(signInError.message || 'Failed to sign in with Google. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Google sign in error:', err);
    } finally {
      setOauthLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setOauthLoading(true);

    try {
      const { error: signInError } = await authService.signInWithApple();
      if (signInError) {
        setError(signInError.message || 'Failed to sign in with Apple. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Apple sign in error:', err);
    } finally {
      setOauthLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email!</h2>
              <p className="text-zinc-400 mb-6">
                We've sent a confirmation link to <span className="text-white font-medium">{formData.email}</span>.
                Please verify your email address to complete your registration.
              </p>
              <button
                onClick={onNavigateToSignIn}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/20"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Jonmurr<span className="text-green-500">.fit</span>
          </h1>
          <p className="text-zinc-400 text-lg">Start your fitness journey today!</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <GoogleSignInButton onClick={handleGoogleSignIn} isLoading={oauthLoading} />
            <AppleSignInButton onClick={handleAppleSignIn} isLoading={oauthLoading} />
          </div>

          <OAuthDivider />

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-zinc-300 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange('fullName')}
                required
                disabled={loading}
                placeholder="Jon Murr"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={handleChange('username')}
                required
                disabled={loading}
                placeholder="jonmurr"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
                disabled={loading}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                required
                disabled={loading}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required
                disabled={loading}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-green-500/20"
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-zinc-400 text-sm">
              Already have an account?{' '}
              <button
                onClick={onNavigateToSignIn}
                disabled={loading}
                className="text-green-400 hover:text-green-300 font-semibold transition-colors disabled:opacity-50"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
