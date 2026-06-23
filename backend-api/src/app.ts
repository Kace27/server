import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import playerRoutes from './routes/playerRoutes';
import rankingRoutes from './routes/rankingRoutes';
import matchRoutes from './routes/matchRoutes';
import { updatePlayerStatus } from './controllers/playerController';
import { triggerRefreshRanking } from './controllers/rankingController';
import { authMiddleware } from './middlewares/auth';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Public API routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/matches', matchRoutes);

// Admin Routes (Directly matching specified endpoints)
app.put('/api/admin/players/:id/status', authMiddleware, updatePlayerStatus);
app.post('/api/admin/cron/refresh-ranking', authMiddleware, triggerRefreshRanking);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

import { refreshRankingCache } from './services/rankingService';

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode.`);
  
  // Auto-refresh ranking cache every 5 minutes (300,000 ms)
  setInterval(() => {
    console.log('Running automatic ranking cache refresh...');
    refreshRankingCache().catch(err => console.error('Auto-refresh failed:', err));
  }, 5 * 60 * 1000);
  
  // Run it once on startup (optional, but good for immediate consistency)
  refreshRankingCache().catch(err => console.error('Initial ranking refresh failed:', err));
});

export default app;
