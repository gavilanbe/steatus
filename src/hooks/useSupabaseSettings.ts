import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';

export interface UserSettings {
  id: string;
  user_id: string;
  // Notification settings
  push_enabled: boolean;
  sound_enabled: boolean;
  quiet_hours: boolean;
  mood_updates: boolean;
  acknowledgments: boolean;
  // Privacy settings
  show_to_all: boolean;
  allow_friend_requests: boolean;
  share_history: boolean;
  // Appearance settings
  dark_mode: boolean;
  color_scheme: 'warm' | 'cool' | 'neutral';
  font_size: 'small' | 'medium' | 'large';
  created_at: string;
  updated_at: string;
}

export function useSupabaseSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error: queryError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // No settings found, create default settings
          await createDefaultSettings();
        } else {
          throw queryError;
        }
      } else {
        setSettings(data);
      }
    } catch (err: any) {
      console.error('Load settings error:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const defaultSettings = {
        user_id: user.id,
        push_enabled: true,
        sound_enabled: false,
        quiet_hours: true,
        mood_updates: true,
        acknowledgments: true,
        show_to_all: true,
        allow_friend_requests: true,
        share_history: false,
        dark_mode: false,
        color_scheme: 'warm' as const,
        font_size: 'medium' as const,
      };

      const { data, error: insertError } = await supabase
        .from('user_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (insertError) throw insertError;
      setSettings(data);
    } catch (err: any) {
      console.error('Create default settings error:', err);
      setError(err.message || 'Failed to create default settings');
    }
  };

  const updateSettings = async (updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user || !settings) return;

    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setSettings(data);

      return { success: true };
    } catch (err: any) {
      console.error('Update settings error:', err);
      setError(err.message || 'Failed to update settings');
      throw err;
    }
  };

  const toggleSetting = async (key: keyof Pick<UserSettings, 'push_enabled' | 'sound_enabled' | 'quiet_hours' | 'mood_updates' | 'acknowledgments' | 'show_to_all' | 'allow_friend_requests' | 'share_history' | 'dark_mode'>) => {
    if (!settings) return;

    try {
      const currentValue = settings[key] as boolean;
      await updateSettings({ [key]: !currentValue });
    } catch (error) {
      console.error(`Failed to toggle ${key}:`, error);
    }
  };

  // Load settings when user changes
  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(null);
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-settings:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Settings change:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            setSettings(payload.new as UserSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    toggleSetting,
    loadSettings,
  };
}