import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import invitationRoutes from './routes/invitations.js';
import columnRoutes from './routes/columns.js';
import { error } from './utils/response.js';

dotenv.config();

const app = express();

// Middleware
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendUrl,
  credentials: true
}));

app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', invitationRoutes);
app.use('/api/projects', columnRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res, next) => {
  error(res, 'Route not found', 404);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  error(res, 'Internal Server Error', 500);
});

export default app;
