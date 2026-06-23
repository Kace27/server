"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshRankingCache = void 0;
const db_1 = __importDefault(require("../config/db"));
const refreshRankingCache = async () => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // 1. Delete all current cached entries
        await client.query('DELETE FROM ranking_cache');
        // 2. Query stats and insert into ranking_cache
        const query = `
      INSERT INTO ranking_cache (player_id, username, matches_played, matches_won, points)
      SELECT 
          p.id AS player_id,
          p.name AS username,
          COALESCE(COUNT(mp.id), 0) AS matches_played,
          COALESCE(SUM(
              CASE 
                  WHEN (mp.home = true AND m.score_home > m.score_away) OR 
                       (mp.home = false AND m.score_away > m.score_home) THEN 1
                  ELSE 0
              END
          ), 0) AS matches_won,
          p.points AS points
      FROM profiles p
      LEFT JOIN matches_played mp ON mp.profile_id = p.id
      LEFT JOIN matches m ON mp.match_id = m.id
      WHERE p.deleted = false
      GROUP BY p.id, p.name, p.points
    `;
        await client.query(query);
        await client.query('COMMIT');
        console.log('Ranking cache successfully refreshed.');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error refreshing ranking cache:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.refreshRankingCache = refreshRankingCache;
