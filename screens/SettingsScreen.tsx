import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, updateUserPassword, deleteUserAccount } from '../services/authService';

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { user, userProfile, signOut, refreshUserProfile } = useAuth();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [username, setUsername] = useState(userProfile?.username || '');
  const [fitnessGoal, setFitnessGoal] = useState(userProfile?.fitness_goal || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fitnessGoalOptions = [
    'Muscle Gain',
    'Fat Loss',
    'Strength',
    'Endurance',
    'Recomposition',
    'General Fitness'
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      await updateUserProfile(userProfile.id, {
        full_name: fullName,
        username: username,
        fitness_goal: fitnessGoal || null,
      });
      await refreshUserProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditingProfile(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      await updateUserPassword(newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (deleteConfirmation !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      await deleteUserAccount(userProfile!.id);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete account' });
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to sign out' });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="max-w-lg mx-auto min-h-screen bg-black pb-24 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-gradient-to-b from-black via-black to-transparent pb-4">
          <div className="flex items-center justify-between px-4 pt-6 pb-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {message && (
            <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
              <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message.text}
              </p>
            </div>
          )}

          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{userProfile?.full_name}</h2>
                <p className="text-sm text-zinc-400">@{userProfile?.username}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Profile Information</h3>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-sm text-green-400 hover:text-green-300 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Fitness Goal</label>
                  <select
                    value={fitnessGoal}
                    onChange={(e) => setFitnessGoal(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a goal</option>
                    {fitnessGoalOptions.map((goal) => (
                      <option key={goal} value={goal}>{goal}</option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setFullName(userProfile?.full_name || '');
                      setUsername(userProfile?.username || '');
                      setFitnessGoal(userProfile?.fitness_goal || '');
                    }}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500">Full Name</p>
                  <p className="text-white">{userProfile?.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Username</p>
                  <p className="text-white">@{userProfile?.username}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Fitness Goal</p>
                  <p className="text-white">{userProfile?.fitness_goal || 'Not set'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Change Password</h3>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="text-sm text-green-400 hover:text-green-300 transition-colors"
                >
                  Change
                </button>
              )}
            </div>

            {isChangingPassword && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 rounded-lg transition-colors mb-3"
            >
              {loading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>

          <div className="bg-red-900/20 backdrop-blur-sm border border-red-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
              {!isDeletingAccount && (
                <button
                  onClick={() => setIsDeletingAccount(true)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete Account
                </button>
              )}
            </div>

            {isDeletingAccount && (
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <p className="text-sm text-zinc-400">
                  This action cannot be undone. This will permanently delete your account and all associated data.
                </p>
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Type <span className="text-red-400 font-semibold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading || deleteConfirmation !== 'DELETE'}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeletingAccount(false);
                      setDeleteConfirmation('');
                    }}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
