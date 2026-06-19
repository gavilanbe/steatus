import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import moodRoutes from './routes/moods.js';
import contactRoutes from './routes/contacts.js';
import pushRoutes from './routes/push.js';
// import friendRoutes from './routes/friends.js';
import { authenticateSocket } from './middleware/auth.js';
// import { initDatabase } from './config/database.js';

dotenv.config({ path: '.env.local' });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5174",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/push', pushRoutes);
// app.use('/api/friends', friendRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time updates
io.use(authenticateSocket);

// Track online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  // Join user to their personal room
  socket.join(`user_${socket.userId}`);
  
  // Track user as online
  onlineUsers.set(socket.userId, {
    socketId: socket.id,
    lastSeen: new Date(),
    status: 'online'
  });
  
  // Broadcast online status to contacts
  socket.broadcast.emit('user_status_update', {
    userId: socket.userId,
    status: 'online',
    timestamp: new Date()
  });
  
  // Handle mood updates
  socket.on('mood_update', (data) => {
    // Broadcast to user's contacts
    socket.broadcast.to(`contacts_${socket.userId}`).emit('contact_mood_update', {
      userId: socket.userId,
      mood: data.mood,
      timestamp: new Date()
    });
  });
  
  // Handle acknowledgments
  socket.on('acknowledge_mood', (data) => {
    io.to(`user_${data.userId}`).emit('mood_acknowledged', {
      acknowledgedBy: socket.userId,
      timestamp: new Date()
    });
  });
  
  // Handle status updates
  socket.on('update_status', (data) => {
    const userStatus = onlineUsers.get(socket.userId);
    if (userStatus) {
      userStatus.status = data.status;
      userStatus.lastSeen = new Date();
      
      // Broadcast status update
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        status: data.status,
        timestamp: new Date()
      });
    }
  });
  
  // Handle getting online users
  socket.on('get_online_users', () => {
    const onlineUsersList = Array.from(onlineUsers.entries()).map(([userId, userData]) => ({
      userId,
      status: userData.status,
      lastSeen: userData.lastSeen
    }));
    
    socket.emit('online_users_list', onlineUsersList);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    
    // Remove from online users and broadcast offline status
    onlineUsers.delete(socket.userId);
    socket.broadcast.emit('user_status_update', {
      userId: socket.userId,
      status: 'offline',
      timestamp: new Date()
    });
  });
});

const PORT = process.env.PORT || 3001;

// Start server
const startServer = async () => {
  try {
    console.log('🗄️ Using Supabase for database - no initialization needed');
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🏠 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5174'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();