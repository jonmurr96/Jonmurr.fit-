import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { authService, UserProfileData } from '../services/authService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string, currentUser: User | null, retries = 3): Promise<void> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const { profile, error } = await authService.getUserProfile(userId);
      
      if (profile) {
        setUserProfile(profile);
        return;
      }
      
      if (error && 'code' in error && error.code === 'PGRST116') {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
          continue;
        }
        
        if (currentUser && attempt === retries) {
          console.log('Creating profile for OAuth user:', currentUser.id);
          const { profile: newProfile, error: createError } = await authService.createOAuthUserProfile(currentUser);
          
          if (newProfile) {
            setUserProfile(newProfile);
            return;
          }
          
          if (createError) {
            console.error('Error creating OAuth user profile:', createError);
          }
        }
      }
      
      if (error) {
        console.error('Error loading user profile:', error);
      }
      setUserProfile(null);
      return;
    }
  };

  const refreshUserProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id, user);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { session: currentSession } = await authService.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadUserProfile(currentSession.user.id, currentSession.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = authService.onAuthStateChange(async (newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadUserProfile(newSession.user.id, newSession.user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setSession(null);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    userProfile,
    loading,
    signOut: handleSignOut,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
