import React from 'react';

interface OAuthButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export const GoogleSignInButton: React.FC<OAuthButtonProps> = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-zinc-700 rounded-lg hover:bg-zinc-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      <span className="text-sm font-medium">
        {isLoading ? 'Loading...' : 'Continue with Google'}
      </span>
    </button>
  );
};

export const AppleSignInButton: React.FC<OAuthButtonProps> = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-zinc-700 rounded-lg hover:bg-zinc-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg width="18" height="18" viewBox="0 0 18 22" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.5 11.3c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.9C5.2 5.7 3 7.3 3 10.7c0 1.4.2 2.8.7 4.2.6 1.7 2.8 6 5.1 5.9 1.2 0 2-.8 3.2-.8 1.2 0 1.9.8 3.2.8 2.2 0 4.2-3.8 4.7-5.5-2.6-1.2-2.4-4.8-2.4-5zM12.9 3.8c.7-.9 1.2-2.1 1-3.4-1.1 0-2.4.7-3.2 1.6-.7.8-1.3 2-1.1 3.2 1.2.1 2.5-.6 3.3-1.4z"/>
      </svg>
      <span className="text-sm font-medium">
        {isLoading ? 'Loading...' : 'Continue with Apple'}
      </span>
    </button>
  );
};

export const OAuthDivider: React.FC = () => {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-zinc-700" />
      <span className="text-xs text-zinc-500">OR</span>
      <div className="flex-1 h-px bg-zinc-700" />
    </div>
  );
};
