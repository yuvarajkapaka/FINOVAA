import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import { getDatabase } from './db/database.js';
import { initSchema } from './db/schema.js';
import walletRoutes from './routes/walletRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import academyRoutes from './routes/academyRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';

const app = express();

// Initialize database schema safely on start
initSchema();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Mount Wallet, Ledger, Savings Goals, Academy, Marketplace, Life Simulation, Score, and Mentor API routes
app.use('/api', walletRoutes);
app.use('/api', goalRoutes);
app.use('/api', academyRoutes);
app.use('/api', marketRoutes);
app.use('/api', simulationRoutes);
app.use('/api', scoreRoutes);
app.use('/api', mentorRoutes);




// Health-check endpoint
app.get('/api/health', (req, res) => {
  try {
    const db = getDatabase();
    const query = db.prepare('SELECT 1 as is_healthy');
    const result = query.get();

    res.status(200).json({
      status: 'healthy',
      app: 'FINOVA API',
      tagline: 'Learn Money. Master Decisions.',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: result?.is_healthy === 1 ? 'connected' : 'unknown'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FINOVA API. Access /api/health for system status.',
    documentation: '/api'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start listening if executed directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  FINOVA Server running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
}

export default app;
