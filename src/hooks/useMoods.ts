import { useState, useEffect } from 'react';
import { moodsApi } from '../lib/api';
import { type MoodId } from '../lib/utils';

interface Mood {
  id: number;
  moodType: MoodId;
  isVisible: boolean;
  acknowledgmentCount: number;
  createdAt: string;
}

export function useMoods() {
  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [moodHistory, setMoodHistory] = useState<Mood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentMood = async () => {
    try {
      setIsLoading(true);
      const response = await moodsApi.getCurrentMood();
      setCurrentMood(response.mood);
    } catch (err) {
      setError('Failed to load current mood');
      console.error('Load current mood error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoodHistory = async () => {
    try {
      const response = await moodsApi.getMoodHistory();
      setMoodHistory(response.moods);
    } catch (err) {
      console.error('Load mood history error:', err);
    }
  };

  const createMood = async (moodType: MoodId, isVisible = true) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await moodsApi.createMood({ moodType, isVisible });
      const newMood: Mood = {
        id: response.mood.id,
        moodType: response.mood.moodType as MoodId,
        isVisible: response.mood.isVisible,
        acknowledgmentCount: 0,
        createdAt: response.mood.createdAt,
      };
      
      setCurrentMood(newMood);
      
      // Add to history
      setMoodHistory(prev => [newMood, ...prev]);
      
      return newMood;
    } catch (err) {
      setError('Failed to update mood');
      console.error('Create mood error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeMood = async (moodId: number) => {
    try {
      const response = await moodsApi.acknowledgeMood(moodId.toString());
      
      // Update current mood if it matches
      if (currentMood && currentMood.id === moodId) {
        setCurrentMood(prev => prev ? {
          ...prev,
          acknowledgmentCount: response.acknowledgmentCount
        } : null);
      }
      
      return response;
    } catch (err) {
      console.error('Acknowledge mood error:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadCurrentMood();
    loadMoodHistory();
  }, []);

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