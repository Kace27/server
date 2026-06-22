import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import playerRoutes from './routes/playerRoutes';
import rankingRoutes from './routes/rankingRoutes';
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

// Admin Routes (Directly matching specified endpoints)
app.put('/api/admin/players/:id/status', authMiddleware, updatePlayerStatus);
app.post('/api/admin/cron/refresh-ranking', authMiddleware, triggerRefreshRanking);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode.`);
});

export default app;
