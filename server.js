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
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

// ========== CORS - YEMERA BYOSE (KURI PHONE N'UNDI MUNTU) ==========
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== API ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/users', userRoutes);

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Blog server is running properly', 
    status: 'OK',
    database: process.env.DB_NAME || 'neondb',
    port: PORT
  });
});

// ========== ROOT ROUTE ==========
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

// ========== ERROR HANDLER ==========
app.use(errorHandler);

// ========== DATABASE CONNECTION ==========
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database ${process.env.DB_NAME || 'neondb'} connected successfully`);
    
    await sequelize.sync({ alter: false });
    console.log('✅ All tables synchronized');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
      console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
      console.log(`💬 Chat API: http://localhost:${PORT}/api/chat/conversations`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

startServer();