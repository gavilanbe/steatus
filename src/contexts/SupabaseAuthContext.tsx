import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile, uploadAvatar, getAvatarUrl } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { username?: string; display_name?: string; bio?: string; avatar_emoji?: string }) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session:', { session, error });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User found in session, loading profile...');
          await loadProfile(session.user.id);
        } else {
          console.log('No user in session, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          await loadProfile(session.user.id);
        } catch (error) {
          console.error('Profile loading error in auth change:', error);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile loading timeout')), 10000);
      });

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const { data, error } = result;

      console.log('Profile query result:', { data, error });

      if (error) {
        console.error('Error loading profile:', error);
        if (error.code === 'PGRST116') {
          console.log('Profile not found, user may need to complete registration');
        }
        // Don't return early here - continue to set loading to false
      } else if (data) {
        // Add avatar URL if available
        const avatarUrl = getAvatarUrl(userId);
        console.log('Setting profile data:', data);
        setProfile({
          ...data,
          avatar_url: data.avatar_url || avatarUrl
        });
      }
    } catch (error) {
      console.error('Profile loading error:', error);
    } finally {
      console.log('Profile loading completed, setting loading to false');
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, displayName?: string) => {
    setLoading(true);
    
    try {
      console.log('Starting sign up process:', { email, username, displayName });
      
      // Check if username is already taken
      console.log('Checking if username exists...');
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking username:', checkError);
        throw new Error('Error checking username availability');
      }

      if (existingProfile) {
        console.log('Username already taken:', username);
        throw new Error('Username already taken');
      }

      console.log('Username available, proceeding with sign up...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            display_name: displayName || username
          }
        }
      });

      console.log('Sign up result:', { data, error });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }

      console.log('Sign up successful');
      // Profile will be created automatically by the database trigger
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { username?: string; display_name?: string; bio?: string; avatar_emoji?: string }) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Reload profile
      await loadProfile(user.id);
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Profile update failed');
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const avatarUrl = await uploadAvatar(file, user.id);
      
      // Update profile with new avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Reload profile to reflect the change
      await loadProfile(user.id);
      
      return avatarUrl;
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      throw new Error(error.message || 'Avatar upload failed');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    uploadProfilePicture,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}