import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initDatabase, closeDbPool, checkDbHealth } from './config/db';

const PORT = process.env.PORT || 5000;

// Initialize server process
const server = app.listen(PORT, async () => {
  console.log(`[MediConnect Server] Listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`[MediConnect Server] Health check: http://localhost:${PORT}/api/health`);

  // Initialize Neon DB
  try {
    await initDatabase();
    const health = await checkDbHealth();
    if (health.connected) {
      console.log(`[Neon DB] Connected to database "${health.database}" in ${health.latencyMs}ms`);
    } else {
      console.log(`[Neon DB] Status: ${health.error || 'Running without active Neon connection'}`);
    }
  } catch (err: any) {
    console.error('[Neon DB] Startup check error:', err.message);
  }
});

// Production Thread & Process Error Handling
process.on('uncaughtException', (err: Error) => {
  console.error('[Process Fatal] Uncaught Exception:', err.name, err.message, err.stack);
  // Give current requests 2 seconds before exiting
  setTimeout(() => {
    process.exit(1);
  }, 2000);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Process Warning] Unhandled Rejection at:', reason);
});

// Graceful Shutdown for SIGTERM & SIGINT (Docker, PM2, Kubernetes, Cloud Run)
async function gracefulShutdown(signal: string) {
  console.log(`\n[Process] ${signal} signal received. Closing HTTP server & database pool gracefully...`);

  server.close(async () => {
    console.log('[Process] HTTP server closed.');
    try {
      await closeDbPool();
      console.log('[Process] Graceful shutdown completed. Exiting.');
      process.exit(0);
    } catch (err: any) {
      console.error('[Process] Error during pool close:', err.message);
      process.exit(1);
    }
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    console.error('[Process] Forceful shutdown initiated due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
