import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './SupabaseAuthContext';
import { type MoodId } from '../lib/utils';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Map<string, { status: string; lastSeen: Date }>;
  emitMoodUpdate: (mood: MoodId) => void;
  emitMoodAcknowledgment: (userId: string) => void;
  emitStatusUpdate: (status: string) => void;
  getOnlineUsers: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user, session } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, { status: string; lastSeen: Date }>>(new Map());

  useEffect(() => {
    if (user && session) {
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3002', {
        auth: {
          token: session.access_token
        },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      setSocket(newSocket);

      // Connection event handlers will be set above

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Real-time event handlers
      newSocket.on('contact_mood_update', (data: { userId: string; mood: MoodId; timestamp: Date }) => {
        console.log('Contact mood update:', data);
        // This will be handled by the mood hooks via Supabase real-time
        // But we can also show immediate notifications here
      });

      newSocket.on('mood_acknowledged', (data: { acknowledgedBy: string; timestamp: Date }) => {
        console.log('Mood acknowledged:', data);
        // Show notification that someone acknowledged your mood
      });

      newSocket.on('user_status_update', (data: { userId: string; status: string; timestamp: Date }) => {
        setOnlineUsers(prev => {
          const newMap = new Map(prev);
          if (data.status === 'offline') {
            newMap.delete(data.userId);
          } else {
            newMap.set(data.userId, {
              status: data.status,
              lastSeen: new Date(data.timestamp)
            });
          }
          return newMap;
        });
      });

      newSocket.on('online_users_list', (users: Array<{ userId: string; status: string; lastSeen: Date }>) => {
        const userMap = new Map();
        users.forEach(user => {
          userMap.set(user.userId, {
            status: user.status,
            lastSeen: new Date(user.lastSeen)
          });
        });
        setOnlineUsers(userMap);
      });

      // Request online users on connection
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        newSocket.emit('get_online_users');
      });

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Map());
      };
    } else {
      // Clean up when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Map());
      }
    }
  }, [user, session]);

  const emitMoodUpdate = (mood: MoodId) => {
    if (socket && isConnected) {
      socket.emit('mood_update', { mood });
    }
  };

  const emitMoodAcknowledgment = (userId: string) => {
    if (socket && isConnected) {
      socket.emit('acknowledge_mood', { userId });
    }
  };

  const emitStatusUpdate = (status: string) => {
    if (socket && isConnected) {
      socket.emit('update_status', { status });
    }
  };

  const getOnlineUsers = () => {
    if (socket && isConnected) {
      socket.emit('get_online_users');
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    emitMoodUpdate,
    emitMoodAcknowledgment,
    emitStatusUpdate,
    getOnlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}