import { useState, useEffect } from 'react';
import { supabase, Mood } from '../lib/supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { type MoodId } from '../lib/utils';

export function useSupabaseMoods() {
  const { user } = useAuth();
  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [moodHistory, setMoodHistory] = useState<Mood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentMood = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error: queryError } = await supabase
        .from('moods')
        .select(`
          id,
          mood_type,
          is_visible,
          created_at,
          acknowledgment_count
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // No mood found, that's ok
          setCurrentMood(null);
        } else {
          throw queryError;
        }
      } else {
        setCurrentMood({
          ...data,
          user_id: user.id,
          acknowledgment_count: data.acknowledgment_count || 0
        });
      }
    } catch (err: any) {
      console.error('Load current mood error:', err);
      setError(err.message || 'Failed to load current mood');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoodHistory = async () => {
    if (!user) return;

    try {
      const { data, error: queryError } = await supabase
        .from('moods')
        .select(`
          id,
          mood_type,
          is_visible,
          created_at,
          acknowledgment_count
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (queryError) throw queryError;

      const moods = data.map(mood => ({
        ...mood,
        user_id: user.id,
        acknowledgment_count: mood.acknowledgment_count || 0
      }));

      setMoodHistory(moods);
    } catch (err: any) {
      console.error('Load mood history error:', err);
    }
  };

  const createMood = async (moodType: MoodId, isVisible = true) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('moods')
        .insert([{
          user_id: user.id,
          mood_type: moodType,
          is_visible: isVisible
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      const newMood: Mood = {
        ...data,
        acknowledgment_count: 0
      };

      setCurrentMood(newMood);
      setMoodHistory(prev => [newMood, ...prev]);

      // Trigger push notifications for contacts if visible and important moods
      if (isVisible && (moodType === 'shutdown' || moodType === 'meltdown' || moodType === 'overwhelmed')) {
        try {
          await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3002'}/api/push/notify-mood`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              moodType: moodType,
              userName: user.user_metadata?.display_name || user.user_metadata?.username || 'Someone'
            })
          });
        } catch (pushError) {
          console.error('Failed to send push notification:', pushError);
          // Don't throw here as the mood was created successfully
        }
      }

      return newMood;
    } catch (err: any) {
      console.error('Create mood error:', err);
      setError(err.message || 'Failed to create mood');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeMood = async (moodId: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // First, get the mood to find out whose mood it is
      const { data: moodData } = await supabase
        .from('moods')
        .select('user_id')
        .eq('id', moodId)
        .single();

      const { error: insertError } = await supabase
        .from('mood_acknowledgments')
        .insert([{
          mood_id: moodId,
          acknowledged_by: user.id
        }]);

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Already acknowledged');
        }
        throw insertError;
      }

      // Update acknowledgment count for current mood
      if (currentMood && currentMood.id === moodId) {
        setCurrentMood(prev => prev ? {
          ...prev,
          acknowledgment_count: (prev.acknowledgment_count || 0) + 1
        } : null);
      }

      // Send push notification to the mood owner
      if (moodData?.user_id && moodData.user_id !== user.id) {
        try {
          await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3002'}/api/push/notify-acknowledgment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: moodData.user_id,
              acknowledgerName: user.user_metadata?.display_name || user.user_metadata?.username || 'Someone'
            })
          });
        } catch (pushError) {
          console.error('Failed to send acknowledgment notification:', pushError);
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('Acknowledge mood error:', err);
      throw err;
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadCurrentMood();
      loadMoodHistory();
    } else {
      setCurrentMood(null);
      setMoodHistory([]);
    }
  }, [user]);

  // Set up real-time subscription for current user's moods
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-moods:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moods',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Mood change:', payload);
          loadCurrentMood();
          loadMoodHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    currentMood,
    moodHistory,
    isLoading,
    error,
    createMood,
    acknowledgeMood,
    loadCurrentMood,
    loadMoodHistory,
  };
}