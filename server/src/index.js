import express from 'express';
import cors from 'cors';
import { PORT, NODE_ENV, CLIENT_ORIGIN } from './config.js';
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

// Permitted local development origins
const devOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

// Parse explicit CLIENT_ORIGIN (e.g. single URL or comma-separated list)
const configuredOrigins = CLIENT_ORIGIN
  ? CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

// Dynamic CORS configuration:
// If CLIENT_ORIGIN is explicitly configured, avoid wildcard CORS in production
// and only permit the configured production origin(s) plus local dev origins.
const corsOptions = configuredOrigins.length > 0
  ? {
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., curl, mobile apps, server-to-server health checks)
        if (!origin) return callback(null, true);

        if (configuredOrigins.includes(origin) || devOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not permitted by FINOVA CORS policy`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  : {
      origin: true,
      credentials: true
    };

// Middleware
app.use(cors(corsOptions));
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
