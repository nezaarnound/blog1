import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { sequelize } from './src/models/index.js';
import authRoutes from './src/routes/authRoutes.js';
import postRoutes from './src/routes/postRoutes.js';
import commentRoutes from './src/routes/commentRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import imageRoutes from './src/routes/imageRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for uploaded images)
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Blog server is running properly', 
    status: 'OK',
    database: process.env.DB_NAME,
    port: PORT
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Blog1 API is running', 
    status: 'OK',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      posts: '/api/posts',
      chat: '/api/chat/conversations'
    }
  });
});

// Error handler
app.use(errorHandler);

// Database connection and server start
sequelize.authenticate()
  .then(() => {
    console.log(`✅ Database ${process.env.DB_NAME} connected successfully`);
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
      console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
      console.log(`💬 Chat API: http://localhost:${PORT}/api/chat/conversations`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });