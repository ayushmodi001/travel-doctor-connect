import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { notFound, errorHandler } from './middleware/errorHandler';
import { checkDbHealth } from './config/db';

import doctorRoutes from './routes/doctorRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import authRoutes from './routes/authRoutes';
import emergencyRoutes from './routes/emergencyRoutes';
import travelRoutes from './routes/travelRoutes';
import userRoutes from './routes/userRoutes';
import triageRoutes from './routes/triageRoutes';
import chatRoutes from './routes/chatRoutes';
import path from 'path';
import mapsRoutes from './routes/mapsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import storageRoutes from './routes/storageRoutes';

const app: Application = express();

// Production Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id', 'x-ai-api-key'],
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static file bucket storage
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Request identifier & performance tracking
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('X-Request-Id', reqId);
  next();
});

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint with Neon DB diagnostic
app.get('/api/health', async (_req: Request, res: Response) => {
  const dbHealth = await checkDbHealth();
  res.json({
    status: 'ok',
    service: 'MediConnect Backend API Server',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'Neon DB (PostgreSQL)',
      ...dbHealth,
    },
  });
});

// Mount Routes for All Screens
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medical-records', userRoutes); // Direct alias for MedicalHistoryScreen
app.use('/api/documents', storageRoutes); // Document / file bucket storage
app.use('/api/upload', storageRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/maps', mapsRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
