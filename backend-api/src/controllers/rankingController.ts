import { Request, Response } from 'express';
import pool from '../config/db';
import { refreshRankingCache } from '../services/rankingService';

export const getRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT player_id, username, matches_played, matches_won, points, updated_at 
      FROM ranking_cache 
      ORDER BY points DESC, matches_won DESC
      LIMIT 100
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const triggerRefreshRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    await refreshRankingCache();
    res.json({ message: 'Ranking cache refreshed successfully.' });
  } catch (error) {
    console.error('Error triggering ranking refresh:', error);
    res.status(500).json({ error: 'Failed to refresh ranking cache' });
  }
};
