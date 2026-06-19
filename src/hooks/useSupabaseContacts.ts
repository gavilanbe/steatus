import { useState, useEffect } from 'react';
import { supabase, Contact, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { type MoodId } from '../lib/utils';

interface ContactWithProfile extends Contact {
  contact_profile: Profile;
  current_mood?: {
    mood_type: MoodId;
    created_at: string;
    is_visible: boolean;
  };
}

interface FriendRequest {
  id: number;
  user_id: string;
  created_at: string;
  requester_profile: Profile;
}

export function useSupabaseContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactWithProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error: queryError } = await supabase
        .from('contacts')
        .select(`
          id,
          contact_user_id,
          status,
          created_at
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (queryError) throw queryError;

      // Get profiles for contacts
      const contactIds = data.map(c => c.contact_user_id);
      
      let contactsWithProfiles = data;
      if (contactIds.length > 0) {
        // Get profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', contactIds);

        // Get current moods for contacts
        const { data: moodsData } = await supabase
          .from('moods')
          .select('user_id, mood_type, created_at, is_visible')
          .in('user_id', contactIds)
          .order('created_at', { ascending: false });

        // Create profile lookup
        const profilesLookup = profilesData?.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>) || {};

        // Get latest mood for each contact
        const latestMoods = moodsData?.reduce((acc, mood) => {
          if (!acc[mood.user_id]) {
            acc[mood.user_id] = mood;
          }
          return acc;
        }, {} as Record<string, any>) || {};

        contactsWithProfiles = data.map(contact => ({
          ...contact,
          contact_profile: profilesLookup[contact.contact_user_id] || {
            id: contact.contact_user_id,
            username: 'Unknown',
            display_name: 'Unknown User',
            avatar_url: null
          },
          current_mood: latestMoods[contact.contact_user_id] || undefined
        }));
      }

      setContacts(contactsWithProfiles as ContactWithProfile[]);
    } catch (err: any) {
      console.error('Load contacts error:', err);
      setError(err.message || 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;

    try {
      const { data, error: queryError } = await supabase
        .from('contacts')
        .select(`
          id,
          user_id,
          created_at
        `)
        .eq('contact_user_id', user.id)
        .eq('status', 'pending');

      if (queryError) throw queryError;

      // Get profiles for friend requests
      if (data && data.length > 0) {
        const requesterIds = data.map(r => r.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', requesterIds);

        const profilesLookup = profilesData?.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>) || {};

        const requestsWithProfiles = data.map(request => ({
          ...request,
          requester_profile: profilesLookup[request.user_id] || {
            id: request.user_id,
            username: 'Unknown',
            display_name: 'Unknown User',
            avatar_url: null
          }
        }));

        setFriendRequests(requestsWithProfiles as FriendRequest[]);
      } else {
        setFriendRequests([]);
      }
    } catch (err: any) {
      console.error('Load friend requests error:', err);
    }
  };

  const searchUsers = async (query: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(10);
        
      if (searchError) throw searchError;
      
      // Filter out users who are already contacts or have pending requests
      const existingContacts = contacts.map(c => c.contact_user_id);
      const pendingRequests = friendRequests.map(r => r.user_id);
      
      const filteredResults = data.filter(profile => 
        !existingContacts.includes(profile.id) && 
        !pendingRequests.includes(profile.id)
      );
      
      setSearchResults(filteredResults);
    } catch (err: any) {
      console.error('Search users error:', err);
      setError(err.message || 'Failed to search users');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      if (userId === user.id) {
        throw new Error('Cannot add yourself as a friend');
      }

      // Check if relationship already exists
      const { data: existingData } = await supabase
        .from('contacts')
        .select('id')
        .or(`and(user_id.eq.${user.id},contact_user_id.eq.${userId}),and(user_id.eq.${userId},contact_user_id.eq.${user.id})`);

      if (existingData && existingData.length > 0) {
        throw new Error('Friend relationship already exists');
      }

      // Create friend request
      const { error: insertError } = await supabase
        .from('contacts')
        .insert([{
          user_id: user.id,
          contact_user_id: userId,
          status: 'pending'
        }]);

      if (insertError) throw insertError;

      // Remove from search results
      setSearchResults(prev => prev.filter(profile => profile.id !== userId));

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send friend request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const id = parseInt(requestId);

      // Update the request to accepted
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ status: 'accepted' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create reciprocal relationship
      const { data: requestData } = await supabase
        .from('contacts')
        .select('user_id')
        .eq('id', id)
        .single();

      if (requestData) {
        await supabase
          .from('contacts')
          .insert([{
            user_id: user.id,
            contact_user_id: requestData.user_id,
            status: 'accepted'
          }]);
      }

      // Remove from pending requests and reload contacts
      setFriendRequests(prev => prev.filter(req => req.id !== id));
      loadContacts();

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to accept friend request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const id = parseInt(requestId);

      // Delete the request
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Remove from pending requests
      setFriendRequests(prev => prev.filter(req => req.id !== id));

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to decline friend request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const removeContact = async (contactId: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Find the contact to get their user ID
      const { data: contactData } = await supabase
        .from('contacts')
        .select('contact_user_id')
        .eq('id', contactId)
        .eq('user_id', user.id)
        .single();

      if (!contactData) throw new Error('Contact not found');

      // Delete both directions of the relationship
      await supabase
        .from('contacts')
        .delete()
        .or(`and(user_id.eq.${user.id},contact_user_id.eq.${contactData.contact_user_id}),and(user_id.eq.${contactData.contact_user_id},contact_user_id.eq.${user.id})`);

      // Remove from local state
      setContacts(prev => prev.filter(contact => contact.id !== contactId));

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to remove contact';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadContacts();
      loadFriendRequests();
    } else {
      setContacts([]);
      setFriendRequests([]);
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to contact changes
    const contactsChannel = supabase
      .channel(`user-contacts:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadContacts();
          loadFriendRequests();
        }
      )
      .subscribe();

    // Subscribe to mood changes from contacts
    const moodsChannel = supabase
      .channel(`contact-moods:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moods'
        },
        () => {
          // Reload contacts to get updated moods
          loadContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(moodsChannel);
    };
  }, [user]);

  const addByFriendCode = async (friendCode: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      // Extract user ID from friend code (format: TEA-{first8chars})
      if (!friendCode.startsWith('TEA-') || friendCode.length !== 12) {
        throw new Error('Invalid friend code format');
      }

      const userIdPrefix = friendCode.substring(4);

      // Find user by partial ID match
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .like('id', `${userIdPrefix}%`)
        .neq('id', user.id)
        .limit(1)
        .single();

      if (userError || !userData) {
        throw new Error('Friend code not found');
      }

      // Check if relationship already exists
      const { data: existingData } = await supabase
        .from('contacts')
        .select('id')
        .or(`and(user_id.eq.${user.id},contact_user_id.eq.${userData.id}),and(user_id.eq.${userData.id},contact_user_id.eq.${user.id})`);

      if (existingData && existingData.length > 0) {
        throw new Error('Friend relationship already exists');
      }

      // Send friend request
      const { error: insertError } = await supabase
        .from('contacts')
        .insert([{
          user_id: user.id,
          contact_user_id: userData.id,
          status: 'pending'
        }]);

      if (insertError) throw insertError;

      return { success: true, user: userData };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add friend by code';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    contacts,
    friendRequests,
    searchResults,
    isLoading,
    error,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    addByFriendCode,
    removeContact,
    loadContacts,
    loadFriendRequests,
  };
}