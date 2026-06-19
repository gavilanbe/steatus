import { useState, useEffect } from 'react';
import { contactsApi } from '../lib/api';
import { type MoodId } from '../lib/utils';

interface Contact {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  currentMood?: MoodId;
  moodUpdatedAt?: string;
  moodVisible: boolean;
  isOnline: boolean;
}

interface FriendRequest {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const response = await contactsApi.getContacts();
      setContacts(response.contacts);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Load contacts error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await contactsApi.getFriendRequests();
      setFriendRequests(response.requests);
    } catch (err) {
      console.error('Load friend requests error:', err);
    }
  };

  const sendFriendRequest = async (username: string) => {
    try {
      setError(null);
      await contactsApi.sendFriendRequest(username);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send friend request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleFriendRequest = async (requestId: number, action: 'accept' | 'reject') => {
    try {
      await contactsApi.handleFriendRequest(requestId.toString(), action);
      
      // Remove from pending requests
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
      // If accepted, reload contacts to get the new contact
      if (action === 'accept') {
        loadContacts();
      }
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${action} friend request`;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const removeContact = async (contactId: number) => {
    try {
      await contactsApi.removeContact(contactId.toString());
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to remove contact';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Mock acknowledge for now - this will be handled by mood system
  const acknowledgeContact = (contactId: number) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, hasAcknowledged: true }
        : contact
    ) as any);
  };

  useEffect(() => {
    loadContacts();
    loadFriendRequests();
  }, []);

  return {
    contacts,
    friendRequests,
    isLoading,
    error,
    sendFriendRequest,
    handleFriendRequest,
    removeContact,
    acknowledgeContact,
    loadContacts,
    loadFriendRequests,
  };
}