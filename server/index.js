import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import planRouter from './routes/plan.js';
import refineRouter from './routes/refine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount plan & refine routes
app.use('/api/plan', planRouter);
app.use('/api/refine', refineRouter);

// Global fallback error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    error: {
      code: 'UPSTREAM',
      message: 'Internal server error occurred.',
    },
  });
});

app.listen(PORT, () => {
  console.log(`[Trip Planner Server] Running on http://localhost:${PORT}`);
});
