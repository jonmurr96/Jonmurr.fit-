import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        await signUp(email, password, name);
        alert('Sign up successful! Please check your email to verify your account.');
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-500 mb-2">Jonmurr.fit</h1>
          <p className="text-zinc-400">Your AI-powered fitness companion</p>
        </div>

        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
          <div className="flex mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-center font-medium transition-colors ${
                !isSignUp
                  ? 'text-green-500 border-b-2 border-green-500'
                  : 'text-zinc-400 border-b border-zinc-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-center font-medium transition-colors ${
                isSignUp
                  ? 'text-green-500 border-b-2 border-green-500'
                  : 'text-zinc-400 border-b border-zinc-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="Your name"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder="your@email.com"
                required
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
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
              {isSignUp && (
                <p className="mt-1 text-xs text-zinc-500">At least 6 characters</p>
              )}
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
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
                  Processing...
                </span>
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500">
            {isSignUp ? (
              <p>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="text-green-500 hover:text-green-400"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
