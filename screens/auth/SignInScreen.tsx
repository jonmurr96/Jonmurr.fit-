import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { GoogleSignInButton, AppleSignInButton, OAuthDivider } from '../../components/OAuthButtons';

interface SignInScreenProps {
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onNavigateToSignUp,
  onNavigateToForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user, error: signInError } = await authService.signIn({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in.');
        } else {
          setError(signInError.message || 'Failed to sign in. Please try again.');
        }
        return;
      }

      if (!user) {
        setError('Failed to sign in. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign in error:', err);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Jonmurr<span className="text-green-500">.fit</span>
          </h1>
          <p className="text-zinc-400 text-lg">Welcome back! Ready to crush your goals?</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

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

          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                disabled={loading}
                className="text-sm text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-zinc-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={onNavigateToSignUp}
                disabled={loading}
                className="text-green-400 hover:text-green-300 font-semibold transition-colors disabled:opacity-50"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
