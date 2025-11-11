import { supabase } from './supabaseClient';
import { User, Session, AuthError, PostgrestError } from '@supabase/supabase-js';

export interface AuthUser extends User {
  email?: string;
}

export type DatabaseError = PostgrestError | Error | null;

export interface UserProfileData {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  fitness_goal?: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  username: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: Session | null;
  error: AuthError | null;
}

class AuthService {
  async signUp({ email, password, fullName, username }: SignUpData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          },
        },
      });

      if (error) {
        return { user: null, session: null, error };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      console.error('Sign up error:', err);
      return {
        user: null,
        session: null,
        error: err as AuthError,
      };
    }
  }

  async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, session: null, error };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return {
        user: null,
        session: null,
        error: err as AuthError,
      };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      console.error('Sign out error:', err);
      return { error: err as AuthError };
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err) {
      console.error('Reset password error:', err);
      return { error: err as AuthError };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (err) {
      console.error('Update password error:', err);
      return { error: err as AuthError };
    }
  }

  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { session: data.session, error };
    } catch (err) {
      console.error('Get session error:', err);
      return { session: null, error: err as AuthError };
    }
  }

  async getUserProfile(userId: string): Promise<{ profile: UserProfileData | null; error: DatabaseError }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Get user profile error:', error);
        return { profile: null, error };
      }

      return { profile: data, error: null };
    } catch (err) {
      console.error('Get user profile error:', err);
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      return { profile: null, error };
    }
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfileData, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{ profile: UserProfileData | null; error: DatabaseError }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update user profile error:', error);
        return { profile: null, error };
      }

      return { profile: data, error: null };
    } catch (err) {
      console.error('Update user profile error:', err);
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      return { profile: null, error };
    }
  }

  async deleteAccount(userId: string): Promise<{ error: DatabaseError }> {
    try {
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteUserError) {
        console.error('Delete account error:', deleteUserError);
        return { error: deleteUserError };
      }

      await this.signOut();

      return { error: null };
    } catch (err) {
      console.error('Delete account error:', err);
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      return { error };
    }
  }

  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }
}

export const authService = new AuthService();

export const updateUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfileData, 'id' | 'created_at' | 'updated_at'>>
) => {
  const { profile, error } = await authService.updateUserProfile(userId, updates);
  if (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update profile');
  }
  return profile;
};

export const updateUserPassword = async (newPassword: string) => {
  const { error } = await authService.updatePassword(newPassword);
  if (error) {
    throw new Error(error.message || 'Failed to update password');
  }
};

export const deleteUserAccount = async (userId: string) => {
  const { error } = await authService.deleteAccount(userId);
  if (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete account');
  }
};
