import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3002';

interface Friend {
  id: string;
  username: string;
  avatar_emoji?: string;
}

interface FriendCode {
  code: string;
  expires_at: string;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendCode, setFriendCode] = useState<FriendCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, getAccessToken } = useAuth();

  const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getAccessToken();
    return fetch(`${API_BASE_URL}/api/friends${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  const loadFriends = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest('/list');
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriendCode = async () => {
    if (!user) return;
    
    try {
      const response = await makeAuthenticatedRequest('/my-code');
      if (response.ok) {
        const data = await response.json();
        setFriendCode(data.code ? { code: data.code, expires_at: data.expires_at } : null);
      }
    } catch (error) {
      console.error('Error loading friend code:', error);
    }
  };

  const generateFriendCode = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest('/generate-code', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriendCode({ code: data.code, expires_at: data.expires_at });
        return data.code;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate friend code');
      }
    } catch (error) {
      console.error('Error generating friend code:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const useFriendCode = async (code: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest('/use-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      
      if (response.ok) {
        const data = await response.json();
        await loadFriends(); // Refresh friends list
        return data.friend;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add friend');
      }
    } catch (error) {
      console.error('Error using friend code:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailInvitation = async (email: string, message?: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest('/invite-email', {
        method: 'POST',
        body: JSON.stringify({ email, message }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.invitation;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending email invitation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendCode();
    }
  }, [user]);

  return {
    friends,
    friendCode,
    isLoading,
    generateFriendCode,
    useFriendCode,
    sendEmailInvitation,
    loadFriends,
    loadFriendCode,
  };
};